import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ArticleService } from 'src/article/article.service';
import { Comment } from 'src/common/types';
import { CreateCommentDto } from './dto/create-comment.dto';
import { randomUUID } from 'node:crypto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(
    @Inject(forwardRef(() => ArticleService))
    private articleService: ArticleService,
    private prisma: PrismaService,
  ) {}

  async getByArticleId(articleId: string): Promise<Comment[]> {
    const article = await this.articleService.findById(articleId);
    if (!article) {
      throw new UnprocessableEntityException('Article Not Found');
    }
    return this.prisma.comment.findMany({
      where: { articleId },
    });
  }

  async findById(id: string): Promise<Comment | undefined> {
    return await this.prisma.comment.findUnique({
      where: { id },
    });
  }

  async findByIdOrThrow(id: string): Promise<Comment | never> {
    const comment = await this.findById(id);
    if (!comment) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }
    return comment;
  }

  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    const article = await this.articleService.findById(
      createCommentDto.articleId,
    );
    if (!article) {
      throw new UnprocessableEntityException('Article Not Found');
    }
    return this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        articleId: createCommentDto.articleId,
        authorId: createCommentDto.authorId ?? null,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.findByIdOrThrow(id);
    await this.prisma.comment.delete({
      where: { id },
    });
  }
}
