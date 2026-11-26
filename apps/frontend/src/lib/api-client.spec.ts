import { describe, expect, it, vi, beforeEach } from "vitest"
import { apiFetch } from "./api-client"

function response(status: number): Response {
  return { ok: status >= 200 && status < 300, status } as Response
}

describe("apiFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  it("returns the response as-is when it is not a 401", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response(200))

    const result = await apiFetch("/api/expenses")

    expect(result.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith("/api/expenses", undefined)
  })

  it("silently refreshes and retries once on a 401, returning the retried response", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(200)) // POST /api/auth/refresh
      .mockResolvedValueOnce(response(200)) // retried original request

    const result = await apiFetch("/api/expenses", { method: "GET" })

    expect(result.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(fetch).toHaveBeenNthCalledWith(1, "/api/expenses", { method: "GET" })
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/auth/refresh",
      expect.objectContaining({ method: "POST" })
    )
    expect(fetch).toHaveBeenNthCalledWith(3, "/api/expenses", { method: "GET" })
  })

  it("returns the original 401 response without retrying when the refresh itself fails", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(401)) // POST /api/auth/refresh fails too

    const result = await apiFetch("/api/expenses")

    expect(result.status).toBe(401)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it("deduplicates concurrent refreshes so parallel 401s trigger only one refresh call", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response(401)) // first request
      .mockResolvedValueOnce(response(401)) // second request
      .mockResolvedValueOnce(response(200)) // the single shared refresh
      .mockResolvedValueOnce(response(200)) // first retry
      .mockResolvedValueOnce(response(200)) // second retry

    const [first, second] = await Promise.all([apiFetch("/api/expenses"), apiFetch("/api/totals")])

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(5)
    const refreshCalls = vi.mocked(fetch).mock.calls.filter(([url]) => url === "/api/auth/refresh")
    expect(refreshCalls).toHaveLength(1)
  })
})
