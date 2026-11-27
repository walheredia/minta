import { useState } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CategoryCombobox } from "./category-combobox"
import type { ExpenseCategory } from "@/lib/expenses"

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response
}

const panaderia: ExpenseCategory = { id: "cat_pan", name: "Panadería", source: "SYSTEM" }

function Harness({ onChange }: { onChange?: (value: ExpenseCategory | null) => void }) {
  const [value, setValue] = useState<ExpenseCategory | null>(null)
  return (
    <>
      <label htmlFor="category">Tipo de gasto</label>
      <CategoryCombobox
        id="category"
        value={value}
        onChange={(next) => {
          setValue(next)
          onChange?.(next)
        }}
      />
    </>
  )
}

function searchCalls() {
  return vi.mocked(fetch).mock.calls.filter(([url]) => String(url).startsWith("/api/expense-categories"))
}

describe("CategoryCombobox", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("asks for three letters before searching", async () => {
    render(<Harness />)

    fireEvent.change(screen.getByLabelText("Tipo de gasto"), { target: { value: "pa" } })

    expect(screen.getByText("Escribí al menos 3 letras")).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(searchCalls()).toHaveLength(0)
  })

  it("shows matching categories and lets the user pick one", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, [panaderia]))
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    fireEvent.change(screen.getByLabelText("Tipo de gasto"), { target: { value: "pana" } })

    const option = await screen.findByRole("option", { name: /panadería/i })
    expect(searchCalls()[0][0]).toBe("/api/expense-categories?q=pana")

    fireEvent.click(option)

    expect(onChange).toHaveBeenLastCalledWith(panaderia)
    expect(screen.getByLabelText("Tipo de gasto")).toHaveValue("Panadería")
  })

  it("tells the user when nothing matches", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, []))
    render(<Harness />)

    fireEvent.change(screen.getByLabelText("Tipo de gasto"), { target: { value: "zzzz" } })

    expect(await screen.findByText("No encontramos «zzzz»")).toBeInTheDocument()
  })

  it("offers a retry when suggestions fail to load", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(500, {}))
      .mockResolvedValueOnce(jsonResponse(200, [panaderia]))
    render(<Harness />)

    fireEvent.change(screen.getByLabelText("Tipo de gasto"), { target: { value: "pana" } })

    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }))

    expect(await screen.findByRole("option", { name: /panadería/i })).toBeInTheDocument()
  })

  it("searches once per pause in typing", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, [panaderia]))
    render(<Harness />)
    const input = screen.getByLabelText("Tipo de gasto")

    fireEvent.change(input, { target: { value: "pan" } })
    fireEvent.change(input, { target: { value: "pana" } })
    fireEvent.change(input, { target: { value: "panad" } })

    await screen.findByRole("option", { name: /panadería/i })
    await waitFor(() => expect(searchCalls()).toHaveLength(1))
    expect(searchCalls()[0][0]).toBe("/api/expense-categories?q=panad")
  })
})
