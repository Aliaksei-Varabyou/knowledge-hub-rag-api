import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { GeminiService } from './gemini/gemini.service';
import { HttpService } from '@nestjs/axios';

@Module({
  imports: [HttpService],
  controllers: [AiController],
  providers: [AiService, GeminiService],
  exports: [AiService],
})
export class AiModule {}
