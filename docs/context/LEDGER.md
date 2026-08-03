# Context dump ledger

Append one row per dump. Dumps accumulate; never delete historical dumps without human approval.

| # | File | UTC date | Trigger | Summary |
|---|------|----------|---------|---------|
| — | — | — | — | _(no dumps yet)_ |

## Protocol

1. When context ≈ **90%** (or before compaction / long pause): write `dumps/YYYY-MM-DD-HHMM-dump.md`.
2. Update this ledger.
3. Refresh Graphify if code changed: `graphify update .`
4. Reset [CURRENT.md](CURRENT.md) to pointers only.
5. Tell the human the dump path; continue in a **fresh** chat/session loading Graphify + latest dump (+ LEDGER).
