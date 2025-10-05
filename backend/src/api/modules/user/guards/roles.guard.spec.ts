import { RolesGuard } from './roles.guard';
import { ExecutionContext } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

const makeCtx = (role?: UserRole) =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  it('allows when no roles metadata', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as any;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(makeCtx(UserRole.USER))).toBe(true);
  });

  it('denies when user role not in required', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.ADMIN]),
    } as any;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(makeCtx(UserRole.USER))).toBe(false);
  });

  it('allows when user role matches', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValue([UserRole.ADMIN, UserRole.USER]),
    } as any;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(makeCtx(UserRole.USER))).toBe(true);
  });
});
