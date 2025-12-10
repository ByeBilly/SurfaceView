# PROJECT_OVERVIEW.md — Session Starter / Continuation Brief

This document is a concise, always-up-to-date summary of the project.

The human will copy/paste this file at the start of new work sessions as a
"continuation brief" for ChatGPT, Gemini, Cursor, Bolt, DeepSeek, or any
other agents. All agents must keep this document accurate and current.

## 1. Project Name
**SurfaceView Web (Flooring Edition)**

## 2. Current Vision / Purpose
A professional, fully offline flooring visualization tool for tradespeople. It allows users to take a photo of a room, automatically detect the floor, remove existing furniture (virtual staging), and visualize new flooring products (carpet, tile, plank) on site. The app runs as a PWA using local storage (IndexedDB) for data privacy and offline resilience.

## 3. Key Features (High-Level)
- **AI Floor Detection**: Geometric analysis and computer vision (YUV flood fill) to identify floor areas.
- **Smart Furniture Removal**: "Garage" system to detect, extract, and hide furniture, filling the void with new flooring.
- **Offline Capability**: Uses IndexedDB for persistent storage of high-res assets and jobs.
- **Visualizer Engine**: Canvas-based rendering with scale, rotation, and opacity controls.
- **Job Management**: Create jobs, export PDF packages, and manage a custom product catalogue.

## 4. Current Status (Short Summary)
The application is a functional React PWA. The core visualization engine is robust, featuring a "Smart Vision" pipeline that can handle complex scenes. The recent "Hard to Define Floor" logic adds a layer of intelligence, prompting users to remove furniture if the floor detection is ambiguous. Asset management is fully offline via IndexedDB.

## 5. Active Branches / Environments
- **Main**: Stable, production-ready code.
- **Dev**: Integration branch for multi-agent work.
- **Feature Branches**: `feature/*` convention used by Gemini.

## 6. Most Recent Work
- Implemented **Geometric Post-Processing** for floor masks (Connected Component Analysis).
- Added **"Hard to Define Floor"** heuristics to detect when AI is struggling.
- Created **Furniture Removal Workflow**: A modal prompts the user to "Move Out Furniture" if the floor is unclear.
- Refined **Overlay Rendering**: New "Dark Veil + Blue Highlight" style for clearer mask review.
- Updated **IndexedDB** logic to support virtual staging assets.
- Installed **Global Continuity Pack** and Cursor rules.

## 7. Known Issues / Risks (Short List)
- **Vision Performance**: Large images (>2000px) may cause UI blocking on slower devices during flood fill operations.
- **Perspective Distortion**: Rendering uses 2D affine transformations (scale/rotate); full 3D perspective projection (vanishing points) is not yet implemented.
- **Shadow Extremes**: While YUV helps, extreme contrast can still fragment the floor mask.

## 8. Next Intended Actions
- Refine perspective transformation for realistic floor rendering.
- Implement "Wall Base" masking to separate skirting boards from the floor.
- Improve PDF export to include "Before" and "After" comparisons.

## 9. User Feedback Highlights
- **Request**: Clearer distinction between "floor" and "not floor" during review. (Resolved via Dark Veil overlay).
- **Request**: Automatic removal of furniture to avoid manual masking. (Resolved via Furniture Removal workflow).

## 10. Last Updated
- **Date**: 2024-05-22
- **Agent**: Gemini
- **Note**: Fixed internal error and re-synced documentation standard.