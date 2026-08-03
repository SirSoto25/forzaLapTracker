# Graph Report - forzaLapTracker  (2026-08-03)

## Corpus Check
- 148 files · ~163,999 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1322 nodes · 1686 edges · 123 communities (105 shown, 18 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d3805a98`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compilerOptions
- tauri.conf.json
- devDependencies
- BM25
- Evaluation Test Scenarios
- default.json
- SQLite Database Expert
- compilerOptions
- Agentic Council — Orchestrator Map (RESTRICTED)
- What You Must Do When Invoked
- lib.rs
- design_system.py
- Handoff: [TASK_TITLE]
- Session Handoff Skill
- Appendix B - Canonical Sources (read these before reinventing)
- During the session
- DesignSystemGenerator
- Expected Behaviors by Scenario
- check_staleness.py
- SQLite Security Examples
- shadcn/ui
- SQLite Advanced Patterns
- File map (target)
- validate_handoff.py
- Commands
- UI/UX Pro Max - Design Intelligence
- React Composition Patterns
- _palette_is_dark
- _select_palette_for_mode
- list_handoffs.py
- Customization & Theming
- Forza Horizon 6 Lap Tracker — Design Spec
- setup_test_env.py
- Component Composition
- Styling & Customization
- Pre-Delivery Checklist (canonical — the only one)
- Quick Reference
- 4. DESIGN ENGINEERING DIRECTIVES (Bias Correction)
- create_handoff.py
- Tools
- Test Results: Opus 4.5 (Baseline)
- design_system.py
- React Composition Patterns
- 10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know)
- tasteskill: Anti-Slop Frontend Skill
- React Composition Patterns
- graphify reference: extra exports and benchmark
- Registry Authoring and Addresses
- Base vs Radix
- Chat & Messaging
- 9. AI TELLS (Forbidden Patterns)
- Forms & Inputs
- test_design_system_mode.py
- 11. REDESIGN PROTOCOL
- 3. DEFAULT ARCHITECTURE & CONVENTIONS
- 6. PERFORMANCE & ACCESSIBILITY GUARDRAILS
- Frontend Design
- Living project docs (template)
- api.ts
- Context continuity (Forza Lap Tracker)
- graphify reference: query, path, explain
- Sections
- 0. BRIEF INFERENCE (Read the Room Before Anything Else)
- 12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)
- 5. CONTEXT-AWARE PROACTIVITY
- 8. DARK MODE PROTOCOL
- Icons
- Web Interface Guidelines
- Implementer
- E2E / smoke author
- Unit test author
- session-start-context.js
- build_fh6_seed.py
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native AGENTS.md integration
- graphify reference: incremental update and cluster-only
- Pull request gate
- Pull request reviewer
- Code quality reviewer
- Verifier
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- extraction-spec.md
- architecture-avoid-boolean-props.md
- architecture-compound-components.md
- patterns-children-over-render-props.md
- patterns-explicit-variants.md
- react19-no-forwardref.md
- state-context-interface.md
- state-decouple-implementation.md
- state-lift-state.md
- _template.md
- ponytail/SKILL.md
- DUMP_TEMPLATE.md
- _generate_intelligent_overrides
- 1. THE THREE DIALS (Core Configuration)
- Agentic Council — Orchestrator Map (RESTRICTED)
- compare.ts
- client.test.ts
- api.test.ts
- rescrape_cars.py
- Project knowledge graph → **Graphify**
- Orchestrator
- LEDGER.md
- 7. DIAL DEFINITIONS (Technical Reference)
- Active context (scratch)
- Project skills catalog
- 3. Domain model
- File map
- detect_domain
- semver.ts
- 1. THE THREE DIALS (Core Configuration)
- validate_data.py
- updateCheck.ts

## God Nodes (most connected - your core abstractions)
1. `DesignSystemGenerator` - 29 edges
2. `t()` - 24 edges
3. `getDb()` - 21 edges
4. `BM25` - 17 edges
5. `compilerOptions` - 16 edges
6. `tasteskill: Anti-Slop Frontend Skill` - 16 edges
7. `search()` - 15 edges
8. `Appendix B - Canonical Sources (read these before reinventing)` - 15 edges
9. `Session Handoff Skill` - 13 edges
10. `Component Composition` - 13 edges

## Surprising Connections (you probably didn't know these)
- `TestPersistence` --uses--> `BM25`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_core.py → .agents/skills/ui-ux-pro-max/scripts/core.py
- `TestReasoningMatch` --uses--> `BM25`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_core.py → .agents/skills/ui-ux-pro-max/scripts/core.py
- `TestDomainDetection` --uses--> `DesignSystemGenerator`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_core.py → .agents/skills/ui-ux-pro-max/scripts/design_system.py
- `TestPersistence` --uses--> `DesignSystemGenerator`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_core.py → .agents/skills/ui-ux-pro-max/scripts/design_system.py
- `TestSearchDomains` --uses--> `DesignSystemGenerator`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_core.py → .agents/skills/ui-ux-pro-max/scripts/design_system.py

## Import Cycles
- None detected.

## Communities (123 total, 18 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.09
Nodes (22): DOM, DOM.Iterable, ES2020, src, compilerOptions, allowImportingTsExtensions, isolatedModules, jsx (+14 more)

### Community 1 - "tauri.conf.json"
Cohesion: 0.07
Nodes (27): $APPDATA/images/cars/**, $APPLOCALDATA/images/cars/**, icons/128x128@2x.png, icons/128x128.png, icons/32x32.png, icons/icon.icns, icons/icon.ico, app (+19 more)

### Community 2 - "devDependencies"
Cohesion: 0.05
Nodes (37): dependencies, react, react-dom, @tauri-apps/api, @tauri-apps/plugin-opener, @tauri-apps/plugin-sql, devDependencies, @tauri-apps/cli (+29 more)

### Community 3 - "BM25"
Cohesion: 0.06
Nodes (33): BM25, detect_domain(), _domain_keywords(), _get_bm25(), _load_csv(), _load_product_keywords(), _normalize(), Apply synonym substitution before tokenizing. (+25 more)

### Community 4 - "Evaluation Test Scenarios"
Cohesion: 0.04
Nodes (41): Evaluation Test Scenarios, Results Template, Scenario 1: Basic Handoff Creation, Scenario 2: Handoff with Chaining, Scenario 3: Resume from Handoff, Scenario 4: Proactive Handoff Suggestion, Scenario 5: Validation Flow, Scenario 6: Staleness Check (+33 more)

### Community 5 - "default.json"
Cohesion: 0.18
Nodes (10): core:default, main, opener:default, sql:allow-execute, sql:default, description, identifier, permissions (+2 more)

### Community 6 - "SQLite Database Expert"
Cohesion: 0.05
Nodes (39): 0. Mandatory Reading Protocol, 13. Pre-Implementation Checklist, 14. Summary, 1. Overview, 2.1 Security-First Database Operations, 2.2 Data Integrity Principles, 2. Core Responsibilities, 3.1 Version Recommendations (+31 more)

### Community 7 - "compilerOptions"
Cohesion: 0.22
Nodes (8): vite.config.ts, compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 9 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native AGENTS.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 11 - "design_system.py"
Cohesion: 0.18
Nodes (11): format_markdown(), format_master_md(), generate_design_system(), persist_design_system(), Format design system as markdown., Main entry point for design system generation.      Args:         query: Sear, Slugify a name into a single safe path segment.      Only [a-z0-9_-] survives;, Persist design system to design-system/<project>/ folder using Master + Override (+3 more)

### Community 16 - "Handoff: [TASK_TITLE]"
Cohesion: 0.08
Nodes (25): Active Processes, Architecture Overview, Assumptions Made, Blockers/Open Questions, Codebase Understanding, Context for Resuming Agent, Critical Files, Current State Summary (+17 more)

### Community 17 - "Session Handoff Skill"
Cohesion: 0.08
Nodes (24): Agent-Triggered (Proactive), Benefits, CREATE Mode, Creating a Handoff, Handoff Chaining, Handoff Document Structure, How It Works, Key Features (+16 more)

### Community 18 - "Appendix B - Canonical Sources (read these before reinventing)"
Cohesion: 0.09
Nodes (21): APPENDICES - Real Source-Backed Reference Material, Appendix A - Install Commands per Design System, Appendix B - Canonical Sources (read these before reinventing), Appendix C - Apple Liquid Glass: Honest Web Approximation, Apple Liquid Glass (Apple platforms only), Atlassian, Bootstrap, Carbon (+13 more)

### Community 19 - "During the session"
Cohesion: 0.09
Nodes (19): ADR Format, Numbering, Optional sections, Template, What qualifies, When to offer an ADR, CONTEXT.md Format, Rules (+11 more)

### Community 20 - "DesignSystemGenerator"
Cohesion: 0.17
Nodes (8): DesignSystemGenerator, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV., Find matching reasoning rule for a category., Apply reasoning rules to search results., TestReasoningMatch, The exact reproduction from issue #428., TestEndToEndCoherence

### Community 21 - "Expected Behaviors by Scenario"
Cohesion: 0.10
Nodes (21): Critical Failures (Any Model), Expected Behaviors by Scenario, For Haiku Optimization, For Opus Optimization, For Sonnet Optimization, Haiku (Fast, Lightweight), Minimum Pass Thresholds, Model Characteristics (+13 more)

### Community 22 - "check_staleness.py"
Cohesion: 0.16
Nodes (20): calculate_staleness_level(), check_files_exist(), check_staleness(), get_changed_files_since(), get_commits_since(), get_current_branch(), main(), parse_handoff_metadata() (+12 more)

### Community 23 - "SQLite Security Examples"
Cohesion: 0.10
Nodes (20): Audit Logging, Backup Security, Database File Security, Database Operation Logging, Dynamic Query Building with Whitelisting, Encrypted Backups, Error Handling, File Permissions & Security (+12 more)

### Community 24 - "shadcn/ui"
Cohesion: 0.11
Nodes (19): Chat & Messaging → [chat.md](./rules/chat.md), CLI, Component Docs, Examples, and Usage, Component Selection, Component Structure → [composition.md](./rules/composition.md), Critical Rules, Current Project Context, Detailed References (+11 more)

### Community 25 - "SQLite Advanced Patterns"
Cohesion: 0.11
Nodes (18): Advanced FTS5 Queries, Advanced Query Patterns, Common Table Expressions (CTEs), Complex FTS5 Setup, Connection Pooling, Database Migrations, FTS5 Maintenance, Full-Text Search (FTS5) Advanced (+10 more)

### Community 26 - "File map (target)"
Cohesion: 0.11
Nodes (18): File map (target), Forza Lap Tracker MVP — Implementation Plan, Global Constraints, Parallelism (orchestrator), Post-MVP (do not implement in this plan), Spec coverage check, Task 10: On-demand car image download, Task 11: E2E / desktop smoke (+10 more)

### Community 27 - "validate_handoff.py"
Cohesion: 0.16
Nodes (17): calculate_quality_score(), check_file_references(), check_recommended_sections(), check_required_sections(), check_todos(), main(), print_report(), Check if referenced files exist. (+9 more)

### Community 28 - "Commands"
Cohesion: 0.12
Nodes (17): `add` — Add components, `apply` — Apply a preset to an existing project, `build` — Build a custom registry, Commands, Contents, `diff` — Check for updates, `docs` — Get component documentation URLs, Dry-Run Mode (+9 more)

### Community 29 - "UI/UX Pro Max - Design Intelligence"
Cohesion: 0.12
Nodes (16): Before Delivering App UI, Example Workflow, If a search returns 0 results, Output Formats, Rule Categories by Priority, Running the search tool, Step 1: Analyze User Requirements, Step 2: Generate Design System (REQUIRED for new pages/projects) (+8 more)

### Community 30 - "React Composition Patterns"
Cohesion: 0.12
Nodes (16): 1.1 Avoid Boolean Prop Proliferation, 1.2 Use Compound Components, 1. Component Architecture, 2.1 Decouple State Management from UI, 2.2 Define Generic Context Interfaces for Dependency Injection, 2.3 Lift State into Provider Components, 2. State Management, 3.1 Create Explicit Component Variants (+8 more)

### Community 31 - "_palette_is_dark"
Cohesion: 0.27
Nodes (5): _palette_is_dark(), WCAG relative luminance of a #RRGGBB string, or None if unparseable., True when a colors.csv row's Background is a dark surface., _relative_luminance(), TestLuminance

### Community 32 - "_select_palette_for_mode"
Cohesion: 0.10
Nodes (19): Behavior, Decisions (locked), Design: GitHub Releases + in-app update notice, Failure behavior, File, Goal, Implementation sketch, Jobs / matrix (+11 more)

### Community 33 - "list_handoffs.py"
Cohesion: 0.24
Nodes (13): check_completion_status(), extract_title(), format_date(), list_handoffs(), main(), parse_date_from_filename(), datetime, Path (+5 more)

### Community 34 - "Customization & Theming"
Cohesion: 0.14
Nodes (14): 1. Built-in variants, 2. Tailwind classes via `className`, 3. Add a new variant, 4. Wrapper components, Adding Custom Colors, Border Radius, Changing the Theme, Checking for Updates (+6 more)

### Community 35 - "Forza Horizon 6 Lap Tracker — Design Spec"
Cohesion: 0.20
Nodes (10): 10. Open follow-ups (post-MVP, do not build now), 1. Product goal, 2. Non-goals (MVP), 4. Images, 5. Screens (MVP), 6. Architecture, 7. i18n, 8. Testing (product requirements) (+2 more)

### Community 36 - "setup_test_env.py"
Cohesion: 0.26
Nodes (12): clean_test_env(), create_sample_handoffs(), create_test_project(), init_git_repo(), main(), Path, Initialize git repo with commit history., Create sample handoff documents for testing. (+4 more)

### Community 37 - "Component Composition"
Cohesion: 0.15
Nodes (13): Avatar always needs AvatarFallback, Button has no isPending or isLoading prop, Callouts use Alert, Card structure, Choosing between overlay components, Component Composition, Contents, Dialog, Sheet, and Drawer always need a Title (+5 more)

### Community 38 - "Styling & Customization"
Cohesion: 0.15
Nodes (13): Built-in variants first, className for layout only, Contents, No manual dark: color overrides, No manual z-index on overlay components, No raw color values for status/state indicators, No space-x-* / space-y-*, Prefer size-* over w-* h-* when equal (+5 more)

### Community 39 - "Pre-Delivery Checklist (canonical — the only one)"
Cohesion: 0.15
Nodes (12): Accessibility, Common Rules for Professional UI + Pre-Delivery Checklist, Icons & Visual Elements, Interaction, Interaction (App), Layout, Layout & Spacing, Light/Dark Mode (+4 more)

### Community 40 - "Quick Reference"
Cohesion: 0.15
Nodes (12): 10. Charts & Data (LOW), 1. Accessibility (CRITICAL), 2. Touch & Interaction (CRITICAL), 3. Performance (HIGH), 4. Style Selection (HIGH), 5. Layout & Responsive (HIGH), 6. Typography & Color (MEDIUM), 7. Animation (MEDIUM) (+4 more)

### Community 41 - "4. DESIGN ENGINEERING DIRECTIVES (Bias Correction)"
Cohesion: 0.17
Nodes (12): 4.10 Quotes & Testimonials, 4.11 Page Theme Lock (Light / Dark Mode Consistency), 4.1 Typography, 4.2 Color Calibration, 4.3 Layout Diversification, 4.4 Materiality, Shadows, Cards, 4.5 Interactive UI States, 4.6 Data & Form Patterns (+4 more)

### Community 42 - "create_handoff.py"
Cohesion: 0.26
Nodes (11): find_previous_handoffs(), generate_handoff(), get_git_info(), get_previous_handoff_info(), main(), Get information about the previous handoff for chaining., Generate a handoff document with pre-filled metadata., Run a command and return (success, output). (+3 more)

### Community 43 - "Tools"
Cohesion: 0.17
Nodes (11): Configuring Registries, Setup, `shadcn:get_add_command_for_items`, `shadcn:get_audit_checklist`, `shadcn:get_item_examples_from_registries`, `shadcn:get_project_registries`, `shadcn:list_items_in_registries`, shadcn MCP Server (+3 more)

### Community 44 - "Test Results: Opus 4.5 (Baseline)"
Cohesion: 0.18
Nodes (10): Areas Working Well, Detailed Observations, How to Run Tests with Other Models, Potential Improvements Noted, Recommendations, Scenario Test Results, Script Verification Tests, Strengths (Opus) (+2 more)

### Community 45 - "design_system.py"
Cohesion: 0.27
Nodes (7): _query_wants_dark(), True when a styles.csv row describes itself as dark-first., True when the query explicitly asks for a dark theme., Resolve the mode the rest of the output has to agree with., _resolve_color_mode(), _style_is_dark_primary(), TestModeResolution

### Community 46 - "React Composition Patterns"
Cohesion: 0.18
Nodes (10): 1. Component Architecture (HIGH), 2. State Management (MEDIUM), 3. Implementation Patterns (MEDIUM), 4. React 19 APIs (MEDIUM), Full Compiled Document, How to Use, Quick Reference, React Composition Patterns (+2 more)

### Community 47 - "10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know)"
Cohesion: 0.20
Nodes (10): 10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know), Animation Library Choice, Cards & Containers, Galleries & Media, Hero Paradigms, Layout & Grids, Micro-Interactions & Effects, Navigation & Menus (+2 more)

### Community 48 - "tasteskill: Anti-Slop Frontend Skill"
Cohesion: 0.20
Nodes (10): 13. OUT OF SCOPE, 14. FINAL PRE-FLIGHT CHECK, 1.A Dial Inference (design read → dial values), 1.B Use-Case Presets, 1.C How the Dials Drive Output, 1. THE THREE DIALS (Core Configuration), 2.A When to reach for a real design system (use official packages), 2.B When the brief is an aesthetic, not a system (+2 more)

### Community 49 - "React Composition Patterns"
Cohesion: 0.20
Nodes (9): Component Architecture (CRITICAL), Core Principles, Creating a New Rule, Impact Levels, Implementation Patterns (MEDIUM), React Composition Patterns, Rules, State Management (HIGH) (+1 more)

### Community 50 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 52 - "Registry Authoring and Addresses"
Cohesion: 0.22
Nodes (9): Address Schemes, Build and Verify, GitHub Registries, Include, Item Definitions, Mental Model, Registry Authoring and Addresses, Registry Dependencies (+1 more)

### Community 53 - "Base vs Radix"
Cohesion: 0.22
Nodes (9): Accordion, Base vs Radix, Button / trigger as non-button element (base only), Composition: asChild (radix) vs render (base), Contents, Select, Select — multiple selection and object values (base only), Slider (+1 more)

### Community 54 - "Chat & Messaging"
Cohesion: 0.22
Nodes (9): Attachments use Attachment, Chat & Messaging, Contents, Escape hatch: the scroller hooks, Message rows use Message, Message surfaces use Bubble, Scrollable threads use MessageScroller, Streaming, anchoring, and jump-to-latest are built in (+1 more)

### Community 55 - "9. AI TELLS (Forbidden Patterns)"
Cohesion: 0.25
Nodes (8): 9.A Visual & CSS, 9. AI TELLS (Forbidden Patterns), 9.B Typography, 9.C Layout & Spacing, 9.D Content & Data ("Jane Doe" Effect), 9.E External Resources & Components, 9.F Production-Test Tells (banned outright), 9.G EM-DASH BAN (the single most-violated Tell)

### Community 56 - "Forms & Inputs"
Cohesion: 0.25
Nodes (8): Buttons inside inputs use InputGroup + InputGroupAddon, Contents, Field validation and disabled states, FieldSet + FieldLegend for grouping related fields, Forms & Inputs, Forms use FieldGroup + Field, InputGroup requires InputGroupInput/InputGroupTextarea, Option sets (2–7 choices) use ToggleGroup

### Community 57 - "test_design_system_mode.py"
Cohesion: 0.43
Nodes (3): _filter_anti_patterns_for_mode(), Drop "avoid dark mode" advice once dark mode is the resolved answer., TestAntiPatternGating

### Community 58 - "11. REDESIGN PROTOCOL"
Cohesion: 0.29
Nodes (7): 11.A Detect the Mode (first action), 11.B Audit Before Touching, 11.C Preservation Rules, 11.D Modernisation Levers (priority order), 11.E Decision Tree: Targeted Evolution vs Full Redesign, 11.F What Never Changes Silently, 11. REDESIGN PROTOCOL

### Community 59 - "3. DEFAULT ARCHITECTURE & CONVENTIONS"
Cohesion: 0.29
Nodes (7): 3.A Stack, 3.B State, 3.C Icons, 3.D Emoji Policy, 3. DEFAULT ARCHITECTURE & CONVENTIONS, 3.E Responsiveness & Layout Mechanics, 3.F Dependency Verification (mandatory)

### Community 60 - "6. PERFORMANCE & ACCESSIBILITY GUARDRAILS"
Cohesion: 0.29
Nodes (7): 6.A Hardware Acceleration, 6.B Reduced Motion (mandatory), 6.C Dark Mode (mandatory for any consumer-facing page), 6.D Core Web Vitals Targets, 6.E DOM Cost, 6.F Z-Index Restraint, 6. PERFORMANCE & ACCESSIBILITY GUARDRAILS

### Community 61 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground it in the subject, More on writing in design, Process: brainstorm, explore, plan, critique, build, critique again, Restraint and self-critique

### Community 62 - "Living project docs (template)"
Cohesion: 0.29
Nodes (6): ADR shape, Layout, Living project docs (template), Project specialization, Rules of thumb, When to write

### Community 63 - "api.ts"
Cohesion: 0.06
Nodes (79): App(), BootState, Route, routes, CarPicker(), CarPickerProps, TimeInput(), TimeInputProps (+71 more)

### Community 64 - "Context continuity (Forza Lap Tracker)"
Cohesion: 0.29
Nodes (6): After code / docs / architecture changes, Artifacts, Context ≈ 90% (mandatory dump), Context continuity (Forza Lap Tracker), Rules, Session start

### Community 65 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 66 - "Sections"
Cohesion: 0.33
Nodes (5): 1. Component Architecture (architecture), 2. State Management (state), 3. Implementation Patterns (patterns), 4. React 19 APIs (react19), Sections

### Community 67 - "0. BRIEF INFERENCE (Read the Room Before Anything Else)"
Cohesion: 0.40
Nodes (5): 0.A Read these signals first, 0.B Output a one-line "Design Read" before generating, 0. BRIEF INFERENCE (Read the Room Before Anything Else), 0.C If the brief is ambiguous, ask one question, do not guess, 0.D Anti-Default Discipline

### Community 68 - "12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)"
Cohesion: 0.40
Nodes (5): 12.A File Location, 12.B Required Frontmatter, 12.C Required Body Sections, 12.D Block-Library Discipline, 12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)

### Community 69 - "5. CONTEXT-AWARE PROACTIVITY"
Cohesion: 0.40
Nodes (5): 5.A Sticky-Stack - Canonical Skeleton, 5.B Horizontal-Pan - Canonical Skeleton, 5.C Scroll-Reveal Stagger - Canonical Skeleton (lighter alternative), 5. CONTEXT-AWARE PROACTIVITY, 5.D Forbidden Animation Patterns

### Community 70 - "8. DARK MODE PROTOCOL"
Cohesion: 0.40
Nodes (5): 8.A Token Strategy (pick one, stick to it), 8.B Do Not Prescribe Specific Colors Here, 8.C Default Mode, 8.D Test in Both Modes Before Finishing, 8. DARK MODE PROTOCOL

### Community 71 - "Icons"
Cohesion: 0.40
Nodes (4): Icons, Icons in Button use data-icon attribute, No sizing classes on icons inside components, Pass icons as component objects, not string keys

### Community 72 - "Web Interface Guidelines"
Cohesion: 0.40
Nodes (4): Guidelines Source, How It Works, Usage, Web Interface Guidelines

### Community 73 - "Implementer"
Cohesion: 0.40
Nodes (4): Implementer, Mandatory constraints, Out of scope unless packet says so, Workflow

### Community 74 - "E2E / smoke author"
Cohesion: 0.40
Nodes (4): E2E / smoke author, Mandatory constraints, Out of scope, Workflow

### Community 75 - "Unit test author"
Cohesion: 0.40
Nodes (4): Mandatory constraints, Out of scope, Unit test author, Workflow

### Community 76 - "session-start-context.js"
Cohesion: 0.50
Nodes (4): exists(), fs, main(), path

### Community 77 - "build_fh6_seed.py"
Cohesion: 0.36
Nodes (9): download_logo(), fetch(), fetch_text(), main(), parse_make_cars(), Extract car models from forzagarage make page (JSON-LD + /cars/ links)., Download webp logo; fallback to generated SVG. Returns public-relative path., slugify() (+1 more)

### Community 78 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 79 - "graphify reference: commit hook and native AGENTS.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native AGENTS.md integration, graphify reference: commit hook and native AGENTS.md integration

### Community 80 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 81 - "Pull request gate"
Cohesion: 0.50
Nodes (3): Mandatory constraints, Output format, Pull request gate

### Community 82 - "Pull request reviewer"
Cohesion: 0.50
Nodes (3): Mandatory constraints, Output format, Pull request reviewer

### Community 83 - "Code quality reviewer"
Cohesion: 0.50
Nodes (3): Code quality reviewer, Mandatory constraints, Output format

### Community 84 - "Verifier"
Cohesion: 0.50
Nodes (3): Mandatory constraints, Output format, Verifier

### Community 100 - "_generate_intelligent_overrides"
Cohesion: 0.29
Nodes (6): Automated smoke (run on any host), Deferred, Host limitation (this CI/agent host), Manual checklist, MVP smoke checklist, Prerequisites

### Community 101 - "1. THE THREE DIALS (Core Configuration)"
Cohesion: 0.38
Nodes (11): AppHandle, Option, PathBuf, Result, cars_dir(), ensure_car_image(), ensure_car_image_inner(), find_cached() (+3 more)

### Community 102 - "Agentic Council — Orchestrator Map (RESTRICTED)"
Cohesion: 0.25
Nodes (8): Agentic Council — Orchestrator Map (RESTRICTED), Failure handling, Isolation law, Parallel waves (typical feature), Ponytail + skill catalog, Roster (orchestrator only), Sealed task packet template, What workers must never receive

### Community 103 - "compare.ts"
Cohesion: 0.25
Nodes (8): Agent council, Continuity, Development, Forza Lap Tracker, Releases, Skills, Specs, Status

### Community 107 - "rescrape_cars.py"
Cohesion: 0.70
Nodes (4): fetch_text(), main(), parse_make_cars(), title_from_slug()

### Community 108 - "Project knowledge graph → **Graphify**"
Cohesion: 0.33
Nodes (6): Commands, Legacy, Outputs (source of truth), Project knowledge graph → **Graphify**, Session habit, Skill / rule

### Community 109 - "Orchestrator"
Cohesion: 0.40
Nodes (4): Orchestrator, Outputs to human, Packet template, Rules

### Community 110 - "LEDGER.md"
Cohesion: 0.40
Nodes (3): Dumps directory, Context dump ledger, Protocol

### Community 111 - "7. DIAL DEFINITIONS (Technical Reference)"
Cohesion: 0.25
Nodes (8): ansi_ljust(), format_ascii_box(), hex_to_ansi(), Convert hex color to ANSI True Color swatch (██) with fallback., Like str.ljust but accounts for zero-width ANSI escape sequences., Create a Unicode section separator: ├─── NAME ───...┤, Format design system as Unicode box with ANSI color swatches., section_header()

### Community 112 - "Active context (scratch)"
Cohesion: 0.50
Nodes (4): Active context (scratch), Do not store here, In flight (session), Resume pointers

### Community 113 - "Project skills catalog"
Cohesion: 0.50
Nodes (4): Continuity, Not installed, Packet hints (orchestrator only), Project skills catalog

### Community 114 - "3. Domain model"
Cohesion: 0.50
Nodes (4): 3.1 PI → class, 3.2 Lap time, 3.3 Catalog, 3. Domain model

### Community 115 - "File map"
Cohesion: 0.14
Nodes (13): File map, GitHub Releases + In-App Update Notice Implementation Plan, Global Constraints, Placeholder / consistency self-review, Spec coverage checklist, Task 1: Semver helpers (TDD), Task 2: GitHub latest-release check (TDD), Task 3: Tauri CSP + opener allowlist for GitHub (+5 more)

### Community 116 - "detect_domain"
Cohesion: 0.43
Nodes (3): Pick the highest-ranked palette matching the resolved mode.      Only the dark, _select_palette_for_mode(), TestPaletteSelection

### Community 117 - "semver.ts"
Cohesion: 0.20
Nodes (6): Execute searches across multiple domains., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation.          variance/motion/densi, Bucket a 1-10 dial value into its tier config. Returns None if value is None., _resolve_dial()

### Community 118 - "1. THE THREE DIALS (Core Configuration)"
Cohesion: 0.33
Nodes (6): _detect_page_type(), format_page_override_md(), _generate_intelligent_overrides(), Format a page-specific override file with intelligent AI-generated content., Generate intelligent overrides based on page type using layered search., Detect page type from context and search results.

### Community 119 - "validate_data.py"
Cohesion: 0.50
Nodes (4): 7. DIAL DEFINITIONS (Technical Reference), DESIGN_VARIANCE (Level 1-10), MOTION_INTENSITY (Level 1-10), VISUAL_DENSITY (Level 1-10)

### Community 122 - "updateCheck.ts"
Cohesion: 0.31
Nodes (8): githubReleasesLatestApiUrl(), compareSemver(), parseSemver(), Semver, checkForAppUpdate(), fetchLatestRelease(), shouldNotifyUpdate(), UpdateCheckResult

## Knowledge Gaps
- **702 isolated node(s):** `fs`, `path`, `name`, `private`, `version` (+697 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `tasteskill: Anti-Slop Frontend Skill` connect `tasteskill: Anti-Slop Frontend Skill` to `0. BRIEF INFERENCE (Read the Room Before Anything Else)`, `12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)`, `5. CONTEXT-AWARE PROACTIVITY`, `8. DARK MODE PROTOCOL`, `4. DESIGN ENGINEERING DIRECTIVES (Bias Correction)`, `10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know)`, `Appendix B - Canonical Sources (read these before reinventing)`, `9. AI TELLS (Forbidden Patterns)`, `validate_data.py`, `11. REDESIGN PROTOCOL`, `3. DEFAULT ARCHITECTURE & CONVENTIONS`, `6. PERFORMANCE & ACCESSIBILITY GUARDRAILS`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `DesignSystemGenerator` connect `DesignSystemGenerator` to `BM25`, `design_system.py`, `design_system.py`, `detect_domain`, `semver.ts`, `test_design_system_mode.py`, `_palette_is_dark`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `DesignSystemGenerator` (e.g. with `TestDomainDetection` and `TestPersistence`) actually correct?**
  _`DesignSystemGenerator` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `BM25` (e.g. with `TestDomainDetection` and `TestPersistence`) actually correct?**
  _`BM25` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `fs`, `path`, `name` to the rest of the system?**
  _702 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `tauri.conf.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._