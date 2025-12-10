
export enum FlooringType {
  Carpet = 'Carpet',
  Tile = 'Tile',
  Plank = 'Plank'
}

export interface BusinessProfile {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  logoUrl?: string;
  isSetup: boolean;
}

export interface Product {
  id: string;
  name: string;
  type: FlooringType;
  masterTextureUrl?: string; // For remote URLs (Unsplash)
  masterTextureId?: string;  // For local IndexedDB assets
  widthMm: number;
  lengthMm: number;
  notes?: string;
  stairUrl?: string;
  trimUrl?: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface RoomObject {
  id: string;
  label: string; 
  imageUrl: string; // Blob URL
  assetId?: string; // Local DB ID
  x: number; 
  y: number; 
  width: number; 
  height: number; 
  zIndex: number;
  isVisible: boolean; // Controls if object is layered ON TOP (true) or REMOVED/FILLED (false)
}

export interface Job {
  id: string;
  name: string;
  clientName?: string;
  createdAt: number;
  mainPhotoUrl?: string; // For remote
  mainPhotoId?: string;  // For local DB
  renderedPreviewUrl?: string; // Usually a Base64 string for thumbnails is fine, or Blob
  renderedPreviewId?: string;
  maskPoints: Point[];
  objects?: RoomObject[];
  productId?: string;
  scale: number;
  rotation: number;
  opacity: number;
  notes: string;
  status: 'draft' | 'completed';
}

export interface SampleRoom {
  id: string;
  name: string;
  url?: string;
  assetId?: string;
  createdAt: number;
}
