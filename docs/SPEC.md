# SPEC.md — Product Specification

## 1. Core Features
- **Floor Detection**: Automated segmentation of floor areas using YUV color space analysis and Connected Component Labeling.
- **Virtual Staging**: Identification and removal of foreground objects (furniture) to reveal the floor.
- **Visualizer**: Application of texture patterns (wood, tile, carpet) to masked areas with adjustable scale, rotation, and opacity.
- **Job Management**: Local CRUD operations for Jobs, including photo storage and PDF generation.

## 2. Architecture
- **Frontend**: React 18, TypeScript, Vite.
- **Styling**: Tailwind CSS.
- **State Management**: React Context + Local Component State.
- **Storage**: IndexedDB (via `services/db.ts` wrapper).
- **Vision**: Custom Computer Vision pipeline (no external ML models) in `services/vision.ts`.

## 3. Data Models
### Job
```typescript
interface Job {
  id: string;
  name: string;
  mainPhotoId: string; // Asset ID
  renderedPreviewId?: string; // Asset ID
  maskPoints: Point[]; // Polygon definition
  objects: RoomObject[]; // Furniture metadata
  productId?: string;
  scale: number;
  rotation: number;
  opacity: number;
  status: 'draft' | 'completed';
}
```

### RoomObject
```typescript
interface RoomObject {
  id: string;
  imageUrl: string;
  isVisible: boolean; // Controls layering vs removal
  x: number;
  y: number;
  width: number;
  height: number;
}
```

## 4. User Flows
1. **New Job**: Dashboard -> New Job -> Take/Upload Photo.
2. **Analysis**: Auto-detect Objects -> Auto-detect Floor -> Review Mask.
3. **Correction**: If unclear -> "Move Out Furniture" -> Re-run detection.
4. **Visualization**: Select Product -> Adjust Sliders -> Save.
5. **Export**: Job Details -> Export PDF.

## 5. Acceptance Criteria
- App must load and function offline.
- Images up to 4K resolution must be supported (downscaled for processing).
- PDF Export must include Business Profile header.