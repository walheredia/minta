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

/** Shape of the editable fields sent to the backend on create/update. */
export interface ExpenseInput {
  amount: string
  currency: Currency
  description: string
  occurredAt: string
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
