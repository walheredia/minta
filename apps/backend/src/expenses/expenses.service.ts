import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { ExpenseCategoriesService } from '../expense-categories/expense-categories.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExpenseDto } from './create-expense.schema.js';
import { UpdateExpenseDto } from './update-expense.schema.js';

const categorySelect = { select: { id: true, name: true } } as const;

const expenseWithCategory = {
  include: {
    systemCategory: categorySelect,
    householdCategory: categorySelect,
  },
} satisfies Prisma.ExpenseDefaultArgs;

type ExpenseWithCategory = Prisma.ExpenseGetPayload<typeof expenseWithCategory>;

/** API shape of an Expense: the category is embedded, FK columns are not exposed. */
function toExpenseResponse(expense: ExpenseWithCategory) {
  const {
    systemCategory,
    householdCategory,
    systemCategoryId: _systemCategoryId,
    householdCategoryId: _householdCategoryId,
    ...rest
  } = expense;
  const category = systemCategory
    ? { ...systemCategory, source: 'SYSTEM' as const }
    : { ...householdCategory!, source: 'HOUSEHOLD' as const };
  return { ...rest, category };
}

/**
 * All expenses created and listed through this service are forced to
 * `visibility: PERSONAL` and `householdId: null` — this iteration has no
 * Shared/Household expenses yet (see ADR-backed spec decisions). Any
 * client-supplied `visibility`, `householdId` or `userId` is ignored.
 */
@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: ExpenseCategoriesService,
  ) {}

  async create(userId: string, dto: CreateExpenseDto) {
    const expense = await this.prisma.$transaction(async (tx) => {
      const categoryColumns = await this.categories.resolveForExpense(
        tx,
        userId,
        dto.category,
      );

      return tx.expense.create({
        data: {
          amount: dto.amount,
          currency: dto.currency,
          detail: dto.detail ?? null,
          occurredAt: dto.occurredAt,
          visibility: 'PERSONAL',
          householdId: null,
          userId,
          ...categoryColumns,
        },
        ...expenseWithCategory,
      });
    });

    return toExpenseResponse(expense);
  }

  async findAllForUser(userId: string) {
    const expenses = await this.prisma.expense.findMany({
      where: { userId, visibility: 'PERSONAL' },
      orderBy: { occurredAt: 'desc' },
      ...expenseWithCategory,
    });

    return expenses.map(toExpenseResponse);
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

    const expense = await this.prisma.$transaction(async (tx) => {
      const categoryColumns = dto.category
        ? await this.categories.resolveForExpense(tx, userId, dto.category)
        : {};

      return tx.expense.update({
        where: { id },
        data: {
          amount: dto.amount,
          currency: dto.currency,
          detail: dto.detail,
          occurredAt: dto.occurredAt,
          ...categoryColumns,
        },
        ...expenseWithCategory,
      });
    });

    return toExpenseResponse(expense);
  }

  async remove(userId: string, id: string) {
    await this.findOwnedOrThrow(userId, id);

    await this.prisma.expense.delete({ where: { id } });
  }
}
