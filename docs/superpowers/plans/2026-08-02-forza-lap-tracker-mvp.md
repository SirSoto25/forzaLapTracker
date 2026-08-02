# Forza Lap Tracker MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.  
> **Orchestrator:** Dispatch sealed packets per task; use project agents (`flt-dev`, `flt-unit`, …) without telling workers about each other. After code lands: `graphify update .`.

**Goal:** Ship a local-only Tauri 2 + React + SQLite desktop app that records FH6 lap times, auto-maps PI→class (incl. R/X), filters history, and compares two cars on one circuit.

**Architecture:** React UI (i18n ES/EN) calls Tauri commands; SQLite in app data dir; pure domain in `src/domain/`; seed JSON on first run; car images downloaded on demand into app data when registering a lap.

**Tech Stack:** Tauri 2, React 19, TypeScript, Vite, Vitest, `tauri-plugin-sql` (SQLite), i18next (or light custom JSON catalogs if smaller), Graphify for living graph.

**Repo:** https://github.com/SirSoto25/forzaLapTracker

## Global Constraints

- Local-only: no accounts, sync, sharing, telemetry
- Quality: **ponytail full** — shortest correct diff; no speculative abstractions
- PI→class: D 0–400, C 401–500, B 501–600, A 601–700, S1 701–800, S2 801–900, R 901–998, X 999; PI outside 0…999 rejected
- Lap time UI `mm:ss:mmm`, storage `time_ms`
- Default locale `es`; Settings toggle ES|EN
- Targets: Windows + Linux
- Skills when relevant: `ponytail`, `graphify`, `domain-modeling`, `sqlite-database-expert`, `frontend-design`, `shadcn` (only if already chosen for UI)
- Spec: `docs/superpowers/specs/2026-08-02-forza-lap-tracker-design.md`

## Parallelism (orchestrator)

| Wave | Tasks (parallel OK if paths don’t conflict) |
|------|-----------------------------------------------|
| A | Task 1 (scaffold) alone first |
| B | Task 2 (domain+tests) ∥ Task 3 (seed JSON files only) |
| C | Task 4 (SQL + commands) after 1+2+3 |
| D | Task 5 (shell i18n) ∥ Task 6 start (register form domain wiring) |
| E | Tasks 7–9 screens sequentially or split by route file |
| F | Task 10 images after register screen exists |
| G | Task 11 e2e + Task 12 verify/graphify |

## File map (target)

```
src/
  domain/piClass.ts
  domain/lapTime.ts
  domain/compare.ts
  db/migrations/001_init.sql
  db/seed.ts
  i18n/es.json
  i18n/en.json
  i18n/index.ts
  lib/tauri.ts          # thin invoke wrappers
  pages/CircuitsPage.tsx
  pages/RegisterLapPage.tsx
  pages/HistoryPage.tsx
  pages/ComparePage.tsx
  pages/SettingsPage.tsx
  components/…          # only as needed (BrandSelect, TimeInput, …)
  App.tsx
  main.tsx
seed/
  circuits.json
  manufacturers.json
  cars.json
src-tauri/
  src/lib.rs / main.rs  # plugins + ensure_car_image command if not pure JS
  capabilities/
public/brands/          # placeholder SVGs/PNGs per manufacturer slug
src/domain/*.test.ts
```

---

### Task 1: Repo remote + Tauri 2 scaffold

**Files:**
- Create: entire Vite+React+TS+Tauri 2 app at repo root (overwrite empty app area; keep `docs/`, `.cursor/`, `.agents/`, `graphify-out/`)
- Modify: `README.md` (dev commands), `.gitignore` (ensure `node_modules`, `src-tauri/target`, `dist`)
- Create: `package.json` scripts `dev`, `build`, `tauri`, `test`

**Interfaces:**
- Consumes: none
- Produces: runnable `npm run tauri dev` shell; `src/App.tsx` placeholder

- [ ] **Step 1: Point git remote at GitHub**

```bash
git remote add origin https://github.com/SirSoto25/forzaLapTracker.git
# or: git remote set-url origin https://github.com/SirSoto25/forzaLapTracker.git
git remote -v
```

Expected: `origin` → `https://github.com/SirSoto25/forzaLapTracker.git`

- [ ] **Step 2: Scaffold Tauri 2 + React + TS**

Use official create flow in a temp dir then merge, **or** `npm create tauri-app@latest` with:
- Identifier: `com.sirsoto25.forzalaptracker`
- Frontend: React + TypeScript + Vite
- Package manager: npm

Preserve existing `docs/`, `.cursor/`, `.agents/`, `graphify-out/`, `skills-lock.json`.

- [ ] **Step 3: Verify empty window runs**

```bash
npm install
npm run tauri dev
```

Expected: native window opens with default Vite React page.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Tauri 2 React TypeScript app"
```

---

### Task 2: Domain — PI→class + lap time (TDD)

**Files:**
- Create: `src/domain/piClass.ts`
- Create: `src/domain/lapTime.ts`
- Create: `src/domain/compare.ts`
- Create: `src/domain/piClass.test.ts`
- Create: `src/domain/lapTime.test.ts`
- Create: `src/domain/compare.test.ts`
- Modify: `package.json` — add `vitest`, script `"test": "vitest run"`

**Interfaces:**
- Produces:
  - `export type CarClass = "D" | "C" | "B" | "A" | "S1" | "S2" | "R" | "X"`
  - `export function piToClass(pi: number): CarClass` — throws if not integer in 0…999
  - `export function parseLapTime(input: string): number` — returns `time_ms`; throws on bad format
  - `export function formatLapTime(timeMs: number): string` — `mm:ss:mmm` zero-padded
  - `export function bestDeltaMs(aMs: number, bMs: number): number` — `aMs - bMs` (negative ⇒ A faster)

- [ ] **Step 1: Add Vitest**

```bash
npm install -D vitest
```

`package.json`:

```json
"scripts": {
  "test": "vitest run"
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node" } });
```

- [ ] **Step 2: Write failing PI tests**

```ts
// src/domain/piClass.test.ts
import { describe, expect, it } from "vitest";
import { piToClass } from "./piClass";

describe("piToClass", () => {
  it.each([
    [0, "D"],
    [400, "D"],
    [401, "C"],
    [500, "C"],
    [501, "B"],
    [600, "B"],
    [601, "A"],
    [700, "A"],
    [701, "S1"],
    [800, "S1"],
    [801, "S2"],
    [900, "S2"],
    [901, "R"],
    [998, "R"],
    [999, "X"],
  ] as const)("pi %i → %s", (pi, cls) => {
    expect(piToClass(pi)).toBe(cls);
  });

  it("rejects out of range", () => {
    expect(() => piToClass(-1)).toThrow();
    expect(() => piToClass(1000)).toThrow();
    expect(() => piToClass(1.5)).toThrow();
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
npm test -- src/domain/piClass.test.ts
```

Expected: FAIL (module missing)

- [ ] **Step 4: Implement `piToClass`**

```ts
// src/domain/piClass.ts
export type CarClass = "D" | "C" | "B" | "A" | "S1" | "S2" | "R" | "X";

export function piToClass(pi: number): CarClass {
  if (!Number.isInteger(pi) || pi < 0 || pi > 999) {
    throw new Error("PI must be an integer from 0 to 999");
  }
  if (pi <= 400) return "D";
  if (pi <= 500) return "C";
  if (pi <= 600) return "B";
  if (pi <= 700) return "A";
  if (pi <= 800) return "S1";
  if (pi <= 900) return "S2";
  if (pi <= 998) return "R";
  return "X";
}
```

- [ ] **Step 5: Run PI tests — expect PASS**

```bash
npm test -- src/domain/piClass.test.ts
```

- [ ] **Step 6: Write failing lap time tests**

```ts
// src/domain/lapTime.test.ts
import { describe, expect, it } from "vitest";
import { formatLapTime, parseLapTime } from "./lapTime";

describe("lapTime", () => {
  it("parses mm:ss:mmm", () => {
    expect(parseLapTime("01:23:456")).toBe(83456);
    expect(parseLapTime("00:00:000")).toBe(0);
  });
  it("formats ms", () => {
    expect(formatLapTime(83456)).toBe("01:23:456");
    expect(formatLapTime(0)).toBe("00:00:000");
  });
  it("rejects garbage", () => {
    expect(() => parseLapTime("1:2:3")).toThrow();
    expect(() => parseLapTime("99:99:999")).toThrow();
  });
});
```

- [ ] **Step 7: Implement parse/format**

```ts
// src/domain/lapTime.ts
const RE = /^(\d{2}):([0-5]\d):(\d{3})$/;

export function parseLapTime(input: string): number {
  const m = RE.exec(input.trim());
  if (!m) throw new Error("Time must be mm:ss:mmm");
  const mm = Number(m[1]);
  const ss = Number(m[2]);
  const ms = Number(m[3]);
  return mm * 60_000 + ss * 1000 + ms;
}

export function formatLapTime(timeMs: number): string {
  if (!Number.isInteger(timeMs) || timeMs < 0) throw new Error("Invalid time_ms");
  const mm = Math.floor(timeMs / 60_000);
  const rem = timeMs % 60_000;
  const ss = Math.floor(rem / 1000);
  const ms = rem % 1000;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}:${String(ms).padStart(3, "0")}`;
}
```

- [ ] **Step 8: Compare helper + test**

```ts
// src/domain/compare.ts
export function bestDeltaMs(aMs: number, bMs: number): number {
  return aMs - bMs;
}
```

```ts
// src/domain/compare.test.ts
import { expect, it } from "vitest";
import { bestDeltaMs } from "./compare";
it("delta", () => {
  expect(bestDeltaMs(80000, 81000)).toBe(-1000);
});
```

- [ ] **Step 9: Commit**

```bash
git add src/domain package.json vitest.config.ts package-lock.json
git commit -m "feat: domain PI class and lap time helpers with tests"
```

---

### Task 3: Seed JSON (minimal roster)

**Files:**
- Create: `seed/circuits.json`
- Create: `seed/manufacturers.json`
- Create: `seed/cars.json`
- Create: `public/brands/placeholder.svg` (shared fallback icon)

**Interfaces:**
- Produces seed shapes consumed by Task 4:

```ts
// circuits.json
[{ "name": "Horizon Mexico Circuit", "slug": "horizon-mexico-circuit" }]

// manufacturers.json
[{ "name": "Porsche", "slug": "porsche", "icon": "brands/placeholder.svg" }]

// cars.json
[{ "manufacturer_slug": "porsche", "model": "911 GT3 RS", "image_url": null }]
```

Include **≥5 circuits** and **≥8 cars** across **≥4 manufacturers** (names can be approximate FH6-flavored; expand later from public roster). `image_url` may be `null` until real URLs are curated.

- [ ] **Step 1: Write the three JSON files** with the shapes above
- [ ] **Step 2: Add `public/brands/placeholder.svg`** (simple geometric mark)
- [ ] **Step 3: Commit**

```bash
git add seed public/brands
git commit -m "chore: add minimal FH6 seed circuits and cars"
```

---

### Task 4: SQLite schema, first-run seed, Tauri SQL plugin

**Files:**
- Create: `src/db/migrations/001_init.sql`
- Create: `src/db/types.ts`
- Create: `src/db/client.ts` — open DB, run migrations, seed if empty
- Create: `src/lib/api.ts` — typed wrappers around SQL / invoke
- Modify: `src-tauri/Cargo.toml` — `tauri-plugin-sql` with sqlite
- Modify: `src-tauri/src/lib.rs` — register plugin
- Modify: `src-tauri/capabilities/*.json` — allow sql + fs for image dir later
- Modify: `package.json` — `@tauri-apps/plugin-sql`

**Interfaces:**
- Produces tables matching spec §3
- Produces:
  - `await initDb(): Promise<void>`
  - `listCircuits()`, `createCircuit(name)`, `listManufacturers()`, `listCars(manufacturerId?)`, `createCar(...)`, `insertLap(...)`, `listLaps(filters)`, `bestLap(circuitId, carId?)`, `getSetting` / `setSetting`

**SQL (`001_init.sql`):**

```sql
CREATE TABLE IF NOT EXISTS manufacturer (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon_path TEXT NOT NULL,
  is_builtin INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS car (
  id INTEGER PRIMARY KEY,
  manufacturer_id INTEGER NOT NULL REFERENCES manufacturer(id),
  model TEXT NOT NULL,
  is_builtin INTEGER NOT NULL DEFAULT 1,
  image_path TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(manufacturer_id, model)
);
CREATE TABLE IF NOT EXISTS circuit (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_builtin INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS lap (
  id INTEGER PRIMARY KEY,
  circuit_id INTEGER NOT NULL REFERENCES circuit(id),
  car_id INTEGER NOT NULL REFERENCES car(id),
  pi INTEGER NOT NULL CHECK (pi >= 0 AND pi <= 999),
  class TEXT NOT NULL,
  time_ms INTEGER NOT NULL CHECK (time_ms >= 0),
  notes TEXT,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS setting (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lap_circuit_time ON lap(circuit_id, time_ms);
CREATE INDEX IF NOT EXISTS idx_lap_car ON lap(car_id);
```

- [ ] **Step 1: Install plugin**

```bash
npm install @tauri-apps/plugin-sql
# follow current Tauri 2 docs to add tauri-plugin-sql to Cargo.toml with feature sqlite
```

- [ ] **Step 2: Register plugin + migration load path** (app data `sqlite:forza_lap_tracker.db`)
- [ ] **Step 3: Implement `initDb`** — run `001_init.sql`; if `circuit` count is 0, insert from `seed/*.json` (load via `fetch`/`import` of JSON bundled in frontend or `include_str` from Rust — prefer bundling JSON imports in TS for ponytail)
- [ ] **Step 4: Implement CRUD helpers in `src/lib/api.ts`** using `piToClass` when inserting laps
- [ ] **Step 5: Smoke from a temporary button or `console` in dev** — insert one lap, `SELECT` count ≥ 1
- [ ] **Step 6: Commit**

```bash
git commit -m "feat: SQLite schema, seed on first run, data API"
```

---

### Task 5: App shell + i18n ES/EN

**Files:**
- Create: `src/i18n/es.json`, `src/i18n/en.json`, `src/i18n/index.ts`
- Modify: `src/App.tsx` — nav: Circuits | Register | History | Compare | Settings
- Create: `src/pages/SettingsPage.tsx` — locale toggle persists via `setting.locale`

**Interfaces:**
- `t(key: string): string`
- `setLocale("es" | "en")` → writes DB + re-renders
- Default on missing setting: `"es"`

- [ ] **Step 1: Minimal catalogs** covering nav labels + register/history/compare strings used in later tasks
- [ ] **Step 2: Shell layout** — sidebar or top nav; outlet for pages (React Router or simple state tab — pick **one**; prefer `react-router-dom` if already common with Vite template, else `useState` route enum for fewer deps)
- [ ] **Step 3: Settings page** saves locale
- [ ] **Step 4: Commit**

```bash
git commit -m "feat: app shell navigation and ES/EN i18n"
```

---

### Task 6: Circuits page

**Files:**
- Create: `src/pages/CircuitsPage.tsx`
- Modify: routing in `App.tsx`

**Behavior:**
- List builtin + custom circuits
- “Add circuit” → `createCircuit(name)`
- Click → summary: best overall lap (time + car), links to Register (preselect circuit), History (filter), Compare (preselect circuit)

- [ ] **Step 1: Implement list + add**
- [ ] **Step 2: Implement detail/summary with `bestLap(circuitId)`**
- [ ] **Step 3: Commit**

```bash
git commit -m "feat: circuits list and summary"
```

---

### Task 7: Register lap page

**Files:**
- Create: `src/pages/RegisterLapPage.tsx`
- Create: `src/components/TimeInput.tsx` — controlled `mm:ss:mmm` mask
- Create: `src/components/CarPicker.tsx` — manufacturer (icon) → model

**Behavior:**
1. Circuit select (or from query)
2. Brand → model (icons from `icon_path`; car thumb if `image_path`)
3. PI number → live class label via `piToClass` (catch errors → show validation)
4. Time via `TimeInput` → `parseLapTime` on submit
5. Optional notes → `insertLap`
6. On model select: call `ensureCarImage(carId)` (stub OK until Task 10 returns immediately)

- [ ] **Step 1: Build form with client-side validation**
- [ ] **Step 2: Persist via API**
- [ ] **Step 3: Manual smoke in `tauri dev`**
- [ ] **Step 4: Commit**

```bash
git commit -m "feat: register lap form with PI class and time mask"
```

---

### Task 8: History page

**Files:**
- Create: `src/pages/HistoryPage.tsx`

**Behavior:**
- Table columns: date, circuit, car, PI, class, time (`formatLapTime`)
- Filters: circuit, class, manufacturer/car, date from/to
- Sort: time_ms ASC | recorded_at DESC

- [ ] **Step 1: `listLaps(filters)` query with WHERE clauses**
- [ ] **Step 2: Wire UI filters**
- [ ] **Step 3: Commit**

```bash
git commit -m "feat: lap history with filters"
```

---

### Task 9: Compare page

**Files:**
- Create: `src/pages/ComparePage.tsx`

**Behavior:**
- Pick circuit, car A, car B
- Show best time each, delta via `bestDeltaMs` + `formatLapTime(Math.abs(delta))` with sign/label “A faster” / “B faster” / “tie”
- List last N=5 laps per car on that circuit

- [ ] **Step 1: Implement comparison view**
- [ ] **Step 2: Commit**

```bash
git commit -m "feat: compare two cars on a circuit"
```

---

### Task 10: On-demand car image download

**Files:**
- Create: `src-tauri/src/images.rs` (or inline in `lib.rs`) — `ensure_car_image(car_id)`
- Modify: `src/lib/api.ts` — `ensureCarImage(id: number)`
- Modify: `CarPicker` / Register page — await ensure on model change; placeholder on failure

**Behavior:**
- Resolve app data `images/cars/{id}.webp` (or `.jpg` matching download)
- If file exists → update `car.image_path` if null → return path
- Else if `image_url` set → HTTP GET → write file → update row
- Else / on error → return `null` (UI placeholder); **never** block lap save

- [ ] **Step 1: Rust command + capability for http + fs app data**
- [ ] **Step 2: Wire frontend**
- [ ] **Step 3: Test with one seed car that has a reachable `image_url` (or mock URL); confirm failure path with bad URL**
- [ ] **Step 4: Commit**

```bash
git commit -m "feat: download car image on demand when registering"
```

---

### Task 11: E2E / desktop smoke

**Files:**
- Create: `e2e/smoke.spec.ts` **or** `scripts/smoke.md` + minimal Playwright if Tauri driver is heavy
- Prefer: documented manual smoke checklist in `docs/context/` **and** one automated Vitest integration that exercises `parseLapTime`/`piToClass`/`bestDeltaMs` already covered — plus a **Playwright** flow against Vite preview **only if** Tauri WebDriver setup is ≤1 hour; otherwise ship checklist + defer full Tauri e2e

**Checklist (must pass on Windows or Linux host):**

1. First launch seeds circuits/cars
2. Register lap → appears in History
3. Compare shows delta
4. Locale switch ES↔EN updates nav labels
5. Invalid PI / time shows error and does not save

- [ ] **Step 1: Add `docs/qa/MVP_SMOKE.md` with the checklist**
- [ ] **Step 2: Run checklist; fix blockers**
- [ ] **Step 3: Commit**

```bash
git commit -m "test: MVP smoke checklist and fixes"
```

---

### Task 12: Graphify refresh + README + push readiness

**Files:**
- Modify: `README.md` — clone URL, `npm i`, `npm run tauri dev`, `npm test`, Graphify note
- Run: `graphify update .`

- [ ] **Step 1: Update README with https://github.com/SirSoto25/forzaLapTracker**
- [ ] **Step 2: `graphify update .`**
- [ ] **Step 3: Commit graph artifacts (keep `graphify-out/cache` ignored)**

```bash
git add README.md graphify-out/graph.json graphify-out/manifest.json
git commit -m "docs: README and refresh graphify graph"
```

- [ ] **Step 4: Push when user asks**

```bash
git push -u origin HEAD
```

---

## Spec coverage check

| Spec item | Task |
|-----------|------|
| Local-only SQLite | 4 |
| PI→class incl. D0, R, X | 2, 7 |
| Time mm:ss:mmm | 2, 7 |
| Circuits hybrid | 3, 6 |
| Cars catalog + custom | 3, 7 |
| Screens MVP | 5–9 |
| i18n ES/EN default es | 5 |
| On-demand car image | 10 |
| Brand icons bundled | 3, 7 |
| Unit tests domain | 2 |
| Smoke / e2e | 11 |
| Graphify | 12 |
| Repo URL | 1, 12 |

## Post-MVP (do not implement in this plan)

Export/import DB, rich best-per-class UI, auto-updating seed from URL, full car image CDN pack.
