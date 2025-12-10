# NOTES_CHATGPT.md — Orchestrator's Notebook

This is ChatGPT’s personal note file inside the repo.
It stores architectural direction, observations, decisions, and reasoning
that must persist across agent updates.

## Design Philosophy
- **Offline First**: The app must function 100% without internet. IndexedDB is the source of truth.
- **Zero Latency**: Visual feedback (sliders, toggles) must be instant. Expensive operations (vision) must be async/backgrounded.
- **Privacy**: User photos never leave the device.

## Critical Invariants
- `services/db.ts` must always return Promises (async).
- `vision.ts` must handle `isVisible` flag on objects correctly (True = Cutout, False = Fill).

## Tech Stack Rationale
- **React**: Component modularity.
- **Tailwind**: Rapid styling and small bundle size.
- **IndexedDB**: Only viable option for storing >50MB of user photos in browser.

## Notes for Future Sessions
- When implementing perspective transform, consider using CSS 3D transforms for the preview but Canvas API for the final export render.