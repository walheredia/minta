import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Cheap presence-only check: this just prevents an anonymous visitor from
// reaching a protected route. It can't validate the JWT (that would require
// verifying it here too, which the spec doesn't ask for) — the real
// authorization check happens server-side via `GET /api/auth/me`, which the
// protected screens call themselves (see `src/app/gastos/page.tsx`).
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("minta_access")

  if (!hasSession) {
    return NextResponse.redirect(new URL("/ingresar", request.url))
  }
}

export const config = {
  matcher: ["/gastos/:path*"],
}
