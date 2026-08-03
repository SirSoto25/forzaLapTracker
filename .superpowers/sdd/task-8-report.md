# Task 8 report: History page

## Implemented

- Added `src/pages/HistoryPage.tsx`: table (date, circuit, car, PI, class, time via `formatLapTime`); filters circuit / class / car (`CarPicker`) / date from–to; sort time ASC or date DESC via existing `listLaps`.
- Honors App `selectedCircuitId` preselect (same pattern as Register).
- Wired History into `App.tsx`; i18n `history.*` in `es.json` / `en.json`; filter/table styles in `App.css`.
- `CarPicker` accepts optional `required` (false on History so car filter stays clearable).

## Verification

- `npm test`: 6 files passed, 27 tests passed.
- `npm run typecheck`: passed.

## Commit

- `95b37d2db1ed085e6ae8cb30e98d7dc882b697b7` — `feat: lap history with filters` on `feat/mvp`

---

## Manufacturer filter (2026-08-03)

### Changes

- `LapFilters.manufacturerId` optional; `listLaps` adds `car.manufacturer_id = ?` (AND with `carId` when both set).
- `HistoryPage`: manufacturer `<select>` alongside existing `CarPicker`; loads via `listManufacturers`.

### Verification

- `npm test`: 6 files passed, 27 tests passed.
- `npm run typecheck`: passed.

### Concerns

- Resolved prior concern: manufacturer alone now filters laps without picking a car.
- Mismatch (manufacturer filter + car from another brand) correctly returns empty via AND.

### Commit

- `11e62093af66e051f5aea2dd5309288e945a83f1` — `feat: history manufacturer filter` on `feat/mvp`
