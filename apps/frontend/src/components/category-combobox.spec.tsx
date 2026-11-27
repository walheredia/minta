import { useState } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CategoryCombobox } from "./category-combobox"
import type { CategoryChoice, ExpenseCategory } from "@/lib/expenses"

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response
}

const panaderia: ExpenseCategory = { id: "cat_pan", name: "Panadería", source: "SYSTEM" }

function Harness({ onChange }: { onChange?: (value: CategoryChoice | null) => void }) {
  const [value, setValue] = useState<CategoryChoice | null>(null)
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

  it("offers to create the typed category when nothing equivalent exists", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, []))
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    fireEvent.change(screen.getByLabelText("Tipo de gasto"), { target: { value: "  clases de cerámica" } })
    fireEvent.click(await screen.findByRole("option", { name: "Crear «Clases de cerámica»" }))

    expect(onChange).toHaveBeenLastCalledWith({ source: "NEW", name: "Clases de cerámica" })
    expect(screen.getByLabelText("Tipo de gasto")).toHaveValue("Clases de cerámica")
  })

  it("does not offer to create a category that already exists under another spelling", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, [panaderia]))
    render(<Harness />)

    fireEvent.change(screen.getByLabelText("Tipo de gasto"), { target: { value: "PANADERIA" } })

    expect(await screen.findByRole("option", { name: /panadería/i })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /crear/i })).not.toBeInTheDocument()
  })

  it("lists the user's Household categories like any other, without a source label", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, [{ id: "hh_1", name: "Clases de cerámica", source: "HOUSEHOLD" }])
    )
    render(<Harness />)

    fireEvent.change(screen.getByLabelText("Tipo de gasto"), { target: { value: "ceram" } })

    const option = await screen.findByRole("option", { name: /clases de cerámica/i })
    expect(option).toHaveTextContent(/^Clases de cerámica$/)
  })

  it("lets the user pick a suggestion with the keyboard", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, [panaderia, { id: "cat_panales", name: "Pañales", source: "SYSTEM" }])
    )
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const input = screen.getByLabelText("Tipo de gasto")

    fireEvent.change(input, { target: { value: "pana" } })
    await screen.findByRole("option", { name: /pañales/i })
    fireEvent.keyDown(input, { key: "ArrowDown" })
    fireEvent.keyDown(input, { key: "ArrowDown" })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(onChange).toHaveBeenLastCalledWith({ id: "cat_panales", name: "Pañales", source: "SYSTEM" })
    expect(input).toHaveValue("Pañales")
  })

  it("closes the suggestions with Escape", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, [panaderia]))
    render(<Harness />)
    const input = screen.getByLabelText("Tipo de gasto")

    fireEvent.change(input, { target: { value: "pana" } })
    await screen.findByRole("option", { name: /panadería/i })
    fireEvent.keyDown(input, { key: "Escape" })

    await waitFor(() => expect(screen.queryByRole("option")).not.toBeInTheDocument())
  })

  it("explains the length limit instead of offering to create a name that is too long", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, []))
    render(<Harness />)

    fireEvent.change(screen.getByLabelText("Tipo de gasto"), { target: { value: "x".repeat(41) } })

    expect(await screen.findByText("Máximo 40 caracteres.")).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /crear/i })).not.toBeInTheDocument()
  })

  it("still lets the user create a category when suggestions fail to load", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(500, {}))
    render(<Harness />)

    fireEvent.change(screen.getByLabelText("Tipo de gasto"), { target: { value: "ceramica" } })

    expect(await screen.findByRole("option", { name: "Crear «Ceramica»" })).toBeInTheDocument()
  })

  it("lets the user clear the chosen category with a labelled button", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, [panaderia]))
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    fireEvent.change(screen.getByLabelText("Tipo de gasto"), { target: { value: "pana" } })
    fireEvent.click(await screen.findByRole("option", { name: /panadería/i }))
    fireEvent.click(screen.getByRole("button", { name: "Borrar tipo de gasto" }))

    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(screen.getByLabelText("Tipo de gasto")).toHaveValue("")
  })
})
