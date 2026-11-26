import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { RequestWithUser } from '../auth/auth.guard.js';
import { createExpenseSchema } from './create-expense.schema.js';
import type { CreateExpenseDto } from './create-expense.schema.js';
import { ExpensesService } from './expenses.service.js';

@Controller('expenses')
@UseGuards(AuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Body({ schema: createExpenseSchema }) dto: CreateExpenseDto, @Req() request: RequestWithUser) {
    return this.expensesService.create(request.user!.id, dto);
  }

  @Get()
  findAll(@Req() request: RequestWithUser) {
    return this.expensesService.findAllForUser(request.user!.id);
  }
}
