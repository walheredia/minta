# 01: Setup de testing de componentes en frontend (Vitest + RTL)

**What to build:** Infraestructura de testing a nivel de componente para `apps/frontend`, que hoy no tiene ningún test runner configurado. Es un prefactor: no agrega comportamiento de usuario, pero deja listo el seam de testing que todos los tickets de frontend de esta spec van a usar.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Vitest corre en `apps/frontend` con scripts `test` y `test:watch`, con la misma forma de invocarlos que ya existe en `apps/backend`.
- [ ] React Testing Library (y los matchers de DOM equivalentes a `jest-dom`) están instalados y configurados para testear componentes del App Router de Next.js, incluyendo la distinción entre Server y Client Components donde aplique.
- [ ] Hay al menos un test de ejemplo pasando contra un componente real ya existente en el proyecto (por ejemplo `ThemeToggle` o la home page), probando que el seam funciona de punta a punta.
