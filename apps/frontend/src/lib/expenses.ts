export type Currency = "ARS" | "USD"

/** Shown when an Expense is saved without an Expense Category. */
export const MISSING_CATEGORY_MESSAGE = "Elegí o creá un tipo de gasto."

/** Maximum length of an Expense's Detail (mirrors the backend). */
export const DETAIL_MAX_LENGTH = 200

export type CategorySource = "SYSTEM" | "HOUSEHOLD"

/** An Expense Category ("Tipo de gasto") as returned by the API. */
export interface ExpenseCategory {
  id: string
  name: string
  source: CategorySource
}

/** A category the user typed that doesn't exist yet; created when the Expense is saved. */
export interface NewCategory {
  source: "NEW"
  name: string
}

/** What the category picker yields: an existing category or a new one to create. */
export type CategoryChoice = ExpenseCategory | NewCategory

/** Reference to the category an Expense is classified under, as sent to the API. */
export type CategoryRef = Pick<ExpenseCategory, "id" | "source"> | NewCategory

export interface Expense {
  id: string
  amount: string
  currency: Currency
  category: ExpenseCategory
  detail: string | null
  occurredAt: string
  createdAt: string
  updatedAt: string
  userId: string
}

/** Shape of the editable fields sent to the backend on create/update. */
export interface ExpenseInput {
  amount: string
  currency: Currency
  category: CategoryRef
  detail: string | null
  occurredAt: string
}

/** The category reference to send for a picked category. */
export function toCategoryRef(choice: CategoryChoice): CategoryRef {
  return choice.source === "NEW" ? choice : { source: choice.source, id: choice.id }
}

/** Trims the Detail; blank becomes null. */
export function toDetail(raw: string): string | null {
  const trimmed = raw.trim()
  return trimmed === "" ? null : trimmed
}

const CURRENCY_FORMATTERS: Record<Currency, Intl.NumberFormat> = {
  ARS: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }),
  USD: new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD" }),
}

/** Formats an amount using Argentine thousands/decimal separators for the given currency. */
export function formatAmount(amount: string | number, currency: Currency): string {
  return CURRENCY_FORMATTERS[currency].format(Number(amount))
}

/** True when `occurredAt` falls in the same calendar year/month as `referenceDate`. */
function isInSameMonth(occurredAt: string, referenceDate: Date): boolean {
  const occurred = new Date(occurredAt)
  return (
    occurred.getUTCFullYear() === referenceDate.getUTCFullYear() &&
    occurred.getUTCMonth() === referenceDate.getUTCMonth()
  )
}

/**
 * Sums this month's expense amounts per currency ("quiero ver el total de
 * mis gastos del mes" — the list itself still shows full history, only the
 * totals are scoped to the current month). ARS and USD totals are always
 * kept separate and never combined or converted into one another (ADR 0002).
 */
export function totalsByCurrency(
  expenses: Expense[],
  referenceDate: Date = new Date()
): Record<Currency, number> {
  return expenses
    .filter((expense) => isInSameMonth(expense.occurredAt, referenceDate))
    .reduce<Record<Currency, number>>(
      (totals, expense) => {
        totals[expense.currency] += Number(expense.amount)
        return totals
      },
      { ARS: 0, USD: 0 }
    )
}
