# Expense Categories (Tipos de gasto)

Status: ready-for-agent

## Problem Statement

Today every **Expense** carries a free-text "Descripción". Two expenses at the same bakery end up as "Panadería", "panaderia" and "pan y facturas", so a User can never group or analyse their spending by what it was for. Typing the same thing over and over on a phone is also slow. And there is no shared vocabulary: every User invents their own words from scratch.

## Solution

Replace the free-text description with a required **Expense Category** ("Tipo de gasto"), picked through a search-as-you-type field. After typing at least three letters, the User sees matching categories: a rich catalog of **System Category**s that Minta provides to everyone (Mercadería, Combustible, Netflix, Peluquería…), plus the **Household Category**s that members of their own **Household** created before. If nothing fits, the User creates a new category right from the same field ("Crear «Clases de cerámica»"). It is saved with the Expense and becomes available to everyone in their Household from then on, and never to other Households. An optional free-text **Detail** ("Detalle") keeps any extra context.

To make Household Categories possible before Household invitations exist, every User now automatically belongs to a one-person Household.

## User Stories

1. As a User recording an Expense, I want to classify it by picking an Expense Category, so that my spending can later be grouped by what it was for.
2. As a User, I want suggestions to appear as I type the category, so that I don't have to type full names on my phone.
3. As a User, I want suggestions to start only after I type three letters, so that I'm not flooded with an unfiltered list.
4. As a User, I want the search to ignore accents and capitalisation, so that typing "panaderia" finds "Panadería".
5. As a User, I want the search to match anywhere in the name, so that typing "vehic" finds "Lavadero vehículo/auto".
6. As a User, I want categories that start with what I typed to appear before those that merely contain it, so that the most likely match is on top.
7. As a User, I want the categories my Household uses most to rank higher, so that my usual choices are one tap away.
8. As a User, I want to see at most a handful of suggestions, so that the list stays scannable on a small screen.
9. As a User, I want a large catalog of common Argentine expense categories available from day one, so that I rarely need to create my own.
10. As a User, I want to create a new category from the same field when nothing matches, so that I can classify unusual expenses without leaving the form.
11. As a User, I want creating a category to be an explicit choice ("Crear «X»"), so that a typo doesn't silently become a new category.
12. As a User, I want a new category to be saved only when I save the Expense, so that abandoning the form leaves no stray categories behind.
13. As a User, I want Minta to stop me from creating a category that already exists under a slightly different spelling (accents, capitals, extra spaces), so that my Household doesn't end up with duplicates.
14. As a User, I want new category names to be tidied up (trimmed, first letter capitalised), so that the list looks consistent.
15. As a User, I want category names limited to a reasonable length, so that they fit in lists and stay meaningful.
16. As a User, I want categories I create to be available to every member of my Household, so that we classify shared spending the same way.
17. As a User, I want categories created by other Households to never appear in my searches, so that my Household's vocabulary stays ours and private.
18. As a User, I want to be unable to assign another Household's category to my Expense, even by crafting a request, so that Household data stays isolated.
19. ~~As a User, I want to see which suggestions were created in my Household, so that I can tell them apart from the built-in ones.~~ Deferred until Household invitations ship (see UI & UX Decisions).
20. As a User, I want to add an optional Detail to an Expense, so that I can note specifics ("facturas para el domingo") without polluting the category list.
21. As a User, I want to change an Expense's category and Detail when editing it, using the same search field, so that I can fix misclassifications.
22. As a User, I want the expense list to show the category as the main text of each row and the Detail underneath, so that I can scan what I spent on at a glance.
23. As a User, I want a clear inline error if I try to save without choosing a category, so that I know what's missing.
24. As a User, I want the search field to be fully usable with the keyboard and screen readers, so that it's accessible.
25. As a User, I want a gentle message when no category matches, along with the option to create it, so that I'm never stuck.
26. As a User, I want an inline error with a retry if suggestions fail to load, so that a network hiccup doesn't block me.
27. As a newly registered User, I want a Household to exist for me automatically, so that categories I create already belong somewhere shareable when invitations arrive.
28. As an existing User, I want to receive my Household automatically when this feature ships, so that I can use Household Categories right away.
29. As a User whose Household created a category that Minta later adds to its catalog, I want the two to be merged automatically, with my Expenses moved to the catalog one, so that I never see duplicates.
30. As a User, I want monthly ARS/USD totals to keep working exactly as before, so that classification doesn't change my numbers.

## Implementation Decisions

**Domain rules** (see `GLOSSARY.md`, ADR 0004, ADR 0005)
- Every Expense has exactly one Expense Category (required) and an optional Detail. The old free-text description is removed.
- Every User belongs to exactly one Household. A one-person Household is created atomically with the User at registration, named "Hogar de {name}", or "Mi Hogar" when the User has no name. A migration backfills a Household for every existing User.
- Household Categories always belong to the whole Household, regardless of the visibility of the Expense they were created from.
- Invariant: no two Expense Categories visible to the same Household share a normalized name.

**Name normalization** (a small pure module, the only new unit-tested piece)
- Display name: trimmed, inner whitespace collapsed, first character upper-cased, the rest kept as typed. Maximum 40 characters after trimming; minimum 1.
- Normalized key: the display name lower-cased, with diacritics stripped (Unicode NFD minus combining marks) and whitespace collapsed. It is used for uniqueness and search matching.

**Schema** (MySQL via Prisma)
- New `SystemExpenseCategory` table: id, name, normalized key (unique), group (internal rubro label from the seed; not exposed in the UI yet).
- New `HouseholdExpenseCategory` table: id, householdId (required), name, normalized key, createdByUserId, createdAt. Unique on (householdId, normalized key).
- `Expense`: drops `description`; adds a nullable `detail` (max 200 chars), a nullable `systemCategoryId` and a nullable `householdCategoryId`. A database CHECK constraint (raw SQL in the migration) enforces that exactly one of the two category FKs is set. The service enforces the same rule.
- `HouseholdMember.userId` becomes unique (one Household per User).
- Existing Expense rows are test data and are deleted by the migration.

**System Category catalog**
- The catalog is defined in code as a list grouped by rubro (contents in Further Notes) and applied by an idempotent sync step that runs as the Prisma seed: on deploy, in local dev and before e2e tests. It upserts by normalized key.
- When the sync adds a System Category whose normalized key matches an existing Household Category, it reassigns that Household Category's Expenses to the System Category and deletes the Household Category, in one transaction. This preserves the uniqueness invariant.
- System Categories are never edited or deleted through the API.

**API** (all routes authenticated and scoped server-side to the requesting User's Household)
- `GET /api/expense-categories?q=<text>` returns up to 8 items `{ id, name, source: "SYSTEM" | "HOUSEHOLD" }`. If `q` is shorter than 3 characters after trimming, it returns `200 []`. Matching is substring over the normalized key. Ordering:
  1. the exact normalized match first (so the client never offers to create an existing name), then prefix matches, then substring-only matches;
  2. then by how many Expenses of the User's Household members use the category, descending;
  3. then alphabetically.
- `POST /api/expenses` and `PATCH /api/expenses/:id` replace `description` with:
  - `category`, one of `{ source: "SYSTEM", id }`, `{ source: "HOUSEHOLD", id }` or `{ source: "NEW", name }`;
  - `detail?: string | null`.
- With `NEW`, the name is normalized. If any visible category already has that key, it is reused, not duplicated. Otherwise a Household Category is created inside the same transaction as the Expense.
- A `HOUSEHOLD` id that doesn't exist or belongs to another Household, or an unknown `SYSTEM` id, yields `400` with a generic message ("Tipo de gasto inválido."). The response never reveals another Household's category.
- Expense responses replace `description` with `category: { id, name, source }` and `detail: string | null`.
- The existing Expense rules (PERSONAL visibility, 404 for another User's Expense) are unchanged.

**Frontend**
- A new reusable category combobox is used by both the create form and the inline row edit. It calls the search endpoint with a ~250 ms debounce once the input reaches 3 characters, and ignores stale responses.
- The "Crear «X»" option is appended only when no suggestion's normalized name equals the typed text's normalized key. Normalization is mirrored client-side for this check only; the server remains the source of truth.
- The selected value is `{ source, id, name }` or `{ source: "NEW", name }`. Free text that was never selected is not a valid value.
- Frontend types and the input shape (`Expense`, `ExpenseInput`) drop `description` in favour of `category` and `detail`. Row action labels (e.g. "Editar …", "Eliminar …") use the category name.

## UI & UX Decisions

**Screens touched:** the Gastos screen, specifically the add-expense form, the inline row edit and the expense list rows. Patterns: DESIGN.md *Lists of records (gastos)*, *Controls* and *States*.

**Category combobox ("Tipo de gasto")**
- It replaces the "Descripción" field in the same position (after Monto/Moneda, before Fecha) and has a visible label "Tipo de gasto". Placeholder example: "Ej.: Panadería".
- Built from the shadcn/Base UI combobox primitive (style `base-nova`), `h-10`, and keyboard-complete: arrow keys move, Enter selects, Esc closes. It exposes combobox/listbox roles, and the active option is announced.
- Popover on the `card` surface with a hairline ring and `rounded-lg`. Rows are at least 40px tall on touch. The matched substring is emphasized in semibold.
- Household Categories and System Categories look the same. A "de tu Hogar" label was dropped (follow-up review): while every Household has a single member it would mention a concept the user cannot see. Reintroduce it when Household invitations ship.
- The last option, separated by a hairline, is "Crear «{typed text}»" with a `Plus` icon. It only appears per the rule above.
- States:
  - **Under 3 characters:** no popover, plus a muted helper text "Escribí al menos 3 letras".
  - **Loading:** 3 skeleton option rows inside the popover.
  - **No results:** the muted line "No encontramos «X»" plus the create option.
  - **Error:** an inline row with an icon, "No pudimos cargar los tipos de gasto." and a "Reintentar" action. The User can still create.
  - **Selected:** the input shows the name, and a clear (×) icon button with `aria-label` resets it.
  - **Validation:** submitting without a selection shows "Elegí o creá un tipo de gasto." in the form's existing `role="alert"` block, and focus moves to the combobox.
- A new "Detalle (opcional)" text input follows the combobox, `h-10`, placeholder "Ej.: facturas para el domingo".

**List rows**
- Primary text is the category name. The meta line underneath shows the Detail (when present, truncated with an ellipsis) · date · currency badge. The amount stays on the right.
- Below `sm`: category and amount on top; Detail/date and the actions underneath, per DESIGN.md.
- Long content: a category name of 40 characters and a 200-character Detail must truncate without causing horizontal scroll at 390px.

**Inline edit:** same fields as the add form (Monto, Moneda, Tipo de gasto, Detalle, Fecha). From `sm` the fields wrap onto two lines when one line can't fit them. The popover must not be clipped by the list surface.

**Responsive:** at 390px the popover is as wide as the input. At 1440px the form stays in the sticky right column and the popover matches the input width.

**DESIGN.md update:** add a "Search-as-you-type (combobox)" pattern capturing the minimum-characters rule, the create option, the source label and the states above.

## Testing Decisions

- A good test asserts externally observable behaviour (HTTP status and body, persisted effects observable through the API, rendered DOM after interactions), never internals such as mock call counts or component state.
- **Primary seam: the backend HTTP boundary.** It extends the existing e2e pattern (supertest against a real Nest app and the real MySQL), with the system catalog seeded before the suite. It covers:
  - Household auto-creation at registration.
  - Search: the 3-character minimum, accent and case insensitivity, substring matching, prefix-first and usage ordering, the cap of 8, and the `source` field.
  - Isolation: User B never sees User A's Household Categories in search, and gets `400` when assigning one by id on create or update.
  - Create and update with each category source. A `NEW` name equivalent to an existing System Category or Household Category reuses it.
  - Name length validation, the optional `detail`, and the response shape.
- **Secondary seam: the name-normalization pure module.** Table-driven unit tests for display name and normalized key, following the existing unit-test style.
- **Catalog sync:** run against the real database in the e2e suite. It is idempotent (a second run changes nothing), and the merge path moves the Expenses of a Household Category to a newly added System Category with the same normalized key.
- **Frontend component tests** (Vitest + RTL with the network mocked at the fetch boundary, like the existing expense form, list and manager specs) cover:
  - No search under 3 characters.
  - Debounced suggestions render.
  - The create option appears only without an equivalent match.
  - Keyboard selection works.
  - The submitted payload carries the chosen or new category plus the Detail.
  - The missing-category validation shows.
  - Rows render the category and Detail.
  - Inline edit changes the category.
- UI work also passes the ui-design visual loop (390px and 1440px, light and dark).

## Out of Scope

- Managing Household Categories (rename, delete, manual merge) and any category settings screen.
- Showing rubros/groups in the UI or using them for filtering. They exist only inside the catalog definition.
- Household invitations, joining or leaving a Household, Shared Expenses, and any Household UI.
- Category-based reports, charts or filters on the expense list.
- Personal (User-private) categories.
- Migrating existing expense descriptions (existing data is test data and is discarded).

## Further Notes

**System Category catalog (approved).** Grouped by rubro, as stored internally:

- **Alimentación:** Mercadería, Supermercado, Almacén, Verdulería, Carnicería, Pollería, Pescadería, Fiambrería, Panadería, Dietética, Kiosco, Sodero/Agua, Bebidas, Vinoteca, Mayorista
- **Comer afuera:** Restaurante/Salidas, Pizzería, Heladería, Cafetería, Bar, Parrilla, Comida rápida, Delivery, Rotisería, Sushi, Almuerzo laboral
- **Vivienda:** Alquiler, Expensas, Hipoteca, ABL/Inmobiliario, Seguro de hogar, Mantenimiento/Arreglos, Ferretería, Pinturería, Materiales de construcción, Muebles, Electrodomésticos, Bazar/Decoración, Jardinería, Mudanza, Cerrajería
- **Servicios del hogar:** Luz, Gas, Garrafa, Agua/AySA, Internet, Cable/TV, Telefonía fija, Celular, Servicio doméstico, Limpieza del hogar, Lavandería, Fumigación, Alarma/Seguridad
- **Vehículo:** Combustible, Lavadero vehículo/auto, Cochera/Estacionamiento, Peajes, Seguro del auto, Patente, Service/Mecánico, Gomería, Repuestos, VTV, Multas, Cuota del auto, Moto
- **Transporte:** Colectivo/SUBE, Tren, Subte, Taxi/Remís, Uber/Cabify/DiDi, Bicicleta, Micro de larga distancia, Avión
- **Salud:** Prepaga/Obra social, Farmacia, Médico/Consulta, Odontólogo, Psicólogo/Terapia, Óptica, Análisis/Estudios, Kinesiología, Nutricionista
- **Cuidado personal:** Peluquería, Barbería, Manicura, Estética/Depilación, Perfumería, Cosmética, Masajes/Spa
- **Ropa:** Ropa, Calzado, Ropa deportiva, Accesorios, Lencería/Ropa interior, Tintorería, Arreglos de ropa
- **Educación:** Colegio/Cuota escolar, Universidad, Cursos, Idiomas, Útiles escolares, Libros, Uniformes, Transporte escolar, Clases particulares
- **Hijos:** Pañales, Guardería/Jardín, Juguetes, Niñera, Cumpleaños infantiles, Actividades extracurriculares
- **Mascotas:** Veterinaria, Alimento para mascotas, Pet shop, Peluquería canina, Paseador
- **Suscripciones y streaming:** Netflix, Spotify, Disney+, Max, Prime Video, Paramount+, YouTube Premium, Apple Music/iCloud, Google One, Star+/Flow, Diarios/Revistas
- **Gaming y entretenimiento:** Playstation, Xbox, Nintendo, Steam/Juegos, Cine, Teatro, Recitales/Shows, Eventos deportivos, Salidas nocturnas, Boliche, Hobbies
- **Deporte:** Gimnasio, Club, Fútbol (cancha), Pádel/Tenis, Natación, Equipamiento deportivo
- **Tecnología:** Electrónica, Computación, Celular (equipo), Accesorios tecnológicos, Software/Apps, Reparación de equipos
- **Viajes:** Hotel/Alojamiento, Pasajes, Excursiones, Comida en viaje, Alquiler de auto, Seguro de viaje
- **Finanzas e impuestos:** Monotributo, Ganancias, Bienes personales, Comisiones bancarias, Mantenimiento de cuenta, Intereses de tarjeta, Cuota de préstamo, Seguro de vida, Contador
- **Regalos y social:** Regalos, Cumpleaños, Casamientos/Eventos, Donaciones, Cuota social/Club
- **Trabajo:** Coworking, Insumos de oficina, Comida de trabajo
- **Otros:** Otros, Imprevistos, Trámites, Correo/Envíos, Fotocopias/Impresiones, Cigarrillos/Tabaco, Lotería/Apuestas

Every name in the catalog must have a distinct normalized key, and the sync step fails loudly if two collide.
