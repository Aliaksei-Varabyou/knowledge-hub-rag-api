export const Role = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ArticleStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ArticleStatus = (typeof ArticleStatus)[keyof typeof ArticleStatus];

export type User = {
  id: string;
  login: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

export type CurrentUserType = {
  userId: string;
  login: string;
  role: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
};

export type Article = {
  id: string;
  title: string;
  content: string;
  status: ArticleStatus;
  authorId: string | null;
  categoryId: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
};

export type Comment = {
  id: string;
  content: string;
  articleId: string;
  authorId: string | null;
  createdAt: number;
};
