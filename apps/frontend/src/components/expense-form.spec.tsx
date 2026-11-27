import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { ExpenseForm } from "./expense-form"
import type { Expense, ExpenseCategory } from "@/lib/expenses"

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

const supermercado: ExpenseCategory = { id: "cat_super", name: "Supermercado", source: "SYSTEM" }

const created: Expense = {
  id: "expense_1",
  amount: "1500.5",
  currency: "USD",
  category: supermercado,
  detail: "Compra del mes",
  occurredAt: "2026-01-10T00:00:00.000Z",
  createdAt: "2026-01-10T00:00:00.000Z",
  updatedAt: "2026-01-10T00:00:00.000Z",
  userId: "user_1",
}

/** Types into "Tipo de gasto" and picks the suggestion served by the (mocked) search. */
async function pickCategory(text: string, name: RegExp) {
  fireEvent.change(screen.getByLabelText(/tipo de gasto/i), { target: { value: text } })
  fireEvent.click(await screen.findByRole("option", { name }))
}

function expensePosts() {
  return vi.mocked(fetch).mock.calls.filter(([url]) => url === "/api/expenses")
}

describe("ExpenseForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("submits a new expense with its category and detail, then resets the form", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(200, [supermercado])) // category search
      .mockResolvedValueOnce(jsonResponse(201, created)) // POST /api/expenses

    const onCreated = vi.fn()
    render(<ExpenseForm onCreated={onCreated} />)

    fireEvent.change(screen.getByLabelText(/monto/i), { target: { value: "1500.5" } })
    fireEvent.change(screen.getByLabelText(/moneda/i), { target: { value: "USD" } })
    await pickCategory("super", /supermercado/i)
    fireEvent.change(screen.getByLabelText(/detalle/i), { target: { value: "  Compra del mes " } })
    fireEvent.change(screen.getByLabelText(/fecha/i), { target: { value: "2026-01-10" } })
    fireEvent.click(screen.getByRole("button", { name: /cargar gasto/i }))

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(created)
    })

    expect(expensePosts()[0][1]).toEqual(
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          amount: "1500.5",
          currency: "USD",
          category: { source: "SYSTEM", id: "cat_super" },
          detail: "Compra del mes",
          occurredAt: "2026-01-10",
        }),
      })
    )

    expect(screen.getByLabelText(/tipo de gasto/i)).toHaveValue("")
    expect(screen.getByLabelText(/detalle/i)).toHaveValue("")
  })

  it("asks for a category before submitting, without calling the backend", async () => {
    render(<ExpenseForm />)

    fireEvent.change(screen.getByLabelText(/monto/i), { target: { value: "100" } })
    fireEvent.click(screen.getByRole("button", { name: /cargar gasto/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Elegí o creá un tipo de gasto.")
    expect(screen.getByLabelText(/tipo de gasto/i)).toHaveFocus()
    expect(expensePosts()).toHaveLength(0)
  })

  it("shows an inline error when the amount is invalid, without notifying the parent", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(200, [supermercado]))
      .mockResolvedValueOnce(
        jsonResponse(400, {
          statusCode: 400,
          message: ["amount: El monto debe ser mayor a 0."],
          error: "Bad Request",
        })
      )

    const onCreated = vi.fn()
    render(<ExpenseForm onCreated={onCreated} />)

    fireEvent.change(screen.getByLabelText(/monto/i), { target: { value: "-5" } })
    await pickCategory("super", /supermercado/i)
    fireEvent.change(screen.getByLabelText(/fecha/i), { target: { value: "2026-01-10" } })
    fireEvent.click(screen.getByRole("button", { name: /cargar gasto/i }))

    await waitFor(() => {
      expect(screen.getByText(/el monto debe ser mayor a 0/i)).toBeInTheDocument()
    })

    expect(onCreated).not.toHaveBeenCalled()
  })

  it("silently refreshes and retries the create call when the access token expired, without surfacing an error", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(200, [supermercado])) // category search
      .mockResolvedValueOnce(jsonResponse(401, {})) // original POST /api/expenses
      .mockResolvedValueOnce(jsonResponse(200, {})) // POST /api/auth/refresh
      .mockResolvedValueOnce(jsonResponse(201, created)) // retried POST /api/expenses

    const onCreated = vi.fn()
    render(<ExpenseForm onCreated={onCreated} />)

    fireEvent.change(screen.getByLabelText(/monto/i), { target: { value: "1500.5" } })
    await pickCategory("super", /supermercado/i)
    fireEvent.change(screen.getByLabelText(/fecha/i), { target: { value: "2026-01-10" } })
    fireEvent.click(screen.getByRole("button", { name: /cargar gasto/i }))

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(created)
    })

    expect(fetch).toHaveBeenCalledTimes(4)
    expect(fetch).toHaveBeenNthCalledWith(3, "/api/auth/refresh", expect.objectContaining({ method: "POST" }))
  })
})
