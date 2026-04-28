import { Controller, Post, Body, Param } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('articles/:articleId/summarize')
  summarizeArticle(@Param() articleId: string, @Body() body: any) {
    return this.aiService.summarizeArticle(articleId, body);
  }

  @Post('articles/:articleId/translate')
  translateArticle(@Param('articleId') articleId: string, @Body() body: any) {
    return this.aiService.translateArticle(articleId, body);
  }

  @Post('articles/:articleId/analyze')
  analyzeArticle(@Param('articleId') articleId: string, @Body() body: any) {
    return this.aiService.analyzeArticle(articleId, body);
  }
}
