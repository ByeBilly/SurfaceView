import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Briefcase, Package, Settings, ChevronLeft } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
  title?: string;
  showBack?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, hideNav = false, title, showBack }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center shadow-sm z-10 shrink-0">
        {showBack && (
          <button onClick={() => navigate(-1)} className="mr-3 p-1 rounded-full hover:bg-slate-100 text-slate-600">
            <ChevronLeft size={24} />
          </button>
        )}
        <h1 className="text-lg font-bold text-slate-800 flex-1 truncate">
          {title || 'SurfaceView'}
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {children}
      </main>

      {/* Bottom Navigation (Mobile First) */}
      {!hideNav && (
        <nav className="bg-white border-t border-slate-200 px-6 py-2 flex justify-between items-center shrink-0 safe-area-bottom">
          <NavItem 
            icon={<LayoutDashboard size={22} />} 
            label="Home" 
            active={isActive('/')} 
            onClick={() => navigate('/')} 
          />
          <NavItem 
            icon={<Briefcase size={22} />} 
            label="Jobs" 
            active={isActive('/jobs')} 
            onClick={() => navigate('/jobs')} 
          />
          <div className="-mt-8">
            <button 
              onClick={() => navigate('/visualizer/new')}
              className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform active:scale-95"
            >
              <PlusCircle size={28} />
            </button>
          </div>
          <NavItem 
            icon={<Package size={22} />} 
            label="Products" 
            active={isActive('/products')} 
            onClick={() => navigate('/products')} 
          />
          <NavItem 
            icon={<Settings size={22} />} 
            label="Settings" 
            active={isActive('/settings')} 
            onClick={() => navigate('/settings')} 
          />
        </nav>
      )}
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ 
  icon, label, active, onClick 
}) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center w-16 py-1 rounded-lg transition-colors ${
      active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <div className="mb-1">{icon}</div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);
