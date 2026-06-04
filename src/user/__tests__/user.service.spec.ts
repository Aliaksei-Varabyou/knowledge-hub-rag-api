import { PrismaService } from 'prisma/prisma.service';
import { UserService } from '../user.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from 'src/common/types';

describe('User service', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as any;

    service = new UserService(prisma);
  });

  it('should return users without password', async () => {
    const users = [{ id: '1', login: 'test' }];
    (prisma.user.findMany as any).mockResolvedValue(users);

    const result = await service.findAll();
    expect(result).toEqual(users);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      select: expect.any(Object),
    });
  });
  it('should throw if user not found', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    await expect(service.findByIdOrThrow('1')).rejects.toThrow(
      NotFoundException,
    );
  });
  it('should return user if found', async () => {
    const user = { id: '1' };
    (prisma.user.findUnique as any).mockResolvedValue(user);

    const result = await service.findByIdOrThrow('1');
    expect(result).toEqual(user);
  });
  it('should create user with default role', async () => {
    const dto = { login: 'test', password: '123' };
    (prisma.user.create as any).mockResolvedValue(dto);

    await service.create(dto as any);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        login: 'test',
        password: '123',
        role: Role.VIEWER,
      },
      select: expect.any(Object),
    });
  });
  it('should throw if user not found', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    await expect(
      service.updatePassword('1', { oldPassword: 'a', newPassword: 'b' }, {
        userId: '1',
      } as any),
    ).rejects.toThrow(NotFoundException);
  });
  it('should block editor updating another user', async () => {
    const user = {
      id: '1',
      role: Role.EDITOR,
      password: '123',
    };

    (prisma.user.findUnique as any).mockResolvedValue(user);
    await expect(
      service.updatePassword('1', { oldPassword: '123', newPassword: '456' }, {
        userId: '2',
      } as any),
    ).rejects.toThrow(ForbiddenException);
  });
  it('should throw if old password does not match', async () => {
    const user = {
      id: '1',
      role: Role.ADMIN,
      password: '123',
    };
    (prisma.user.findUnique as any).mockResolvedValue(user);
    await expect(
      service.updatePassword(
        '1',
        { oldPassword: 'wrong', newPassword: '456' },
        { userId: '1' } as any,
      ),
    ).rejects.toThrow('Old password does not match');
  });
  it('should update password successfully', async () => {
    const user = {
      id: '1',
      role: Role.ADMIN,
      password: '123',
    };
    (prisma.user.findUnique as any).mockResolvedValue(user);
    (prisma.user.update as any).mockResolvedValue({ id: '1' });
    const result = await service.updatePassword(
      '1',
      { oldPassword: '123', newPassword: '456' },
      { userId: '1' } as any,
    );
    expect(result).toEqual({ id: '1' });
    expect(prisma.user.update).toHaveBeenCalled();
  });
  it('should throw if delete fails', async () => {
    (prisma.user.delete as any).mockRejectedValue(new Error());
    await expect(service.delete('1')).rejects.toThrow(NotFoundException);
  });
  it('should delete user successfully', async () => {
    (prisma.user.delete as any).mockResolvedValue({});
    await expect(service.delete('1')).resolves.toBeUndefined();
  });
});
