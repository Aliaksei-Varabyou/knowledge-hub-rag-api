import { JwtGuard } from '../jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

describe('JwtGuard', () => {
  let guard: JwtGuard;
  let jwtService: JwtService;
  let config: ConfigService;
  let reflector: Reflector;

  beforeEach(() => {
    jwtService = {
      verifyAsync: vi.fn(),
    } as Partial<JwtService> as JwtService;
    config = {
      get: vi.fn().mockReturnValue('secret'),
    } as Partial<ConfigService> as ConfigService;
    reflector = {
      get: vi.fn(),
      getAllAndOverride: vi.fn(),
    } as any;
    guard = new JwtGuard(jwtService, config, reflector);
  });

  const mockContext = (authHeader?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: authHeader ? { authorization: authHeader } : {},
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as any;

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
  it('should allow access for public route', async () => {
    (reflector.getAllAndOverride as any).mockReturnValue(true);
    const context = mockContext();
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
  it('Should throw error if no header', async () => {
    (reflector.getAllAndOverride as any).mockReturnValue(false);
    const context = mockContext();
    await expect(guard.canActivate(context)).rejects.toThrow(
      'No authorization header',
    );
  });
  it('Should throw error if invalid auth format', async () => {
    (reflector.getAllAndOverride as any).mockReturnValue(false);
    const context = mockContext('Invalid token');
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Invalid authorization format',
    );
  });
  it('Should throw error if incorrect token', async () => {
    (reflector.getAllAndOverride as any).mockReturnValue(false);
    (jwtService.verifyAsync as any).mockRejectedValue(new Error());

    const context = mockContext('Bearer invalid-token');
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Invalid or expired token',
    );
  });
});
