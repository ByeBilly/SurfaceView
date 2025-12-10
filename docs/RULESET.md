# RULESET.md — Multi-Agent Governance

## PURPOSE
Defines consistent processes for all AI agents participating in the repo.

## AGENTS
- Gemini: Feature builder / code generator
- Cursor: Local executor, fixer, debugger
- Bolt: CI automation, tests
- DeepSeek: Product Strategy & QA
- ChatGPT: Architect
- Human: Product Owner

## CORE RULES

### Rule 1 — Documentation Required
Every change MUST update appropriate docs (`PROJECT_OVERVIEW.md`, `SPEC.md`, etc.).

### Rule 2 — Ask ChatGPT if uncertain
No agent should guess architecture.

### Rule 3 — Git Branching Strategy
- `main` = Stable, production-ready.
- `dev` = Integration branch.
- `feature/<name>` = New features (Gemini).
- `fix/<name>` = Bug fixes (Cursor).

### Rule 4 — Continuity Logging
Agents MUST log decisions and context in `CONTINUITY.md` and `SESSION_HISTORY.md`.

### Rule 5 — Code Quality
- Strict TypeScript usage (no `any`).
- Async/Await for all DB and Vision operations.
- Comments explaining complex Vision algorithms.

### Rule 6 — User Feedback is Law
Prioritize items in `USER_FEEDBACK.md`.

### Rule 7 — Self-Correction
Agents must critique their own output via `REDTEAM.md` entries.