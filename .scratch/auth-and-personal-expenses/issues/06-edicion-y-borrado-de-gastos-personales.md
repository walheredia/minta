# 06: Edición y borrado de gastos personales

**What to build:** Un usuario puede corregir un gasto personal que cargó mal, o eliminarlo, directamente desde la pantalla `/gastos`.

**Blocked by:** 05 (Alta y listado de gastos personales)

**Status:** ready-for-agent

- [ ] `PATCH /api/expenses/:id` permite modificar `amount`, `currency`, `description` y `occurredAt` de un gasto propio.
- [ ] `DELETE /api/expenses/:id` elimina un gasto propio.
- [ ] Intentar editar o eliminar un gasto que pertenece a otro usuario devuelve `404` (no `403`, para no confirmar su existencia).
- [ ] La pantalla `/gastos` permite editar y eliminar un gasto desde la misma lista, con una confirmación antes de borrar.
- [ ] Un test e2e (supertest) cubre: edición exitosa, borrado exitoso, y el `404` al intentar tocar un gasto ajeno.
- [ ] Un test de componente (RTL) cubre las acciones de editar y borrar en la lista.
