import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { ExpenseForm } from "./expense-form"

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

describe("ExpenseForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("submits a new expense and notifies the parent with the created expense", async () => {
    const created = {
      id: "expense_1",
      amount: "1500.5",
      currency: "USD",
      description: "Supermercado",
      occurredAt: "2026-01-10T00:00:00.000Z",
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: "2026-01-10T00:00:00.000Z",
      userId: "user_1",
    }
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(201, created) as Response)

    const onCreated = vi.fn()
    render(<ExpenseForm onCreated={onCreated} />)

    fireEvent.change(screen.getByLabelText(/monto/i), { target: { value: "1500.5" } })
    fireEvent.change(screen.getByLabelText(/moneda/i), { target: { value: "USD" } })
    fireEvent.change(screen.getByLabelText(/descripción/i), {
      target: { value: "Supermercado" },
    })
    fireEvent.change(screen.getByLabelText(/fecha/i), { target: { value: "2026-01-10" } })
    fireEvent.click(screen.getByRole("button", { name: /cargar gasto/i }))

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(created)
    })

    expect(fetch).toHaveBeenCalledWith(
      "/api/expenses",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          amount: "1500.5",
          currency: "USD",
          description: "Supermercado",
          occurredAt: "2026-01-10",
        }),
      })
    )

    expect(screen.getByLabelText(/descripción/i)).toHaveValue("")
  })

  it("shows an inline error when the amount is invalid, without notifying the parent", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(400, {
        statusCode: 400,
        message: ["amount: El monto debe ser mayor a 0."],
        error: "Bad Request",
      }) as Response
    )

    const onCreated = vi.fn()
    render(<ExpenseForm onCreated={onCreated} />)

    fireEvent.change(screen.getByLabelText(/monto/i), { target: { value: "-5" } })
    fireEvent.change(screen.getByLabelText(/descripción/i), {
      target: { value: "Gasto inválido" },
    })
    fireEvent.change(screen.getByLabelText(/fecha/i), { target: { value: "2026-01-10" } })
    fireEvent.click(screen.getByRole("button", { name: /cargar gasto/i }))

    await waitFor(() => {
      expect(screen.getByText(/el monto debe ser mayor a 0/i)).toBeInTheDocument()
    })

    expect(onCreated).not.toHaveBeenCalled()
  })

  it("silently refreshes and retries the create call when the access token expired, without surfacing an error", async () => {
    const created = {
      id: "expense_1",
      amount: "1500.5",
      currency: "USD",
      description: "Supermercado",
      occurredAt: "2026-01-10T00:00:00.000Z",
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: "2026-01-10T00:00:00.000Z",
      userId: "user_1",
    }
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, {}) as Response) // original POST /api/expenses
      .mockResolvedValueOnce(jsonResponse(200, {}) as Response) // POST /api/auth/refresh
      .mockResolvedValueOnce(jsonResponse(201, created) as Response) // retried POST /api/expenses

    const onCreated = vi.fn()
    render(<ExpenseForm onCreated={onCreated} />)

    fireEvent.change(screen.getByLabelText(/monto/i), { target: { value: "1500.5" } })
    fireEvent.change(screen.getByLabelText(/moneda/i), { target: { value: "USD" } })
    fireEvent.change(screen.getByLabelText(/descripción/i), {
      target: { value: "Supermercado" },
    })
    fireEvent.change(screen.getByLabelText(/fecha/i), { target: { value: "2026-01-10" } })
    fireEvent.click(screen.getByRole("button", { name: /cargar gasto/i }))

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(created)
    })

    expect(fetch).toHaveBeenCalledTimes(3)
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/auth/refresh",
      expect.objectContaining({ method: "POST" })
    )
  })
})
