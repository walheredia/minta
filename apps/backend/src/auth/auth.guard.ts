import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { parseCookie } from 'cookie';
import { PrismaService } from '../prisma/prisma.service.js';

export const ACCESS_TOKEN_COOKIE = 'minta_access';

interface AccessTokenPayload {
  sub: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

export interface RequestWithUser {
  headers: { cookie?: string };
  user?: AuthenticatedUser;
}

/**
 * Reads and verifies the `minta_access` JWT cookie, attaching the
 * authenticated user to `request.user`. Reusable across any controller that
 * needs an authenticated user (expenses endpoints included).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const cookies = parseCookie(request.headers.cookie ?? '');
    const token = cookies[ACCESS_TOKEN_COOKIE];

    if (!token) {
      throw new UnauthorizedException();
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    request.user = user;
    return true;
  }
}
