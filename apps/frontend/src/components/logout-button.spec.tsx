import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { LogoutButton } from "./logout-button"

const push = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}))

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
    push.mockClear()
  })

  it("is visible with the expected label", () => {
    render(<LogoutButton />)

    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument()
  })

  it("calls the logout endpoint and redirects to /ingresar on success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 200 } as Response)

    render(<LogoutButton />)
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }))

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/ingresar")
    })

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("still redirects to /ingresar even if the logout request fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network error"))

    render(<LogoutButton />)
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }))

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/ingresar")
    })
  })
})
