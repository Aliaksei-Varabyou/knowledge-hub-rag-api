import { BadRequestException, Injectable } from '@nestjs/common';
import { GeminiService } from './gemini/gemini.service';
import { buildAnalyzePrompt, buildSummarizePrompt, buildTranslatePrompt } from './prompts';
import { ArticleService } from 'src/article/article.service';
import {
  SummarizeArticleDto,
  SummaryLength,
} from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AnalyzeArticleDto, AnalyzeTask } from './dto/analyze-article.dto';

@Injectable()
export class AiService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly articleService: ArticleService,
  ) {}

  private safeJsonParse(text: string): any {
    try {
      return JSON.parse(text);
    } catch (error) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {}
      }
      throw new BadRequestException('Invalid AI response format');
    }
  }

  private normalizeSuggestions(input: any): string[] {
    if (Array.isArray(input)) {
      return input.map(String);
    }
    if (typeof input === 'string') {
      return [input];
    }
    return [];
  }

  private normalizeSeverity(value: any): 'info' | 'warning' | 'error' {
    const allowed = ['info', 'warning', 'error'];

    if (typeof value === 'string' && allowed.includes(value.toLowerCase())) {
      return value.toLowerCase() as any;
    }
    return 'info';
  }

  async summarizeArticle(articleId: string, dto: SummarizeArticleDto) {
    const { maxLength = SummaryLength.MEDIUM } = dto;

    const article = await this.articleService.findById(articleId);

    const prompt = buildSummarizePrompt(article.content, maxLength);

    const summary = (await this.geminiService.generateContext(prompt)).trim();

    return {
      articleId,
      summary,
      originalLength: article.content.length,
      summaryLength: summary.length,
    };
  }

  async translateArticle(articleId: string, dto: TranslateArticleDto) {
    const { targetLanguage, sourceLanguage } = dto;
    if (!targetLanguage) {
      throw new BadRequestException('Target language is required');
    }

    const article = await this.articleService.findById(articleId);

    const prompt = buildTranslatePrompt(
      article.content,
      targetLanguage,
      sourceLanguage,
    );

    const rawResponse = (
      await this.geminiService.generateContext(prompt)
    ).trim();

    const parsed = this.safeJsonParse(rawResponse);
    if (!parsed.translatedText || !parsed.detectedLanguage) {
      throw new BadRequestException('AI response missing required fields');
    }

    return {
      articleId,
      translatedText: parsed.translatedText,
      detectedLanguage: parsed.detectedLanguage,
    };
  }

  async analyzeArticle(articleId: string, dto: AnalyzeArticleDto) {
    const { task = AnalyzeTask.REVIEW } = dto;

    const article = await this.articleService.findById(articleId);

    const prompt = buildAnalyzePrompt(article.content, task);

    const rawResponse = (
      await this.geminiService.generateContext(prompt)
    ).trim();

    const parsed = this.safeJsonParse(rawResponse);

    return {
      articleId,
      analysis: parsed.analysis ?? rawResponse,
      suggestions: this.normalizeSuggestions(parsed.suggestions),
      severity: this.normalizeSeverity(parsed.severity),
    };
  }
}
