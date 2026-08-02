# Forza Lap Tracker

Native Win/Linux lap timer for Forza Horizon 6 (Tauri 2 + React + SQLite). Local-only.

**Repository:** https://github.com/SirSoto25/forzaLapTracker

## Specs

See [docs/README.md](docs/README.md). Product design:

`docs/superpowers/specs/2026-08-02-forza-lap-tracker-design.md`

## Agent council

Custom agents live in `.cursor/agents/`. The human (or `flt-orchestrator`) dispatches **sealed packets**. Worker agents are isolated on purpose.

## Skills

UI, domain modeling, SQLite, and quality skills are in `.agents/skills/`. See [docs/skills.md](docs/skills.md).

## Continuity

- Knowledge graph: **Graphify** → `graphify-out/` (`graphify update .` / `/graphify .`)
- Notes: [docs/graph/PROJECT_GRAPH.md](docs/graph/PROJECT_GRAPH.md)
- Context dumps (~90%): [docs/context/](docs/context/)
- Rules: `graphify.mdc` + `context-continuity`

## Status

Spec approved — see implementation plan under `docs/superpowers/plans/`.
