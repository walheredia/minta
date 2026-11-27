import type { PrismaClient } from '../generated/prisma/client.js';
import { normalizeCategoryKey } from './category-name.js';
import { SYSTEM_CATEGORY_CATALOG } from './system-categories.catalog.js';

interface CatalogEntry {
  name: string;
  normalizedKey: string;
  groupName: string;
}

function catalogEntries(): CatalogEntry[] {
  const seen = new Map<string, string>();
  const entries: CatalogEntry[] = [];

  for (const [groupName, names] of Object.entries(SYSTEM_CATEGORY_CATALOG)) {
    for (const name of names) {
      const normalizedKey = normalizeCategoryKey(name);
      const clash = seen.get(normalizedKey);
      if (clash) {
        throw new Error(
          `System Category catalog: "${name}" collides with "${clash}" (key "${normalizedKey}").`,
        );
      }
      seen.set(normalizedKey, name);
      entries.push({ name, normalizedKey, groupName });
    }
  }

  return entries;
}

/**
 * Brings the System Category table in line with the catalog. Idempotent:
 * creates missing categories and updates renamed/regrouped ones, matching by
 * normalized key. Never deletes (Expenses may reference retired names).
 */
export async function syncSystemCategories(
  prisma: PrismaClient,
): Promise<void> {
  const entries = catalogEntries();
  const existing = await prisma.systemExpenseCategory.findMany();
  const existingByKey = new Map(
    existing.map((category) => [category.normalizedKey, category]),
  );

  const missing = entries.filter(
    (entry) => !existingByKey.has(entry.normalizedKey),
  );
  const changed = entries.filter((entry) => {
    const current = existingByKey.get(entry.normalizedKey);
    return (
      current &&
      (current.name !== entry.name || current.groupName !== entry.groupName)
    );
  });

  await prisma.$transaction(async (tx) => {
    if (missing.length > 0) {
      await tx.systemExpenseCategory.createMany({ data: missing });
    }
    for (const entry of changed) {
      await tx.systemExpenseCategory.update({
        where: { normalizedKey: entry.normalizedKey },
        data: { name: entry.name, groupName: entry.groupName },
      });
    }
  });
}
