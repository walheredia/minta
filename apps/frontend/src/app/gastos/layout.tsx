import { LogoutButton } from "@/components/logout-button"

// Wraps every screen under /gastos with a small authenticated-area header.
// Kept separate from `page.tsx` (ticket 05 owns that file and is rewriting
// it in parallel) so both tickets can land without touching the same file.
export default function GastosLayout({ children }: LayoutProps<"/gastos">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="text-sm font-medium text-foreground">Minta</span>
        <LogoutButton />
      </header>
      {children}
    </div>
  )
}
