"use client"

import { useRef, useState, type FormEvent } from "react"
import { CircleAlert } from "lucide-react"
import { CategoryCombobox } from "@/components/category-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { apiFetch } from "@/lib/api-client"
import { DETAIL_MAX_LENGTH, MISSING_CATEGORY_MESSAGE, toCategoryRef, toDetail } from "@/lib/expenses"
import type { CategoryChoice, Currency, Expense } from "@/lib/expenses"

type Status = "idle" | "submitting"


function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function extractErrorMessages(body: unknown): string[] {
  const message = (body as { message?: unknown } | null)?.message

  if (Array.isArray(message)) {
    return message.map(String)
  }

  if (typeof message === "string" && message.length > 0) {
    return [message]
  }

  return ["No pudimos guardar el gasto. Probá otra vez."]
}

interface ExpenseFormProps {
  onCreated?: (expense: Expense) => void
}

export function ExpenseForm({ onCreated }: ExpenseFormProps) {
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState<Currency>("ARS")
  const [category, setCategory] = useState<CategoryChoice | null>(null)
  const [detail, setDetail] = useState("")
  const categoryInputRef = useRef<HTMLInputElement>(null)
  const [occurredAt, setOccurredAt] = useState(todayIsoDate)
  const [errors, setErrors] = useState<string[]>([])
  const [status, setStatus] = useState<Status>("idle")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!category) {
      setErrors([MISSING_CATEGORY_MESSAGE])
      categoryInputRef.current?.focus()
      return
    }

    setStatus("submitting")
    setErrors([])

    try {
      const response = await apiFetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency,
          category: toCategoryRef(category),
          detail: toDetail(detail),
          occurredAt,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setErrors(extractErrorMessages(body))
        setStatus("idle")
        return
      }

      const created = (await response.json()) as Expense
      onCreated?.(created)
      setAmount("")
      setCategory(null)
      setDetail("")
      setOccurredAt(todayIsoDate())
      setStatus("idle")
    } catch {
      setErrors(["Sin conexión con el servidor. Revisá tu internet y probá otra vez."])
      setStatus("idle")
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Cargar gasto"
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expense-amount">Monto</Label>
          <Input
            id="expense-amount"
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0,00"
            className="tabular-nums"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expense-currency">Moneda</Label>
          <Select
            id="expense-currency"
            name="currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value as Currency)}
          >
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-category">Tipo de gasto</Label>
        <CategoryCombobox
          id="expense-category"
          value={category}
          onChange={(next) => {
            setCategory(next)
            if (next) setErrors((current) => current.filter((message) => message !== MISSING_CATEGORY_MESSAGE))
          }}
          invalid={errors.includes(MISSING_CATEGORY_MESSAGE)}
          inputRef={categoryInputRef}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-detail">
          Detalle <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id="expense-detail"
          name="detail"
          type="text"
          maxLength={DETAIL_MAX_LENGTH}
          placeholder="Ej.: facturas para el domingo"
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-occurred-at">Fecha</Label>
        <Input
          id="expense-occurred-at"
          name="occurredAt"
          type="date"
          value={occurredAt}
          onChange={(event) => setOccurredAt(event.target.value)}
        />
      </div>

      {errors.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <ul className="flex flex-col gap-1">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <Button type="submit" size="lg" className="mt-1 w-full" disabled={status === "submitting"}>
        {status === "submitting" ? "Cargando…" : "Cargar gasto"}
      </Button>
    </form>
  )
}
