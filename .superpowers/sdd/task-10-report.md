# Task 10 report: On-demand car image download

## Implemented

- Added `src-tauri/src/images.rs`: Tauri command `ensure_car_image(car_id, image_url)` downloads via **reqwest** (rustls) into `{appData}/images/cars/{id}.{ext}`; returns absolute path or `None` on any failure (no throw).
- Wired `ensureCarImage` in `src/lib/api.ts`: loads car row → invoke → `UPDATE car.image_path`; catches all errors → `null` (never blocks lap save).
- `CarPicker` already awaited ensure on model change; uses `convertFileSrc` for app-data thumbs; placeholder when null.
- Capabilities: fs scope for `$APPDATA` / `$APPLOCALDATA` `images/**`; `protocol-asset` + assetProtocol scope for car images.
- Seed: Porsche 911 GT3 RS → reachable `placehold.co` PNG; Mustang → bad URL for failure-path coverage.

## Verification

- `npm test`: 6 files, **29** tests passed (incl. ensureCarImage success + null-on-failure).
- `npm run typecheck`: passed.
- `cargo check`: **failed** — `linker link.exe not found` (MSVC Build Tools missing). Rust/TS sources are in place; re-run after installing VS C++ build tools.

## Concerns

- HTTP uses Rust `reqwest`, not `tauri-plugin-http` (fits Tauri 2 command side; no JS http capability needed).
- Existing local DBs keep old `image_url` nulls (`INSERT OR IGNORE`); fresh seed only on first run / reset DB.
- Full download not exercised in desktop smoke here (no link.exe).

## Commit

- `6952a961bb1e34cd497b721fe169c9b9bebdf134` — `feat: download car image on demand when registering` on `feat/mvp`

---

## CarPicker stale ensureCarImage guard (2026-08-03)

### Changes

- `CarPicker`: track selected car via `carIdRef`; after `ensureCarImage` resolves, update `thumbPath` only when `carIdRef.current === id` so slow downloads for a prior selection cannot overwrite the current thumbnail.

### Verification

- `npm test`: 6 files, **29** tests passed.

### Commit

- `b708a780ee0c4c8a63cb47cc6f19f126b42c6f89` — `fix: ignore stale ensureCarImage in CarPicker` on `feat/mvp`