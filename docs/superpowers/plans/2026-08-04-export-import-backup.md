# Export / Import Backup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export and import app data as a Zod-validated `.fltbackup.json` from Settings, with Replace or Merge import modes and fail-closed validation.

**Architecture:** Pure Zod schema + parse helpers; API layer builds/applies backups inside SQLite transactions; Settings UI uses Tauri dialog + fs plugins for save/open. Natural keys only (no raw SQLite ids in the file).

**Tech Stack:** Zod, Tauri 2 (`plugin-dialog`, `plugin-fs`), React Settings, Vitest, existing `@tauri-apps/plugin-sql`.

## Global Constraints

- Payload: manufacturers, cars, circuits, laps, settings only — **no** image cache / `image_path`.
- Format: `"forza-lap-tracker-backup"`, `schemaVersion: 1`, file suggestion `*.fltbackup.json`.
- Import modes: user chooses **Replace** or **Merge**; Replace needs explicit confirm.
- Zod validates **before** any DB write; referential integrity in schema refine; root `.strict()`.
- On apply: recompute `class` via `piToClass(pi)` (do not trust file class for writes).
- Transactions + rollback on apply failure.
- i18n ES + EN; default locale Spanish.
- TDD for schema + apply helpers; `npm test` after logic tasks.
- No cloud sync, encryption, or partial export filters.

## File map

| File | Responsibility |
| --- | --- |
| `src/lib/backup/schema.ts` | Zod schemas + `parseBackupJson` |
| `src/lib/backup/schema.test.ts` | Accept/reject fixtures |
| `src/lib/backup/buildBackup.ts` | DB → backup object |
| `src/lib/backup/applyBackup.ts` | Replace / Merge apply |
| `src/lib/backup/applyBackup.test.ts` | Apply logic with mocked db |
| `src/lib/backup/types.ts` | Shared TS types inferred from Zod |
| `src/lib/api.ts` | `exportBackupToFile` / `importBackupFromFile` orchestration (or thin wrappers) |
| `src/pages/SettingsPage.tsx` | Backup UI section |
| `src/i18n/es.json` / `en.json` | Strings |
| `src/App.css` | Minimal backup section styles if needed |
| `package.json` | Add `zod`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs` |
| `src-tauri/Cargo.toml` / `lib.rs` / `capabilities/default.json` | Register dialog + fs plugins + permissions |

---

### Task 1: Add dependencies (zod, dialog, fs)

**Files:**
- Modify: `package.json` / lockfile via npm
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/capabilities/default.json`

**Interfaces:**
- Produces: `zod` importable; `open`/`save` from `@tauri-apps/plugin-dialog`; read/write text via `@tauri-apps/plugin-fs`

- [ ] **Step 1: Install npm packages**

```bash
npm install zod @tauri-apps/plugin-dialog @tauri-apps/plugin-fs
```

- [ ] **Step 2: Add Rust crates and init plugins**

In `Cargo.toml` dependencies:

```toml
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
```

In `lib.rs` after opener:

```rust
.plugin(tauri_plugin_dialog::init())
.plugin(tauri_plugin_fs::init())
```

- [ ] **Step 3: Capabilities**

Extend `capabilities/default.json` permissions with dialog defaults and fs scope sufficient to read/write user-selected paths (follow Tauri 2 docs for `dialog:default` and `fs:allow-read-file` / `fs:allow-write-file` with dialog-picked files — use official `dialog` + `fs` permission sets that allow user-selected paths).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/src/lib.rs src-tauri/capabilities/default.json
git commit -m "chore: add zod and Tauri dialog/fs plugins for backup"
```

---

### Task 2: Zod backup schema (TDD)

**Files:**
- Create: `src/lib/backup/schema.ts`
- Create: `src/lib/backup/schema.test.ts`
- Create: `src/lib/backup/types.ts` (re-export `z.infer` types)

**Interfaces:**
- Produces:
  - `BACKUP_FORMAT = "forza-lap-tracker-backup"`
  - `backupFileSchema` (Zod)
  - `parseBackupJson(text: string): { ok: true; data: BackupFileV1 } | { ok: false; message: string }`
  - Type `BackupFileV1`

- [ ] **Step 1: Write failing tests** covering:
  - Valid minimal fixture parses
  - Wrong `format` rejected
  - `schemaVersion: 2` rejected
  - PI 1000 rejected
  - Lap referencing missing circuit rejected
  - Car referencing missing manufacturer rejected
  - Invalid JSON rejected
  - Extra top-level key rejected (`.strict()`)

- [ ] **Step 2: Run tests — expect FAIL**

`npm test -- src/lib/backup/schema.test.ts`

- [ ] **Step 3: Implement schema**

Use Zod 3/4 APIs available from installed package. Structure:

```ts
import { z } from "zod";
import type { CarClass } from "../../domain/piClass";

const carClassSchema = z.enum(["D", "C", "B", "A", "S1", "S2", "R", "X"]);

export const BACKUP_FORMAT = "forza-lap-tracker-backup" as const;

const manufacturerSchema = z.object({
  name: z.string().trim().min(1),
  icon_path: z.string().min(1),
  is_builtin: z.union([z.literal(0), z.literal(1)]),
});

const carSchema = z.object({
  manufacturer_name: z.string().trim().min(1),
  model: z.string().trim().min(1),
  is_builtin: z.union([z.literal(0), z.literal(1)]),
  image_url: z.string().nullable(),
});

const circuitSchema = z.object({
  name: z.string().trim().min(1),
  is_builtin: z.union([z.literal(0), z.literal(1)]),
});

const lapSchema = z.object({
  circuit_name: z.string().trim().min(1),
  manufacturer_name: z.string().trim().min(1),
  car_model: z.string().trim().min(1),
  pi: z.number().int().min(0).max(999),
  class: carClassSchema,
  time_ms: z.number().int().min(0),
  notes: z.string().nullable(),
  recorded_at: z.string().min(1),
});

const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

const dataSchema = z.object({
  manufacturers: z.array(manufacturerSchema),
  cars: z.array(carSchema),
  circuits: z.array(circuitSchema),
  laps: z.array(lapSchema),
  settings: z.array(settingSchema),
});

export const backupFileSchema = z
  .object({
    format: z.literal(BACKUP_FORMAT),
    schemaVersion: z.literal(1),
    exportedAt: z.string().min(1),
    appVersion: z.string().min(1),
    data: dataSchema,
  })
  .strict()
  .superRefine((file, ctx) => {
    const mfg = new Set(file.data.manufacturers.map((m) => m.name));
    for (const [i, car] of file.data.cars.entries()) {
      if (!mfg.has(car.manufacturer_name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `cars[${i}] unknown manufacturer`,
          path: ["data", "cars", i, "manufacturer_name"],
        });
      }
    }
    const carKeys = new Set(
      file.data.cars.map((c) => `${c.manufacturer_name}::${c.model}`),
    );
    const circuits = new Set(file.data.circuits.map((c) => c.name));
    for (const [i, lap] of file.data.laps.entries()) {
      if (!circuits.has(lap.circuit_name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `laps[${i}] unknown circuit`,
          path: ["data", "laps", i, "circuit_name"],
        });
      }
      const ck = `${lap.manufacturer_name}::${lap.car_model}`;
      if (!carKeys.has(ck)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `laps[${i}] unknown car`,
          path: ["data", "laps", i, "car_model"],
        });
      }
    }
  });

export type BackupFileV1 = z.infer<typeof backupFileSchema>;

export function parseBackupJson(
  text: string,
): { ok: true; data: BackupFileV1 } | { ok: false; message: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, message: "invalid_json" };
  }
  const parsed = backupFileSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      message: first ? `${first.path.join(".")}: ${first.message}` : "invalid_schema",
    };
  }
  return { ok: true, data: parsed.data };
}
```

- [ ] **Step 4: Tests PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add Zod schema for fltbackup JSON validation"
```

---

### Task 3: Build backup from DB

**Files:**
- Create: `src/lib/backup/buildBackup.ts`
- Create: `src/lib/backup/buildBackup.test.ts` (mock select rows)

**Interfaces:**
- Consumes: DB-like `{ select: ... }` or row arrays
- Produces: `buildBackupPayload(rows, appVersion: string): BackupFileV1` then validate with schema before return

- [ ] **Step 1–4: TDD** — given manufacturer/car/circuit/lap/setting row fixtures, output matches schema; omits `image_path`; uses natural keys.

Implementation sketch: map SQL join results into the JSON shape; set `exportedAt` to `new Date().toISOString()`; `format` + `schemaVersion: 1`; run `backupFileSchema.parse` before return (throw if internal bug).

- [ ] **Step 5: Commit** `feat: build portable backup payload from DB rows`

---

### Task 4: Apply backup (replace + merge) with transaction

**Files:**
- Create: `src/lib/backup/applyBackup.ts`
- Create: `src/lib/backup/applyBackup.test.ts`
- Possibly extend `src/lib/api.ts` with `wipeUserData` helpers used only by apply

**Interfaces:**
- `applyBackup(db, backup: BackupFileV1, mode: "replace" | "merge"): Promise<void>`
- Uses `piToClass` for lap class on write
- Merge lap dedupe key: `(circuit_name, manufacturer_name, car_model, pi, time_ms, recorded_at)`

- [ ] **Step 1: Failing tests** for replace (empty then insert) and merge (skip duplicate lap; upsert manufacturer by name) using an in-memory fake db or vi.mocked execute/select sequence.

If mocking SQL plugin is too heavy, extract pure “plan” functions:
- `planReplace(backup)` / `planMerge(backup, existingSnapshots)` returning ordered operations — test those; thin `applyBackup` executes ops.

**Prefer testable pure planning + thin executor** if `plugin-sql` is awkward to mock.

- [ ] **Step 2–4: Implement** Replace (delete laps→cars→circuits→manufacturers→settings in FK-safe order, then insert) and Merge (upsert by natural keys; insert missing laps only).

After replace: insert settings from backup; caller may invoke seed upsert afterward (Task 5).

- [ ] **Step 5: Commit** `feat: apply backup replace and merge modes`

---

### Task 5: API + file I/O wiring

**Files:**
- Modify: `src/lib/api.ts` (or `src/lib/backup/io.ts` + api exports)
- Modify: `src/db/client.ts` only if need `export async function runSeedUpsert()` public for post-replace

**Interfaces:**
- `exportBackup(): Promise<"saved" | "cancelled">` — getVersion, select all, build, validate, save dialog, writeTextFile
- `importBackup(mode: "replace" | "merge"): Promise<"imported" | "cancelled" | { error: string }>` — open dialog, read, parseBackupJson, apply, on replace call seed upsert if needed

Use:

```ts
import { save, open } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { getVersion } from "@tauri-apps/api/app";
```

Filters: `[{ name: "Forza Lap Tracker Backup", extensions: ["fltbackup.json", "json"] }]`

- [ ] **Step 1: Implement + smoke unit tests for parse path errors**

- [ ] **Step 2: Commit** `feat: wire backup export and import file dialogs`

---

### Task 6: Settings UI

**Files:**
- Modify: `src/pages/SettingsPage.tsx`
- Modify: `src/i18n/es.json`, `src/i18n/en.json`
- Modify: `src/App.css` if needed

**UI:**
- Section title backup
- Export button
- Import button → then mode choice (two buttons or confirm dialog): Replace (with `window.confirm`) / Merge
- Status line success/error

i18n keys (exact):

```
backup.title
backup.export
backup.import
backup.replace
backup.merge
backup.replaceConfirm
backup.exported
backup.imported
backup.cancelled
backup.errorInvalid
backup.errorApply
```

- [ ] **Step 1: Implement UI**

- [ ] **Step 2: `npm test` + `npx tsc --noEmit`**

- [ ] **Step 3: Commit** `feat: add backup export/import controls in settings`

---

### Task 7: Docs + graphify + verify

**Files:**
- Modify: `README.md` short Backup note under Development/Releases
- graphify update if tracked

- [ ] **Step 1: README** — export/import from Settings; Zod-validated; Replace vs Merge; no images

- [ ] **Step 2: `npm test` && `npx tsc --noEmit` && `graphify update .`**

- [ ] **Step 3: Commit** docs/graphify as needed

---

## Spec coverage

| Spec item | Task |
| --- | --- |
| JSON v1 + natural keys | 2–3 |
| Zod strict + referential | 2 |
| Export save dialog | 5–6 |
| Import Replace/Merge + confirm | 4–6 |
| Fail closed | 2, 5 |
| Transactional apply | 4 |
| piToClass on write | 4 |
| Settings UI + i18n | 6 |
| No images | 3 |
| README | 7 |

## Post-implementation gate (controller)

After Task 7: final whole-branch review. If Ready, push branch and open PR, then run **flt-pr-review** + **flt-pr-gate** with checklist:

- [ ] Zod fail-closed before DB writes
- [ ] Replace + Merge implemented
- [ ] No image_path in export
- [ ] Tests for schema accept/reject
- [ ] Settings UI + i18n
- [ ] `npm test` green

Only treat work as done if gate **APPROVE**. If **DENY**, fix and re-gate.
