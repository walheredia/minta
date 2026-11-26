export type Currency = "ARS" | "USD"

export interface Expense {
  id: string
  amount: string
  currency: Currency
  description: string
  occurredAt: string
  createdAt: string
  updatedAt: string
  userId: string
}

const CURRENCY_FORMATTERS: Record<Currency, Intl.NumberFormat> = {
  ARS: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }),
  USD: new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD" }),
}

/** Formats an amount using Argentine thousands/decimal separators for the given currency. */
export function formatAmount(amount: string | number, currency: Currency): string {
  return CURRENCY_FORMATTERS[currency].format(Number(amount))
}

/**
 * Sums expense amounts per currency. ARS and USD totals are always kept
 * separate and never combined or converted into one another (ADR 0002).
 */
export function totalsByCurrency(expenses: Expense[]): Record<Currency, number> {
  return expenses.reduce<Record<Currency, number>>(
    (totals, expense) => {
      totals[expense.currency] += Number(expense.amount)
      return totals
    },
    { ARS: 0, USD: 0 }
  )
}
