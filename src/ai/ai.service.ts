import { Injectable } from '@nestjs/common';
import { GeminiService } from './gemini/gemini.service';
import { buildSummarizePrompt } from './prompts';
import { ArticleService } from 'src/article/article.service';
import {
  SummarizeArticleDto,
  SummaryLength,
} from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';

@Injectable()
export class AiService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly articleService: ArticleService,
  ) {}

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

  async translateArticle(articleId: string, body: TranslateArticleDto) {
    return {
      message: 'Translate not implemented yet',
      articleId,
      body,
    };
  }

  async analyzeArticle(articleId: string, body: AnalyzeArticleDto) {
    return {
      message: 'Analyze not implemented yet',
      articleId,
      body,
    };
  }
}
