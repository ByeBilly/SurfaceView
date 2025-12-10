# REDTEAM.md — Risk Analysis & QA Findings

This document is a shared suggestion box for all agents to list risks, critiques, and gaps.

### [Gemini] — [Performance Risk]
**Issue:**  
The `computeMask` function in `vision.ts` processes pixels on the main thread (mostly). For 4K images, this will freeze the UI.
**Impact:**  
Poor user experience on mobile.
**Recommendation:**  
Move vision logic to a Web Worker.
**Status:**  
Open

### [Gemini] — [Storage Limits]
**Issue:**  
IndexedDB is robust but not infinite. Mobile browsers may evict data if storage pressure is high.
**Impact:**  
User could lose saved jobs.
**Recommendation:**  
Implement a "Export Backup" feature to save a ZIP of the DB.
**Status:**  
Open

### [DeepSeek] — [UX Confusion]
**Issue:**  
Users might not understand "Garage" terminology for furniture.
**Impact:**  
Feature under-utilization.
**Recommendation:**  
Rename "Garage" to "Hidden Objects" or "Furniture Layer".
**Status:**  
In Progress (Iconography updated, text pending).