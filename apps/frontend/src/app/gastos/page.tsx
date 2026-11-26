import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { ExpensesManager } from "@/components/expenses-manager"

// This route reads the session cookie on every request (via `GET /api/auth/me`),
// so it can't be part of the static shell. `instant = false` opts it out of
// Cache Components' instant-navigation validation instead of requiring a
// `<Suspense>` boundary.
export const instant = false

interface CurrentUser {
  email: string
}

async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies()
  const headerList = await headers()
  const host = headerList.get("host")
  const protocol = headerList.get("x-forwarded-proto") ?? "http"

  const response = await fetch(`${protocol}://${host}/api/auth/me`, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  })

  if (!response.ok) {
    return null
  }

  return response.json() as Promise<CurrentUser>
}

export default async function GastosPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/ingresar")
  }

  return <ExpensesManager />
}
