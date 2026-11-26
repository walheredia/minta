import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExpenseDto } from './create-expense.schema.js';
import { UpdateExpenseDto } from './update-expense.schema.js';

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

  /**
   * Scoped to the authenticated user: an expense owned by someone else is
   * treated as if it didn't exist (404, not 403) so its existence is never
   * confirmed to a non-owner.
   */
  private async findOwnedOrThrow(userId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId, visibility: 'PERSONAL' },
    });

    if (!expense) {
      throw new NotFoundException();
    }

    return expense;
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto) {
    await this.findOwnedOrThrow(userId, id);

    return this.prisma.expense.update({
      where: { id },
      data: {
        amount: dto.amount,
        currency: dto.currency,
        description: dto.description,
        occurredAt: dto.occurredAt,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOwnedOrThrow(userId, id);

    await this.prisma.expense.delete({ where: { id } });
  }
}
