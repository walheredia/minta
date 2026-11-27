"use client"

import { useState } from "react"
import Link from "next/link"
import { CircleAlert, CircleCheck } from "lucide-react"
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

  return ["No pudimos crear tu cuenta. Probá otra vez."]
}

export function RegisterForm() {
  const [success, setSuccess] = useState(false)
  const { email, setEmail, password, setPassword, errors, status, handleSubmit } =
    useCredentialsForm({
      endpoint: "/api/auth/register",
      extractErrorMessages,
      networkErrorMessage: "Sin conexión con el servidor. Revisá tu internet y probá otra vez.",
      onSuccess: () => setSuccess(true),
    })

  if (success) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-4 rounded-xl bg-accent px-6 py-8 text-center duration-300 animate-in fade-in zoom-in-95 motion-reduce:animate-none"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
          <CircleCheck aria-hidden className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold text-foreground">Cuenta creada.</p>
          <p className="text-sm text-muted-foreground">Ya podés ingresar con tu email y tu contraseña.</p>
        </div>
        <Link
          href="/ingresar"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Ingresar
        </Link>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
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
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <ul className="flex flex-col gap-1">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <Button type="submit" size="lg" className="mt-2 w-full" disabled={status === "submitting"}>
        {status === "submitting" ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  )
}
