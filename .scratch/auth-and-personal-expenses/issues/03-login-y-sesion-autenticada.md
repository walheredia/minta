# 03: Login y sesión autenticada

**What to build:** Un usuario registrado puede iniciar sesión desde `/ingresar` y queda autenticado: la app reconoce su sesión en pantallas protegidas, y un visitante sin sesión es redirigido al login en vez de ver contenido autenticado.

**Blocked by:** 02 (Registro de cuenta)

**Status:** done

- [x] Nuevo modelo Prisma `RefreshToken` (`userId`, `tokenHash`, `expiresAt`, `createdAt`, `revokedAt`) migrado contra la base local.
- [x] `POST /api/auth/login` valida credenciales y, si son correctas, setea las cookies `httpOnly` `minta_access` (JWT de vida corta) y `minta_refresh` (opaco, cuyo hash queda en `RefreshToken`).
- [x] Un login con credenciales incorrectas devuelve un error genérico, sin indicar si falló el email o la contraseña.
- [x] `GET /api/auth/me` devuelve los datos del usuario autenticado cuando la cookie de access token es válida, y `401` cuando no hay sesión o es inválida.
- [x] Un `AuthGuard` de Nest protege `GET /api/auth/me`, reutilizable para proteger otros endpoints (lo usará el ticket 05).
- [x] La pantalla `/ingresar` permite loguearse con email + contraseña, muestra el error genérico ante credenciales inválidas, y redirige a `/gastos` en éxito.
- [x] El middleware de Next redirige a `/ingresar` cualquier intento de acceder a una ruta autenticada (por ejemplo `/gastos`, aunque todavía esté vacía/placeholder) sin sesión válida.
- [x] Un test e2e (supertest) cubre: login exitoso, login fallido, `GET /me` autenticado y `GET /me` sin sesión.
- [x] Un test de componente (RTL) cubre el formulario de login: caso de éxito y caso de error.

## Resolution

Implemented on branch `feat/auth-and-personal-expenses` (commit 3d05220 (merged in 3a551ae)). All checklist items done, covered by backend (Vitest unit + e2e/supertest) and frontend (Vitest + React Testing Library) tests, verified by a two-axis (Standards + Spec) code review with findings fixed on the same branch.
