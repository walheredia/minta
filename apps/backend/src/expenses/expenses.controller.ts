import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { RequestWithUser } from '../auth/auth.guard.js';
import { createExpenseSchema } from './create-expense.schema.js';
import type { CreateExpenseDto } from './create-expense.schema.js';
import { updateExpenseSchema } from './update-expense.schema.js';
import type { UpdateExpenseDto } from './update-expense.schema.js';
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

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body({ schema: updateExpenseSchema }) dto: UpdateExpenseDto,
    @Req() request: RequestWithUser,
  ) {
    return this.expensesService.update(request.user!.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Req() request: RequestWithUser) {
    await this.expensesService.remove(request.user!.id, id);
  }
}
