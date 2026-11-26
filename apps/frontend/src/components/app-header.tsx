import Link from "next/link"
import { Wordmark } from "@/components/brand/wordmark"
import { LogoutButton } from "@/components/logout-button"
import { ThemeToggle } from "@/components/theme-toggle"

// Top bar for the authenticated area. See the "App shell" pattern in DESIGN.md.
// Only one section exists today (Gastos); new sections join the nav list.
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/gastos" aria-label="Minta, ir a gastos" className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Wordmark />
          </Link>
          <nav aria-label="Secciones" className="hidden sm:block">
            <Link
              href="/gastos"
              aria-current="page"
              className="rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground bg-muted"
            >
              Gastos
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
