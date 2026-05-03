import { BadRequestException, Injectable } from '@nestjs/common';
import { GeminiService } from './gemini/gemini.service';
import {
  buildAnalyzePrompt,
  buildSummarizePrompt,
  buildTranslatePrompt,
} from './prompts';
import { ArticleService } from 'src/article/article.service';
import {
  SummarizeArticleDto,
  SummaryLength,
} from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AnalyzeArticleDto, AnalyzeTask } from './dto/analyze-article.dto';
import { AppLogger } from 'src/common/logger/logger.service';

@Injectable()
export class AiService {
  private cache = new Map<string, { value: any; expiresAt: number }>();

  constructor(
    private readonly geminiService: GeminiService,
    private readonly articleService: ArticleService,
    private readonly logger: AppLogger,
  ) {}

  private buildCacheKey(
    prefix: string,
    articleId: string,
    updatedAt: Date,
    params: any,
  ): string {
    return `${prefix}:${articleId}:${updatedAt.getTime()}:${JSON.stringify(params)}`;
  }

  private getFromCache(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  private setCache(key: string, value: any) {
    const ttl = Number(process.env.AI_CACHE_TTL_SEC || 300);
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  private usage = {
    totalRequests: 0,
    byEndpoint: {
      summarize: 0,
      translate: 0,
      analyze: 0,
    },
  };

  private trackUsage(endpoint: 'summarize' | 'translate' | 'analyze') {
    this.usage.totalRequests++;
    this.usage.byEndpoint[endpoint]++;
  }

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

    const cacheKey = this.buildCacheKey(
      'summarize',
      articleId,
      article.updatedAt,
      { maxLength },
    );
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    const prompt = buildSummarizePrompt(article.content, maxLength);
    const summary = (await this.geminiService.generateContext(prompt)).trim();

    const result = {
      articleId,
      summary,
      originalLength: article.content.length,
      summaryLength: summary.length,
    };
    this.setCache(cacheKey, result);
    this.trackUsage('summarize');
    return result;
  }

  async translateArticle(articleId: string, dto: TranslateArticleDto) {
    const { targetLanguage, sourceLanguage } = dto;
    if (!targetLanguage) {
      throw new BadRequestException('Target language is required');
    }
    const article = await this.articleService.findById(articleId);

    const cacheKey = this.buildCacheKey(
      'translate',
      articleId,
      article.updatedAt,
      { targetLanguage, sourceLanguage },
    );
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

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

    const result = {
      articleId,
      translatedText: parsed.translatedText,
      detectedLanguage: parsed.detectedLanguage,
    };
    this.setCache(cacheKey, result);
    this.trackUsage('translate');
    return result;
  }

  async analyzeArticle(articleId: string, dto: AnalyzeArticleDto) {
    const { task = AnalyzeTask.REVIEW } = dto;
    const article = await this.articleService.findById(articleId);

    const cacheKey = this.buildCacheKey(
      'analyze',
      articleId,
      article.updatedAt,
      { task },
    );
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    const prompt = buildAnalyzePrompt(article.content, task);
    const rawResponse = (
      await this.geminiService.generateContext(prompt)
    ).trim();
    const parsed = this.safeJsonParse(rawResponse);

    const result = {
      articleId,
      analysis: parsed.analysis ?? rawResponse,
      suggestions: this.normalizeSuggestions(parsed.suggestions),
      severity: this.normalizeSeverity(parsed.severity),
    };
    this.setCache(cacheKey, result);
    this.trackUsage('analyze');
    return result;
  }

  getUsage() {
    return this.usage;
  }
}
