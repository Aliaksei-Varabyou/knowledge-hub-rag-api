import { Body, Controller, Post } from '@nestjs/common';
import { RagService } from './rag.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { ReindexRequestDto } from './dto/reindex-request.dto';

@Controller('ai/rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('index')
  @Public()
  async index(@Body() dto: ReindexRequestDto) {
    return this.ragService.indexArticles(dto);
  }
}
