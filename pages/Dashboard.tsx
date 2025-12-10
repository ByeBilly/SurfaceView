
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { db } from '../services/db';
import { BusinessProfile, Job, SampleRoom } from '../types';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, ChevronRight, FileImage, Settings as SettingsIcon, AlertCircle, ArrowRight, Trash2, Camera, Upload } from 'lucide-react';
import { EXAMPLE_ROOMS } from '../constants';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [customSamples, setCustomSamples] = useState<SampleRoom[]>([]);
  // We need to resolve Blob URLs for display
  const [resolvedSampleUrls, setResolvedSampleUrls] = useState<Record<string, string>>({});
  const [resolvedJobUrls, setResolvedJobUrls] = useState<Record<string, string>>({});
  
  const [isUploadingSample, setIsUploadingSample] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Check welcome
      const seen = await db.hasSeenWelcome();
      if (!seen) {
        navigate('/onboarding');
        return;
      }
      
      const p = await db.getProfile();
      setProfile(p);

      const allJobs = await db.getJobs();
      const sorted = allJobs.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
      setRecentJobs(sorted);
      
      // Resolve Job URLs (Thumbnail might be URL or Asset ID)
      const jUrls: Record<string, string> = {};
      for (const j of sorted) {
        if (j.renderedPreviewUrl) jUrls[j.id] = j.renderedPreviewUrl; // Legacy/Base64
        else if (j.renderedPreviewId) jUrls[j.id] = await db.getAssetUrl(j.renderedPreviewId);
        else if (j.mainPhotoId) jUrls[j.id] = await db.getAssetUrl(j.mainPhotoId);
        else if (j.mainPhotoUrl) jUrls[j.id] = j.mainPhotoUrl;
      }
      setResolvedJobUrls(jUrls);

      const samples = await db.getSampleRooms();
      setCustomSamples(samples);
      
      // Resolve Sample URLs
      const sUrls: Record<string, string> = {};
      for (const s of samples) {
        if (s.assetId) {
          sUrls[s.id] = await db.getAssetUrl(s.assetId);
        } else if (s.url) {
          sUrls[s.id] = s.url;
        }
      }
      setResolvedSampleUrls(sUrls);
    };
    loadData();
  }, [navigate]);

  if (!profile) return null;

  const handleStartExample = (imageUrl: string, roomName: string) => {
    navigate('/visualizer/new', { 
      state: { 
        imageUrl, // This works for Blob URLs too
        defaultName: `${roomName} Demo`
      } 
    });
  };

  const handleUploadSample = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingSample(true);
      try {
        const file = e.target.files[0];
        
        // Save to DB Assets
        const assetId = await db.saveAsset(file);
        
        const newRoom: SampleRoom = {
          id: Date.now().toString(),
          name: `My Room ${customSamples.length + 1}`,
          assetId: assetId,
          createdAt: Date.now()
        };
        
        await db.saveSampleRoom(newRoom);
        
        // Refresh
        const updatedSamples = await db.getSampleRooms();
        setCustomSamples(updatedSamples);
        const url = await db.getAssetUrl(assetId);
        setResolvedSampleUrls(prev => ({...prev, [newRoom.id]: url}));
        
      } catch (err) {
        console.error(err);
        alert("Failed to save sample room");
      }
      setIsUploadingSample(false);
    }
  };

  const handleDeleteSample = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Remove this room from your samples?')) {
      await db.deleteSampleRoom(id);
      setCustomSamples(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-8">
        {/* Welcome Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Welcome</h2>
            <h1 className="text-2xl font-bold text-slate-900">{profile.contactName}</h1>
            <p className="text-slate-400 text-sm">{profile.businessName}</p>
          </div>
          <div className="bg-blue-100 text-blue-700 p-2 rounded-lg font-bold">
            SV
          </div>
        </div>

        {/* Setup Prompt */}
        {!profile.isSetup && (
          <div onClick={() => navigate('/settings')} className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start space-x-3 cursor-pointer hover:bg-orange-100 transition-colors animate-fade-in">
            <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-bold text-orange-800 text-sm">Complete your profile</h3>
              <p className="text-orange-600 text-xs mt-1">Add your business details to include them on exported job packages.</p>
            </div>
            <ChevronRight className="text-orange-300 ml-auto self-center" size={18} />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/visualizer/new')}
            className="bg-blue-600 text-white p-4 rounded-xl shadow-lg shadow-blue-200 flex flex-col items-center justify-center space-y-2 hover:bg-blue-700 transition-colors"
          >
            <div className="bg-white/20 p-2 rounded-full">
              <Plus size={24} />
            </div>
            <span className="font-semibold">New Job</span>
          </button>
          
          <button 
            onClick={() => navigate('/products')}
            className="bg-white text-slate-700 border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center space-y-2 hover:bg-slate-50 transition-colors"
          >
            <div className="bg-slate-100 p-2 rounded-full text-slate-600">
              <FileImage size={24} />
            </div>
            <span className="font-semibold">Catalogue</span>
          </button>
        </div>

        {/* Sample Rooms */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4">Sample Rooms</h3>
          <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
            
            {/* Upload Button */}
            <label className="flex-shrink-0 w-32 h-32 relative rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-slate-300 hover:bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-300 transition-colors">
               <input type="file" accept="image/*" className="hidden" onChange={handleUploadSample} disabled={isUploadingSample} />
               {isUploadingSample ? (
                 <span className="text-xs">Saving...</span>
               ) : (
                 <>
                   <Upload size={24} className="mb-2" />
                   <span className="text-xs font-bold">Add Photo</span>
                 </>
               )}
            </label>

            {/* Custom Samples */}
            {customSamples.map(room => (
              <div 
                key={room.id}
                onClick={() => handleStartExample(resolvedSampleUrls[room.id] || '', room.name)}
                className="flex-shrink-0 w-48 h-32 relative rounded-xl overflow-hidden cursor-pointer group border border-slate-200 shadow-sm"
              >
                {resolvedSampleUrls[room.id] ? (
                  <img src={resolvedSampleUrls[room.id]} alt={room.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center"><div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400"></div></div>
                )}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => handleDeleteSample(e, room.id)} className="bg-black/50 hover:bg-red-600 text-white p-1.5 rounded-full backdrop-blur-sm">
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
                  <span className="text-white font-medium text-xs flex items-center truncate">
                    {room.name}
                  </span>
                </div>
              </div>
            ))}

            {/* Default Examples */}
            {EXAMPLE_ROOMS.map(room => (
              <div 
                key={room.id}
                onClick={() => handleStartExample(room.url, room.name)}
                className="flex-shrink-0 w-60 h-32 relative rounded-xl overflow-hidden cursor-pointer group"
              >
                <img src={room.url} alt={room.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
                  <span className="text-white font-medium text-sm flex items-center">
                    {room.name} <ArrowRight size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Jobs */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">Recent Jobs</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>View All</Button>
          </div>

          <div className="space-y-3">
            {recentJobs.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl border border-slate-200 border-dashed">
                <p className="text-slate-400">No jobs yet. Start a new job or try an example room above!</p>
              </div>
            ) : (
              recentJobs.map(job => (
                <div 
                  key={job.id} 
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={resolvedJobUrls[job.id] || ''} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{job.name}</h4>
                    <p className="text-slate-500 text-sm truncate">{job.clientName || 'No Client Name'}</p>
                    <div className="flex items-center text-xs text-slate-400 mt-1">
                      <Clock size={12} className="mr-1" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
