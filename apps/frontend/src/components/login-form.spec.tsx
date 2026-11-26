import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { LoginForm } from "./login-form"

const push = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}))

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
    push.mockClear()
  })

  it("logs in and redirects to /gastos on success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(200, { id: "user_1", email: "persona@example.com" }) as Response
    )

    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "persona@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "correct-horse-battery" },
    })
    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }))

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/gastos")
    })

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "persona@example.com",
          password: "correct-horse-battery",
        }),
      })
    )
  })

  it("shows a generic error message on invalid credentials, without redirecting", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(401, {
        statusCode: 401,
        message: "Email o contraseña incorrectos.",
        error: "Unauthorized",
      }) as Response
    )

    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "persona@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "wrong-password" },
    })
    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }))

    await waitFor(() => {
      expect(screen.getByText(/email o contraseña incorrectos/i)).toBeInTheDocument()
    })

    expect(push).not.toHaveBeenCalled()
  })
})
