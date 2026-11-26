"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { formatAmount, totalsByCurrency } from "@/lib/expenses"
import type { Currency, Expense, ExpenseInput } from "@/lib/expenses"

interface ExpenseListProps {
  expenses: Expense[]
  onEdit: (id: string, payload: ExpenseInput) => Promise<Expense | null>
  onDelete: (id: string) => Promise<boolean>
}

function toDateInputValue(occurredAt: string): string {
  return occurredAt.slice(0, 10)
}

interface EditExpenseFormProps {
  expense: Expense
  onSave: (payload: ExpenseInput) => Promise<void>
  onCancel: () => void
}

// Inline edit form rendered in place of a list row. Deliberately not shared
// with `ExpenseForm` (the add form): the two have different lifecycles
// (pre-filled + save/cancel vs. empty + submit/reset) and sharing would add
// more indirection than the small amount of duplicated markup is worth.
function EditExpenseForm({ expense, onSave, onCancel }: EditExpenseFormProps) {
  const [amount, setAmount] = useState(expense.amount)
  const [currency, setCurrency] = useState<Currency>(expense.currency)
  const [description, setDescription] = useState(expense.description)
  const [occurredAt, setOccurredAt] = useState(toDateInputValue(expense.occurredAt))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await onSave({ amount, currency, description, occurredAt })
    } catch {
      setError("No pudimos guardar los cambios. Probá de nuevo.")
      setSaving(false)
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Editar gasto"
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`edit-amount-${expense.id}`}>Monto</Label>
        <Input
          id={`edit-amount-${expense.id}`}
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`edit-currency-${expense.id}`}>Moneda</Label>
        <Select
          id={`edit-currency-${expense.id}`}
          name="currency"
          value={currency}
          onChange={(event) => setCurrency(event.target.value as Currency)}
        >
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`edit-description-${expense.id}`}>Descripción</Label>
        <Input
          id={`edit-description-${expense.id}`}
          name="description"
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`edit-occurred-at-${expense.id}`}>Fecha</Label>
        <Input
          id={`edit-occurred-at-${expense.id}`}
          name="occurredAt"
          type="date"
          value={occurredAt}
          onChange={(event) => setOccurredAt(event.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

// Two separate totals (ARS, USD) are shown side by side and never combined
// or converted into one another — see ADR 0002.
export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  const totals = totalsByCurrency(expenses)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleSave(expense: Expense, payload: ExpenseInput) {
    const updated = await onEdit(expense.id, payload)
    if (updated) {
      setEditingId(null)
    } else {
      throw new Error("edit failed")
    }
  }

  async function handleConfirmDelete(id: string) {
    const deleted = await onDelete(id)
    if (deleted) {
      setConfirmingDeleteId(null)
      setDeleteError(null)
    } else {
      setDeleteError("No pudimos eliminar el gasto. Probá de nuevo.")
    }
  }

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
              {editingId === expense.id ? (
                <Card size="sm">
                  <CardContent>
                    <EditExpenseForm
                      expense={expense}
                      onSave={(payload) => handleSave(expense, payload)}
                      onCancel={() => setEditingId(null)}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card size="sm">
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
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
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-medium text-foreground">
                          {formatAmount(expense.amount, expense.currency)}
                        </span>
                        {confirmingDeleteId !== expense.id && (
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              aria-label={`Editar ${expense.description}`}
                              onClick={() => setEditingId(expense.id)}
                            >
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              aria-label={`Eliminar ${expense.description}`}
                              onClick={() => {
                                setConfirmingDeleteId(expense.id)
                                setDeleteError(null)
                              }}
                            >
                              Eliminar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {confirmingDeleteId === expense.id && (
                      <div className="flex flex-col gap-2 border-t border-border pt-3">
                        <p className="text-sm text-foreground">
                          ¿Seguro que querés eliminar este gasto?
                        </p>
                        {deleteError && (
                          <p role="alert" className="text-sm text-destructive">
                            {deleteError}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleConfirmDelete(expense.id)}
                          >
                            Sí, eliminar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setConfirmingDeleteId(null)
                              setDeleteError(null)
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
