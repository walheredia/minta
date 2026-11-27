"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"

const noopSubscribe = () => () => {}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // False during SSR and hydration, true on the client afterwards: the theme
  // is only known client-side, so the icon renders after hydration.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label="Cambiar tema" />
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Activar tema claro" : "Activar tema oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
