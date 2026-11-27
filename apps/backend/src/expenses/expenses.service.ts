import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExpenseDto } from './create-expense.schema.js';
import type { CategoryRef } from './expense-fields.schema.js';
import { UpdateExpenseDto } from './update-expense.schema.js';

const INVALID_CATEGORY_MESSAGE = 'Tipo de gasto inválido.';

const expenseWithCategory = {
  include: { systemCategory: { select: { id: true, name: true } } },
} satisfies Prisma.ExpenseDefaultArgs;

type ExpenseWithCategory = Prisma.ExpenseGetPayload<typeof expenseWithCategory>;

/** API shape of an Expense: the category is embedded, FK columns are not exposed. */
function toExpenseResponse(expense: ExpenseWithCategory) {
  const { systemCategory, systemCategoryId: _systemCategoryId, ...rest } = expense;
  return { ...rest, category: { ...systemCategory, source: 'SYSTEM' as const } };
}

/**
 * All expenses created and listed through this service are forced to
 * `visibility: PERSONAL` and `householdId: null` — this iteration has no
 * Shared/Household expenses yet (see ADR-backed spec decisions). Any
 * client-supplied `visibility`, `householdId` or `userId` is ignored.
 */
@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves a category reference to the FK columns to store. Any reference
   * the User cannot use yields the same generic 400, so nothing is revealed
   * about categories outside their reach.
   */
  private async resolveCategory(ref: CategoryRef) {
    const category = await this.prisma.systemExpenseCategory.findUnique({
      where: { id: ref.id },
      select: { id: true },
    });

    if (!category) {
      throw new BadRequestException(INVALID_CATEGORY_MESSAGE);
    }

    return { systemCategoryId: category.id };
  }

  async create(userId: string, dto: CreateExpenseDto) {
    const categoryColumns = await this.resolveCategory(dto.category);

    const expense = await this.prisma.expense.create({
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
    const categoryColumns = dto.category ? await this.resolveCategory(dto.category) : {};

    const expense = await this.prisma.expense.update({
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

    return toExpenseResponse(expense);
  }

  async remove(userId: string, id: string) {
    await this.findOwnedOrThrow(userId, id);

    await this.prisma.expense.delete({ where: { id } });
  }
}
