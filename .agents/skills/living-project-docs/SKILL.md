---
name: living-project-docs
description: Template for keeping architecture decisions (ADRs) and living context notes in Markdown throughout development. Use when a project requires docs/decisions and docs/context updates after product or architecture choices, or when ending a work session with durable notes.
---

# Living project docs (template)

## Layout

```
docs/
├── README.md                 # map
├── decisions/                # ADRs NNN-title.md
├── context/                  # living product/session notes
└── superpowers/
    ├── specs/                # design specs
    └── plans/                # implementation plans
```

## When to write

| Event | Action |
|-------|--------|
| Architecture or product decision | New ADR in `decisions/` |
| Scope/status change | Update or add file in `context/` |
| Formal design locked | Spec under `superpowers/specs/` |
| Ready to build | Plan under `superpowers/plans/` |

## ADR shape

- Context → Decision → Alternatives → Consequences
- Status: `accepted` | `superseded` | `rejected`
- Index row in `decisions/README.md`

## Rules of thumb

- Prefer updating context over endless new files for the same topic
- Do not duplicate ADRs inside context notes — link them
- Do not close a milestone that changed decisions without a docs update

## Project specialization

Point to concrete paths and naming in a project skill (e.g. `listae-docs-sync`).
