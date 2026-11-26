## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### UI design

Design contract in `DESIGN.md` at the repo root; process in the `ui-design` skill. Whenever a workflow skill (`grill-with-docs`, `to-spec`, `to-tickets`, `implement`, `code-review`) touches work with a UI surface in `apps/frontend`, apply the per-stage rules in `docs/agents/ui-design.md`. UI work is never done without the skill's visual verification loop.
