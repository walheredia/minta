"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseList } from "@/components/expense-list"
import type { Expense } from "@/lib/expenses"

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

  useEffect(() => {
    let cancelled = false

    async function loadExpenses() {
      try {
        const response = await fetch("/api/expenses")

        if (!response.ok) {
          if (!cancelled) setLoadError("No pudimos cargar tus gastos. Probá de nuevo.")
          return
        }

        const data = (await response.json()) as Expense[]
        if (!cancelled) setExpenses(sortByOccurredAtDescending(data))
      } catch {
        if (!cancelled) setLoadError("No pudimos conectar con el servidor. Probá de nuevo.")
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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Cargar un gasto</CardTitle>
          <CardDescription>Monto, moneda, descripción y fecha.</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm onCreated={handleCreated} />
        </CardContent>
      </Card>

      {loadError && (
        <p role="alert" className="text-sm text-destructive">
          {loadError}
        </p>
      )}

      <ExpenseList expenses={expenses} />
    </div>
  )
}
