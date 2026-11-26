"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCredentialsForm } from "@/lib/use-credentials-form"

const GENERIC_ERROR = "No pudimos iniciar sesión. Probá de nuevo."

function extractErrorMessages(body: unknown): string[] {
  const message = (body as { message?: unknown } | null)?.message

  if (typeof message === "string" && message.length > 0) {
    return [message]
  }

  return [GENERIC_ERROR]
}

export function LoginForm() {
  const router = useRouter()
  const { email, setEmail, password, setPassword, errors, status, handleSubmit } =
    useCredentialsForm({
      endpoint: "/api/auth/login",
      extractErrorMessages,
      networkErrorMessage: "No pudimos conectar con el servidor. Probá de nuevo.",
      onSuccess: () => router.push("/gastos"),
    })

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

      {errors.length > 0 && (
        <p role="alert" className="text-sm text-destructive">
          {errors[0]}
        </p>
      )}

      <Button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  )
}
