# Minta Design System

The visual and interaction contract for every screen in `apps/frontend`. Agents read this before touching UI (via the `ui-design` skill) and `code-review` treats it as a standards source.

When a UI decision gets made that this file doesn't cover, add it here in the same change — the way `GLOSSARY.md` grows with domain terms.

## Personality

**"Make money make sense."** Minta is a calm, trustworthy place to look at money. It should feel like a modern fintech product (think Mercury, Linear, Copilot Money), not an admin panel and not a crypto app.

- **Calm over loud.** Mostly neutral surfaces; color is reserved for meaning (brand, money in/out, state). One accent moment per screen.
- **Numbers are the hero.** Amounts are the largest, most legible thing on a money screen. Labels whisper, figures speak.
- **Dense but breathable.** Generous outer spacing, tight inner grouping. Related things touch; unrelated things get air.
- **Rioplatense voice.** Copy sounds like a person from Buenos Aires explaining the app to a friend. See [Voice & copy](#voice--copy).

## Voice & copy

Copy is part of the design, and it is where machine-written UI shows first. Write like a person talking, not like a feature list.

### Rules

- **Voseo, plain words.** "Ingresá", "Cargá", "plata", "anotá". End-user terms come from `GLOSSARY.md` ("Gasto", "Hogar").
- **Concrete over abstract.** Name a real situation instead of a quality. Not "control total de tus finanzas" but "a fin de mes sabés a dónde fue la plata".
- **Say it once.** A description must add something the title and the visible fields don't already say. If it only restates them, delete it. Many screens need a title and nothing else.
- **Only claim what's true today.** No promises about features that don't exist (Hogar, ingresos, inversiones) and no unverifiable claims ("gratis", "seguro", "en segundos").
- **Errors say what happened and what to do**, in that order, in plain words: "Sin conexión con el servidor. Revisá tu internet y probá otra vez."
- **Buttons are verbs** that name the result: "Cargar gasto", "Crear cuenta", "Sí, eliminar".
- **Read it out loud.** If nobody would say it that way across a table, rewrite it.

### Machine-writing tells (reject in review)

| Tell | Instead of | Write |
| --- | --- | --- |
| Colon that sets up a reveal or a list inside a slogan | "Cada gasto en su moneda: pesos o dólares, sin conversiones." | "Si lo pagaste en pesos, va en pesos. Si lo pagaste con dólares, va en dólares." |
| Trailing negation as a selling point ("sin X", "sin vueltas", "sin complicaciones") | "…sin conversiones." | State what *does* happen. |
| Rule of three: three parallel bullets or adjectives with icons | Three feature bullets of the same length | One concrete sentence, or show the thing (a real screen, a real example) |
| Stock phrases | "de un vistazo", "en un solo lugar", "pensado para vos", "llevá tu X al siguiente nivel", "mes a mes" | The specific fact |
| Em dashes (—) for asides and in titles | "Minta — Make money make sense" | A period, a comma, or `·` in titles |
| Paired slogan fragments invented for a screen | "Simple. Rápido. Tuyo." | A normal sentence |
| Description that restates the title | "Ingresá a tu cuenta" / "Iniciá sesión con tu email y tu contraseña…" | Drop the description |
| Field list as helper text | "Monto, moneda, descripción y fecha." above those exact fields | Nothing |
| Reassurance filler | "Tus datos son solo tuyos.", "Tranqui, es fácil." | Nothing, or a specific fact backed by the product |

The brand tagline ("Make money make sense", "Gastá con cabeza. Ahorrá más.") is owned by the product and stays as is. Don't coin new taglines per screen.

## Tokens

All tokens live in `apps/frontend/src/app/globals.css` as CSS variables and are exposed to Tailwind through `@theme inline`. **Never hard-code a color, radius, or shadow in a component** — use the semantic utility (`bg-card`, `text-muted-foreground`, `ring-border`…). If a needed token doesn't exist, add it to `globals.css` and document it here.

### Color

Neutrals are **tinted toward the brand hue (~165, mint)** with very low chroma. Pure greys (`oklch(x 0 0)`) are not used for surfaces — they read as unstyled.

| Token | Role |
| --- | --- |
| `background` | Page canvas. Dark: deep green-black, never `#000`. |
| `card` | Raised surface (cards, panels, popovers) — one step lighter than `background` in dark mode, white on a faintly tinted canvas in light mode. |
| `muted` / `muted-foreground` | Secondary surfaces (table header, inset areas) / secondary text. |
| `border`, `input` | Hairlines and field outlines. Low contrast; structure comes from spacing first. |
| `primary` | Brand mint. Primary actions, active nav, focus ring, links. |
| `gold` | Accent for savings / positive highlights. Use at most once per screen. |
| `destructive` | Errors and destructive actions only. |
| `chart-1…5` | Data viz series, mint-led and distinguishable in both themes. |

Utilities defined in `globals.css`:
- `bg-brand-glow`: soft mint/gold radial glow built from `primary` and `gold`. Brand surfaces only (auth brand panel, future hero areas); never behind data.

Rules:
- Text on any surface meets **WCAG AA** (4.5:1 body, 3:1 large text and UI glyphs).
- Status is never conveyed by color alone — pair it with an icon or text.
- Both themes are first-class. Every screen is checked in light **and** dark.

### Typography

- **UI font:** Geist (`font-sans`). **Figures:** Geist Mono (`font-mono`) or Geist with `tabular-nums` for any amount, date column, or number that can be compared vertically.
- Scale (Tailwind classes):

| Use | Class |
| --- | --- |
| Hero figure (balance, monthly total) | `text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums` |
| Page title | `text-2xl font-semibold tracking-tight` |
| Section / card title | `text-base font-semibold` |
| Body | `text-sm` |
| Label, meta, helper | `text-xs` or `text-sm text-muted-foreground` |
| Overline (rare) | `text-xs font-medium uppercase tracking-wider text-muted-foreground` |

- Max two weights per view (regular + semibold; medium for labels/buttons).
- Line length for prose: `max-w-prose` or narrower.

### Spacing & layout

- 4px base grid (Tailwind spacing). Prefer `gap-*` over margins.
- Inner grouping `gap-1.5`–`gap-2` (label ↔ field), field groups `gap-4`–`gap-5`, sections `gap-8`–`gap-10`.
- Page gutters: `px-4` mobile, `px-6`+ from `sm`. App content max width `max-w-5xl` (dashboards) or `max-w-2xl` (single-column flows).
- Mobile first. Every screen must work at **390px** wide with no horizontal scroll, and look intentional at **1440px** (no lone narrow column floating in a void).

### Shape & depth

- Radius: `--radius` = 0.75rem. Cards `rounded-xl`, controls `rounded-lg`, pills/badges `rounded-full`.
- Depth comes from **surface contrast + hairline ring**, not heavy shadows. Light mode may use `shadow-xs`/`shadow-sm` on raised cards; dark mode uses a lighter surface + `ring-1 ring-border`.
- One elevated layer at a time (a dialog over a page, not cards inside cards inside cards).

### Controls

- Form controls and primary buttons in forms are **`h-10`** (`size="lg"` on `Button`, `h-10` on `Input`/`Select`). The compact `h-8` sizes are for toolbars and dense rows only.
- Every field has a visible `<Label>`. Placeholder text is an example, never the label.
- Focus is always visible (`ring-3 ring-ring/50`). Never remove outlines without a replacement.
- Touch targets ≥ 40px on mobile.
- Icons: `lucide-react`, `size-4` inline, stroke default. Icon-only buttons need `aria-label`.

### Motion

- Subtle and fast: 150–200ms, `ease-out`. Use `tw-animate-css` (`animate-in fade-in slide-in-from-bottom-2`) for entering content.
- Animate opacity/transform only. Respect `motion-reduce:` — disable non-essential motion.
- No bouncing, no looping decoration.

## Patterns

### Auth screens (ingresar, registro)

- **Desktop (`lg+`)**: two-column split. Left: brand panel (wordmark, tagline, one concrete sentence, a sample of the real product, subtle mint glow). No feature-bullet lists. Right: the form, vertically centered, `max-w-sm`.
- **Mobile**: brand panel collapses to the wordmark above the form. No card chrome around the form on mobile — the screen *is* the card.
- Title (`text-2xl`), an optional one-line description only when it adds information (e.g. password rules), fields, full-width primary button, then the secondary link ("¿Todavía no tenés una cuenta? Registrate") below the form.
- Success and error states are inline, with icon + text, announced via `role="status"` / `role="alert"`.

### App shell (authenticated area)

- Top bar: wordmark left, primary navigation, user/session actions right (theme toggle, cerrar sesión). Sticky, `backdrop-blur`, hairline bottom border.
- Page header inside content: title + one-line context + primary action aligned right (stacks on mobile).

### Money

- Amounts always formatted with `formatAmount` (es-AR separators) and `tabular-nums`, right-aligned in lists/tables.
- Currency is shown as a small muted badge (`ARS`, `USD`) next to the figure when both currencies can appear.
- **ARS and USD are never summed or converted into one figure** (ADR 0002). Totals appear as separate stat tiles side by side.
- Stat tile: overline label, hero figure, optional delta/meta line. No icons-in-colored-circles filler.

### Lists of records (gastos)

- Rows, not stacked cards: one surface containing the list, rows separated by hairlines, `py-3`, hover `bg-muted/50`.
- Primary text (description) left, meta (date, currency) muted beneath it, amount right.
- Below `sm` a row becomes two lines: description + amount on top, date + actions underneath, so descriptions don't collapse to a few characters.
- Row actions (editar, eliminar) are icon buttons or a `…` menu, visible on hover/focus on fine pointers (`pointer-fine:`) and always visible on touch, with 40px touch targets.
- Edit happens inline in the row, with the same fields in the same order as the add form; from `sm` they sit on one line when they fit and wrap onto a second line otherwise. The add form lives beside the list on desktop (sticky right column) and above it on mobile.
- Destructive actions confirm inline or in a dialog; the confirm button uses `variant="destructive"`.

### Search-as-you-type (combobox)

Used for picking a record from a large server-side set (e.g. "Tipo de gasto").

- Built on the shadcn/Base UI `Combobox` primitive, `h-10`, visible `<Label>`, keyboard-complete (arrows, Enter, Esc) with combobox/listbox roles.
- **Minimum query**: no popover until 3 characters; a muted helper ("Escribí al menos 3 letras") sits under the field until then. Its line stays reserved (hidden, not removed) so the fields below never jump. Requests are debounced (~250ms) and stale responses ignored.
- **Ordering** (server): exact match first, then prefix matches, then the rest.
- **Popover**: `bg-popover` surface with hairline ring, width matches the input. Options ≥40px tall on touch (`min-h-10`, `pointer-fine:min-h-8`); the matched substring is semibold. At most 8 options.
- **Secondary label**: when options come from different sources, the less common one gets a small muted text label to the right (e.g. "de tu Hogar"); the default source gets none.
- **Create option**: when free-form creation is allowed, the last option (after a hairline separator) is "Crear «texto»" with a `Plus` icon, shown only when no option already has an equivalent name.
- **States**: loading = 3 skeleton option rows; no results = muted "No encontramos «texto»"; error = inline icon + message + "Reintentar" ghost button; selected = input shows the name plus a clear (×) icon button with `aria-label`.
- **Validation**: a required combobox left empty reports through the form's `role="alert"` block, marks the field `aria-invalid` and moves focus to it.

### States (every data view must design all of them)

- **Loading**: skeletons that match the final layout. No bare spinners for page-level loads.
- **Empty**: icon + one-line explanation + the primary action to fix it ("Cargá tu primer gasto").
- **Error**: inline message with icon, what happened, and a retry when possible.
- **Success**: brief inline confirmation; avoid toasts for things that are already visible on screen.

## Anti-patterns (reject in review)

- A single small card floating in the middle of a large empty dark canvas.
- Pure black (`#000`) or pure-grey (`oklch(x 0 0)`) surfaces.
- Browser default fonts (serif/Times) anywhere — means the font pipeline is broken.
- Every section wrapped in its own card; cards nested in cards.
- Colored icon-in-a-circle decorations, gratuitous gradients on text, emoji as UI.
- Hard-coded hex/rgb/oklch values or arbitrary `text-[13px]`-style values in components.
- Labels as placeholders, low-contrast grey-on-grey text, invisible focus.
- Mixing ARS and USD in one total.
- Layouts verified only at one viewport or one theme.
