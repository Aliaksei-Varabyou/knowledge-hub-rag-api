import { ArticleStatus } from 'generated/prisma/enums';

export class GetArticlesQueryDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  order: 'asc' | 'desc';

  status?: ArticleStatus;
  categoryId?: string;
  tag?: string;
}
