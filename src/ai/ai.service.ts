import { Injectable } from '@nestjs/common';
import { GeminiService } from './gemini/gemini.service';
import { buildSummarizePrompt, SummaryLength } from './prompts';
import { ArticleService } from 'src/article/article.service';

@Injectable()
export class AiService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly articleService: ArticleService,
  ) {}

  async summarizeArticle(
    articleId: string,
    body: { maxLength?: SummaryLength },
  ) {
    const { maxLength = 'medium' } = body;

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

  async translateArticle(articleId: string, body: any) {
    return {
      message: 'Translate not implemented yet',
      articleId,
      body,
    };
  }

  async analyzeArticle(articleId: string, body: any) {
    return {
      message: 'Analyze not implemented yet',
      articleId,
      body,
    };
  }
}
