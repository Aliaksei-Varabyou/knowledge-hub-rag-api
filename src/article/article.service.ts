import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Article } from 'src/common/types';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticleStatus } from 'src/common/enums';
import { randomUUID } from 'node:crypto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { CommentService } from 'src/comment/comment.service';

@Injectable()
export class ArticleService {
  private articles: Article[] = [];
  constructor(
    @Inject(forwardRef(() => CommentService))
    private commentService: CommentService,
  ) {}

  async findAll(status?: ArticleStatus, categoryId?: string, tag?: string): Promise<Article[]> {
    let results = this.articles;
    if (status) results = results.filter(article => article.status === status);
    if (categoryId) results = results.filter(article => article.categoryId === categoryId);
    if (tag !== undefined) results = results.filter(article => article.tags.includes(tag));

    return results;
  }

  findById(id: string): Article | undefined {
    return this.articles.find(article => article.id === id);
  }

  async findByIdOrThrow(id: string): Promise<Article | never> {
    const article  = await this.findById(id);
    if (!article) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }
    return article;
  }

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    const article: Article = {
      id: randomUUID(),
      title: createArticleDto.title,
      content: createArticleDto.content,
      status: createArticleDto.status ?? ArticleStatus.DRAFT,
      authorId: createArticleDto.authorId ?? null,
      categoryId: createArticleDto.categoryId ?? null,
      tags: createArticleDto.tags ?? [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    this.articles.push(article);
    return article;
  }

  async update(id: string, updateArticleDto: UpdateArticleDto): Promise<Article> {
    const article = await this.findByIdOrThrow(id);
    article.title = updateArticleDto.title !== undefined ? updateArticleDto.title : article.title;
    article.content = updateArticleDto.content !== undefined ? updateArticleDto.content : article.content;
    article.status = updateArticleDto.status !== undefined ? updateArticleDto.status : article.status;
    article.authorId = updateArticleDto.authorId !== undefined ? updateArticleDto.authorId : article.authorId;
    article.categoryId = updateArticleDto.categoryId !== undefined ? updateArticleDto.categoryId : article.categoryId;
    article.tags = updateArticleDto.tags !== undefined ? updateArticleDto.tags : article.tags;
    article.updatedAt = Date.now();

    return article;
  }

  async delete(id: string): Promise<void> {
    await this.findByIdOrThrow(id);
    this.commentService.deleteByArticleId(id);
    this.articles = this.articles.filter(article => article.id !== id);
  }

  clearAuthor(userId: string): void {
    this.articles = this.articles.map(article => {
      return {
        ...article,
        authorId: article.authorId === userId ? null : article.authorId
      }
    });
  }

  clearCategory(categoryId: string): void {
    this.articles = this.articles.map(article => {
      return {
        ...article,
        categoryId: article.categoryId === categoryId ? null : article.categoryId
      }
    });
  }
}
