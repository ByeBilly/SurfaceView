
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { db } from '../services/db';
import { visionService, VisionResult } from '../services/vision.ts';
import { Product, Point, Job, RoomObject } from '../types';
import { Button } from '../components/Button';
import { 
  Camera, X, SlidersHorizontal, 
  Maximize, RotateCw, Save, ThumbsUp, Plus, Minus, Info,
  Armchair, Eye, EyeOff, Layers, AlertTriangle, Sofa
} from 'lucide-react';

type Stage = 'upload' | 'analyzing_objects' | 'detecting_floor' | 'review' | 'correcting' | 'visualizing';
type CorrectionMode = 'add' | 'remove';

export const Visualizer: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Workflow State
  const [stage, setStage] = useState<Stage>('upload');
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<'products' | 'objects'>('products');

  // Vision State
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);
  const [posPoints, setPosPoints] = useState<Point[]>([]);
  const [negPoints, setNegPoints] = useState<Point[]>([]);
  const [correctionMode, setCorrectionMode] = useState<CorrectionMode>('add');
  const [maskOverlay, setMaskOverlay] = useState<HTMLCanvasElement | null>(null);
  
  // Intelligence Layer State
  const [showFurniturePrompt, setShowFurniturePrompt] = useState(false);
  
  // Object State (The Garage)
  const [roomObjects, setRoomObjects] = useState<RoomObject[]>([]);

  // Rendering State
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0); 
  const [opacity, setOpacity] = useState(0.9);
  const [products, setProducts] = useState<Product[]>([]);
  const [jobName, setJobName] = useState('New Job');
  
  // Resolved Product Textures
  const [productTextures, setProductTextures] = useState<Record<string, string>>({});

  // 1. Setup & Load
  useEffect(() => {
    const init = async () => {
      // Load Products
      const prods = await db.getProducts();
      setProducts(prods);
      
      // Pre-resolve all product textures
      const textures: Record<string, string> = {};
      for (const p of prods) {
        if (p.masterTextureId) textures[p.id] = await db.getAssetUrl(p.masterTextureId);
        else if (p.masterTextureUrl) textures[p.id] = p.masterTextureUrl;
      }
      setProductTextures(textures);
      
      // Load Job or State
      if (location.state && location.state.imageUrl) {
        setImgSrc(location.state.imageUrl);
        if (location.state.defaultName) setJobName(location.state.defaultName);
      } else if (id && id !== 'new') {
        const job = await db.getJob(id);
        if (job) {
          setJobName(job.name);
          
          // Resolve main photo
          if (job.mainPhotoId) {
             const url = await db.getAssetUrl(job.mainPhotoId);
             setImgSrc(url);
          } else if (job.mainPhotoUrl) {
             setImgSrc(job.mainPhotoUrl);
          }
          
          if (job.maskPoints.length > 0) {
              setPosPoints(job.maskPoints); 
              setStage('visualizing');
          } else {
              setStage('upload');
          }
          if (job.productId) setSelectedProductId(job.productId);
          if (job.objects) setRoomObjects(job.objects);
          setScale(job.scale);
          setRotation(job.rotation);
          setOpacity(job.opacity);
        }
      }
    };
    init();
  }, [id, location.state]);

  // 2. Auto-Detect Trigger
  useEffect(() => {
    if (imgSrc && stage === 'upload') {
       runAnalysisPipeline();
    }
  }, [imgSrc, stage]);

  const runAnalysisPipeline = async (forceRefine = false) => {
    if (!imgSrc) return;
    
    // Step 1: Detect Objects (Garage) - only if not already done
    let currentObjects = roomObjects;
    if (currentObjects.length === 0 && !forceRefine) {
        setStage('analyzing_objects');
        setFeedbackMsg("Identifying furniture...");
        try {
           const detected = await visionService.detectForegroundObjects(imgSrc);
           setRoomObjects(detected);
           currentObjects = detected;
           if (detected.length > 0) {
             setFeedbackMsg(`Found ${detected.length} item(s) to isolate.`);
             await new Promise(r => setTimeout(r, 1000));
           }
        } catch (e) {
           console.error("Object detection failed", e);
        }
    }

    // Step 2: Detect Floor
    setStage('detecting_floor');
    setFeedbackMsg("Finding floor area...");
    
    try {
      // Pass the detected objects so they can be subtracted from the floor
      const result = await visionService.computeMask(imgSrc, [], [], currentObjects);
      setVisionResult(result);
      
      const overlay = visionService.maskToCanvas(result.mask, result.width, result.height);
      setMaskOverlay(overlay);
      
      if (result.hardToDefineFloor && !forceRefine) {
         setShowFurniturePrompt(true);
         return; // Pause here
      }
      
      if (!result.isValid) {
         setFeedbackMsg(result.message || "Floor detection low confidence.");
      } else {
         setFeedbackMsg("AI found the floor");
      }
      setStage('review');
    } catch (e) {
      console.error(e);
      setFeedbackMsg("Could not detect floor automatically.");
      setStage('review');
    }
  };

  const handleRemoveFurniture = async () => {
     setShowFurniturePrompt(false);
     
     // 1. Force detection if we haven't
     let currentObjects = roomObjects;
     if (currentObjects.length === 0) {
         setStage('analyzing_objects');
         setFeedbackMsg("Scanning for furniture...");
         currentObjects = await visionService.detectForegroundObjects(imgSrc!);
         setRoomObjects(currentObjects);
     }
     
     // 2. Hide them (Mark invisible so they are replaced by floor in computeMask)
     const hiddenObjects = currentObjects.map(o => ({...o, isVisible: false}));
     setRoomObjects(hiddenObjects);
     
     // 3. Re-run floor detection with hidden objects
     setStage('detecting_floor');
     setFeedbackMsg("Creating clean floor mask...");
     
     const result = await visionService.computeMask(imgSrc!, [], [], hiddenObjects);
     setVisionResult(result);
     const overlay = visionService.maskToCanvas(result.mask, result.width, result.height);
     setMaskOverlay(overlay);
     
     setStage('review');
     setFeedbackMsg("Furniture removed from mask");
  };

  const handleTryExistingMask = () => {
      setShowFurniturePrompt(false);
      setStage('review'); // Or 'correcting'
  };

  const runRefinement = async (newPos: Point[], newNeg: Point[]) => {
    if (!imgSrc) return;
    
    // Pass existing objects to ensure consistency during refinement
    const result = await visionService.computeMask(imgSrc, newPos, newNeg, roomObjects);
    setVisionResult(result);
    const overlay = visionService.maskToCanvas(result.mask, result.width, result.height);
    setMaskOverlay(overlay);
    
    if (!result.isValid) {
        setFeedbackMsg(result.message || "Selection unclear");
    } else {
        setFeedbackMsg(null);
    }
  };

  const handleTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (stage !== 'correcting') return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    if (correctionMode === 'add') {
       const newPos = [...posPoints, {x, y}];
       setPosPoints(newPos);
       runRefinement(newPos, negPoints);
    } else {
       const newNeg = [...negPoints, {x, y}];
       setNegPoints(newNeg);
       runRefinement(posPoints, newNeg);
    }
  };

  const toggleObjectVisibility = (objId: string) => {
    setRoomObjects(prev => prev.map(o => o.id === objId ? { ...o, isVisible: !o.isVisible } : o));
  };

  // 3. Rendering Loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgSrc) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgSrc;
    img.onload = () => {
       // Canvas Setup
       const containerW = containerRef.current?.clientWidth || window.innerWidth;
       const ratio = img.width / img.height;
       const maxDim = 1200;
       let renderW = img.width;
       let renderH = img.height;
       if (renderW > maxDim || renderH > maxDim) {
         if (ratio > 1) { renderW = maxDim; renderH = maxDim / ratio; }
         else { renderH = maxDim; renderW = maxDim * ratio; }
       }
       canvas.width = renderW;
       canvas.height = renderH;

       // LAYER 1: Background
       ctx.drawImage(img, 0, 0, renderW, renderH);

       // LAYER 2: Flooring (If Visualizing)
       if (stage === 'visualizing' && visionResult && selectedProductId) {
         const product = products.find(p => p.id === selectedProductId);
         const textureUrl = productTextures[selectedProductId];
         
         if (product && textureUrl) {
           const polygon = visionService.maskToPolygon(visionResult.mask, visionResult.width, visionResult.height);
           // We use the raw polygon (with many points) or convex hull?
           // Convex hull is safer for simple floors, but complex floors need the raw poly.
           // However, raw poly from lines is tricky. Let's use hull for now as per previous version,
           // but strictly we should use the mask directly if we could shader it.
           // Canvas 'clip' supports complex paths if we trace them right.
           // For now, let's stick to Hull for stability, or try to trace better.
           // Actually, using the maskOverlay as a stencil is better?
           // No, we need pattern tiling.
           
           // Simplified Hull for now:
           const hull = convexHull(polygon);
           
           if (hull.length > 2) {
              ctx.save();
              ctx.beginPath();
              ctx.moveTo(hull[0].x * renderW, hull[0].y * renderH);
              hull.slice(1).forEach(p => ctx.lineTo(p.x * renderW, p.y * renderH));
              ctx.closePath();
              ctx.clip();

              const texture = new Image();
              texture.crossOrigin = 'anonymous';
              texture.src = textureUrl;
              
              if (texture.complete) {
                 drawTexture(ctx, texture, renderW, renderH, product.widthMm);
              } else {
                 texture.onload = () => drawTexture(ctx, texture, renderW, renderH, product.widthMm);
              }
              ctx.restore();
           }
         }
       }

       // LAYER 3: Objects
       if (stage === 'visualizing') {
           roomObjects.forEach(obj => {
               if (obj.isVisible) {
                   const objImg = new Image();
                   objImg.src = obj.imageUrl;
                   if (objImg.complete) {
                       ctx.drawImage(objImg, obj.x * renderW, obj.y * renderH, obj.width * renderW, obj.height * renderH);
                   } else {
                       objImg.onload = () => {
                           ctx.drawImage(objImg, obj.x * renderW, obj.y * renderH, obj.width * renderW, obj.height * renderH);
                       }
                   }
               }
           });
       }

       // LAYER 4: Overlay (Review/Correction Mode)
       // Specs: "Dark veil over whole image... Then draw floor mask area with strong highlight."
       if ((stage === 'review' || stage === 'correcting') && maskOverlay) {
          // 1. Dark Veil (50% Black)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(0, 0, renderW, renderH);

          // 2. Floor Mask Highlight (Bright Blue 60% - baked into maskOverlay)
          ctx.drawImage(maskOverlay, 0, 0, renderW, renderH);

          // 3. Tap Points
          const drawPoint = (p: Point, color: string) => {
             ctx.beginPath();
             ctx.arc(p.x * renderW, p.y * renderH, 6, 0, Math.PI * 2);
             ctx.fillStyle = color;
             ctx.strokeStyle = 'white';
             ctx.lineWidth = 2;
             ctx.fill();
             ctx.stroke();
          };
          posPoints.forEach(p => drawPoint(p, '#22c55e'));
          negPoints.forEach(p => drawPoint(p, '#ef4444'));
       }
    };
  }, [imgSrc, stage, maskOverlay, posPoints, negPoints, visionResult, selectedProductId, scale, rotation, opacity, products, roomObjects, productTextures]);

  // Helper for texture drawing
  const drawTexture = (ctx: CanvasRenderingContext2D, texture: HTMLImageElement, w: number, h: number, widthMm: number) => {
      const pCanvas = document.createElement('canvas');
      const pCtx = pCanvas.getContext('2d');
      if (!pCtx) return;
      
      const baseScale = (w / 4000) * (widthMm * 4); 
      const finalScale = baseScale * scale;
      pCanvas.width = texture.width * finalScale;
      pCanvas.height = texture.height * finalScale;
      
      pCtx.rotate((rotation * Math.PI) / 180);
      pCtx.drawImage(texture, 0, 0, pCanvas.width, pCanvas.height);
      const pattern = ctx.createPattern(pCanvas, 'repeat');
      if (pattern) {
          ctx.globalAlpha = opacity;
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, w, h);
      }
  };

  useEffect(() => { draw(); }, [draw]);

  // Helper: Convex Hull
  const convexHull = (p: Point[]): Point[] => {
     if (p.length < 3) return p;
     p.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
     const cross = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
     const lower: Point[] = [];
     for (const point of p) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
        lower.push(point);
     }
     const upper: Point[] = [];
     for (const point of p.reverse()) {
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
        upper.push(point);
     }
     upper.pop();
     lower.pop();
     return lower.concat(upper);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const assetId = await db.saveAsset(file);
      const url = await db.getAssetUrl(assetId);
      setImgSrc(url);
      setStage('upload'); 
    }
  };

  const handleSaveJob = async () => {
    if (!imgSrc) return;
    const polygon = visionResult ? convexHull(visionService.maskToPolygon(visionResult.mask, visionResult.width, visionResult.height)) : [];
    
    let thumbId = undefined;
    if (canvasRef.current) {
       const blob = await new Promise<Blob | null>(r => canvasRef.current?.toBlob(r, 'image/jpeg', 0.7));
       if (blob) {
         thumbId = await db.saveAsset(blob);
       }
    }
    
    let mainPhotoAssetId = undefined;
    if (imgSrc.startsWith('blob:')) {
       const response = await fetch(imgSrc);
       const blob = await response.blob();
       mainPhotoAssetId = await db.saveAsset(blob);
    }

    await db.saveJob({
       id: id === 'new' ? Date.now().toString() : id!,
       name: jobName,
       createdAt: Date.now(),
       mainPhotoId: mainPhotoAssetId,
       renderedPreviewId: thumbId,
       maskPoints: polygon,
       objects: roomObjects,
       productId: selectedProductId || undefined,
       scale,
       rotation,
       opacity,
       notes: '',
       status: 'draft'
    });
    navigate('/jobs');
  };

  // --- RENDER UI ---
  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-4 py-3 bg-slate-800 border-b border-slate-700 z-10 shrink-0">
         <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><X size={20} /></Button>
         <h2 className="font-bold text-sm truncate max-w-[150px]">{jobName}</h2>
         <Button variant="primary" size="sm" onClick={handleSaveJob} disabled={stage !== 'visualizing'}>
            <Save size={16} className="mr-1" /> Save
         </Button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
         {imgSrc ? (
            <canvas 
               ref={canvasRef}
               onPointerDown={handleTap} 
               className="max-w-full max-h-full object-contain touch-none"
            />
         ) : (
            <div className="text-center p-8">
               <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                 <Camera size={40} />
               </div>
               <label className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium cursor-pointer hover:bg-blue-700">
                 Take Photo
                 <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
               </label>
            </div>
         )}
         
         {/* Spinner/Feedback overlays */}
         {(stage === 'detecting_floor' || stage === 'analyzing_objects') && (
             <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <p className="text-white font-medium">{feedbackMsg}</p>
             </div>
         )}
         
         {/* Furniture Modal */}
         {showFurniturePrompt && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
               <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl space-y-4">
                  <div className="flex justify-center">
                     <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center text-blue-400">
                       <Sofa size={32} />
                     </div>
                  </div>
                  <div className="text-center">
                     <h3 className="text-xl font-bold text-white mb-2">Floor is hard to detect</h3>
                     <p className="text-slate-300 text-sm leading-relaxed">
                       Furniture or objects are confusing the floor detector. Would you like me to temporarily remove them so we can see the floor clearly?
                     </p>
                  </div>
                  <div className="space-y-3 pt-2">
                     <Button fullWidth size="lg" onClick={handleRemoveFurniture} className="bg-blue-600 hover:bg-blue-700">
                        Move Out Furniture
                     </Button>
                     <Button fullWidth variant="secondary" onClick={handleTryExistingMask} className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white">
                        Try Without Furniture
                     </Button>
                     <Button fullWidth variant="ghost" onClick={() => navigate('/')} className="text-slate-500">
                        Choose Different Photo
                     </Button>
                  </div>
               </div>
            </div>
         )}

         {/* Enhanced Legend for Review/Correction */}
         {(stage === 'review' || stage === 'correcting') && !showFurniturePrompt && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
              <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-bold border border-slate-600 shadow-xl flex items-center space-x-4">
                  <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div> Floor</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-slate-800 border border-slate-500 rounded-full mr-2"></div> Not Floor</div>
              </div>
            </div>
         )}

         {(stage === 'review' || stage === 'correcting') && feedbackMsg && !showFurniturePrompt && (
            <div className="absolute top-4 bg-slate-900/90 text-white px-4 py-2 rounded-full text-sm font-medium border border-slate-700 shadow-lg flex items-center animate-fade-in pointer-events-none">
              <AlertTriangle size={16} className="mr-2 text-yellow-400" />
              {feedbackMsg}
            </div>
         )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-slate-800 border-t border-slate-700 p-4 shrink-0 safe-area-bottom">
         {stage === 'review' && (
            <div className="space-y-3 animate-slide-up">
               <div className="flex justify-center mb-2">
                  <span className="text-sm font-medium text-slate-300">Does this area look correct?</span>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <Button variant="secondary" onClick={() => setStage('correcting')} className="border-slate-600 text-slate-300 hover:bg-slate-700">Fix Floor</Button>
                  
                  {/* Gate progress on validity */}
                  <Button 
                    variant="primary" 
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:bg-slate-700" 
                    onClick={() => setStage('visualizing')}
                    disabled={visionResult ? !visionResult.isValid : true}
                  >
                    <ThumbsUp size={18} className="mr-2" /> Looks Good
                  </Button>
               </div>
            </div>
         )}

         {stage === 'correcting' && (
            <div className="space-y-4 animate-slide-up">
               <div className="flex justify-center space-x-4">
                  <button onClick={() => setCorrectionMode('add')} className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all ${correctionMode === 'add' ? 'bg-green-600 text-white shadow-lg scale-105' : 'bg-slate-700 text-slate-400'}`}><Plus size={20} /> <span>This IS Floor</span></button>
                  <button onClick={() => setCorrectionMode('remove')} className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all ${correctionMode === 'remove' ? 'bg-red-600 text-white shadow-lg scale-105' : 'bg-slate-700 text-slate-400'}`}><Minus size={20} /> <span>NOT Floor</span></button>
               </div>
               <Button fullWidth onClick={() => setStage('visualizing')}>Use This Floor Area</Button>
            </div>
         )}

         {stage === 'visualizing' && (
            <div className="space-y-4">
               <div className="flex bg-slate-700 rounded-lg p-1">
                 <button onClick={() => setTab('products')} className={`flex-1 py-1 text-xs font-bold rounded shadow transition-all ${tab === 'products' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>Flooring</button>
                 <button onClick={() => setTab('objects')} className={`flex-1 py-1 text-xs font-bold rounded shadow transition-all flex items-center justify-center gap-1 ${tab === 'objects' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}><Armchair size={12} /> Garage ({roomObjects.length})</button>
                 <button onClick={() => setStage('review')} className="flex-1 py-1 text-xs font-bold text-slate-400 hover:text-white">Edit Mask</button>
               </div>
               
               {tab === 'products' && (
                 <>
                   <div className="flex items-center space-x-4 text-slate-300">
                      <Maximize size={16} />
                      <input type="range" min="0.5" max="2" step="0.1" value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="flex-1 accent-blue-500 h-1 bg-slate-600 rounded-lg" />
                      <RotateCw size={16} />
                      <input type="range" min="0" max="90" step="15" value={rotation} onChange={e => setRotation(parseFloat(e.target.value))} className="flex-1 accent-blue-500 h-1 bg-slate-600 rounded-lg" />
                   </div>
                   <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                      {products.map(p => (
                         <div 
                           key={p.id} 
                           onClick={() => setSelectedProductId(p.id)}
                           className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedProductId === p.id ? 'border-green-500 scale-105 shadow-xl' : 'border-slate-600 opacity-60'}`}
                         >
                           <img src={productTextures[p.id]} className="w-full h-full object-cover" />
                         </div>
                      ))}
                   </div>
                 </>
               )}
               {tab === 'objects' && (
                 <div className="space-y-2">
                    {roomObjects.length === 0 ? <div className="text-center text-slate-500 text-sm py-4">No objects detected.</div> : roomObjects.map(obj => (
                        <div key={obj.id} className="flex items-center justify-between bg-slate-700 p-2 rounded-lg">
                            <div className="flex items-center space-x-3"><img src={obj.imageUrl} className="w-8 h-8 rounded bg-slate-600" /><span className="text-sm font-medium">{obj.label}</span></div>
                            <button onClick={() => toggleObjectVisibility(obj.id)} className="text-slate-300 hover:text-white">{obj.isVisible ? <Eye size={18} /> : <EyeOff size={18} className="text-slate-500" />}</button>
                        </div>
                    ))}
                 </div>
               )}
            </div>
         )}
      </div>
    </div>
  );
};
