# Project knowledge graph → **Graphify**

The living project graph is **Graphify**, not a hand-maintained Mermaid file.

## Outputs (source of truth)

| File | Use |
|------|-----|
| `graphify-out/graph.json` | Queryable graph (`graphify query` / `path` / `explain`) |
| `graphify-out/GRAPH_REPORT.md` | Plain-language highlights (after clustered build) |
| `graphify-out/graph.html` | Interactive view in browser |
| `graphify-out/manifest.json` | Build manifest |

## Commands

```bash
# Full rebuild (assistant: /graphify .) — includes docs semantic pass when configured
graphify update .                 # code AST only, fast, no LLM
graphify update . --force         # after large deletions
graphify watch .                  # rebuild on file changes (dev)
graphify query "how does PI map to class?"
graphify path "Lap" "Circuit"
graphify explain "piToClass"
```

Ensure `graphify` is on `PATH` (Windows: `%AppData%\Python\Python314\Scripts`).

## Session habit

1. Prefer **graphify query/path/explain** (or read `GRAPH_REPORT.md`) before broad greps.
2. After non-trivial code/docs land: `graphify update .` (or `/graphify --update`).
3. Context dumps still live under `docs/context/` — they **reference** graphify, they do not replace it.

## Skill / rule

- Skill: `.agents/skills/graphify/`
- Always-on rule: `.cursor/rules/graphify.mdc`

## Legacy

The old Mermaid sketch was removed in favor of Graphify. Domain decisions remain in `docs/superpowers/specs/`.
