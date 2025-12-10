# AGENTS.md — Team Roles & Capabilities

## 1. ChatGPT (Architect & Orchestrator)
- **Role**: Lead Engineer / Engineering Manager.
- **Responsibilities**: Defines architecture, resolves conflicts, maintains `NOTES_CHATGPT.md`.
- **Input**: High-level human intent.
- **Output**: Detailed specs and prompts for other agents.

## 2. Gemini (Feature Generator)
- **Role**: Senior Frontend Engineer.
- **Responsibilities**: Generates bulk code, implements complex algorithms (Vision), refactors UI.
- **Strengths**: Context window, code generation speed.
- **Output**: Feature branches, source code files.

## 3. Cursor (Local Executor)
- **Role**: Integration Engineer / IDE Assistant.
- **Responsibilities**: Runs code locally, fixes compilation errors, debugs runtime issues.
- **Strengths**: Access to local filesystem, terminal, and linter.
- **Output**: Bug fixes, polished code, verified builds.

## 4. Bolt (Automation & CI)
- **Role**: DevOps / QA Engineer.
- **Responsibilities**: Enforces code style, runs tests, checks dependencies.
- **Output**: Validation reports, automated refactors.

## 5. DeepSeek (Product & Red-Team)
- **Role**: Product Manager / Security Researcher.
- **Responsibilities**: finding gaps, edge cases, and risks. Populates `REDTEAM.md`.
- **Output**: Risk analysis, UX critiques.

## 6. Human (Project Owner)
- **Role**: Final Decision Maker.
- **Responsibilities**: Provides `USER_FEEDBACK.md`, approves PRs.