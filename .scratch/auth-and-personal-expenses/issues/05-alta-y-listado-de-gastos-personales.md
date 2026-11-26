# 05: Alta y listado de gastos personales

**What to build:** Un usuario autenticado carga un gasto personal (monto, moneda, descripción, fecha) desde `/gastos` y lo ve reflejado en su lista, con los totales de ARS y de USD del período mostrados por separado.

**Blocked by:** 03 (Login y sesión autenticada)

**Status:** done

- [x] `POST /api/expenses` crea un `Expense` a partir de `amount`, `currency` (`ARS`|`USD`), `description` y `occurredAt`, forzando siempre `visibility: PERSONAL`, `householdId: null` y el `userId` del usuario autenticado — cualquier valor distinto recibido para esos tres campos se ignora.
- [x] `GET /api/expenses` devuelve únicamente los gastos personales del usuario autenticado, ordenados descendente por `occurredAt`.
- [x] Ambos endpoints devuelven `401` si no hay sesión válida (usando el `AuthGuard` del ticket 03).
- [x] La pantalla `/gastos` tiene un formulario para cargar un gasto y una lista de los gastos ya cargados.
- [x] La pantalla `/gastos` muestra dos totales separados (ARS y USD) del período visible, nunca combinados ni convertidos entre sí (ADR 0002).
- [x] La pantalla funciona correctamente en viewport mobile y en modo oscuro.
- [x] Un test e2e (supertest) cubre: creación de un gasto, listado, y que un segundo usuario no ve los gastos del primero.
- [x] Un test de componente (RTL) cubre el formulario de alta y el renderizado de la lista con los totales separados por moneda.

## Resolution

Implemented on branch `feat/auth-and-personal-expenses` (commit 99c43b3 (merged in 1f2c487)). All checklist items done, covered by backend (Vitest unit + e2e/supertest) and frontend (Vitest + React Testing Library) tests, verified by a two-axis (Standards + Spec) code review with findings fixed on the same branch.
