"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCredentialsForm } from "@/lib/use-credentials-form"

function extractErrorMessages(body: unknown): string[] {
  const message = (body as { message?: unknown } | null)?.message

  if (Array.isArray(message)) {
    return message.map(String)
  }

  if (typeof message === "string" && message.length > 0) {
    return [message]
  }

  return ["No pudimos crear tu cuenta. Probá de nuevo."]
}

export function RegisterForm() {
  const [success, setSuccess] = useState(false)
  const { email, setEmail, password, setPassword, errors, status, handleSubmit } =
    useCredentialsForm({
      endpoint: "/api/auth/register",
      extractErrorMessages,
      networkErrorMessage: "No pudimos conectar con el servidor. Probá de nuevo.",
      onSuccess: () => setSuccess(true),
    })

  if (success) {
    return (
      <div role="status" className="flex flex-col gap-2 text-center">
        <p className="text-base font-medium text-foreground">
          Cuenta creada con éxito.
        </p>
        <p className="text-sm text-muted-foreground">
          Ya podés iniciar sesión con tu email y tu contraseña.
        </p>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-password">Contraseña</Label>
        <Input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1 text-sm text-destructive">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <Button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  )
}
