# 02: Classify Expenses with System Categories

**What to build:** The tracer bullet for Expense Categories. The free-text "Descripción" is replaced by a required "Tipo de gasto" chosen from the System Category catalog through a search-as-you-type combobox (3-character minimum), plus an optional "Detalle". It works in the add form and the inline row edit, and the list rows show the category as primary text with the Detail underneath. See the spec's Implementation Decisions, UI & UX Decisions and Further Notes (catalog). Creating new categories is ticket 03.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Schema: System Category table; Expense drops `description` and gains `detail` (≤200), `systemCategoryId` and `householdCategoryId` with a CHECK that exactly one is set; existing test Expenses are deleted
- [ ] Idempotent catalog sync (Prisma seed) loads the full approved catalog with rubro groups, and fails loudly on duplicate normalized keys
- [ ] `GET /api/expense-categories?q=`: `[]` under 3 characters; accent- and case-insensitive substring match; prefix matches first, then alphabetical; at most 8 results; items `{ id, name, source }`
- [ ] Expense create/update accept `category: { source: "SYSTEM", id }` and `detail`; an unknown id yields 400 "Tipo de gasto inválido."; responses carry `category` and `detail`
- [ ] Combobox used in the add form and the inline edit, with all states (helper under 3 characters, loading, no results, error with retry, selected with clear, missing-category validation)
- [ ] List rows show the category plus the Detail/date meta line; row action labels use the category name
- [ ] DESIGN.md gains a "Search-as-you-type (combobox)" pattern
- [ ] e2e and component tests cover the above
- [ ] Follows DESIGN.md (Lists of records, Controls, Search-as-you-type); all states designed: loading, empty, error, success
- [ ] Passes the ui-design visual loop at 390px and 1440px, light and dark
