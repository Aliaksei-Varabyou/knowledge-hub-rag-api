import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { GeminiService } from './gemini/gemini.service';
import { HttpModule } from '@nestjs/axios';
import { ArticleModule } from 'src/article/article.module';
import { AppLogger } from 'src/common/logger/logger.service';

@Module({
  imports: [HttpModule, ArticleModule],
  controllers: [AiController],
  providers: [AiService, GeminiService, AppLogger],
  exports: [AiService, GeminiService],
})
export class AiModule {}
