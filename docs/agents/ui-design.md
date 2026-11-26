# UI Design

How the engineering workflow skills handle anything with a user interface. The design contract is `DESIGN.md` at the repo root; the process lives in the `ui-design` skill.

The workflow skills (`grill-with-docs`, `to-spec`, `to-tickets`, `implement`, `code-review`) are vendored from `mattpocock/skills` and pinned in `skills-lock.json`, so they are **not edited**. They pick up this document through `CLAUDE.md` instead. These rules extend them; they don't replace any step.

## What counts as UI work

Any change that creates or modifies screens, components, styles, or design tokens in `apps/frontend` — in practice, `*.tsx` under `src/app/` or `src/components/`, or `src/app/globals.css`. Pure logic changes (`src/lib/`, hooks without markup) are not UI work.

## Per stage

| Stage | What to add when the work has a UI surface |
| --- | --- |
| `/grill-with-docs` | Call the Skill tool with `ui-design` (Shape mode). Grill the user on hierarchy, states, and responsive behaviour for each screen. New reusable patterns or tokens go into `DESIGN.md`, the way new terms go into `GLOSSARY.md`. |
| `/to-spec` | Call `ui-design` (Shape mode). Add a `## UI & UX Decisions` section to the spec, after `## Implementation Decisions`. |
| `/to-tickets` | Call `ui-design` (Shape mode). Add its two UI acceptance criteria to every ticket with a UI surface. |
| `/implement` | Call `ui-design` (Build mode) **before** writing UI code, and finish its visual loop **before** calling `code-review`. A UI ticket is not done until the loop passes. |
| `/code-review` | Add `DESIGN.md` to the standards sources. If the diff touches UI, spawn a third parallel sub-agent for the **Design** axis (ui-design Review mode) and report it under `## Design`, after `## Standards` and `## Spec`, without cross-axis reranking. |

## Visual verification

The visual loop needs a browser tool (built-in browser pane, Claude in Chrome, or a Playwright MCP) and the dev server running (`pnpm dev`). If no browser tool is available, the agent says so explicitly instead of claiming the UI was verified.
