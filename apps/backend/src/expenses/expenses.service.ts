import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExpenseDto } from './create-expense.schema.js';

/**
 * All expenses created and listed through this service are forced to
 * `visibility: PERSONAL` and `householdId: null` — this iteration has no
 * Shared/Household expenses yet (see ADR-backed spec decisions). Any
 * client-supplied `visibility`, `householdId` or `userId` is ignored.
 */
@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        amount: dto.amount,
        currency: dto.currency,
        description: dto.description,
        occurredAt: dto.occurredAt,
        visibility: 'PERSONAL',
        householdId: null,
        userId,
      },
    });
  }

  findAllForUser(userId: string) {
    return this.prisma.expense.findMany({
      where: { userId, visibility: 'PERSONAL' },
      orderBy: { occurredAt: 'desc' },
    });
  }
}
