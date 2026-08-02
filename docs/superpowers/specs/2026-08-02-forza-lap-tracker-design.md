# Forza Horizon 6 Lap Tracker — Design Spec

**Status:** approved  
**Date:** 2026-08-02  
**Repo:** https://github.com/SirSoto25/forzaLapTracker  
**Stack:** Tauri 2 + React + TypeScript + SQLite  
**Quality bar:** ponytail **full** (minimal code that works; no speculative abstractions)

## 1. Product goal

Native Windows/Linux desktop app to record and compare lap times for Forza Horizon 6 circuits. All data stays on the user’s machine. No accounts, sync, or sharing.

## 2. Non-goals (MVP)

- Cloud sync, multi-user, social, leaderboards
- Telemetry / analytics
- Live game integration / memory reading
- Shipping copyrighted game assets in the installer beyond small brand icons (car renders are on-demand cache only)

## 3. Domain model

| Entity | Fields |
|--------|--------|
| Circuit | `id`, `name`, `is_builtin`, `created_at` |
| Manufacturer | `id`, `name`, `icon_path` (bundled) |
| Car | `id`, `manufacturer_id`, `model`, `is_builtin`, `image_path` (nullable local cache), `image_url` (seed, for download), `created_at` |
| Lap | `id`, `circuit_id`, `car_id`, `pi`, `class`, `time_ms`, `notes` nullable, `recorded_at` |
| Setting | key/value (e.g. `locale`) |

### 3.1 PI → class

| Class | PI |
|-------|-----|
| D | 0–400 |
| C | 401–500 |
| B | 501–600 |
| A | 601–700 |
| S1 | 701–800 |
| S2 | 801–900 |
| R | 901–998 |
| X | 999 |

- PI must be integer in `0…999` or reject save.
- Class is computed on PI change and stored on the lap for filtering.

### 3.2 Lap time

- UI format: `mm:ss:mmm` (e.g. `01:23:456`).
- Storage: `time_ms` integer.
- Pure functions: `parseLapTime` / `formatLapTime` with unit tests.

### 3.3 Catalog

- **Circuits:** FH6 seed list + user-created customs (`is_builtin = 0`). Seed updates never overwrite customs.
- **Cars:** manufacturer → model seed from public FH6 roster sources + user-created customs.
- First-run applies versioned seed/migrations into SQLite under the app data directory.

## 4. Images

- Brand icons: shipped with the app.
- Car image: on-demand when the user selects that model while **registering a lap**.
  - Command: ensure local file for `car_id`.
  - If missing and `image_url` present: download to `{appData}/images/cars/{id}.webp`, set `image_path`.
  - Network failure: placeholder UI; lap save still allowed.
- No upload/share of images.

## 5. Screens (MVP)

1. **Circuits** — list; open circuit summary (best lap; links to register / history / compare).
2. **Register lap** — circuit, brand→model (icons/thumbs), PI→live class, time mask, optional notes.
3. **History** — table + filters: circuit, class, car, date; sort by time or date.
4. **Compare** — one circuit, car A vs car B: best times, delta, recent laps each.
5. **Settings** — locale ES | EN (default **ES**), persisted locally.

## 6. Architecture

```
React UI (i18n) → Tauri commands → SQLite
                              ↘ image cache on disk
Seed JSON ──first run──→ SQLite
```

- Domain pure logic in shared TS (and/or Rust if already on the command path); prefer one place (ponytail: TS shared module unless Rust is required for the command).
- Prefer `tauri-plugin-sql` unless a thin `rusqlite` command set is shorter for the MVP.

## 7. i18n

- Spanish and English string catalogs; toggle in Settings.
- Default locale: `es`.

## 8. Testing (product requirements)

- Unit: PI→class matrix (incl. D=0, R, X), time parse/format, compare delta.
- E2E (desktop smoke): register lap → appears in history; compare shows delta; locale switch updates UI.
- Verification: build Win/Linux targets when CI allows; local smoke on developer OS.

## 9. Agentic delivery

Parallel, isolated agent council. See:

- [2026-08-02-agentic-council-design.md](./2026-08-02-agentic-council-design.md) (orchestrator-only map)
- Project agents under `.cursor/agents/` (each file is a sealed role)
- Skills catalog: [docs/skills.md](../../skills.md) (`graphify`, `frontend-design`, `domain-modeling`, …)

**Constraint:** worker agents must not be given knowledge of other workers’ identities or duties. Only the orchestrator holds the roster and pipeline.

## 10. Open follow-ups (post-MVP, do not build now)

- Export/import DB backup
- Best-per-class on circuit view beyond what’s needed for compare
- Auto-update of seed catalogs from a maintained URL
