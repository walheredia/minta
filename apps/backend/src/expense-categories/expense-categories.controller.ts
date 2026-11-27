import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { RequestWithUser } from '../auth/auth.guard.js';
import { ExpenseCategoriesService } from './expense-categories.service.js';
import { searchCategoriesSchema } from './search-categories.schema.js';
import type { SearchCategoriesQuery } from './search-categories.schema.js';

@Controller('expense-categories')
@UseGuards(AuthGuard)
export class ExpenseCategoriesController {
  constructor(private readonly expenseCategoriesService: ExpenseCategoriesService) {}

  @Get()
  search(@Query({ schema: searchCategoriesSchema }) query: SearchCategoriesQuery, @Req() request: RequestWithUser) {
    return this.expenseCategoriesService.search(request.user!.id, query.q);
  }
}
