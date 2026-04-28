import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  async summarizeArticle(articleId: string, body: any) {
    return {
      message: 'Summarize not implemented yet',
      articleId,
      body,
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
