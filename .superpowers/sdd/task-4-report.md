# Task 4 report — SQLite schema, first-run seed, Tauri SQL plugin

## Status

Implemented on `feat/mvp`.

## Changes

- Added `001_init.sql` with the required manufacturer, car, circuit, lap, and setting tables plus lap indexes.
- Registered that SQL as Tauri migration version 1 for `sqlite:forza_lap_tracker.db`.
- Added `@tauri-apps/plugin-sql` 2.4.0 and `tauri-plugin-sql` 2.4.0 with the `sqlite` feature.
- Added and registered `tauri-plugin-fs` 2.5.1 so the requested `fs:default` capability is valid for the later image directory work.
- Enabled `sql:default`, `sql:allow-execute`, and `fs:default` in the main-window capability.
- Added `initDb()`, which loads the database (thereby applying the registered migration) and imports `seed/*.json` only when the circuit count is zero.
- Added typed catalog, lap, best-lap, filtered-history, and setting helpers. All values are bound parameters; `insertLap` validates `timeMs` and derives the stored class with `piToClass(pi)`.

## API surface

- `initDb`
- `listCircuits`, `createCircuit`
- `listManufacturers`
- `listCars`, `createCar`
- `insertLap`, `listLaps`, `bestLap`
- `getSetting`, `setSetting`

## Verification

- TDD red: the two new test modules initially failed because `src/db/client.ts` and `src/lib/api.ts` did not exist.
- Targeted green: `npm test -- src/db/client.test.ts src/lib/api.test.ts` — 4/4 passed.
- Full suite: `npm test` — 24/24 passed across 5 files.
- TypeScript: `npm run typecheck` — passed.
- Production frontend: `npm run build` — passed.
- SQL smoke: applied the migration to in-memory SQLite, loaded all 5 manufacturers, 8 cars, and 6 circuits, inserted one lap, confirmed lap count 1, and confirmed `PRAGMA foreign_key_check` was clean.
- Rust formatting: `cargo fmt --check` — passed.
- Rust manifest/dependencies: `cargo metadata --no-deps --format-version 1` — passed and showed SQL+SQLite and filesystem plugins.
- Native compile: `cargo check` reached compilation but could not proceed because this machine has no MSVC `link.exe`, matching the known environment limitation.

## Concerns

- A native Tauri-window smoke test was not possible without the MSVC linker. The schema/seed/lap path was smoke-tested with in-memory SQLite and the TS database behavior is covered by unit tests.
- Filesystem JavaScript bindings were intentionally not added; Task 4 only needs the Rust plugin and capability. Add `@tauri-apps/plugin-fs` when the image-cache code begins calling it.
