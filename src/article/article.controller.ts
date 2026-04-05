import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { isValidUUID } from 'src/common/utils';
import { UpdateArticleDto } from './dto/update-article.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticleStatus } from 'src/common/enums';
import { Article } from 'src/common/types';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}
    
  @Get()
  async getAllArticles(
    @Query('status') status?: ArticleStatus,
    @Query('categoryId') categoryId?: string,
    @Query('tag') tag?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: keyof Article,
    @Query('order') order?: 'asc' | 'desc'
  ) {
    return await this.articleService.findAll(status, categoryId, tag, page, limit, sortBy, order);
  }

  @Get(':id')
  async getArticleById(@Param('id') id: string) {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    return await this.articleService.findByIdOrThrow(id);
  }

  @Post()
  createArticle(@Body() createArticleDto: CreateArticleDto) {
    return this.articleService.create(createArticleDto);
  }

  @Put(':id')
  async updateArticle(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    return await this.articleService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteArticle(@Param('id') id: string) {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    return await this.articleService.delete(id);
  }
}
