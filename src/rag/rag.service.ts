import { Injectable } from '@nestjs/common';
import { GeminiService } from 'src/ai/gemini/gemini.service';

@Injectable()
export class RagService {
  constructor(private readonly geminiService: GeminiService) {}

  async TestEmbedding() {
    const embedding =
      await this.geminiService.generateEmbeddings('NestJS is awesome');

    return {
      dimension: embedding.length,
      preview: embedding.slice(0, 5),
    };
  }
}
