import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ExpenseList } from "./expense-list"
import type { Expense } from "@/lib/expenses"

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
  {
    id: "2",
    amount: "500.25",
    currency: "ARS",
    description: "Transporte",
    occurredAt: "2026-01-15T00:00:00.000Z",
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
    userId: "user_1",
  },
  {
    id: "3",
    amount: "50",
    currency: "USD",
    description: "Suscripción",
    occurredAt: "2026-01-10T00:00:00.000Z",
    createdAt: "2026-01-10T00:00:00.000Z",
    updatedAt: "2026-01-10T00:00:00.000Z",
    userId: "user_1",
  },
]

describe("ExpenseList", () => {
  it("renders every expense passed in", () => {
    render(<ExpenseList expenses={expenses} />)

    expect(screen.getByText("Supermercado")).toBeInTheDocument()
    expect(screen.getByText("Transporte")).toBeInTheDocument()
    expect(screen.getByText("Suscripción")).toBeInTheDocument()
  })

  it("shows the ARS and USD totals separately, never combined or converted", () => {
    render(<ExpenseList expenses={expenses} />)

    const arsTotal = screen.getByTestId("total-ARS")
    const usdTotal = screen.getByTestId("total-USD")

    expect(arsTotal).toHaveTextContent("1.500,25")
    expect(usdTotal).toHaveTextContent("50,00")
    expect(arsTotal.textContent).not.toContain(usdTotal.textContent ?? "__none__")
  })

  it("shows an empty state when there are no expenses", () => {
    render(<ExpenseList expenses={[]} />)

    expect(screen.getByText(/todavía no cargaste ningún gasto/i)).toBeInTheDocument()
    expect(screen.getByTestId("total-ARS")).toHaveTextContent("0,00")
    expect(screen.getByTestId("total-USD")).toHaveTextContent("0,00")
  })
})
