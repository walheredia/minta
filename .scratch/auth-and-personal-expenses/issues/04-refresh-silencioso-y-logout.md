# 04: Refresh silencioso y logout

**What to build:** La sesión de un usuario autenticado sobrevive más allá de la vida corta del access token sin pedirle loguearse de nuevo, y puede cerrar sesión explícitamente desde la UI, lo que invalida la sesión de inmediato.

**Blocked by:** 03 (Login y sesión autenticada)

**Status:** ready-for-agent

- [ ] `POST /api/auth/refresh` valida el refresh token recibido contra su hash en `RefreshToken`, lo marca `revokedAt` y emite un par nuevo de cookies (rotación en cada uso).
- [ ] Un refresh token ya revocado o vencido es rechazado (soporta detectar reuso/robo).
- [ ] `POST /api/auth/logout` revoca el refresh token activo del usuario y limpia ambas cookies (`minta_access`, `minta_refresh`).
- [ ] El frontend dispara el refresh de forma transparente cuando el access token expira, sin interrumpir ninguna acción del usuario en curso.
- [ ] Hay un botón "Cerrar sesión" visible en el área autenticada; al tocarlo, la sesión termina y la siguiente navegación a una ruta protegida redirige a `/ingresar`.
- [ ] Un test e2e (supertest) cubre: un refresh válido rota el token y permite seguir autenticado, un refresh con token ya revocado falla, y logout invalida la sesión (un `GET /me` posterior devuelve `401`).
- [ ] Un test de componente (RTL) cubre el botón de logout.
