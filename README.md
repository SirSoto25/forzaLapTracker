# Forza Lap Tracker

Native Win/Linux lap timer for Forza Horizon 6 (Tauri 2 + React + SQLite). Local-only.

**Repository:** https://github.com/SirSoto25/forzaLapTracker

## Development

```bash
git clone https://github.com/SirSoto25/forzaLapTracker
cd forzaLapTracker
npm i
npm run tauri dev
```

Run tests with `npm test`.

Build the frontend with `npm run build` or the desktop app with `npm run tauri build`.

**Windows:** Native builds need [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (MSVC + Windows SDK). Install the “Desktop development with C++” workload before `npm run tauri build`.

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

Tauri 2 + React + TypeScript scaffold ready for MVP implementation.
