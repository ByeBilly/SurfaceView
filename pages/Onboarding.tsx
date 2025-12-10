
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { Button } from '../components/Button';
import { Building2 } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();

  const handleStart = async () => {
    await db.markWelcomeSeen();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto text-blue-600 shadow-xl shadow-blue-100">
          <Building2 size={48} />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">SurfaceView</h1>
          <p className="text-slate-500 text-lg leading-relaxed">
            The professional offline flooring visualization tool for tradespeople. 
            Visualize carpet, tile, and plank flooring directly on site.
          </p>
        </div>

        <div className="pt-8 space-y-4">
          <Button fullWidth size="lg" onClick={handleStart} className="shadow-lg shadow-blue-500/30">
            Get Started
          </Button>
          <p className="text-xs text-slate-400">
            No account required. All data stored locally on your device.
          </p>
        </div>
      </div>
    </div>
  );
};
