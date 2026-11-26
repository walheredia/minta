# 02: Registro de cuenta

**What to build:** Un usuario nuevo puede crear su cuenta en Minta con email y contraseña desde la pantalla `/registro`, de punta a punta: completar el formulario, ver los errores de validación si los hay, y terminar con una cuenta creada en la base.

**Blocked by:** 01 (Setup de testing de componentes en frontend)

**Status:** ready-for-agent

- [ ] `POST /api/auth/register` crea un `User` con email único y contraseña hasheada (argon2id) — la contraseña en texto plano nunca se persiste ni se loguea.
- [ ] Registrarse con un email que ya existe devuelve un error claro y no crea un segundo usuario.
- [ ] Registrarse con una contraseña que no cumple los requisitos mínimos devuelve un error claro sin tocar la base.
- [ ] La pantalla `/registro` permite completar email + contraseña y muestra los errores de validación o de email duplicado de forma clara, sin recargar la página.
- [ ] Un test e2e (supertest, siguiendo el patrón de `test/app.e2e-spec.ts`) cubre el registro exitoso, el email duplicado y la contraseña inválida.
- [ ] Un test de componente (RTL) cubre el formulario de registro: caso de éxito y al menos un caso de error.
