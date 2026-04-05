import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { isValidUUID } from 'src/common/utils';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  async getCommentsByArticle(@Query('articleId') articleId: string) {
    return await this.commentService.getByArticleId(articleId);
  }

  @Get(':id')
  async getCommentById(@Param('id') id: string) {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    const comment = await this.commentService.findByIdOrThrow(id);
    return comment;
  }
  
  @Post()
  createComment(@Body() createCommentDto: CreateCommentDto) {
    if (!isValidUUID(createCommentDto.articleId)) {
      throw new BadRequestException('Invalid ID format');
    }
    return this.commentService.create(createCommentDto);
  }
  
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(@Param('id') id: string) {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    return await this.commentService.delete(id);
  }
}
