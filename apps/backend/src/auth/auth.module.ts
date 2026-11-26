import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  // `JwtModule` is re-exported so other modules that need `AuthGuard` (which
  // depends on `JwtService`) can satisfy that dependency by importing
  // `AuthModule` alone, instead of each registering their own `JwtModule`.
  exports: [AuthGuard, JwtModule],
})
export class AuthModule {}
