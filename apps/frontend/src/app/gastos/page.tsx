import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

// This route reads the session cookie on every request (via `GET /api/auth/me`),
// so it can't be part of the static shell. `instant = false` opts it out of
// Cache Components' instant-navigation validation instead of requiring a
// `<Suspense>` boundary for this placeholder — ticket 05 revisits this page.
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

// Placeholder screen: confirms the session is valid and shows the user's
// email. Ticket 05 replaces this with the real expense list + form.
export default async function GastosPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/ingresar")
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Tus gastos</h1>
      <p className="text-sm text-muted-foreground">
        Sesión iniciada como{" "}
        <span className="font-medium text-foreground">{user.email}</span>.
      </p>
    </main>
  )
}
