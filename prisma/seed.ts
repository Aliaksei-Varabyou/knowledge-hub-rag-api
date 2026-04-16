import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { ArticleStatus, PrismaClient, Role } from '../generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prismaClient = new PrismaClient({ adapter });

async function main() {
  // clearing
  await prismaClient.comment.deleteMany();
  await prismaClient.article.deleteMany();
  await prismaClient.category.deleteMany();
  await prismaClient.user.deleteMany();
  await prismaClient.tag.deleteMany();

  // users
  const admin = await prismaClient.user.create({
    data: {
      login: 'admin',
      password: 'admin123',
      role: Role.ADMIN,
    },
  });
  const editor = await prismaClient.user.create({
    data: {
      login: 'editor',
      password: 'editor123',
      role: Role.EDITOR,
    },
  });

  // categories
  const tech = await prismaClient.category.create({
    data: {
      name: 'Tech',
      description: 'Tech category description',
    },
  });
  const life = await prismaClient.category.create({
    data: {
      name: 'Life',
      description: 'Life category description',
    },
  });
  const news = await prismaClient.category.create({
    data: {
      name: 'News',
      description: 'News category description',
    },
  });

  // tags
  const tags = await Promise.all([
    prismaClient.tag.create({ data: { name: 'nestjs' } }),
    prismaClient.tag.create({ data: { name: 'docker' } }),
    prismaClient.tag.create({ data: { name: 'prisma' } }),
    prismaClient.tag.create({ data: { name: 'Typescript' } }),
    prismaClient.tag.create({ data: { name: 'backend' } }),
  ]);

  // articles
  const article1 = await prismaClient.article.create({
    data: {
      title: 'Intro to NestJS',
      content: 'NestJS is awesome...',
      status: ArticleStatus.PUBLISHED,
      authorId: admin.id,
      categoryId: tech.id,
      tags: {
        connect: [{ id: tags[0].id }, { id: tags[3].id }],
      },
    },
  });
  const article2 = await prismaClient.article.create({
    data: {
      title: 'Docker Basics',
      content: 'Docker explained...',
      status: ArticleStatus.DRAFT,
      authorId: editor.id,
      categoryId: tech.id,
      tags: {
        connect: [{ id: tags[1].id }],
      },
    },
  });
  const article3 = await prismaClient.article.create({
    data: {
      title: 'Healthy Routine',
      content: 'Wake up early...',
      status: ArticleStatus.PUBLISHED,
      authorId: editor.id,
      categoryId: life.id,
      tags: {
        connect: [{ id: tags[4].id }],
      },
    },
  });
  const article4 = await prismaClient.article.create({
    data: {
      title: 'Breaking News',
      content: 'Something happened...',
      status: ArticleStatus.ARCHIVED,
      authorId: admin.id,
      categoryId: news.id,
    },
  });
  const article5 = await prismaClient.article.create({
    data: {
      title: 'Prisma Guide',
      content: 'Using Prisma...',
      status: ArticleStatus.PUBLISHED,
      authorId: admin.id,
      categoryId: tech.id,
      tags: {
        connect: [{ id: tags[2].id }],
      },
    },
  });

  // comments
  await prismaClient.comment.createMany({
    data: [
      {
        content: 'Great article!',
        authorId: admin.id,
        articleId: article1.id,
      },
      {
        content: 'Very helpful',
        authorId: editor.id,
        articleId: article1.id,
      },
      {
        content: 'Nice tips!',
        authorId: editor.id,
        articleId: article3.id,
      },
    ]
  });

  console.log('Seed successful!');
}

main();
