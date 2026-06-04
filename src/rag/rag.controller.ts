import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { RagService } from './rag.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { ReindexRequestDto } from './dto/reindex-request.dto';
import { RagSearchRequestDto } from './dto/rag-search-request.dto';
import { RagChatRequestDto } from './dto/rag-chat-request.dto';

@Controller('ai/rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('index')
  @Public()
  async index(@Body() dto: ReindexRequestDto) {
    return this.ragService.indexArticles(dto);
  }

  @Delete('index/articles/:articleId')
  @HttpCode(204)
  @Public()
  async deleteArticleVectors(@Param('articleId') articleId: string) {
    await this.ragService.deleteArticleVectors(articleId);
  }

  @Post('search')
  @Public()
  async search(@Body() dto: RagSearchRequestDto) {
    return this.ragService.search(dto);
  }

  @Post('chat')
  @Public()
  async chat(@Body() dto: RagChatRequestDto) {
    return this.ragService.chat(dto);
  }
}
