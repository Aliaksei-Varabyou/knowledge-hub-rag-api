import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../roles.guard';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/common/types';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      get: vi.fn(),
      getAllAndOverride: vi.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  const mockContext = ({
    role,
    method = 'GET',
  }: {
    role?: Role;
    method?: string;
  }) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { role } : undefined,
          method,
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as any;

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
  it('should allow access if role matches', () => {
    (reflector.getAllAndOverride as any).mockReturnValue(['ADMIN']);

    const context = mockContext({ role: Role.ADMIN });
    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });
  it('should throw if role is insufficient', () => {
    (reflector.getAllAndOverride as any).mockReturnValue(['ADMIN']);
    const context = mockContext({ role: Role.VIEWER });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
  it('should throw if no user in request', () => {
    (reflector.getAllAndOverride as any).mockReturnValue(['ADMIN']);
    const context = mockContext({ role: undefined as Role });
    expect(() => guard.canActivate(context)).toThrow('No user in request');
  });
  it('should allow if no roles metadata', () => {
    (reflector.getAllAndOverride as any).mockReturnValue(undefined);
    const context = mockContext({ role: 'ANY' as Role });
    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });
  it('should throw if user can only read', () => {
    (reflector.getAllAndOverride as any).mockReturnValue(['VIEWER']);
    const context = mockContext({ role: Role.VIEWER, method: 'POST' });
    expect(() => guard.canActivate(context)).toThrow('Viewer can only read');
  });
  it('should throw if role is not allowed', () => {
    (reflector.getAllAndOverride as any).mockReturnValue(['ADMIN']);
    const context = mockContext({
      role: Role.EDITOR,
    });
    expect(() => guard.canActivate(context)).toThrow('Access denied');
  });
});
