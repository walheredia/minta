# 06: Edición y borrado de gastos personales

**What to build:** Un usuario puede corregir un gasto personal que cargó mal, o eliminarlo, directamente desde la pantalla `/gastos`.

**Blocked by:** 05 (Alta y listado de gastos personales)

**Status:** done

- [x] `PATCH /api/expenses/:id` permite modificar `amount`, `currency`, `description` y `occurredAt` de un gasto propio.
- [x] `DELETE /api/expenses/:id` elimina un gasto propio.
- [x] Intentar editar o eliminar un gasto que pertenece a otro usuario devuelve `404` (no `403`, para no confirmar su existencia).
- [x] La pantalla `/gastos` permite editar y eliminar un gasto desde la misma lista, con una confirmación antes de borrar.
- [x] Un test e2e (supertest) cubre: edición exitosa, borrado exitoso, y el `404` al intentar tocar un gasto ajeno.
- [x] Un test de componente (RTL) cubre las acciones de editar y borrar en la lista.

## Resolution

Implemented on branch `feat/auth-and-personal-expenses` (commit 7746415 (merged in 11daaba)). All checklist items done, covered by backend (Vitest unit + e2e/supertest) and frontend (Vitest + React Testing Library) tests, verified by a two-axis (Standards + Spec) code review with findings fixed on the same branch.
