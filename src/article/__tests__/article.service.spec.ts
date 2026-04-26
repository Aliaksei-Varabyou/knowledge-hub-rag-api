import { ArticleService } from '../article.service';
import { PrismaService } from 'prisma/prisma.service';
import { ArticleStatus, Role } from 'src/common/types';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('Article service', () => {
  let service: ArticleService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      article: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      $transaction: vi.fn(),
    } as any;

    service = new ArticleService(prisma);
  });

  it('should return paginated articles', async () => {
    (prisma.$transaction as any).mockResolvedValue([[{ id: '1' }], 1]);
    const result = await service.findAll({});
    expect(result).toEqual({
      data: [{ id: '1' }],
      total: 1,
      page: 1,
      limit: 10,
    });
  });
  it('should filter by status', async () => {
    (prisma.article.findMany as any).mockResolvedValue([]);
    (prisma.article.count as any).mockResolvedValue(0);
    (prisma.$transaction as any).mockResolvedValue([[], 0]);

    await service.findAll({ status: ArticleStatus.PUBLISHED });
    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: ArticleStatus.PUBLISHED,
        }),
      }),
    );
  });
  it('should throw if article not found', async () => {
    (prisma.article.findUnique as any).mockResolvedValue(null);
    await expect(service.findByIdOrThrow('1')).rejects.toThrow(
      NotFoundException,
    );
  });
  it('should create article with default status', async () => {
    await service.create({
      title: 't',
      content: 'c',
    } as any);
    expect(prisma.article.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ArticleStatus.DRAFT,
        }),
      }),
    );
  });
  it('should block editor updating not his article', async () => {
    (prisma.article.findUnique as any).mockResolvedValue({
      authorId: '1',
    });
    await expect(
      service.update('1', {}, { userId: '2', role: Role.EDITOR } as any),
    ).rejects.toThrow(ForbiddenException);
  });
  it('should update article', async () => {
    (prisma.article.findUnique as any).mockResolvedValue({
      authorId: '1',
    });
    (prisma.article.update as any).mockResolvedValue({ id: '1' });
    const result = await service.update('1', { title: 'new' }, {
      userId: '1',
      role: Role.ADMIN,
    } as any);
    expect(result).toEqual({ id: '1' });
  });
  it('should throw if delete fails', async () => {
    (prisma.article.delete as any).mockRejectedValue(new Error());
    await expect(service.delete('1')).rejects.toThrow(NotFoundException);
  });
  it('should delete article', async () => {
    (prisma.article.delete as any).mockResolvedValue({});
    await expect(service.delete('1')).resolves.toBeUndefined();
  });
});
