"use client"

import { useState, type FormEvent } from "react"
import { CircleAlert, Pencil, ReceiptText, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatAmount, totalsByCurrency } from "@/lib/expenses"
import type { Currency, Expense, ExpenseInput } from "@/lib/expenses"

interface ExpenseListProps {
  expenses: Expense[]
  onEdit: (id: string, payload: ExpenseInput) => Promise<Expense | null>
  onDelete: (id: string) => Promise<boolean>
  /** Month the totals are scoped to; defaults to the current month. Overridable for tests. */
  referenceDate?: Date
  /** True while the initial list is being fetched: renders skeletons instead of the empty state. */
  loading?: boolean
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
      className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,1.4fr)_10rem]"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`edit-amount-${expense.id}`}>Monto</Label>
        <Input
          id={`edit-amount-${expense.id}`}
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          className="tabular-nums"
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
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive sm:col-span-full"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <div className="flex justify-end gap-2 sm:col-span-full">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  )
}

interface TotalTileProps {
  currency: Currency
  label: string
  total: number
  count: number
}

function TotalTile({ currency, label, total, count }: TotalTileProps) {
  return (
    <Card className="gap-2 px-5 py-4 shadow-xs sm:gap-3 sm:py-5 dark:shadow-none">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        <CurrencyBadge currency={currency} />
      </div>
      <span
        data-testid={`total-${currency}`}
        className="text-2xl font-semibold tracking-tight text-foreground tabular-nums sm:text-3xl"
      >
        {formatAmount(total, currency)}
      </span>
      <span className="text-xs text-muted-foreground">
        {count === 0 ? "Sin gastos este mes" : count === 1 ? "1 gasto este mes" : `${count} gastos este mes`}
      </span>
    </Card>
  )
}

function CurrencyBadge({ currency }: { currency: Currency }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {currency}
    </span>
  )
}

function ListSkeleton() {
  return (
    <div aria-hidden className="divide-y">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <ReceiptText aria-hidden className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">Todavía no cargaste ningún gasto.</p>
        <p className="text-sm text-muted-foreground">Usá el formulario para cargar el primero.</p>
      </div>
    </div>
  )
}

function countThisMonth(expenses: Expense[], currency: Currency, referenceDate: Date = new Date()): number {
  return expenses.filter((expense) => {
    const occurred = new Date(expense.occurredAt)
    return (
      expense.currency === currency &&
      occurred.getUTCFullYear() === referenceDate.getUTCFullYear() &&
      occurred.getUTCMonth() === referenceDate.getUTCMonth()
    )
  }).length
}

// Two separate totals (ARS, USD) are shown side by side and never combined
// or converted into one another — see ADR 0002.
export function ExpenseList({ expenses, onEdit, onDelete, referenceDate, loading = false }: ExpenseListProps) {
  const totals = totalsByCurrency(expenses, referenceDate)
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
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TotalTile
          currency="ARS"
          label="Total del mes en pesos"
          total={totals.ARS}
          count={countThisMonth(expenses, "ARS", referenceDate)}
        />
        <TotalTile
          currency="USD"
          label="Total del mes en dólares"
          total={totals.USD}
          count={countThisMonth(expenses, "USD", referenceDate)}
        />
      </div>

      <Card className="gap-0 py-0 shadow-xs dark:shadow-none">
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground">Historial</h2>
          {!loading && expenses.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {expenses.length === 1 ? "1 gasto" : `${expenses.length} gastos`}
            </span>
          )}
        </div>

        {loading ? (
          <ListSkeleton />
        ) : expenses.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y">
            {expenses.map((expense) => (
              <li key={expense.id} className="group/row">
                {editingId === expense.id ? (
                  <div className="bg-muted/40 px-5 py-4">
                    <EditExpenseForm
                      expense={expense}
                      onSave={(payload) => handleSave(expense, payload)}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                      <span className="col-start-1 row-start-1 truncate text-sm font-medium text-foreground">
                        {expense.description}
                      </span>
                      <span className="col-start-1 row-start-2 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                        {new Date(expense.occurredAt).toLocaleDateString("es-AR", {
                          timeZone: "UTC",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <div className="col-start-2 row-start-1 flex items-center justify-self-end gap-2 sm:row-span-2 sm:gap-3">
                        <span className="text-sm font-semibold whitespace-nowrap text-foreground tabular-nums">
                          {formatAmount(expense.amount, expense.currency)}
                        </span>
                        <CurrencyBadge currency={expense.currency} />
                      </div>
                      {confirmingDeleteId !== expense.id && (
                        <div className="col-start-2 row-start-2 -mr-2 flex justify-self-end transition-opacity sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:mr-0 pointer-fine:opacity-0 pointer-fine:group-hover/row:opacity-100 pointer-fine:group-focus-within/row:opacity-100">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="max-sm:-my-1.5 max-sm:size-10"
                            aria-label={`Editar ${expense.description}`}
                            onClick={() => setEditingId(expense.id)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="hover:bg-destructive/10 hover:text-destructive max-sm:-my-1.5 max-sm:size-10"
                            aria-label={`Eliminar ${expense.description}`}
                            onClick={() => {
                              setConfirmingDeleteId(expense.id)
                              setDeleteError(null)
                            }}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      )}
                    </div>

                    {confirmingDeleteId === expense.id && (
                      <div className="flex flex-col gap-3 rounded-lg bg-destructive/5 p-3 ring-1 ring-destructive/20 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm text-foreground">
                            ¿Seguro que querés eliminar este gasto?
                          </p>
                          {deleteError && (
                            <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
                              <CircleAlert aria-hidden className="size-4 shrink-0" />
                              {deleteError}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setConfirmingDeleteId(null)
                              setDeleteError(null)
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => handleConfirmDelete(expense.id)}
                          >
                            Sí, eliminar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
