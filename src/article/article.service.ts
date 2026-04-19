import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from 'prisma/prisma.service';
import { GetArticlesQueryDto } from './dto/get-articles.dto';
import { Article, ArticleStatus, Role } from 'generated/prisma/client';
import { CurrentUserType } from 'src/common/types';

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: GetArticlesQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    const allowedSortFields = ['createdAt', 'updatedAt', 'title'];
    const sortBy = allowedSortFields.includes(query.sortBy)
      ? query.sortBy
      : 'createdAt';
    const order = query.order === 'asc' ? 'asc' : 'desc';

    const where = {
      ...(query.status && { status: query.status }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.tag && {
        tags: {
          some: { name: query.tag },
        },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          author: true,
          category: true,
          tags: true,
        },
      }),
      this.prisma.article.count({
        where,
      }),
    ]);
    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<Article | null> {
    return await this.prisma.article.findUnique({
      where: { id },
      include: {
        author: true,
        category: true,
        tags: true,
      },
    });
  }

  async findByIdOrThrow(id: string): Promise<Article | never> {
    const article = await this.findById(id);
    if (!article) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }
    return article;
  }

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    return await this.prisma.article.create({
      data: {
        title: createArticleDto.title,
        content: createArticleDto.content,
        status: createArticleDto.status ?? ArticleStatus.DRAFT,
        authorId: createArticleDto.authorId ?? null,
        categoryId: createArticleDto.categoryId ?? null,
        tags: createArticleDto.tags?.length
          ? {
              connectOrCreate: createArticleDto.tags.map((name) => ({
                where: { name },
                create: { name },
              })),
            }
          : undefined,
      },
    });
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
    user: CurrentUserType,
  ): Promise<Article> {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (user.role === Role.EDITOR && article.authorId !== user.userId) {
      throw new ForbiddenException('Editor can update only own resources');
    }

    return await this.prisma.article.update({
      where: { id },
      data: {
        ...updateArticleDto,
        tags: updateArticleDto.tags?.length
          ? {
              set: [],
              connectOrCreate: updateArticleDto.tags.map((name) => ({
                where: { name },
                create: { name },
              })),
            }
          : undefined,
      },
    });
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.article.delete({ where: { id } });
    } catch {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }
  }
}
