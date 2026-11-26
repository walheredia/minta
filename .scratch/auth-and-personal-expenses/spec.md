# Auth + CRUD de gastos personales

Status: done

## Problem Statement

Minta hoy no tiene forma de que una persona cree una cuenta, inicie sesión, ni registre en qué gastó su dinero. Sin autenticación no existe el concepto de "mis datos" a proteger, y sin carga de gastos la app todavía no entrega el valor más básico por el que existe: ayudar a una persona a controlar y entender sus gastos personales en pesos y dólares.

## Solution

Permitir que una persona se registre e inicie sesión con email y contraseña, mantenerse autenticada de forma segura entre visitas, y cargar, ver, editar y eliminar sus propios gastos personales (en ARS o USD, llevados por separado), para empezar a ver en qué se le va la plata desde el primer día. Esta iteración cubre intencionalmente solo gastos personales (`Gasto` con `visibility = PERSONAL`) — todavía sin gastos compartidos de Hogar, sin ingresos, sin inversiones y sin importación automática.

## User Stories

1. Como usuario nuevo, quiero poder registrarme con mi email y una contraseña, para empezar a usar Minta con mi propia cuenta.
2. Como usuario registrado, quiero iniciar sesión con mi email y contraseña, para acceder a mis datos.
3. Como usuario que ya inició sesión, quiero que mi sesión persista entre visitas sin tener que loguearme cada vez que abro la app, para no tener fricción de uso diario.
4. Como usuario, quiero poder cerrar sesión explícitamente, para proteger mis datos si uso un dispositivo compartido.
5. Como usuario, quiero que mis credenciales nunca queden expuestas a scripts de terceros en el navegador, para que mi información financiera esté segura.
6. Como usuario, quiero recibir un error claro si intento registrarme con un email que ya existe, para saber que ya tengo una cuenta.
7. Como usuario, quiero recibir un error claro si mi contraseña no cumple los requisitos mínimos, para poder corregirla antes de enviarla.
8. Como usuario, quiero recibir un error claro y genérico si mis credenciales de login son incorrectas, sin que el sistema revele si falló el email o la contraseña, para que no se filtre qué emails están registrados.
9. Como usuario autenticado, quiero que mi sesión expire automáticamente después de un tiempo razonable, para reducir el riesgo si me olvido de cerrar sesión.
10. Como usuario autenticado, quiero que la app renueve mi sesión de forma transparente mientras la uso activamente, para no tener que loguearme de nuevo en medio de una tarea.
11. Como usuario, quiero cargar un gasto personal indicando monto, moneda (ARS o USD), descripción y fecha, para llevar un registro de mis gastos.
12. Como usuario, quiero ver la lista de mis gastos personales ordenada por fecha, para revisar mi actividad reciente.
13. Como usuario, quiero poder editar un gasto que cargué mal (monto, moneda, descripción o fecha), para corregir errores de carga.
14. Como usuario, quiero poder eliminar un gasto cargado por error, para mantener mi registro preciso.
15. Como usuario, quiero ver el total de mis gastos del mes en pesos y el total en dólares por separado, para entender cuánto gasté en cada moneda sin que se mezclen en una sola cifra.
16. Como usuario, quiero que la lista y el formulario de gastos funcionen bien en mi celular, ya que es donde voy a cargar la mayoría de mis gastos.
17. Como usuario, quiero poder usar la app en modo oscuro, para que sea cómoda de usar de noche.
18. Como usuario, quiero que solo yo pueda ver y modificar mis propios gastos, para que mi información financiera sea privada.
19. Como usuario, quiero que al intentar acceder a una pantalla que requiere sesión sin estar logueado se me lleve al login, para entender por qué no puedo ver mis datos.
20. Como usuario, quiero poder cargar un gasto sin que se me pida ningún dato relacionado con un Hogar o familiar, ya que esa función todavía no existe, para que el formulario sea simple.
21. Como desarrollador, quiero que el frontend y el backend compartan el mismo origen, para poder usar cookies httpOnly sin lidiar con CORS (ADR 0003).
22. Como desarrollador, quiero que las contraseñas se almacenen siempre hasheadas, nunca en texto plano, para proteger a los usuarios ante una eventual filtración de la base.
23. Como desarrollador, quiero que el refresh token se guarde hasheado en la base, para que una filtración de esa tabla no permita secuestrar sesiones directamente.

## Implementation Decisions

### Backend (`apps/backend`)

- Dos módulos nuevos de Nest: `AuthModule` (`AuthController`, `AuthService`) y `ExpensesModule` (`ExpensesController`, `ExpensesService`), ambos sobre el `PrismaService` ya existente.
- Nuevo modelo Prisma `RefreshToken` (`id`, `userId`, `tokenHash`, `expiresAt`, `createdAt`, `revokedAt` nullable), relacionado a `User`. Requiere una nueva migración.
- Hash de contraseña: `argon2` (variante `argon2id`), por ser el estándar recomendado actualmente para hashing de contraseñas.
- Access token: JWT firmado (HS256, secreto en `JWT_ACCESS_SECRET`), de vida corta (ej. 15 minutos), entregado como cookie `httpOnly`, `Secure` en producción, `SameSite=Lax`, nombre `minta_access`.
- Refresh token: string opaco (no JWT), de vida larga (ej. 30 días), entregado como cookie `httpOnly` `minta_refresh`. Se guarda en `RefreshToken` únicamente su hash (nunca el valor crudo) y se **rota** en cada uso: el token usado se marca `revokedAt` y se emite uno nuevo, para poder detectar reuso/robo.
- Endpoints bajo `/api/auth`: `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`.
- Endpoints bajo `/api/expenses`: `GET /` (lista propia, ordenada descendente por `occurredAt`, sin paginación en esta iteración), `POST /`, `PATCH /:id`, `DELETE /:id`. Todos forzados a `visibility: PERSONAL` y `householdId: null`; no hay forma de setear otro valor desde esta API todavía. Todos scopeados al `userId` autenticado; pedir un gasto de otro usuario responde `404` (no `403`, para no confirmar su existencia).
- `AuthGuard` de Nest que lee la cookie de access token, valida el JWT y adjunta el usuario autenticado al request; protege todo `ExpensesModule` y `GET /api/auth/me`.
- Validación de body con Zod a través de `StandardSchemaValidationPipe` (soportado nativamente por esta versión de Nest, ver `apps/backend/AGENTS.md`).
- `amount` se recibe como number/string y se persiste como `Decimal`; `currency` restringido al enum `Currency` (`ARS`/`USD`) ya existente en el schema.

### Frontend (`apps/frontend`)

- Rutas nuevas bajo el App Router: `/registro`, `/ingresar`, y el área autenticada `/gastos` (lista + alta de gastos). La landing de marca ya construida en `/` queda como está para un visitante no autenticado, con los CTAs llevando a `/ingresar` / `/registro`; tras autenticarse, redirección a `/gastos`.
- Como las cookies son `httpOnly`, el frontend no puede leer el token directamente: el estado de sesión se resuelve llamando a `GET /api/auth/me`. Un middleware de Next.js protege `/gastos` (y las rutas autenticadas futuras), redirigiendo a `/ingresar` si no hay sesión.
- En desarrollo local, Next reescribe las llamadas a `/api/*` hacia `http://localhost:3001` (rewrite de `next.config.ts`), preservando el mismo-origen aparente desde el browser igual que en producción (ADR 0003).
- Formularios con los componentes de shadcn/ui ya scaffoldeados (se agregan `input`, `label`, `card` vía `shadcn add` según haga falta).
- Montos formateados según la moneda (separador de miles estilo argentino); los totales del período se muestran como dos tarjetas separadas (ARS y USD), nunca combinados ni convertidos (ADR 0002).

## Testing Decisions

- **Seam principal (backend, ambas features): límite HTTP.** Se extiende el patrón ya existente en `test/app.e2e-spec.ts` (supertest contra una instancia real de Nest conectada al MySQL real de Docker). Cubre el ciclo completo de auth (registrarse → loguearse → acceder a una ruta protegida → refrescar → cerrar sesión → acceso denegado después de cerrar sesión) y el ciclo CRUD de gastos (crear → listar → editar → eliminar → no visible para otro usuario).
- **Seam secundario, solo donde el HTTP no alcanza:** unit tests puntuales para lógica difícil de afirmar solo por HTTP — el helper de hash/compare del refresh token, y los caminos de rechazo del guard (token expirado o inválido) — siguiendo el mismo patrón de mocking que ya usa `app.controller.spec.ts` (Prisma mockeado con `vi.fn()`).
- **Frontend:** se agrega Vitest + React Testing Library a `apps/frontend` (no existe seam de testing ahí todavía). Tests a nivel de componente/página para los formularios de registro/login (validación, mensajes de error, redirect tras éxito) y para la pantalla de gastos (alta, edición, borrado, separación de totales por moneda), con las llamadas al backend mockeadas en el límite de red.
- Un buen test acá verifica comportamiento observable (respuesta HTTP, cookies seteadas/limpiadas, DOM/estado renderizado tras una interacción), nunca detalles internos de implementación (cantidad de llamadas a un mock, estado privado de un componente).

## Out of Scope

- Verificación de email y recuperación de contraseña ("olvidé mi contraseña") — requieren elegir un proveedor de email, todavía no decidido.
- Ingresos (mensuales recurrentes y extraordinarios) — el modelo de dominio todavía no está definido en detalle.
- Hogar compartido: invitar a un familiar, marcar un gasto como `SHARED`, visibilidad compartida en la UI. El modelo Prisma (`Household`, `HouseholdMember`) ya existe, pero ninguna ruta ni pantalla lo usa todavía.
- Inversiones y activos.
- Importación automática de gastos vía LLM leyendo resúmenes de tarjeta de crédito.
- Deploy a producción (vhost de Apache, PM2/systemd, CI/CD en GitHub Actions) — las decisiones ya están registradas en `docs/adr/0001` y `docs/adr/0003`, pero la ejecución queda para una iteración aparte, una vez que haya algo listo para desplegar.
- Login social / OAuth.
- Roles o permisos más allá de "dueño del recurso" — no hay admin ni distinción de roles todavía.

## Further Notes

- `Expense` ya tiene `householdId` nullable y `visibility` en el schema (pensado justamente para no requerir una migración disruptiva cuando se implemente el Hogar compartido); esta iteración simplemente no ejercita esos campos más que para fijarlos en `null` / `PERSONAL`.
- ADR 0003 (mismo origen + cookies httpOnly) es la razón por la que no hace falta configurar CORS: en producción todo corre bajo `minta.appcont.com.ar`, y en local se preserva ese mismo-origen aparente vía rewrite de Next hacia el backend.
- ADR 0002 (moneda sin auto-conversión) es la razón por la que nunca hay un total único: los montos en ARS y en USD no se combinan ni se convierten automáticamente en ningún lado de esta iteración.
