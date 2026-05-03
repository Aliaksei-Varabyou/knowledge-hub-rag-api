import { Controller, Post, Body, Param, UseGuards, Get } from '@nestjs/common';
import { AiService } from './ai.service';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { CustomThrottlerGuard } from 'src/common/guards/throttler.guard';

@UseGuards(CustomThrottlerGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('articles/:articleId/summarize')
  summarizeArticle(
    @Param() articleId: string,
    @Body() body: SummarizeArticleDto,
  ) {
    return this.aiService.summarizeArticle(articleId, body);
  }

  @Post('articles/:articleId/translate')
  translateArticle(
    @Param('articleId') articleId: string,
    @Body() body: TranslateArticleDto,
  ) {
    return this.aiService.translateArticle(articleId, body);
  }

  @Post('articles/:articleId/analyze')
  analyzeArticle(
    @Param('articleId') articleId: string,
    @Body() body: AnalyzeArticleDto,
  ) {
    return this.aiService.analyzeArticle(articleId, body);
  }

  @Get('usage')
  getUsage() {
    return this.aiService.getUsage();
  }
}
