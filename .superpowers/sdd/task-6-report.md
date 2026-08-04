# Task 6 Report: Settings UI for backup export/import

## Status
**DONE**

## Summary
Added a Backup fieldset on Settings with Export and Import (Replace / Merge mode choice). Replace asks for `window.confirm` before applying. Status line uses the exact `backup.*` i18n keys in Spanish and English.

## Changes
- **Modified** `src/pages/SettingsPage.tsx`: third `locale-picker` fieldset; `exportBackup` / `importBackup` from `../lib/api`; import mode buttons after Import; status messages for saved/cancelled/imported/errors
- **Modified** `src/i18n/es.json`, `src/i18n/en.json`: all required `backup.*` keys
- **App.css**: unchanged (reused `.locale-picker` / `.muted`)

## Tests
- `npm test` — 12 files, 61 tests passed
- `npx tsc --noEmit` — clean

## Commit
`feat: add backup export/import controls in settings`

## Concerns
- Import error mapping uses parse codes (`invalid_json` / `invalid_schema`) and Zod-style `path: message` → `backup.errorInvalid`; everything else → `backup.errorApply`. Rare apply errors that look like Zod paths could be misclassified.
- No dedicated SettingsPage component test (dialogs require Tauri); covered by existing backup unit tests + typecheck.
