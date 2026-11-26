# 02: Registro de cuenta

**What to build:** Un usuario nuevo puede crear su cuenta en Minta con email y contraseña desde la pantalla `/registro`, de punta a punta: completar el formulario, ver los errores de validación si los hay, y terminar con una cuenta creada en la base.

**Blocked by:** 01 (Setup de testing de componentes en frontend)

**Status:** done

- [x] `POST /api/auth/register` crea un `User` con email único y contraseña hasheada (argon2id) — la contraseña en texto plano nunca se persiste ni se loguea.
- [x] Registrarse con un email que ya existe devuelve un error claro y no crea un segundo usuario.
- [x] Registrarse con una contraseña que no cumple los requisitos mínimos devuelve un error claro sin tocar la base.
- [x] La pantalla `/registro` permite completar email + contraseña y muestra los errores de validación o de email duplicado de forma clara, sin recargar la página.
- [x] Un test e2e (supertest, siguiendo el patrón de `test/app.e2e-spec.ts`) cubre el registro exitoso, el email duplicado y la contraseña inválida.
- [x] Un test de componente (RTL) cubre el formulario de registro: caso de éxito y al menos un caso de error.

## Resolution

Implemented on branch `feat/auth-and-personal-expenses` (commit 39066df (merged in df18367)). All checklist items done, covered by backend (Vitest unit + e2e/supertest) and frontend (Vitest + React Testing Library) tests, verified by a two-axis (Standards + Spec) code review with findings fixed on the same branch.
