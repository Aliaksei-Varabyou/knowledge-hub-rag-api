import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Article } from 'src/common/types';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { CommentService } from 'src/comment/comment.service';
import { PrismaService } from 'prisma/prisma.service';
import { GetArticlesQueryDto } from './dto/get-articles.dto';
import { ArticleStatus } from 'generated/prisma/enums';

@Injectable()
export class ArticleService {
  constructor(
    @Inject(forwardRef(() => CommentService))
    private prisma: PrismaService,
  ) {}

  async findAll(query: GetArticlesQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const allowedSortFields = ['createdAt', 'updatedAt', 'title'];
    const sortBy = allowedSortFields.includes(query.sortBy)
      ? query.sortBy
      : 'createdAt';
    const order = query.order === 'asc' ? 'asc' : 'desc';

    const [data, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where: {
          ...(query.status && { status: query.status }),
          ...(query.categoryId && { categoryId: query.categoryId }),
          ...(query.tag && {
            tags: {
              some: { name: query.tag },
            },
          }),
        },
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
        where: {
          ...(query.status && { status: query.status }),
          ...(query.categoryId && { categoryId: query.categoryId }),
          ...(query.tag && {
            tags: {
              some: { name: query.tag },
            },
          }),
        },
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
              connectOrCreate: createArticleDto.tags.map((tag) => ({
                id: tag,
              })),
            }
          : undefined,
      },
    });
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    return await this.prisma.article.update({
      where: { id },
      data: {
        ...updateArticleDto,
        tags: updateArticleDto.tags?.length
          ? {
              connectOrCreate: updateArticleDto.tags.map((tag) => ({
                id: tag,
              })),
            }
          : undefined,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.findByIdOrThrow(id);
    await this.prisma.article.delete({
      where: { id },
    });
  }
}
