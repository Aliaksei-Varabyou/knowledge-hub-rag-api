import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PrismaService } from 'prisma/prisma.service';
import { Comment } from 'generated/prisma/client';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async getByArticleId(articleId: string): Promise<Comment[]> {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });
    if (!article) {
      throw new NotFoundException('Article Not Found');
    }
    return this.prisma.comment.findMany({
      where: { articleId },
      include: {
        author: true,
      },
    });
  }

  async findById(id: string): Promise<Comment | null> {
    return this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: true,
      },
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
    const articleExists = await this.prisma.article.findUnique({
      where: { id: createCommentDto.articleId },
    });
    if (!articleExists) {
      throw new NotFoundException('Article not found');
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
    try {
      await this.prisma.comment.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }
  }
}
