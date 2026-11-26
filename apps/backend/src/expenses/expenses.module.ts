import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';

@Module({
  // `JwtModule` is imported here too (not just in `AuthModule`) because
  // `AuthGuard` depends on `JwtService`, and Nest resolves a guard's own
  // dependencies against the module that consumes the guard.
  imports: [PrismaModule, AuthModule, JwtModule.register({})],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
