/** Maximum length of an Expense Category name, after trimming. */
export const CATEGORY_NAME_MAX_LENGTH = 40;

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * The name as shown to users: trimmed, inner whitespace collapsed and the
 * first character upper-cased; the rest is kept exactly as typed.
 */
export function toCategoryDisplayName(raw: string): string {
  const collapsed = collapseWhitespace(raw);
  return collapsed.charAt(0).toLocaleUpperCase('es-AR') + collapsed.slice(1);
}

/**
 * Key used for uniqueness and search: case-, accent- and spacing-insensitive,
 * so "Panadería", "panaderia" and " PANADERIA " are the same category.
 */
export function normalizeCategoryKey(raw: string): string {
  return collapseWhitespace(raw)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('es-AR');
}
