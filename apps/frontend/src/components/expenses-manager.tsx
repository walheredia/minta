"use client"

import { useEffect, useState } from "react"
import { CircleAlert } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseList } from "@/components/expense-list"
import { apiFetch } from "@/lib/api-client"
import type { Expense, ExpenseInput } from "@/lib/expenses"

function sortByOccurredAtDescending(expenses: Expense[]): Expense[] {
  return [...expenses].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  )
}

// Owns the client-side state for the `/gastos` screen: fetches the
// authenticated user's expenses on mount and keeps the list in sync as new
// ones are added through `ExpenseForm`.
export function ExpensesManager() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadExpenses() {
      try {
        const response = await apiFetch("/api/expenses")

        if (!response.ok) {
          if (!cancelled) setLoadError("No pudimos cargar tus gastos. Probá otra vez.")
          return
        }

        const data = (await response.json()) as Expense[]
        if (!cancelled) setExpenses(sortByOccurredAtDescending(data))
      } catch {
        if (!cancelled) setLoadError("Sin conexión con el servidor. Revisá tu internet y probá otra vez.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadExpenses()

    return () => {
      cancelled = true
    }
  }, [])

  function handleCreated(expense: Expense) {
    setExpenses((previous) => sortByOccurredAtDescending([expense, ...previous]))
  }

  async function handleEdit(id: string, payload: ExpenseInput): Promise<Expense | null> {
    try {
      const response = await apiFetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) return null

      const updated = (await response.json()) as Expense
      setExpenses((previous) =>
        sortByOccurredAtDescending(previous.map((expense) => (expense.id === id ? updated : expense)))
      )
      return updated
    } catch {
      return null
    }
  }

  async function handleDelete(id: string): Promise<boolean> {
    try {
      const response = await apiFetch(`/api/expenses/${id}`, { method: "DELETE" })

      if (!response.ok) return false

      setExpenses((previous) => previous.filter((expense) => expense.id !== id))
      return true
    } catch {
      return false
    }
  }

  const monthLabel = new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" })

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Gastos</h1>
        <p suppressHydrationWarning className="text-sm text-muted-foreground first-letter:uppercase">
          {monthLabel}
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <aside className="lg:sticky lg:top-20 lg:order-last">
          <Card className="shadow-xs dark:shadow-none">
            <CardHeader>
              <CardTitle className="font-semibold">Nuevo gasto</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseForm onCreated={handleCreated} />
            </CardContent>
          </Card>
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          {loadError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>{loadError}</span>
            </p>
          )}

          <ExpenseList
            expenses={expenses}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </main>
  )
}
