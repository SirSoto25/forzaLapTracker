# Task 5 Report: API + file I/O wiring

## Status
**DONE**

## Summary
Wired backup export/import through Tauri dialog + filesystem plugins. Export selects DB rows (natural-key joins), builds a validated payload, and writes via save dialog. Import opens a file, fail-closed parses with Zod, applies replace/merge, and reseeds builtins after replace.

## Changes
- **Added** `src/lib/backup/io.ts`
  - `exportBackup()` → `"saved" | "cancelled"`
  - `importBackup(mode)` → `"imported" | "cancelled" | { error }`
  - `importBackupText(text, mode)` pure helper for parse/apply (dialogs stay on public surface)
  - `selectBackupSourceRows(db)` SQL matching `BackupSourceRows`
  - Filters: `[{ name: "Forza Lap Tracker Backup", extensions: ["fltbackup.json", "json"] }]`
- **Added** `src/lib/backup/io.test.ts` — smoke tests: invalid JSON/schema never call `applyBackup`; replace reseeds; merge does not; apply throw → `{ error }`
- **Modified** `src/db/client.ts` — exported `runSeedUpsert()` (`upsertSeed` + `seed_version` write)
- **Modified** `src/lib/api.ts` — re-exports `exportBackup` / `importBackup` (+ result types)

## Tests
`npm test` — 12 files / 61 tests passed  
`npx tsc --noEmit` — clean

## Commit
`feat: wire backup export and import file dialogs`

## Concerns
- Dialog cancel/save paths are not unit-tested against live Tauri plugins (mocked only through `importBackupText`).
- Suggested save name uses UTC date from `toISOString().slice(0, 10)`.
- No Settings UI yet (Task 6).
