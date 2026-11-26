import { Body, Controller, Cookies, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ACCESS_TOKEN_COOKIE, AuthGuard, REFRESH_TOKEN_COOKIE } from './auth.guard.js';
import type { RequestWithUser } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { loginSchema } from './login.schema.js';
import type { LoginDto } from './login.schema.js';
import { registerSchema } from './register.schema.js';
import type { RegisterDto } from './register.schema.js';
import type { AuthenticatedUser } from './session.types.js';

const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 15; // 15 minutes
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface Session {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  @Post('register')
  register(@Body({ schema: registerSchema }) dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body({ schema: loginSchema }) dto: LoginDto, @Res({ passthrough: true }) res: unknown) {
    const session = await this.authService.login(dto);
    this.setSessionCookies(res, session);
    return session.user;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Cookies(REFRESH_TOKEN_COOKIE) refreshToken: string | undefined,
    @Res({ passthrough: true }) res: unknown,
  ) {
    const session = await this.authService.refresh(refreshToken);
    this.setSessionCookies(res, session);
    return session.user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Cookies(REFRESH_TOKEN_COOKIE) refreshToken: string | undefined,
    @Res({ passthrough: true }) res: unknown,
  ) {
    await this.authService.logout(refreshToken);
    this.clearSessionCookies(res);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: RequestWithUser): AuthenticatedUser | undefined {
    return request.user;
  }

  private setSessionCookies(res: unknown, session: Session): void {
    const adapter = this.adapterHost.httpAdapter;
    const secure = process.env.NODE_ENV === 'production';

    adapter.setCookie(res, ACCESS_TOKEN_COOKIE, session.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
    adapter.setCookie(res, REFRESH_TOKEN_COOKIE, session.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });
  }

  private clearSessionCookies(res: unknown): void {
    const adapter = this.adapterHost.httpAdapter;
    adapter.clearCookie(res, ACCESS_TOKEN_COOKIE);
    adapter.clearCookie(res, REFRESH_TOKEN_COOKIE);
  }
}
