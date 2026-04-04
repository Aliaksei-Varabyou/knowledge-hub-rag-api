import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ArticleService } from 'src/article/article.service';
import { Comment } from 'src/common/types';
import { CreateCommentDto } from './dto/create-comment.dto';
import { randomUUID } from 'node:crypto';

@Injectable()
export class CommentService {
  private comments: Comment[] = [];
  constructor(private articleService: ArticleService) {}

  async getByArticleId(articleId: string):Promise<Comment[]> {
    const article = await this.articleService.findById(articleId);
    if (!article) {
      throw new UnprocessableEntityException('Article Not Found');
    }
    return this.comments.filter(comment => comment.articleId === articleId);
  }
  
  async findByIdOrThrow(id: string): Promise<Comment | never> {
    const comment = this.comments.find(c => c.id === id);
    if (!comment) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }
    return comment;
  }

  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    const article = await this.articleService.findById(createCommentDto.articleId);
    if (!article) {
      throw new UnprocessableEntityException('Article Not Found');
    }
    const comment: Comment = {
      id: randomUUID(),
      content: createCommentDto.content,
      articleId: createCommentDto.articleId,
      authorId: createCommentDto.authorId ?? null,
      createdAt: Date.now()
    }
    this.comments.push(comment);
    return comment;
  }

  async delete(id: string): Promise<void> {
    await this.findByIdOrThrow(id);
    this.comments = this.comments.filter(comment => comment.id !== id);
  }
}
