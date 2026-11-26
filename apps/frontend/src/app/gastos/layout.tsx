import { AppHeader } from "@/components/app-header"

// Wraps every screen under /gastos with the authenticated app shell.
export default function GastosLayout({ children }: LayoutProps<"/gastos">) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <AppHeader />
      {children}
    </div>
  )
}
