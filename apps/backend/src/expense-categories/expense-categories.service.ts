import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { normalizeCategoryKey } from './category-name.js';

export const SEARCH_MIN_LENGTH = 3;
export const SEARCH_MAX_RESULTS = 8;

export type CategorySource = 'SYSTEM' | 'HOUSEHOLD';

export interface CategorySuggestion {
  id: string;
  name: string;
  source: CategorySource;
}

interface Candidate extends CategorySuggestion {
  normalizedKey: string;
}

function compareCandidates(key: string) {
  return (a: Candidate, b: Candidate) => {
    const aPrefix = a.normalizedKey.startsWith(key) ? 0 : 1;
    const bPrefix = b.normalizedKey.startsWith(key) ? 0 : 1;
    return aPrefix - bPrefix || a.normalizedKey.localeCompare(b.normalizedKey, 'es-AR');
  };
}

@Injectable()
export class ExpenseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search-as-you-type over the Expense Categories visible to the User:
   * substring match on the normalized key, prefix matches first, then
   * alphabetical, capped at {@link SEARCH_MAX_RESULTS}.
   */
  async search(query: string): Promise<CategorySuggestion[]> {
    const key = normalizeCategoryKey(query);
    if (key.length < SEARCH_MIN_LENGTH) {
      return [];
    }

    const systemMatches = await this.prisma.systemExpenseCategory.findMany({
      where: { normalizedKey: { contains: key } },
      select: { id: true, name: true, normalizedKey: true },
    });

    const candidates: Candidate[] = systemMatches.map((category) => ({ ...category, source: 'SYSTEM' }));

    return candidates
      .sort(compareCandidates(key))
      .slice(0, SEARCH_MAX_RESULTS)
      .map(({ id, name, source }) => ({ id, name, source }));
  }
}
