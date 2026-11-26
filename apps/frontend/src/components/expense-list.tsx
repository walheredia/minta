import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { formatAmount, totalsByCurrency } from "@/lib/expenses"
import type { Expense } from "@/lib/expenses"

interface ExpenseListProps {
  expenses: Expense[]
}

// Two separate totals (ARS, USD) are shown side by side and never combined
// or converted into one another — see ADR 0002.
export function ExpenseList({ expenses }: ExpenseListProps) {
  const totals = totalsByCurrency(expenses)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <CardDescription>Total en pesos</CardDescription>
            <CardTitle
              data-testid="total-ARS"
              className="text-xl font-semibold text-foreground"
            >
              {formatAmount(totals.ARS, "ARS")}
            </CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <CardDescription>Total en dólares</CardDescription>
            <CardTitle
              data-testid="total-USD"
              className="text-xl font-semibold text-foreground"
            >
              {formatAmount(totals.USD, "USD")}
            </CardTitle>
          </CardContent>
        </Card>
      </div>

      {expenses.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Todavía no cargaste ningún gasto.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {expenses.map((expense) => (
            <li key={expense.id}>
              <Card size="sm">
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-foreground">
                      {expense.description}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(expense.occurredAt).toLocaleDateString("es-AR", {
                        timeZone: "UTC",
                      })}
                    </span>
                  </div>
                  <span className="shrink-0 font-medium text-foreground">
                    {formatAmount(expense.amount, expense.currency)}
                  </span>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
