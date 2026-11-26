import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { ExpensesManager } from "./expenses-manager"
import type { Expense } from "@/lib/expenses"

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

const expenses: Expense[] = [
  {
    id: "1",
    amount: "1000",
    currency: "ARS",
    description: "Supermercado",
    occurredAt: "2026-01-20T00:00:00.000Z",
    createdAt: "2026-01-20T00:00:00.000Z",
    updatedAt: "2026-01-20T00:00:00.000Z",
    userId: "user_1",
  },
]

describe("ExpensesManager", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("loads and renders the expense list on mount", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(200, expenses) as Response)

    render(<ExpensesManager />)

    await waitFor(() => {
      expect(screen.getByText("Supermercado")).toBeInTheDocument()
    })
  })

  it("silently refreshes and retries the initial list load when the access token expired", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, {}) as Response) // original GET /api/expenses
      .mockResolvedValueOnce(jsonResponse(200, {}) as Response) // POST /api/auth/refresh
      .mockResolvedValueOnce(jsonResponse(200, expenses) as Response) // retried GET /api/expenses

    render(<ExpensesManager />)

    await waitFor(() => {
      expect(screen.getByText("Supermercado")).toBeInTheDocument()
    })

    expect(fetch).toHaveBeenCalledTimes(3)
    expect(fetch).toHaveBeenNthCalledWith(1, "/api/expenses", undefined)
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/auth/refresh",
      expect.objectContaining({ method: "POST" })
    )
    expect(fetch).toHaveBeenNthCalledWith(3, "/api/expenses", undefined)
    expect(screen.queryByText(/no pudimos cargar tus gastos/i)).not.toBeInTheDocument()
  })

  it("shows an error when the list fails to load even after a refresh attempt", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, {}) as Response) // original GET /api/expenses
      .mockResolvedValueOnce(jsonResponse(401, {}) as Response) // POST /api/auth/refresh fails too

    render(<ExpensesManager />)

    await waitFor(() => {
      expect(screen.getByText(/no pudimos cargar tus gastos/i)).toBeInTheDocument()
    })
  })
})
