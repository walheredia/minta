import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AuthGuard } from './auth.guard.js';
import type { AuthenticatedUser, RequestWithUser } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { loginSchema } from './login.schema.js';
import type { LoginDto } from './login.schema.js';
import { registerSchema } from './register.schema.js';
import type { RegisterDto } from './register.schema.js';

const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 15; // 15 minutes
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

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
    const { accessToken, refreshToken, user } = await this.authService.login(dto);
    const adapter = this.adapterHost.httpAdapter;
    const secure = process.env.NODE_ENV === 'production';

    adapter.setCookie(res, 'minta_access', accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    });
    adapter.setCookie(res, 'minta_refresh', refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });

    return user;
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: RequestWithUser): AuthenticatedUser | undefined {
    return request.user;
  }
}
