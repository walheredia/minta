import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './login.schema.js';
import { RegisterDto } from './register.schema.js';
import { generateRefreshToken, hashRefreshToken, verifyRefreshToken } from './refresh-token.util.js';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';
const GENERIC_LOGIN_ERROR = 'Email o contraseña incorrectos.';
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

interface Session {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<Session> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) {
      throw new UnauthorizedException(GENERIC_LOGIN_ERROR);
    }

    const passwordMatches = await argon2.verify(user.passwordHash, dto.password);

    if (!passwordMatches) {
      throw new UnauthorizedException(GENERIC_LOGIN_ERROR);
    }

    return this.startSession(user);
  }

  /**
   * Validates the refresh token cookie against its stored hash, rotates it
   * (revokes the token just used and issues a brand-new access+refresh
   * pair), and returns the new session. Rejecting a token that is missing,
   * unknown, already revoked, or expired — not just "unknown" — is what lets
   * reuse of a stolen refresh token be detected instead of silently honored.
   */
  async refresh(refreshToken: string | undefined): Promise<Session> {
    const stored = await this.findActiveRefreshToken(refreshToken);

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.startSession(user);
  }

  /**
   * Revokes the refresh token presented, ending that session immediately.
   * Idempotent: logging out with a missing, unknown, or already-revoked
   * token is a no-op rather than an error, so the client can always clear
   * its cookies by calling this.
   */
  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async register(dto: RegisterDto) {
    const passwordHash = await argon2.hash(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });

      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new ConflictException('Ya existe una cuenta registrada con ese email.');
      }

      throw error;
    }
  }

  private async findActiveRefreshToken(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(refreshToken) },
    });

    const isActive =
      !!stored &&
      verifyRefreshToken(refreshToken, stored.tokenHash) &&
      stored.revokedAt === null &&
      stored.expiresAt.getTime() > Date.now();

    if (!stored || !isActive) {
      throw new UnauthorizedException();
    }

    return stored;
  }

  private async startSession(user: SessionUser): Promise<Session> {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: ACCESS_TOKEN_TTL },
    );

    const refreshToken = generateRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    };
  }
}
