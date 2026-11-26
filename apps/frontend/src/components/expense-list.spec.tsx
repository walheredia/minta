import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
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

function noopHandlers() {
  return {
    onEdit: vi.fn().mockResolvedValue(null),
    onDelete: vi.fn().mockResolvedValue(false),
  }
}

describe("ExpenseList", () => {
  it("renders every expense passed in", () => {
    render(<ExpenseList expenses={expenses} {...noopHandlers()} />)

    expect(screen.getByText("Supermercado")).toBeInTheDocument()
    expect(screen.getByText("Transporte")).toBeInTheDocument()
    expect(screen.getByText("Suscripción")).toBeInTheDocument()
  })

  it("shows the ARS and USD totals separately, never combined or converted", () => {
    render(<ExpenseList expenses={expenses} {...noopHandlers()} />)

    const arsTotal = screen.getByTestId("total-ARS")
    const usdTotal = screen.getByTestId("total-USD")

    expect(arsTotal).toHaveTextContent("1.500,25")
    expect(usdTotal).toHaveTextContent("50,00")
    expect(arsTotal.textContent).not.toContain(usdTotal.textContent ?? "__none__")
  })

  it("shows an empty state when there are no expenses", () => {
    render(<ExpenseList expenses={[]} {...noopHandlers()} />)

    expect(screen.getByText(/todavía no cargaste ningún gasto/i)).toBeInTheDocument()
    expect(screen.getByTestId("total-ARS")).toHaveTextContent("0,00")
    expect(screen.getByTestId("total-USD")).toHaveTextContent("0,00")
  })

  describe("deleting an expense", () => {
    it("asks for confirmation before deleting, without calling onDelete immediately", () => {
      const { onEdit, onDelete } = noopHandlers()
      render(<ExpenseList expenses={expenses} onEdit={onEdit} onDelete={onDelete} />)

      fireEvent.click(screen.getByRole("button", { name: /eliminar supermercado/i }))

      expect(
        screen.getByText(/seguro que querés eliminar este gasto/i)
      ).toBeInTheDocument()
      expect(onDelete).not.toHaveBeenCalled()
    })

    it("calls onDelete with the expense id once the user confirms", async () => {
      const onEdit = vi.fn().mockResolvedValue(null)
      const onDelete = vi.fn().mockResolvedValue(true)
      render(<ExpenseList expenses={expenses} onEdit={onEdit} onDelete={onDelete} />)

      fireEvent.click(screen.getByRole("button", { name: /eliminar supermercado/i }))
      fireEvent.click(screen.getByRole("button", { name: /^sí, eliminar$/i }))

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith("1")
      })
    })

    it("cancels the confirmation without calling onDelete", () => {
      const { onEdit, onDelete } = noopHandlers()
      render(<ExpenseList expenses={expenses} onEdit={onEdit} onDelete={onDelete} />)

      fireEvent.click(screen.getByRole("button", { name: /eliminar supermercado/i }))
      fireEvent.click(screen.getByRole("button", { name: /cancelar/i }))

      expect(
        screen.queryByText(/seguro que querés eliminar este gasto/i)
      ).not.toBeInTheDocument()
      expect(onDelete).not.toHaveBeenCalled()
    })
  })

  describe("editing an expense", () => {
    it("shows an edit form pre-filled with the expense current values", () => {
      const { onEdit, onDelete } = noopHandlers()
      render(<ExpenseList expenses={expenses} onEdit={onEdit} onDelete={onDelete} />)

      fireEvent.click(screen.getByRole("button", { name: /editar supermercado/i }))

      const form = screen.getByRole("form", { name: /editar gasto/i })
      expect(within(form).getByLabelText(/monto/i)).toHaveValue(1000)
      expect(within(form).getByLabelText(/moneda/i)).toHaveValue("ARS")
      expect(within(form).getByLabelText(/descripción/i)).toHaveValue("Supermercado")
      expect(within(form).getByLabelText(/fecha/i)).toHaveValue("2026-01-20")
    })

    it("calls onEdit with the expense id and the updated values on save", async () => {
      const onEdit = vi.fn().mockResolvedValue({ ...expenses[0], description: "Super actualizado" })
      const onDelete = vi.fn().mockResolvedValue(false)
      render(<ExpenseList expenses={expenses} onEdit={onEdit} onDelete={onDelete} />)

      fireEvent.click(screen.getByRole("button", { name: /editar supermercado/i }))
      const form = screen.getByRole("form", { name: /editar gasto/i })
      fireEvent.change(within(form).getByLabelText(/descripción/i), {
        target: { value: "Super actualizado" },
      })
      fireEvent.click(within(form).getByRole("button", { name: /guardar/i }))

      await waitFor(() => {
        expect(onEdit).toHaveBeenCalledWith("1", {
          amount: "1000",
          currency: "ARS",
          description: "Super actualizado",
          occurredAt: "2026-01-20",
        })
      })

      await waitFor(() => {
        expect(screen.queryByRole("form", { name: /editar gasto/i })).not.toBeInTheDocument()
      })
    })

    it("exits edit mode without calling onEdit when cancelled", () => {
      const { onEdit, onDelete } = noopHandlers()
      render(<ExpenseList expenses={expenses} onEdit={onEdit} onDelete={onDelete} />)

      fireEvent.click(screen.getByRole("button", { name: /editar supermercado/i }))
      const form = screen.getByRole("form", { name: /editar gasto/i })
      fireEvent.click(within(form).getByRole("button", { name: /cancelar/i }))

      expect(screen.queryByRole("form", { name: /editar gasto/i })).not.toBeInTheDocument()
      expect(onEdit).not.toHaveBeenCalled()
    })
  })
})
