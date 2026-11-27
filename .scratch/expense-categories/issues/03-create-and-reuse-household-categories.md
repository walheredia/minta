# 03: Create and reuse Household Categories

**What to build:** When nothing matches, the User picks "Crear «X»" in the combobox, and the new Household Category is saved together with the Expense. It is visible to every member of their Household, never to other Households, and an equivalent name (case, accents, spacing) reuses the existing category instead of duplicating it. Household Categories show a "de tu Hogar" label, and suggestions rank by how often the Household uses them.

**Blocked by:** 01, 02

**Status:** done

- [x] Household Category table, unique on (household, normalized key), records createdByUserId
- [x] Expense gains a nullable `householdCategoryId`; `systemCategoryId` becomes nullable; a DB CHECK enforces exactly one is set
- [x] Names are validated to 1–40 characters (normalization module already exists from 02)
- [x] Expense create/update accept `{ source: "NEW", name }` (created in the same transaction, or reused when an equivalent System or Household Category exists) and `{ source: "HOUSEHOLD", id }`
- [x] A Household Category id from another Household yields 400 "Tipo de gasto inválido."; search never returns another Household's categories (e2e with two Users)
- [x] Search ordering: prefix first, then Household usage count, then alphabetical
- [x] Combobox shows "Crear «X»" only when no suggestion has the same normalized name; Household suggestions show "de tu Hogar"; names over 40 characters are rejected with a clear message
- [x] Follows DESIGN.md (Search-as-you-type); all states designed: loading, empty, error, success
- [x] Passes the ui-design visual loop at 390px and 1440px, light and dark

## Comments

- Category resolution (SYSTEM / HOUSEHOLD / NEW) lives in the expense-categories module; the expenses service calls it inside the same transaction as the Expense write.
- e2e files now run serially (shared MySQL; parallel cleanup deletes deadlocked with the new transactions).
- Visual loop (headless Chrome, 390/1440 × light/dark): fixed the "No encontramos «…»" overflow for names over 40 characters.
