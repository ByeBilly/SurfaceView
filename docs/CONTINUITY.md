# CONTINUITY.md — Mandatory Multi-Agent Continuity Standard

This document defines the **Universal Continuity Requirement** for this project.

It is a **priority document** that MUST be read and respected by **all agents**:
- ChatGPT (Architect & Orchestrator)
- DeepSeek (Creative Strategist, PM, Red-Team Analyst)
- Gemini (Feature Generator, Code Writer)
- Cursor (Local Executor, Integrator, Debugger)
- Bolt (CI, Automation, Validation)
- Human (Product Owner)

## 1. Universal Continuity Requirement

All agents must help maintain long-term continuity across all repositories.

Agents MUST record information that future agents will need, including:
- Communications intended for future sessions.
- Context that would otherwise be lost between builds.
- Architectural decisions, reasoning, and constraints.
- Notes about potential ambiguity or risk.

## 2. Start-of-Session Ritual

Before performing work, every agent must:
1. Read `docs/PROJECT_OVERVIEW.md` to get the current context.
2. Read `docs/PENDING_ITEMS.md` to understand priorities.
3. Check `docs/USER_FEEDBACK.md` for new constraints.
4. Review `docs/NOTES_CHATGPT.md` for architectural direction.

## 3. End-of-Session Handover

At the end of a session, agents must:
1. Update `docs/PROJECT_OVERVIEW.md` with the latest changes.
2. Log the session in `docs/SESSION_HISTORY.md`.
3. Update `docs/PENDING_ITEMS.md` (mark done, add new).
4. (Optional) Leave specific notes in `docs/NOTES_CHATGPT.md`.

## 4. Cross-Agent Communication Rules

- **Do not guess**: If intent is unclear, check `docs/SPEC.md` or `docs/NOTES_CHATGPT.md`.
- **Reference by name**: "Gemini implemented X", "Bolt detected Y".
- **Critique constructively**: Use `docs/REDTEAM.md` for risks and flaws.

## 5. Conflict Resolution

If agents disagree on architecture or implementation:
1. **Spec is King**: `docs/SPEC.md` overrides code.
2. **User is Emperor**: `docs/USER_FEEDBACK.md` overrides Spec.
3. **ChatGPT is Judge**: `docs/NOTES_CHATGPT.md` holds the tie-breaking architectural decision.

## 6. Priority Levels

- **🔴 Critical**: System broken, data loss, or blocking feature.
- **🟡 High**: Core feature missing or significant UX flaw.
- **🟢 Medium**: Enhancement, refactor, or nice-to-have.
- **🔵 Low**: Documentation, polish, or future tech debt.

## 7. Emergency Recovery Procedure

If the build is broken or state is lost:
1. Revert to `main` branch immediately.
2. Check `docs/SESSION_HISTORY.md` to identify the breaking change.
3. Consult `docs/REDTEAM.md` for known risks associated with recent changes.

## 8. Verification & Audit

Bolt (CI Agent) is responsible for verifying that:
- Docs are updated.
- Tests pass.
- Code style is consistent.