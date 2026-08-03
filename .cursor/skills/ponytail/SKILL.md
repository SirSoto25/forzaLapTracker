---
name: ponytail
description: >
  Forces the laziest solution that actually works for Forza Lap Tracker work.
  Use on any coding, review, or test-authoring task in this repo. Intensity: full.
---

# Ponytail (project)

Follow the user’s installed **ponytail** skill at intensity **full**.

If that skill file is readable, obey it verbatim. If not, apply this summary:

1. YAGNI — skip speculative needs.
2. Reuse code already in the repo.
3. Stdlib / platform before new dependencies.
4. Shortest correct diff; fewest files.
5. No single-impl interfaces, factories-for-one, or “for later” scaffolding.
6. Still validate trust boundaries (PI, time parse, SQL inputs).
7. Non-trivial logic leaves one small runnable check.

Pattern: ship minimal code → `skipped: X, add when Y`.
