
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { db } from '../services/db';
import { Product, FlooringType } from '../types';
import { Button } from '../components/Button';
import { Trash2, Plus, Upload, Loader2 } from 'lucide-react';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // New product form
  const [name, setName] = useState('');
  const [type, setType] = useState<FlooringType>(FlooringType.Plank);
  const [widthMm, setWidthMm] = useState(200);
  const [lengthMm, setLengthMm] = useState(1200);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const prods = await db.getProducts();
    setProducts(prods);
    
    // Resolve all image URLs
    const urls: Record<string, string> = {};
    for (const p of prods) {
      if (p.masterTextureId) {
        urls[p.id] = await db.getAssetUrl(p.masterTextureId);
      } else if (p.masterTextureUrl) {
        urls[p.id] = p.masterTextureUrl;
      }
    }
    setResolvedUrls(urls);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this product?')) {
      await db.deleteProduct(id);
      loadProducts();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!name || !selectedFile) return;
    setIsSaving(true);
    
    try {
      // 1. Save Asset
      const assetId = await db.saveAsset(selectedFile);
      
      // 2. Save Product
      const newProduct: Product = {
        id: Date.now().toString(),
        name,
        type,
        widthMm,
        lengthMm,
        masterTextureId: assetId,
      };
      
      await db.saveProduct(newProduct);
      
      // Reset
      setIsAdding(false);
      setName('');
      setSelectedFile(null);
      setPreviewUrl(null);
      loadProducts();
      
    } catch (e) {
      console.error(e);
      alert('Failed to save product');
    }
    setIsSaving(false);
  };

  return (
    <Layout title="Product Catalogue" showBack>
      <div className="p-4">
        {!isAdding ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {/* Add New Card */}
               <button 
                onClick={() => setIsAdding(true)}
                className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors h-40"
               >
                 <Plus size={32} className="mb-2" />
                 <span className="font-medium">Add Product</span>
               </button>

               {products.map(product => (
                 <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-row h-40 relative">
                   <div className="w-1/3 bg-slate-100">
                     <img src={resolvedUrls[product.id]} className="w-full h-full object-cover" alt={product.name} />
                   </div>
                   <div className="p-4 flex-1 flex flex-col justify-between">
                     <div>
                       <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{product.type}</span>
                       <h3 className="font-bold text-slate-900 mt-2">{product.name}</h3>
                       <p className="text-xs text-slate-500">{product.widthMm}mm x {product.lengthMm}mm</p>
                     </div>
                     <button 
                       onClick={() => handleDelete(product.id)}
                       className="absolute bottom-4 right-4 p-2 text-slate-400 hover:text-red-600 transition-colors"
                     >
                       <Trash2 size={18} />
                     </button>
                   </div>
                 </div>
               ))}
            </div>
          </>
        ) : (
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold mb-6">New Product</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                <input 
                  className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Vintage Oak"
                />
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Texture Image</label>
                 <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 relative overflow-hidden">
                    {previewUrl ? (
                      <img src={previewUrl} className="h-full object-contain z-10" alt="Preview" />
                    ) : (
                      <div className="text-center text-slate-400">
                        <Upload className="mx-auto mb-1" />
                        <span className="text-xs">Upload Photo</span>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                 </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select 
                      className="w-full border p-2 rounded-lg"
                      value={type}
                      onChange={e => setType(e.target.value as FlooringType)}
                    >
                      {Object.values(FlooringType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Width (mm)</label>
                    <input 
                      type="number"
                      className="w-full border p-2 rounded-lg"
                      value={widthMm}
                      onChange={e => setWidthMm(parseInt(e.target.value))}
                    />
                 </div>
              </div>
               
               {/* Length field only if not carpet maybe? But carpet has roll width. Keeping generic */}
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Length (mm)</label>
                  <input 
                    type="number"
                    className="w-full border p-2 rounded-lg"
                    value={lengthMm}
                    onChange={e => setLengthMm(parseInt(e.target.value))}
                  />
               </div>

              <div className="pt-4 flex space-x-3">
                <Button variant="secondary" fullWidth onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button fullWidth onClick={handleSave} disabled={!name || !selectedFile || isSaving} loading={isSaving}>
                  Save Product
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
