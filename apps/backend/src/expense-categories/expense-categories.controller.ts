import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { ExpenseCategoriesService } from './expense-categories.service.js';

@Controller('expense-categories')
@UseGuards(AuthGuard)
export class ExpenseCategoriesController {
  constructor(private readonly expenseCategoriesService: ExpenseCategoriesService) {}

  @Get()
  search(@Query('q') q: string | undefined) {
    return this.expenseCategoriesService.search(typeof q === 'string' ? q : '');
  }
}
