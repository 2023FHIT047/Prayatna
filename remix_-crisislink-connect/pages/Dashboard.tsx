import React, { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { profile, role } = useAuth();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    // Prototype optimization: Instant redirection
    if (role) {
      const routes: Record<string, string> = {
        admin: '/admin',
        coordinator: '/coordinator',
        community: '/community',
        volunteer: '/volunteer',
        resource_manager: '/resources'
      };

      const target = routes[role] || '/community';
      // Added a tiny delay to show the "Strategic Link" transition briefly
      const timer = setTimeout(() => {
        navigate(target, { replace: true });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [role, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <div className="relative">
          <RefreshCw className="animate-spin text-[#002147]" size={40} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-[11px] font-black text-[#002147] uppercase tracking-[0.5em] mb-2">Establishing Strategic Link</h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prototype Persona Hydration...</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;