---
name: context-continuity
description: >
  Keep Graphify graph current and dump session context at ~90% usage so nothing
  is lost across compaction. Use at session start, after substantial code
  changes, when nearing context limits, before compaction, or when the user
  says dump context / update graph / handoff.
---

# Context continuity (Forza Lap Tracker)

## Artifacts

| Path | Role |
|------|------|
| `graphify-out/` | **Living knowledge graph** (Graphify) — primary code/docs map |
| `docs/graph/PROJECT_GRAPH.md` | Pointer + commands for Graphify |
| `docs/context/CURRENT.md` | Short in-flight scratch |
| `docs/context/dumps/*.md` | Accumulated dumps (never overwrite old ones) |
| `docs/context/LEDGER.md` | Index of dumps |
| `docs/context/DUMP_TEMPLATE.md` | Dump shape |

Skills: `graphify`, `session-handoff`, `handoff`. Durable dumps always go to `docs/context/dumps/`.

## Session start

1. Prefer `graphify query` / read `graphify-out/GRAPH_REPORT.md` if present.
2. Read `docs/context/LEDGER.md` → latest dump.
3. Read `docs/context/CURRENT.md`.

## After code / docs / architecture changes

```bash
graphify update .
```

(Or `/graphify --update` in the assistant.) Do **not** maintain a parallel Mermaid inventory by hand.

## Context ≈ 90% (mandatory dump)

Triggers: compaction warning, `preCompact` hook, huge thread, user says dump/handoff.

1. Write `docs/context/dumps/YYYY-MM-DD-HHMM-dump.md` (template).
2. Note graph tip: last `graphify update` time / whether `graph.json` is fresh.
3. Append row to `LEDGER.md`.
4. Reset `CURRENT.md` (Latest dump → new file).
5. Tell user to open a **fresh chat** with graphify + latest dump.
6. Stop heavy work in this chat.

## Rules

- Accumulate dumps; never delete prior dumps without human approval.
- Reference specs/ADRs by path; do not paste them into dumps.
- Redact secrets.
- Graphify is the project graph; context dumps are the session ledger.
