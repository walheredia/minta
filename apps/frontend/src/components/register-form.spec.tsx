import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { RegisterForm } from "./register-form"

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("creates an account and shows a success message without reloading the page", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(201, { id: "user_1", email: "nueva@example.com" }) as Response
    )

    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "nueva@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "correct-horse-battery" },
    })
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(screen.getByText(/cuenta creada/i)).toBeInTheDocument()
    })

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "nueva@example.com",
          password: "correct-horse-battery",
        }),
      })
    )
  })

  it("shows an inline error when the email is already registered, without creating a second account", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(409, {
        statusCode: 409,
        message: "Ya existe una cuenta registrada con ese email.",
        error: "Conflict",
      }) as Response
    )

    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "repetido@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "correct-horse-battery" },
    })
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/ya existe una cuenta registrada/i)
      ).toBeInTheDocument()
    })

    expect(screen.queryByText(/cuenta creada/i)).not.toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it("shows inline validation errors when the password does not meet the minimum requirements", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(400, {
        statusCode: 400,
        message: ["password: La contraseña debe tener al menos 8 caracteres."],
        error: "Bad Request",
      }) as Response
    )

    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "nueva@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "short" },
    })
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(screen.getByText(/al menos 8 caracteres/i)).toBeInTheDocument()
    })

    expect(screen.queryByText(/cuenta creada/i)).not.toBeInTheDocument()
  })
})
