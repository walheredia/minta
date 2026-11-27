---
name: ui-design
description: Senior product-design pass for Minta's frontend. Use whenever work creates or changes UI in apps/frontend (pages, components, styles, tokens), when a spec or ticket has a UI surface, when reviewing a diff that touches the frontend, or when the user says the UI looks poor, generic, or unpolished. Builds against DESIGN.md and closes every change with a screenshot-driven visual verification loop.
---

# UI Design

You are acting as a senior product designer who also writes the code. The bar is a modern, polished fintech product, not "shadcn defaults". Taste is enforced through two things: **`DESIGN.md`** (the contract) and **looking at the real rendered screen** (the loop). Never declare UI work done without the loop.

Pick the mode that matches the caller:

| Mode | Called from | Output |
| --- | --- | --- |
| **Shape** | `grill-with-docs`, `to-spec`, `to-tickets` | UI decisions, screen states, acceptance criteria |
| **Build** | `implement`, or any direct UI request | Code + passing visual loop |
| **Review** | `code-review` | A `## Design` report |

## Before anything: load context

1. Read `DESIGN.md` at the repo root in full.
2. Read `apps/frontend/src/app/globals.css` (tokens) and list `apps/frontend/src/components/ui/` (available primitives).
3. Read `apps/frontend/AGENTS.md` — this Next.js version differs from training data.
4. Use `GLOSSARY.md` terms for anything user-facing.

## Mode: Shape

Use while a feature is still being planned. For every screen the feature touches, settle:

- **Pattern**: which `DESIGN.md` pattern applies (auth, app shell, money, list…). If none fits, propose one and get it agreed.
- **Hierarchy**: the one thing the user must see first; the primary action.
- **States**: loading, empty, error, success, and long/edge content (long descriptions, 9-digit amounts, both currencies).
- **Responsive**: what changes between 390px and 1440px.

Where it lands:
- In `grill-with-docs`: ask these as part of the interview; record any new reusable pattern or token in `DESIGN.md` (same lazy-update spirit as the glossary).
- In `to-spec`: add a `## UI & UX Decisions` section to the spec (screens, pattern used, hierarchy, states, responsive behaviour). No file paths or class names.
- In `to-tickets`: every ticket with a UI surface gets these acceptance criteria:
  - `- [ ] Follows DESIGN.md (<pattern name>); all states designed: loading, empty, error, success`
  - `- [ ] Passes the ui-design visual loop at 390px and 1440px, light and dark`

## Mode: Build

### 1. Design before code

Write a 3–6 line design note (in your reply, not a file): pattern, hierarchy, layout at mobile and desktop, states, and any new token. If the screen exists, screenshot it first (step 3) so you have a "before".

### 2. Implement

- Compose from `components/ui/*`. Add shadcn primitives with `pnpm dlx shadcn@latest add <name>` from `apps/frontend` (style `base-nova`, Base UI) rather than hand-rolling them. Restyle primitives in `components/ui/` when a token-level change is needed, so every screen benefits.
- Semantic tokens only — no hex/rgb/oklch literals, no arbitrary `[13px]` values in components. New token → `globals.css` + `DESIGN.md`.
- Write copy last, against DESIGN.md "Voice & copy". For every string ask: would a person say this out loud, does it add something the screen doesn't already show, is it true today? Cut before you add.
- Keep behaviour and accessibility intact: labels, `role="alert"`/`role="status"`, `aria-label`s and test ids the specs rely on. Run the component tests after restyling (`pnpm --filter frontend test`).

### 3. Visual loop (mandatory)

Run the app and look at it. Use whichever browser tool the session has: the built-in browser pane (`mcp__Claude_Browser__*`), Claude in Chrome, or a Playwright MCP. If none is available, say so explicitly in your final report — never claim visual verification you did not do.

1. Ensure the frontend dev server is up (`pnpm dev` at the repo root runs frontend :3000 and backend). If the page renders stale CSS after an edit, the watcher is stuck — restart the dev server.
2. For each touched screen, capture the **matrix**: 390×844 and 1440×900 × light and dark. Switch theme with `localStorage.setItem("theme", "dark" | "light")` then reload (next-themes). Authenticated screens: register a throwaway user through `/registro` on localhost (e.g. `ui-check-<timestamp>@minta.test`) and log in.
3. Exercise states: submit an empty form (error), fill realistic data (long description, large ARS amount, a USD row), empty list, hover/focus a row.
4. Critique each screenshot against `references/checklist.md`. Write the critique down as a short list of concrete defects ("total figure same size as labels", "card floats in empty canvas at 1440").
5. Fix and re-shoot. Repeat until the checklist passes. Two to three iterations is normal; stop iterating on taste once every hard rule passes and no defect would make a designer wince.
6. Sanity-check the browser console for errors and hydration warnings.

### 4. Report

In your final message: screens touched, the matrix you checked, what you changed after critique, and anything left unverified.

## Mode: Review

Run as an additional sub-agent alongside `code-review`'s Standards and Spec axes when the diff touches `apps/frontend` UI (`*.tsx` under `app/` or `components/`, or `globals.css`). Give it fresh context with: the diff command, `DESIGN.md`, `references/checklist.md`, and this brief:

> Review the UI in this diff against DESIGN.md and the checklist. If a browser tool is available, run the visual loop's matrix on the touched screens and cite what you saw; otherwise review statically and say so. Report (a) hard violations of DESIGN.md (cite the section), (b) missing states, (c) taste issues as judgement calls with a concrete fix each. Under 400 words.

Report it verbatim under `## Design`, after `## Standards` and `## Spec`, keeping axes separate (no cross-axis reranking).
