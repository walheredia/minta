import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ExpenseList } from "./expense-list"
import type { Expense, ExpenseCategory } from "@/lib/expenses"

function systemCategory(id: string, name: string): ExpenseCategory {
  return { id, name, source: "SYSTEM" }
}

// Totals are scoped to the current month; the fixtures below are all
// January 2026, so pass that as `referenceDate` instead of relying on the
// real clock (keeps the test deterministic regardless of when it runs).
const REFERENCE_DATE = new Date("2026-01-25T12:00:00.000Z")

const expenses: Expense[] = [
  {
    id: "1",
    amount: "1000",
    currency: "ARS",
    category: systemCategory("cat_super", "Supermercado"),
    detail: "Compra del mes",
    occurredAt: "2026-01-20T00:00:00.000Z",
    createdAt: "2026-01-20T00:00:00.000Z",
    updatedAt: "2026-01-20T00:00:00.000Z",
    userId: "user_1",
  },
  {
    id: "2",
    amount: "500.25",
    currency: "ARS",
    category: systemCategory("cat_sube", "Colectivo/SUBE"),
    detail: null,
    occurredAt: "2026-01-15T00:00:00.000Z",
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
    userId: "user_1",
  },
  {
    id: "3",
    amount: "50",
    currency: "USD",
    category: systemCategory("cat_netflix", "Netflix"),
    detail: null,
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
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("renders every expense passed in", () => {
    render(<ExpenseList expenses={expenses} {...noopHandlers()} />)

    expect(screen.getByText("Supermercado")).toBeInTheDocument()
    expect(screen.getByText("Colectivo/SUBE")).toBeInTheDocument()
    expect(screen.getByText("Netflix")).toBeInTheDocument()
  })

  it("shows the category as the row's main text and the Detail beneath it", () => {
    render(<ExpenseList expenses={expenses} {...noopHandlers()} />)

    const row = screen.getByText("Supermercado").closest("li")!
    expect(within(row).getByText("Compra del mes")).toBeInTheDocument()
  })

  it("shows the ARS and USD totals separately, never combined or converted", () => {
    render(<ExpenseList expenses={expenses} referenceDate={REFERENCE_DATE} {...noopHandlers()} />)

    const arsTotal = screen.getByTestId("total-ARS")
    const usdTotal = screen.getByTestId("total-USD")

    expect(arsTotal).toHaveTextContent("1.500,25")
    expect(usdTotal).toHaveTextContent("50,00")
    expect(arsTotal.textContent).not.toContain(usdTotal.textContent ?? "__none__")
  })

  it("excludes expenses from other months from the totals, while still listing them", () => {
    const otherMonthExpense: Expense = {
      id: "4",
      amount: "999",
      currency: "ARS",
      category: systemCategory("cat_otros", "Gasto de otro mes"),
      detail: null,
      occurredAt: "2025-12-31T00:00:00.000Z",
      createdAt: "2025-12-31T00:00:00.000Z",
      updatedAt: "2025-12-31T00:00:00.000Z",
      userId: "user_1",
    }

    render(
      <ExpenseList
        expenses={[...expenses, otherMonthExpense]}
        referenceDate={REFERENCE_DATE}
        {...noopHandlers()}
      />
    )

    expect(screen.getByText("Gasto de otro mes")).toBeInTheDocument()
    expect(screen.getByTestId("total-ARS")).toHaveTextContent("1.500,25")
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
      expect(within(form).getByLabelText("Tipo de gasto")).toHaveValue("Supermercado")
      expect(within(form).getByLabelText(/detalle/i)).toHaveValue("Compra del mes")
      expect(within(form).getByLabelText(/fecha/i)).toHaveValue("2026-01-20")
    })

    it("calls onEdit with the expense id and the updated values on save", async () => {
      const combustible = systemCategory("cat_nafta", "Combustible")
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [combustible],
      } as Response)
      const onEdit = vi.fn().mockResolvedValue({ ...expenses[0], category: combustible, detail: null })
      const onDelete = vi.fn().mockResolvedValue(false)
      render(<ExpenseList expenses={expenses} onEdit={onEdit} onDelete={onDelete} />)

      fireEvent.click(screen.getByRole("button", { name: /editar supermercado/i }))
      const form = screen.getByRole("form", { name: /editar gasto/i })
      fireEvent.change(within(form).getByLabelText("Tipo de gasto"), { target: { value: "combus" } })
      fireEvent.click(await screen.findByRole("option", { name: /combustible/i }))
      fireEvent.change(within(form).getByLabelText(/detalle/i), { target: { value: "   " } })
      fireEvent.click(within(form).getByRole("button", { name: /guardar/i }))

      await waitFor(() => {
        expect(onEdit).toHaveBeenCalledWith("1", {
          amount: "1000",
          currency: "ARS",
          category: { source: "SYSTEM", id: "cat_nafta" },
          detail: null,
          occurredAt: "2026-01-20",
        })
      })

      await waitFor(() => {
        expect(screen.queryByRole("form", { name: /editar gasto/i })).not.toBeInTheDocument()
      })
    })

    it("does not save an edit without a category", async () => {
      const { onEdit, onDelete } = noopHandlers()
      render(<ExpenseList expenses={expenses} onEdit={onEdit} onDelete={onDelete} />)

      fireEvent.click(screen.getByRole("button", { name: /editar supermercado/i }))
      const form = screen.getByRole("form", { name: /editar gasto/i })
      fireEvent.change(within(form).getByLabelText("Tipo de gasto"), { target: { value: "" } })
      fireEvent.click(within(form).getByRole("button", { name: /guardar/i }))

      expect(await within(form).findByRole("alert")).toHaveTextContent("Elegí o creá un tipo de gasto.")
      expect(onEdit).not.toHaveBeenCalled()
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
