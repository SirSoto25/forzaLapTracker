# Design: Export / Import backup (JSON + Zod)

**Date:** 2026-08-04  
**Status:** Approved  
**Repo:** https://github.com/SirSoto25/forzaLapTracker

## Goal

Let users export and import app data (backup / move to another PC / after format) without losing laps, custom catalog entries, or settings. Cached car images are **not** included.

## Decisions (locked)

| Topic | Choice |
| --- | --- |
| Payload | App data only (manufacturers, cars, circuits, laps, settings) — no image cache |
| File format | Versioned JSON (`.fltbackup.json`) |
| Import modes | User chooses **Replace** or **Merge** at import time |
| Schema validation | **Zod** — fail closed before any DB write |
| UI placement | Settings page |
| Cloud sync / encryption | Out of scope |

## File shape (`schemaVersion: 1`)

```json
{
  "format": "forza-lap-tracker-backup",
  "schemaVersion": 1,
  "exportedAt": "2026-08-04T12:00:00.000Z",
  "appVersion": "0.1.0",
  "data": {
    "manufacturers": [
      { "name": "Custom Make", "icon_path": "brands/placeholder.svg", "is_builtin": 0 }
    ],
    "cars": [
      {
        "manufacturer_name": "Custom Make",
        "model": "Special",
        "is_builtin": 0,
        "image_url": null
      }
    ],
    "circuits": [
      { "name": "My Track", "is_builtin": 0 }
    ],
    "laps": [
      {
        "circuit_name": "My Track",
        "manufacturer_name": "Custom Make",
        "car_model": "Special",
        "pi": 700,
        "class": "A",
        "time_ms": 83456,
        "notes": null,
        "recorded_at": "2026-08-01T10:00:00.000Z"
      }
    ],
    "settings": [
      { "key": "locale", "value": "es" }
    ]
  }
}
```

### Identity rules (portable IDs)

Do **not** export SQLite primary keys. Reference entities by natural keys:

- Manufacturer: `name`
- Car: `(manufacturer_name, model)`
- Circuit: `name`
- Lap: content tuple for dedupe on merge — `(circuit_name, manufacturer_name, car_model, pi, time_ms, recorded_at)` (notes ignored for equality)
- Setting: `key`

Omit local `image_path` (machine-specific). Optionally keep `image_url` if present.

Builtin catalog rows may be included for completeness; import must not break seed upserts (`seed_version` may be imported or left to app re-seed logic — prefer: import settings as-is, then ensure `initDb` / seed version still runs safely on next boot).

## Zod validation (hard gate)

Dependency: `zod` (app dependency).

Before any mutation:

1. `JSON.parse` — on failure → user-facing error, no DB touch  
2. Parse with a Zod schema (`BackupFileV1`) that enforces:
   - `format` literal `"forza-lap-tracker-backup"`
   - `schemaVersion` literal `1` (unknown version → “unsupported backup version”)
   - `exportedAt` ISO datetime string
   - `appVersion` non-empty string
   - `data` object with required arrays
   - Manufacturers: `name` trimmed non-empty; `icon_path` string; `is_builtin` 0|1
   - Cars: `manufacturer_name` + `model` non-empty; `is_builtin` 0|1; `image_url` string | null
   - Circuits: `name` non-empty; `is_builtin` 0|1
   - Laps: names/models non-empty; `pi` int 0–999; `class` enum matching app classes; `time_ms` int ≥ 0; `notes` string | null; `recorded_at` ISO-ish string
   - Settings: `key` / `value` non-empty strings (value may be empty string if we allow — prefer non-empty key, value string including `""`)
3. **Referential checks** (Zod `.superRefine` or post-parse):
   - Every car’s `manufacturer_name` exists in `manufacturers`
   - Every lap’s circuit exists in `circuits`
   - Every lap’s `(manufacturer_name, car_model)` exists in `cars`
4. Reject unknown critical shapes; strip or reject unexpected top-level keys via `.strict()` on the root object (preferred: **strict** root + data so hand-edited junk fails loudly)

On any Zod / refine failure: show i18n error (first issue summary), **commit nothing**.

## Export flow

1. Settings → Export  
2. Build object from DB (join names for cars/laps)  
3. Validate with the same Zod schema before write (self-check)  
4. Native save dialog → write UTF-8 file (suggested name `forza-lap-tracker-backup-YYYY-MM-DD.fltbackup.json`)

Implementation notes:

- Prefer Tauri `plugin-dialog` + `plugin-fs` (or a small Rust command) for save/open on desktop  
- Request only the permissions needed in capabilities

## Import flow

1. Settings → Import → open file dialog  
2. Read text → Zod validate (fail closed)  
3. Modal / confirm: **Replace** or **Merge**  
4. **Replace** requires explicit confirm (“This will erase current data”)  
5. Apply inside a **SQLite transaction**; rollback on error  

### Replace

- Delete all rows from `lap`, `car`, `circuit`, `manufacturer`, `setting` (order respecting FKs), **or** equivalent wipe that leaves schema intact  
- Insert all rows from backup (resolve FKs by inserted IDs)  
- Recompute / preserve `class` from `pi` on insert if safer than trusting file (prefer **recompute** `class` via `piToClass(pi)` and ignore file `class` for writes, while still validating class shape if present)  
- After commit: refresh UI; optionally re-run seed upsert if `seed_version` missing so builtins return — **locked preference:** after replace, set settings from backup; call existing seed upsert path if `seed_version` ≠ current so builtins refill without wiping user rows from backup

### Merge

- Upsert manufacturers by `name` (update `icon_path` only for non-builtin conflicts — prefer: if local builtin exists, keep local icon; if custom, update from backup)  
- Upsert cars by `(manufacturer_id, model)`  
- Upsert circuits by `name`  
- Insert laps only if no exact dedupe match on the content tuple  
- Settings: backup values overwrite matching keys; keys only on device remain  

## UI / i18n

Settings section “Backup” / “Copia de seguridad”:

- Export button  
- Import button  
- Success / error messages (ES + EN)  
- Replace vs Merge choice + Replace confirmation  

Default locale remains Spanish.

## Testing

- Unit: Zod accept fixtures + reject hand-edited invalid JSON (wrong format, bad PI, missing manufacturer, unknown schemaVersion)  
- Unit/integration: merge dedupe; replace empties then loads  
- Manual: export → import Replace on clean DB; export → import Merge with overlap  

## Non-goals

- Exporting/importing cached car images  
- Automatic cloud backup  
- Encrypted backups  
- Partial export filters (all-or-nothing for v1)  

## Risks

- Hand-edited JSON: mitigated by Zod + referential refine + transaction  
- Large histories: JSON size OK for personal lap counts; no streaming required for v1  
- Builtin vs custom on merge: keep natural-key upserts conservative (don’t delete builtins during merge)
