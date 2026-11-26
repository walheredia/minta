/**
 * Shared fetch wrapper for calls that require an authenticated session.
 *
 * The access token cookie is short-lived (15 min). Rather than making every
 * component handle expiry itself, `apiFetch` transparently calls
 * `POST /api/auth/refresh` on a 401 and retries the original request exactly
 * once, so an active user never sees an interruption mid-task. If the
 * refresh itself fails (refresh token missing, revoked, or expired), the
 * original 401 is returned unchanged — the caller reacts to that the same
 * way it would to any other failed request (e.g. redirecting to
 * `/ingresar`, as the proxy already does once the cookies are gone).
 *
 * Concurrent callers that all hit a 401 at once share a single in-flight
 * refresh instead of each racing their own `/api/auth/refresh` call — since
 * the refresh token rotates on every use, a second concurrent refresh call
 * would otherwise find the first one's token already revoked and fail.
 */

let pendingRefresh: Promise<boolean> | null = null

function refreshSession(): Promise<boolean> {
  if (!pendingRefresh) {
    pendingRefresh = fetch("/api/auth/refresh", { method: "POST" })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        pendingRefresh = null
      })
  }

  return pendingRefresh
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init)

  if (response.status !== 401) {
    return response
  }

  const refreshed = await refreshSession()

  if (!refreshed) {
    return response
  }

  return fetch(input, init)
}
