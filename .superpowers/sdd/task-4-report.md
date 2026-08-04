# Task 4 Report: Apply backup (replace + merge)

## Status
**DONE**

## Summary
Pure planning + thin transactional executor for backup apply.

## Changes
- **Created** `src/lib/backup/applyBackup.ts` — `planReplace`, `planMerge`, `applyBackup`, `executeApplyOps`, `lapDedupeKey`
- **Created** `src/lib/backup/applyBackup.test.ts` — replace wipe+insert (class via `piToClass`), merge upsert/dedupe, transaction smoke

## Behavior
- **Replace:** `DELETE` lap→car→circuit→manufacturer→setting, then insert all; lap `class` = `piToClass(pi)`
- **Merge:** upsert manufacturers (keep local builtin icon), cars, circuits; insert laps only if dedupe key differs; settings overwrite by key
- **Dedupe:** `(circuit_name, manufacturer_name, car_model, pi, time_ms, recorded_at)`
- **Transaction:** `BEGIN IMMEDIATE` … `COMMIT` / `ROLLBACK`

## Tests
```
npm test
Test Files  11 passed (11)
Tests       56 passed (56)
npx tsc --noEmit — clean
```

## Commit
`feat: apply backup replace and merge modes`

## Concerns
- No `wipeUserData` in `api.ts` — wipe is plan ops + SQL in executor
- Post-replace seed upsert deferred to Task 5 (caller)
