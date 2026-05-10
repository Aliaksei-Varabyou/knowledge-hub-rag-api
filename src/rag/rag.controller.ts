import { Controller, Get } from '@nestjs/common';
import { RagService } from './rag.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('ai/rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Get('/test_embedding')
  @Public()
  async testEmbedding() {
    return this.ragService.TestEmbedding();
  }
}
