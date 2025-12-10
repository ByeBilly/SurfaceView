
import { Point, RoomObject } from '../types';
import { VISION_CONFIG } from '../constants';

// YUV Color space helper for shadow resistance
const rgbToYuv = (r: number, g: number, b: number) => {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const u = 0.492 * (b - y);
  const v = 0.877 * (r - y);
  return { y, u, v };
};

export interface VisionMetrics {
  coverageFraction: number;
  touchesBottom: boolean;
  componentCount: number;
  largestComponentHeightFraction: number;
}

export interface VisionResult {
  mask: Uint8Array; // 0 or 1
  width: number;
  height: number;
  isValid: boolean;
  message?: string;
  metrics: VisionMetrics;
  hardToDefineFloor: boolean;
}

interface Component {
  id: number;
  pixels: number[];
  minY: number;
  maxY: number;
  area: number;
  bboxHeight: number;
}

export const visionService = {
  /**
   * Main function to compute the floor mask based on positive/negative seeds.
   */
  computeMask: async (
    imgSrc: string, 
    positivePoints: Point[], // Normalised 0-1
    negativePoints: Point[], // Normalised 0-1
    objects: RoomObject[] = [] 
  ): Promise<VisionResult> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgSrc;
      
      img.onload = async () => {
        try {
          const width = VISION_CONFIG.PROCESSING_WIDTH;
          const ratio = img.height / img.width;
          const height = Math.round(width * ratio);
          const totalPixels = width * height;

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) throw new Error('Context failure');

          // Draw Base Image
          ctx.drawImage(img, 0, 0, width, height);
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          // 1. Initialize Mask (0 = Background, 1 = Floor)
          const mask = new Uint8Array(totalPixels);

          // 2. Prepare Seeds
          let seeds = positivePoints.map(p => ({
            x: Math.floor(p.x * width),
            y: Math.floor(p.y * height)
          }));

          // Auto-seed if none provided
          if (seeds.length === 0) {
            seeds.push({ x: Math.floor(width / 2), y: Math.floor(height * 0.9) });
          }

          const negSeeds = negativePoints.map(p => ({
            x: Math.floor(p.x * width),
            y: Math.floor(p.y * height)
          }));

          // 3. Flood Fill Logic (Multi-Seed YUV)
          const tolerance = VISION_CONFIG.DEFAULT_TOLERANCE;
          
          // Pre-calculate seed colors
          const seedColors = seeds.map(s => {
            const sx = Math.max(0, Math.min(width - 1, s.x));
            const sy = Math.max(0, Math.min(height - 1, s.y));
            const idx = (sy * width + sx) * 4;
            return rgbToYuv(data[idx], data[idx+1], data[idx+2]);
          });

          const visited = new Uint8Array(totalPixels);
          const qX: number[] = [];
          const qY: number[] = [];
          
          seeds.forEach(s => {
             qX.push(s.x);
             qY.push(s.y);
          });

          // BFS Flood
          let head = 0;
          while(head < qX.length) {
            const x = qX[head];
            const y = qY[head];
            head++;

            const pixelIdx = y * width + x;
            if (visited[pixelIdx]) continue;
            visited[pixelIdx] = 1;
            mask[pixelIdx] = 1;

            // Check neighbors
            const checkNeighbor = (nx: number, ny: number) => {
              if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
              const nIdx = ny * width + nx;
              if (visited[nIdx]) return;

              const nByteIdx = nIdx * 4;
              const nYuv = rgbToYuv(data[nByteIdx], data[nByteIdx+1], data[nByteIdx+2]);

              let isMatch = false;
              for (const seedColor of seedColors) {
                 const dist = Math.abs(seedColor.y - nYuv.y) * VISION_CONFIG.LUMA_WEIGHT +
                              Math.abs(seedColor.u - nYuv.u) * VISION_CONFIG.CHROMA_WEIGHT +
                              Math.abs(seedColor.v - nYuv.v) * VISION_CONFIG.CHROMA_WEIGHT;
                 if (dist < tolerance) {
                   isMatch = true;
                   break;
                 }
              }

              if (isMatch) {
                 qX.push(nx);
                 qY.push(ny);
              }
            };

            checkNeighbor(x + 1, y);
            checkNeighbor(x - 1, y);
            checkNeighbor(x, y + 1);
            checkNeighbor(x, y - 1);
          }

          // 4. Negative Subtraction (Simple)
          if (negSeeds.length > 0) {
             const negQx: number[] = [];
             const negQy: number[] = [];
             const negVisited = new Uint8Array(totalPixels);
             
             const negSeedColors = negSeeds.map(s => {
                const sx = Math.max(0, Math.min(width - 1, s.x));
                const sy = Math.max(0, Math.min(height - 1, s.y));
                const idx = (sy * width + sx) * 4;
                return rgbToYuv(data[idx], data[idx+1], data[idx+2]);
             });

             negSeeds.forEach(s => { negQx.push(s.x); negQy.push(s.y); });
             
             let negHead = 0;
             while(negHead < negQx.length) {
               const x = negQx[negHead];
               const y = negQy[negHead];
               negHead++;

               const pIdx = y * width + x;
               if (negVisited[pIdx]) continue;
               negVisited[pIdx] = 1;
               mask[pIdx] = 0; // REMOVE

               const checkNeg = (nx: number, ny: number) => {
                  if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
                  const nIdx = ny * width + nx;
                  if (negVisited[nIdx]) return;
                  if (mask[nIdx] === 0) return; 

                  const nByteIdx = nIdx * 4;
                  const nYuv = rgbToYuv(data[nByteIdx], data[nByteIdx+1], data[nByteIdx+2]);
                  
                  let isMatch = false;
                  for (const sColor of negSeedColors) {
                     const dist = Math.abs(sColor.y - nYuv.y) * VISION_CONFIG.LUMA_WEIGHT +
                                  Math.abs(sColor.u - nYuv.u) * VISION_CONFIG.CHROMA_WEIGHT +
                                  Math.abs(sColor.v - nYuv.v) * VISION_CONFIG.CHROMA_WEIGHT;
                     if (dist < tolerance) { isMatch = true; break; }
                  }

                  if (isMatch) {
                    negQx.push(nx);
                    negQy.push(ny);
                  }
               };
               checkNeg(x+1, y);
               checkNeg(x-1, y);
               checkNeg(x, y+1);
               checkNeg(x, y-1);
             }
          }

          // 5. Object Processing (Furniture Garage)
          if (objects.length > 0) {
            const objCanvas = document.createElement('canvas');
            objCanvas.width = width;
            objCanvas.height = height;
            const objCtx = objCanvas.getContext('2d');
            
            if (objCtx) {
              const objectImages = await Promise.all(objects.map(obj => {
                return new Promise<HTMLImageElement | null>(r => {
                   const i = new Image();
                   i.crossOrigin = 'anonymous';
                   i.onload = () => r(i);
                   i.onerror = () => r(null);
                   i.src = obj.imageUrl;
                });
              }));

              objects.forEach((obj, idx) => {
                const imgAsset = objectImages[idx];
                if (imgAsset) {
                  objCtx.clearRect(0,0,width,height);
                  objCtx.drawImage(
                    imgAsset, 
                    obj.x * width, 
                    obj.y * height, 
                    obj.width * width, 
                    obj.height * height
                  );
                  
                  const objData = objCtx.getImageData(0,0,width,height).data;
                  
                  for(let i=0; i < totalPixels; i++) {
                     const alpha = objData[i*4 + 3];
                     if (alpha > 50) {
                        if (obj.isVisible) {
                           // Furniture is VISIBLE -> It sits ON TOP of floor -> Remove from floor mask
                           mask[i] = 0;
                        } else {
                           // Furniture is REMOVED -> Virtual Staging -> Force Fill this area as Floor
                           mask[i] = 1;
                        }
                     }
                  }
                }
              });
            }
          }

          // 6. Geometric Post-Processing (Connected Components)
          const labeled = new Int32Array(totalPixels).fill(0);
          let currentLabel = 1;
          const componentMap: Record<number, Component> = {};

          const getComp = (id: number) => {
            if (!componentMap[id]) componentMap[id] = { id, pixels: [], minY: height, maxY: 0, area: 0, bboxHeight: 0 };
            return componentMap[id];
          };

          for (let i = 0; i < totalPixels; i++) {
             if (mask[i] === 1 && labeled[i] === 0) {
                const label = currentLabel++;
                const comp = getComp(label);
                
                const q = [i];
                labeled[i] = label;
                
                let head = 0;
                while(head < q.length) {
                   const idx = q[head++];
                   const cy = Math.floor(idx / width);
                   
                   comp.area++;
                   comp.pixels.push(idx);
                   if (cy < comp.minY) comp.minY = cy;
                   if (cy > comp.maxY) comp.maxY = cy;

                   const neighbors = [idx-1, idx+1, idx-width, idx+width];
                   for (const nIdx of neighbors) {
                      if (nIdx >= 0 && nIdx < totalPixels) {
                         if (Math.abs((nIdx % width) - (idx % width)) > 1) continue; 
                         if (mask[nIdx] === 1 && labeled[nIdx] === 0) {
                            labeled[nIdx] = label;
                            q.push(nIdx);
                         }
                      }
                   }
                }
                comp.bboxHeight = comp.maxY - comp.minY;
             }
          }

          const components = Object.values(componentMap);
          
          // 7. Intelligence Layer: Hard to Define Floor Analysis
          // A: Tall verticals (Walls painted blue)
          const hasTallVerticals = components.some(c => c.bboxHeight > height * 0.4);
          
          // B: Fragmentation (count significant components > 1% of image)
          const significantComponents = components.filter(c => (c.area / totalPixels) > 0.01);
          const isFragmented = significantComponents.length > 3;

          // C: No valid floor component
          // Definition of valid floor: Touches bottom (approx), starts below horizon, significant size
          const validFloorComponents = components.filter(comp => {
             const touchesBottom = comp.maxY >= height * 0.95;
             const startsLow = comp.minY > height * 0.3; // Top of component is in lower 70% of image
             const significant = (comp.area / totalPixels) >= 0.05;
             return touchesBottom && startsLow && significant;
          });
          const hasNoValidFloor = validFloorComponents.length === 0;

          // D: Coverage Extremes
          const totalFloorArea = components.reduce((acc, c) => acc + c.area, 0);
          const totalCoverage = totalFloorArea / totalPixels;
          const isCoverageSuspicious = totalCoverage > 0.5 || totalCoverage < 0.03;

          let hardToDefineFloor = hasTallVerticals || isFragmented || hasNoValidFloor || isCoverageSuspicious;

          // EXCEPTION: If we are in Virtual Staging mode (objects removed), we trust the result more
          // because we forced the fill, so 'startsLow' or 'fragmentation' might be artificial.
          const isVirtualStaging = objects.some(o => !o.isVisible);
          if (isVirtualStaging) {
             hardToDefineFloor = false;
          }

          // 8. Final Filtering (Produce the Clean Mask)
          // Even if hard to define, we produce a "Best Effort" mask for the user to review.
          // Strategy: Keep only VALID floor components if they exist. Else keep significant ones.
          mask.fill(0);
          let filteredArea = 0;
          let maxComponentHeight = 0;

          const componentsToKeep = validFloorComponents.length > 0 ? validFloorComponents : significantComponents;
          
          componentsToKeep.forEach(comp => {
             comp.pixels.forEach(idx => mask[idx] = 1);
             filteredArea += comp.area;
             if (comp.bboxHeight > maxComponentHeight) maxComponentHeight = comp.bboxHeight;
          });

          // 9. Final Metrics
          const finalCoverage = filteredArea / totalPixels;
          const metrics: VisionMetrics = {
             coverageFraction: finalCoverage,
             touchesBottom: componentsToKeep.some(c => c.maxY >= height * 0.95),
             componentCount: componentsToKeep.length,
             largestComponentHeightFraction: maxComponentHeight / height
          };

          let isValid = true;
          let message = undefined;
          
          if (metrics.coverageFraction < 0.03) {
             isValid = false;
             message = "Floor area too small to detect.";
          }
          if (metrics.coverageFraction > 0.6) {
             isValid = false;
             message = "Area too large. Likely includes walls.";
          }
          if (!metrics.touchesBottom && !isVirtualStaging) {
             isValid = false;
             message = "Floor must start from the bottom.";
          }

          resolve({
            mask,
            width,
            height,
            isValid,
            message,
            metrics,
            hardToDefineFloor
          });

        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
    });
  },

  /**
   * Simulates Foreground Object Detection (The Garage)
   */
  detectForegroundObjects: async (imgSrc: string): Promise<RoomObject[]> => {
     return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imgSrc;
        img.onload = () => {
           const width = 400;
           const height = Math.floor(width * (img.height/img.width));
           const canvas = document.createElement('canvas');
           canvas.width = width;
           canvas.height = height;
           const ctx = canvas.getContext('2d');
           if (!ctx) return resolve([]);
           
           ctx.drawImage(img, 0, 0, width, height);
           const data = ctx.getImageData(0,0,width,height).data;
           
           const floorIdx = (Math.floor(height * 0.9) * width + Math.floor(width * 0.5)) * 4;
           const floorYuv = rgbToYuv(data[floorIdx], data[floorIdx+1], data[floorIdx+2]);
           
           const objMask = new Uint8Array(width * height);
           let objPixelCount = 0;
           let minX = width, maxX = 0, minY = height, maxY = 0;

           // Heuristic: Scan middle band of image for contrast against floor
           for(let y=Math.floor(height*0.3); y<Math.floor(height*0.8); y++) {
             for(let x=Math.floor(width*0.2); x<Math.floor(width*0.8); x++) {
               const idx = (y * width + x) * 4;
               const pixelYuv = rgbToYuv(data[idx], data[idx+1], data[idx+2]);
               
               const dist = Math.abs(floorYuv.y - pixelYuv.y) * 1 +
                            Math.abs(floorYuv.u - pixelYuv.u) * 2 +
                            Math.abs(floorYuv.v - pixelYuv.v) * 2;
               
               if (dist > 50) { 
                  objMask[y*width+x] = 1;
                  objPixelCount++;
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
               }
             }
           }
           
           if (objPixelCount > (width*height)*0.05) {
               const objW = maxX - minX;
               const objH = maxY - minY;
               
               if (objW > 0 && objH > 0) {
                 const extractCanvas = document.createElement('canvas');
                 extractCanvas.width = objW;
                 extractCanvas.height = objH;
                 const eCtx = extractCanvas.getContext('2d');
                 
                 const extractData = eCtx!.createImageData(objW, objH);
                 for(let y=0; y<objH; y++) {
                   for(let x=0; x<objW; x++) {
                     const srcX = minX + x;
                     const srcY = minY + y;
                     const maskVal = objMask[srcY*width + srcX];
                     
                     if (maskVal === 1) {
                        const srcIdx = (srcY * width + srcX) * 4;
                        const destIdx = (y * objW + x) * 4;
                        extractData.data[destIdx] = data[srcIdx];
                        extractData.data[destIdx+1] = data[srcIdx+1];
                        extractData.data[destIdx+2] = data[srcIdx+2];
                        extractData.data[destIdx+3] = 255; 
                     }
                   }
                 }
                 eCtx!.putImageData(extractData, 0, 0);
                 
                 const objectUrl = extractCanvas.toDataURL();
                 
                 resolve([{
                    id: `obj_${Date.now()}`,
                    label: 'Detected Item',
                    imageUrl: objectUrl,
                    x: minX / width,
                    y: minY / height,
                    width: objW / width,
                    height: objH / height,
                    zIndex: 10,
                    isVisible: true
                 }]);
                 return;
               }
           }
           resolve([]);
        };
     });
  },

  /**
   * Converts the boolean mask to a displayable Canvas for the overlay
   * Returns a blue transparent layer.
   */
  maskToCanvas: (mask: Uint8Array, width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let i = 0; i < mask.length; i++) {
       if (mask[i] === 1) {
          const idx = i * 4;
          // Bright Blue Highlight (60% opacity)
          data[idx] = 30;    // R
          data[idx+1] = 144; // G
          data[idx+2] = 255; // B (Dodger Blue)
          data[idx+3] = 160; // Alpha (~60%)
       } else {
          // Transparent (let background show through)
          data[i*4 + 3] = 0;
       }
    }
    
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  },
  
  maskToPolygon: (mask: Uint8Array, width: number, height: number): Point[] => {
     const points: Point[] = [];
     for (let y = 0; y < height; y+=5) {
        let minX = -1;
        let maxX = -1;
        for (let x = 0; x < width; x++) {
           if (mask[y*width+x] === 1) {
              if (minX === -1) minX = x;
              maxX = x;
           }
        }
        if (minX !== -1) {
           points.push({x: minX/width, y: y/height});
           if (maxX !== minX) points.push({x: maxX/width, y: y/height});
        }
     }
     return points;
  }
};
