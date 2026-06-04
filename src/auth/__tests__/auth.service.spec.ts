import * as bcrypt from 'bcrypt';
import { vi } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from 'src/common/types';

describe('Auth service', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userService: UserService;
  let config: ConfigService;

  beforeEach(() => {
    userService = {
      findByLogin: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
    } as any;

    jwtService = {
      signAsync: vi.fn(),
      verifyAsync: vi.fn(),
    } as any;

    config = {
      get: vi.fn((key: string) => {
        const map: Record<string, any> = {
          JWT_SECRET_KEY: 'secret',
          JWT_SECRET_REFRESH_KEY: 'refresh-secret',
          JWT_ACCESS_TTL: '15m',
          JWT_REFRESH_TTL: '7d',
        };
        return map[key];
      }),
    } as any;

    vi.mock('bcrypt', () => ({
      hash: vi.fn(),
      compare: vi.fn(),
    }));

    service = new AuthService(userService, jwtService, config);
  });

  it('should throw if user already exists', async () => {
    (userService.findByLogin as any).mockResolvedValue({ id: 1 });
    await expect(
      service.signUp({ login: 'test', password: '123' }),
    ).rejects.toThrow(BadRequestException);
  });
  it('should create user with hashed password', async () => {
    (userService.findByLogin as any).mockResolvedValue(null);
    (bcrypt.hash as any).mockResolvedValue('hashed' as never);
    await service.signUp({ login: 'test', password: '123' });

    expect(userService.create).toHaveBeenCalledWith({
      login: 'test',
      password: 'hashed',
      role: Role.VIEWER,
    });
  });
  it('should throw if user not found', async () => {
    (userService.findByLogin as any).mockResolvedValue(null);
    await expect(
      service.login({ login: 'test', password: '123' }),
    ).rejects.toThrow(ForbiddenException);
  });
  it('should throw if password is invalid', async () => {
    (userService.findByLogin as any).mockResolvedValue({
      password: 'hashed',
    });

    (bcrypt.compare as any).mockResolvedValue(false as never);
    await expect(
      service.login({ login: 'test', password: '123' }),
    ).rejects.toThrow(ForbiddenException);
  });
  it('should return tokens on successful login', async () => {
    const user = {
      id: 1,
      login: 'test',
      password: 'hashed',
      role: Role.ADMIN,
    };

    (userService.findByLogin as any).mockResolvedValue(user);
    (bcrypt.compare as any).mockResolvedValue(true as never);

    (jwtService.signAsync as any)
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.login({
      login: 'test',
      password: '123',
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });
  it('should throw if no refresh token provided', async () => {
    await expect(service.refresh({ refreshToken: '' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
  it('should throw if token is blacklisted', async () => {
    const token = 'bad-token';
    await service.logout(token);
    await expect(service.refresh({ refreshToken: token })).rejects.toThrow(
      ForbiddenException,
    );
  });
  it('should throw if refresh token is invalid', async () => {
    (jwtService.verifyAsync as any).mockRejectedValue(new Error());
    await expect(service.refresh({ refreshToken: 'bad' })).rejects.toThrow(
      ForbiddenException,
    );
  });
  it('should throw if user not found', async () => {
    (jwtService.verifyAsync as any).mockResolvedValue({ userId: 1 });
    (userService.findById as any).mockResolvedValue(null);
    await expect(service.refresh({ refreshToken: 'token' })).rejects.toThrow(
      ForbiddenException,
    );
  });
  it('should return new tokens on refresh', async () => {
    const payload = { userId: 1 };
    (jwtService.verifyAsync as any).mockResolvedValue(payload);
    const user = {
      id: 1,
      login: 'test',
      role: Role.ADMIN,
    };
    (userService.findById as any).mockResolvedValue(user);
    (jwtService.signAsync as any)
      .mockResolvedValueOnce('new-access')
      .mockResolvedValueOnce('new-refresh');

    const result = await service.refresh({ refreshToken: 'token' });

    expect(result).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
  });
  it('should throw if no refresh token on logout', async () => {
    await expect(service.logout('')).rejects.toThrow(UnauthorizedException);
  });
  it('should add token to blacklist', async () => {
    const token = 'token';
    const result = await service.logout(token);
    expect(result).toEqual({ message: 'Logged out successfully' });
  });
});
