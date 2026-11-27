import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CategoryRef } from '../expenses/expense-fields.schema.js';
import { normalizeCategoryKey } from './category-name.js';

export const SEARCH_MIN_LENGTH = 3;
export const SEARCH_MAX_RESULTS = 8;

const INVALID_CATEGORY_MESSAGE = 'Tipo de gasto inválido.';

export type CategorySource = 'SYSTEM' | 'HOUSEHOLD';

export interface CategorySuggestion {
  id: string;
  name: string;
  source: CategorySource;
}

/** FK columns that classify an Expense; exactly one is set (ADR 0004). */
export interface ExpenseCategoryColumns {
  systemCategoryId: string | null;
  householdCategoryId: string | null;
}

interface Candidate extends CategorySuggestion {
  normalizedKey: string;
  usage: number;
}

type Db = Prisma.TransactionClient | PrismaService;

function compareCandidates(key: string) {
  return (a: Candidate, b: Candidate) => {
    const aPrefix = a.normalizedKey.startsWith(key) ? 0 : 1;
    const bPrefix = b.normalizedKey.startsWith(key) ? 0 : 1;
    return (
      aPrefix - bPrefix ||
      b.usage - a.usage ||
      a.normalizedKey.localeCompare(b.normalizedKey, 'es-AR')
    );
  };
}

/**
 * Owns Expense Categories: which ones a User can see (System Categories plus
 * their own Household's), searching them, and turning a category reference on
 * an Expense into the columns to store, creating Household Categories on demand.
 */
@Injectable()
export class ExpenseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private async householdIdFor(db: Db, userId: string): Promise<string> {
    const membership = await db.householdMember.findUniqueOrThrow({
      where: { userId },
      select: { householdId: true },
    });
    return membership.householdId;
  }

  /**
   * Search-as-you-type over the Expense Categories visible to the User:
   * substring match on the normalized key; prefix matches first, then the
   * ones the Household uses most, then alphabetical; capped at
   * {@link SEARCH_MAX_RESULTS}.
   */
  async search(userId: string, query: string): Promise<CategorySuggestion[]> {
    const key = normalizeCategoryKey(query);
    if (key.length < SEARCH_MIN_LENGTH) {
      return [];
    }

    const householdId = await this.householdIdFor(this.prisma, userId);
    const select = { id: true, name: true, normalizedKey: true } as const;
    const [systemMatches, householdMatches] = await Promise.all([
      this.prisma.systemExpenseCategory.findMany({
        where: { normalizedKey: { contains: key } },
        select,
      }),
      this.prisma.householdExpenseCategory.findMany({
        where: { householdId, normalizedKey: { contains: key } },
        select,
      }),
    ]);

    const usage = await this.usageByCategory(
      householdId,
      systemMatches.map((c) => c.id),
      householdMatches.map((c) => c.id),
    );

    const candidates: Candidate[] = [
      ...systemMatches.map((c) => ({
        ...c,
        source: 'SYSTEM' as const,
        usage: usage.get(`SYSTEM:${c.id}`) ?? 0,
      })),
      ...householdMatches.map((c) => ({
        ...c,
        source: 'HOUSEHOLD' as const,
        usage: usage.get(`HOUSEHOLD:${c.id}`) ?? 0,
      })),
    ];

    return candidates
      .sort(compareCandidates(key))
      .slice(0, SEARCH_MAX_RESULTS)
      .map(({ id, name, source }) => ({ id, name, source }));
  }

  /** How many Expenses of the Household's members use each of the given categories. */
  private async usageByCategory(
    householdId: string,
    systemIds: string[],
    householdIds: string[],
  ) {
    const counts = await this.prisma.expense.groupBy({
      by: ['systemCategoryId', 'householdCategoryId'],
      where: {
        user: { householdMemberships: { some: { householdId } } },
        OR: [
          { systemCategoryId: { in: systemIds } },
          { householdCategoryId: { in: householdIds } },
        ],
      },
      _count: { _all: true },
    });

    const usage = new Map<string, number>();
    for (const row of counts) {
      const key = row.systemCategoryId
        ? `SYSTEM:${row.systemCategoryId}`
        : `HOUSEHOLD:${row.householdCategoryId}`;
      usage.set(key, row._count._all);
    }
    return usage;
  }

  /**
   * Resolves the category reference on an Expense to the columns to store.
   * A `NEW` name reuses any visible category with the same normalized key and
   * otherwise creates a Household Category (inside `db`'s transaction). Any
   * reference outside the User's reach yields the same generic 400, so
   * nothing is revealed about other Households.
   */
  async resolveForExpense(
    db: Db,
    userId: string,
    ref: CategoryRef,
  ): Promise<ExpenseCategoryColumns> {
    if (ref.source === 'SYSTEM') {
      const category = await db.systemExpenseCategory.findUnique({
        where: { id: ref.id },
        select: { id: true },
      });
      if (!category) throw new BadRequestException(INVALID_CATEGORY_MESSAGE);
      return { systemCategoryId: category.id, householdCategoryId: null };
    }

    const householdId = await this.householdIdFor(db, userId);

    if (ref.source === 'HOUSEHOLD') {
      const category = await db.householdExpenseCategory.findFirst({
        where: { id: ref.id, householdId },
        select: { id: true },
      });
      if (!category) throw new BadRequestException(INVALID_CATEGORY_MESSAGE);
      return { systemCategoryId: null, householdCategoryId: category.id };
    }

    const normalizedKey = normalizeCategoryKey(ref.name);
    const system = await db.systemExpenseCategory.findUnique({
      where: { normalizedKey },
      select: { id: true },
    });
    if (system) {
      return { systemCategoryId: system.id, householdCategoryId: null };
    }

    const household = await db.householdExpenseCategory.upsert({
      where: { householdId_normalizedKey: { householdId, normalizedKey } },
      create: {
        householdId,
        normalizedKey,
        name: ref.name,
        createdByUserId: userId,
      },
      update: {},
      select: { id: true },
    });
    return { systemCategoryId: null, householdCategoryId: household.id };
  }
}
