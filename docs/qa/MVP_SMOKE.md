# MVP smoke checklist

Manual desktop smoke for the Forza Lap Tracker MVP. Run on a host where `npm run tauri dev` builds and opens the window (Windows with MSVC Build Tools, or Linux with a working Rust toolchain).

## Host limitation (this CI/agent host)

On the current Windows development host, **`npm run tauri dev` fails at compile time** because the MSVC linker (`link.exe`) is not installed. Vite serves on `http://localhost:1420/`, but the Tauri desktop window never opens, so GUI smoke steps below cannot be executed here. Automated coverage is provided by `npm test` (Vitest) instead; full Tauri e2e is deferred.

## Prerequisites

1. `npm install`
2. `npm run tauri dev` — app window opens without boot error
3. Fresh DB (first launch) or known test data

## Manual checklist

| # | Scenario | Steps | Expected | Pass |
|---|----------|-------|----------|------|
| 1 | First launch seeds circuits/cars | Launch app on clean profile | Circuits page lists builtin circuits; car picker shows seeded cars | ☐ |
| 2 | Register lap → History | Circuits → Register: pick circuit, car, valid PI, valid time → Save | Lap appears in History for that circuit | ☐ |
| 3 | Compare shows delta | Register two laps on same circuit/car (or use existing) → Compare | Delta vs best/reference lap is shown | ☐ |
| 4 | Locale ES↔EN | Settings → switch locale ES ↔ EN | Nav labels and page titles update in the chosen language | ☐ |
| 5 | Invalid PI / time | Register: enter invalid PI or malformed time → Save | Inline error shown; lap is **not** saved | ☐ |

## Automated smoke (run on any host)

```bash
npm test
```

Vitest covers domain and API logic that underpins the checklist:

| Area | Tests | Relates to checklist |
|------|-------|----------------------|
| `parseLapTime` / `formatLapTime` | `src/domain/lapTime.test.ts` | #2, #5 (time validation) |
| `piToClass` | `src/domain/piClass.test.ts` | #2, #5 (PI validation) |
| `bestDeltaMs` | `src/domain/compare.test.ts` | #3 (compare delta) |
| DB client / seed | `src/db/client.test.ts` | #1 (seed data) |
| i18n / locale | `src/i18n/index.test.ts` | #4 (locale switch) |
| API wrappers | `src/lib/api.test.ts` | #2 (register lap) |

**Last run (2026-08-03):** 6 files, 29 tests passed.

## Deferred

- Playwright against Vite preview (no Tauri APIs; limited value for SQLite flows)
- Tauri WebDriver / full desktop e2e — blocked until MSVC toolchain available or Linux CI runner with display
