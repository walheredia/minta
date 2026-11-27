import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { RequestWithUser } from '../auth/auth.guard.js';
import { ExpenseCategoriesService } from './expense-categories.service.js';

@Controller('expense-categories')
@UseGuards(AuthGuard)
export class ExpenseCategoriesController {
  constructor(
    private readonly expenseCategoriesService: ExpenseCategoriesService,
  ) {}

  @Get()
  search(@Query('q') q: string | undefined, @Req() request: RequestWithUser) {
    return this.expenseCategoriesService.search(
      request.user!.id,
      typeof q === 'string' ? q : '',
    );
  }
}
