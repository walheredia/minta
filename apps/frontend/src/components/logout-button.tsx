"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type Status = "idle" | "logging-out"

export function LogoutButton() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>("idle")

  async function handleLogout() {
    setStatus("logging-out")

    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Logging out is best-effort client-side: even if this request fails
      // (e.g. offline), we still send the user to /ingresar — the proxy
      // will bounce them straight back to /gastos if a valid session
      // cookie somehow survived.
    } finally {
      router.push("/ingresar")
    }
  }

  return (
    <Button variant="ghost" onClick={handleLogout} disabled={status === "logging-out"}>
      {status === "logging-out" ? "Cerrando sesión…" : "Cerrar sesión"}
    </Button>
  )
}
