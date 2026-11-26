"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Status = "idle" | "submitting"

const GENERIC_ERROR = "No pudimos iniciar sesión. Probá de nuevo."

function extractErrorMessage(body: unknown): string {
  const message = (body as { message?: unknown } | null)?.message

  if (typeof message === "string" && message.length > 0) {
    return message
  }

  return GENERIC_ERROR
}

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>("idle")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("submitting")
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setError(extractErrorMessage(body))
        setStatus("idle")
        return
      }

      router.push("/gastos")
    } catch {
      setError("No pudimos conectar con el servidor. Probá de nuevo.")
      setStatus("idle")
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password">Contraseña</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  )
}
