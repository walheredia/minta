/**
 * Client-side mirror of the backend's category name normalization. Only used
 * for UI decisions (highlighting, offering "Crear «X»"); the server remains
 * the source of truth for uniqueness.
 */
export const CATEGORY_SEARCH_MIN_LENGTH = 3
export const CATEGORY_NAME_MAX_LENGTH = 40

/** Name as stored: trimmed, inner whitespace collapsed, first letter upper-cased. */
export function toCategoryDisplayName(raw: string): string {
  const collapsed = raw.trim().replace(/\s+/g, " ")
  return collapsed.charAt(0).toLocaleUpperCase("es-AR") + collapsed.slice(1)
}

function foldChar(char: string): string {
  return char.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es-AR")
}

export function normalizeCategoryKey(raw: string): string {
  return Array.from(raw.trim().replace(/\s+/g, " ")).map(foldChar).join("")
}

/**
 * Splits `name` into the parts before, inside and after the first
 * accent/case-insensitive occurrence of `query`, for highlighting.
 */
export function splitOnMatch(name: string, query: string): [string, string, string] {
  const key = normalizeCategoryKey(query)
  const chars = Array.from(name)
  const folded = chars.map(foldChar)
  if (!key) return [name, "", ""]

  for (let start = 0; start < chars.length; start++) {
    let candidate = ""
    for (let end = start; end < chars.length; end++) {
      candidate += folded[end]
      if (candidate === key) {
        return [chars.slice(0, start).join(""), chars.slice(start, end + 1).join(""), chars.slice(end + 1).join("")]
      }
      if (!key.startsWith(candidate)) break
    }
  }

  return [name, "", ""]
}
