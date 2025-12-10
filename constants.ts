
import { FlooringType, Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'French Oak Natural Plank',
    type: FlooringType.Plank,
    widthMm: 190,
    lengthMm: 1900,
    // Wood texture
    masterTextureUrl: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=500', 
    notes: 'Premium engineered oak with a matte lacquer finish.'
  },
  {
    id: 'p2',
    name: 'Carrara Marble Tile',
    type: FlooringType.Tile,
    widthMm: 600,
    lengthMm: 600,
    // Marble texture
    masterTextureUrl: 'https://images.unsplash.com/photo-1599309521976-a97d9dd2462e?auto=format&fit=crop&q=80&w=500',
    notes: 'Classic Italian marble look, porcelain body.'
  },
  {
    id: 'p3',
    name: 'Berber Wool Loop - Grey',
    type: FlooringType.Carpet,
    widthMm: 3660, // Roll width, effectively continuous for rendering logic usually
    lengthMm: 1000,
    // Carpet texture
    masterTextureUrl: 'https://images.unsplash.com/photo-1621251347633-5b8d81093121?auto=format&fit=crop&q=80&w=500',
    notes: '100% Wool, heavy duty residential rating.'
  }
];

export const EXAMPLE_ROOMS = [
  {
    id: 'room1',
    name: 'Modern Living Room',
    url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 'room2',
    name: 'Spacious Kitchen',
    url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 'room3',
    name: 'Master Bedroom',
    url: 'https://images.unsplash.com/photo-1616594039964-408e4080ce37?auto=format&fit=crop&q=80&w=1000'
  }
];

export const STORAGE_KEYS = {
  PROFILE: 'sv_profile',
  PRODUCTS: 'sv_products',
  JOBS: 'sv_jobs',
  ONBOARDED: 'sv_onboarded'
};

export const VISION_CONFIG = {
  PROCESSING_WIDTH: 400, // Downscale for speed
  DEFAULT_TOLERANCE: 35,
  LUMA_WEIGHT: 0.3,      // Lower weight for brightness (handle shadows)
  CHROMA_WEIGHT: 1.5,    // Higher weight for color (strict on hue)
  MIN_FLOOR_PERCENTAGE: 0.05, // 5% of image
  BOTTOM_TOUCH_THRESHOLD: 0.8 // Floor must be in bottom 20%
};
