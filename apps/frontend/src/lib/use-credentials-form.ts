import { useState, type FormEvent } from "react"

export type CredentialsFormStatus = "idle" | "submitting"

interface UseCredentialsFormOptions {
  /** Endpoint the credentials are POSTed to as `{ email, password }`. */
  endpoint: string
  /** Turns a failed response's parsed JSON body into the messages to show inline. */
  extractErrorMessages: (body: unknown) => string[]
  /** Shown when the request itself fails (e.g. the server is unreachable). */
  networkErrorMessage: string
  /** Called with the parsed response body once the request succeeds. */
  onSuccess: (body: unknown) => void
}

/**
 * Shared state/submit/error plumbing for the login and register forms: both
 * are a controlled email/password pair POSTed as JSON to an auth endpoint,
 * with the same success/failure/network-error handling. Each caller keeps
 * its own JSX and decides what "success" means (redirecting vs. showing an
 * inline message) via `onSuccess`, and how to read its own error shape via
 * `extractErrorMessages`.
 */
export function useCredentialsForm({
  endpoint,
  extractErrorMessages,
  networkErrorMessage,
  onSuccess,
}: UseCredentialsFormOptions) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [status, setStatus] = useState<CredentialsFormStatus>("idle")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("submitting")
    setErrors([])

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setErrors(extractErrorMessages(body))
        setStatus("idle")
        return
      }

      const body = await response.json().catch(() => null)
      onSuccess(body)
      setStatus("idle")
    } catch {
      setErrors([networkErrorMessage])
      setStatus("idle")
    }
  }

  return { email, setEmail, password, setPassword, errors, status, handleSubmit }
}
