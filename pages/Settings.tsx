
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { db } from '../services/db';
import { BusinessProfile } from '../types';
import { Button } from '../components/Button';
import { User, Phone, Building2, Save } from 'lucide-react';

export const Settings: React.FC = () => {
  const [formData, setFormData] = useState<BusinessProfile>({
    businessName: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    isSetup: false
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    db.getProfile().then(p => {
      if (p) setFormData(p);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSave = async () => {
    await db.saveProfile(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Layout title="Settings" showBack>
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center space-x-2 text-blue-600 border-b border-slate-100 pb-4">
             <Building2 size={24} />
             <h2 className="text-lg font-bold text-slate-900">Business Profile</h2>
          </div>
          <p className="text-sm text-slate-500">
            These details will appear on your exported Job Packages and PDF reports.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
              <input 
                type="text" 
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Acme Flooring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
              <div className="relative">
                 <User className="absolute top-2.5 left-3 text-slate-400" size={18} />
                 <input 
                  type="text" 
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
               <div className="relative">
                 <Phone className="absolute top-2.5 left-3 text-slate-400" size={18} />
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="(555) 000-0000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="City, State"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button fullWidth onClick={handleSave} className="flex items-center justify-center">
              {saved ? 'Saved!' : <><Save size={18} className="mr-2" /> Save Profile</>}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
