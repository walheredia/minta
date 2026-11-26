import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { AuthGuard } from './auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

function contextWithCookie(cookie: string | undefined): ExecutionContext {
  const request = { headers: { cookie } };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: { verifyAsync: ReturnType<typeof vi.fn> };
  let prisma: { user: { findUnique: ReturnType<typeof vi.fn> } };

  beforeEach(async () => {
    jwtService = { verifyAsync: vi.fn() };
    prisma = { user: { findUnique: vi.fn() } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    guard = module.get(AuthGuard);
  });

  it('rejects a request with no access token cookie', async () => {
    const context = contextWithCookie(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects a request whose access token is expired or otherwise invalid', async () => {
    jwtService.verifyAsync.mockRejectedValueOnce(new Error('jwt expired'));
    const context = contextWithCookie('minta_access=expired-token');

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a request whose token belongs to a user that no longer exists', async () => {
    jwtService.verifyAsync.mockResolvedValueOnce({ sub: 'missing-user' });
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const context = contextWithCookie('minta_access=valid-token');

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('attaches the authenticated user to the request and allows access when the token is valid', async () => {
    jwtService.verifyAsync.mockResolvedValueOnce({ sub: 'user_1' });
    const user = { id: 'user_1', email: 'persona@example.com', name: null, createdAt: new Date() };
    prisma.user.findUnique.mockResolvedValueOnce(user);
    const request: { headers: { cookie: string }; user?: unknown } = {
      headers: { cookie: 'minta_access=valid-token' },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual(user);
  });
});
