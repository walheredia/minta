import { render, screen, fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ThemeToggle } from "./theme-toggle"

const setTheme = vi.fn()
let resolvedTheme = "light"

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme, setTheme }),
}))

describe("ThemeToggle", () => {
  it("switches to dark theme when activated from light theme", () => {
    resolvedTheme = "light"

    render(<ThemeToggle />)

    const button = screen.getByRole("button", { name: "Activar tema oscuro" })
    fireEvent.click(button)

    expect(setTheme).toHaveBeenCalledWith("dark")
  })

  it("switches to light theme when activated from dark theme", () => {
    resolvedTheme = "dark"

    render(<ThemeToggle />)

    const button = screen.getByRole("button", { name: "Activar tema claro" })
    fireEvent.click(button)

    expect(setTheme).toHaveBeenCalledWith("light")
  })
})
