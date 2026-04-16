import { ArticleStatus, Role } from 'generated/prisma/enums';

export type User = {
  id: string;
  login: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

export type Category = {
  id: string,
  name: string
  description: string
}

export type Article = {
  id: string,
  title: string,
  content: string,
  status: ArticleStatus,
  authorId: string | null,
  categoryId: string | null,
  tags: string[],
  createdAt: number,
  updatedAt: number
}

export type Comment = {
  id: string,
  content: string,
  articleId: string,
  authorId: string | null,
  createdAt: number
}
