# Project skills catalog

Installed under `.agents/skills/` (project scope). Orchestrator embeds the relevant skill **names** in sealed packets; workers open only those skills.

| Skill | Use for |
|-------|---------|
| `frontend-design` | Visual identity, typography, layout for desktop UI (avoid generic AI looks) |
| `design-taste-frontend` | Taste / polish pass on UI |
| `ui-ux-pro-max` | Design system search: palette, type, UX patterns (desktop/React) |
| `web-design-guidelines` | Audit UI against Vercel Web Interface Guidelines (a11y/UX) |
| `vercel-composition-patterns` | React component composition without prop-drilling mess |
| `shadcn` | shadcn/ui components when the UI stack uses them |
| `domain-modeling` | Bounded contexts, entities, invariants (Circuit/Car/Lap/PI) |
| `sqlite-database-expert` | SQLite schema, indexes, migrations, local DB practices |
| `living-project-docs` | ADRs + living `docs/context` |
| `ponytail` | Minimal correct code (mandatory on all code packets) |
| `session-handoff` | Structured handoff sections (pair with project dump path) |
| `handoff` | Compact live thread for the next agent |
| `context-continuity` | **Project:** Graphify refresh + dump at ~90% → `docs/context/dumps/` |
| `graphify` | **Living knowledge graph** (`graphify-out/`, query/path/explain/update) |

## Packet hints (orchestrator only)

- **UI slice:** `ponytail` + `frontend-design` + `ui-ux-pro-max` (+ `shadcn` / `vercel-composition-patterns` if React components)
- **UI review:** `web-design-guidelines` + `design-taste-frontend`
- **Schema / domain:** `ponytail` + `domain-modeling` + `sqlite-database-expert`
- **Docs/ADR:** `living-project-docs`
- **Near context limit / end of wave:** `context-continuity` (+ `session-handoff` structure)

## Continuity

- Living graph: `graphify-out/` (Graphify) — see `docs/graph/PROJECT_GRAPH.md`
- Context dumps: `docs/context/dumps/` + `docs/context/LEDGER.md`
- Skills: `graphify`, `.cursor/skills/context-continuity`

## Not installed

- `anti-ui-slop` — clone failed; covered by `frontend-design` + `design-taste-frontend` + `web-design-guidelines`.