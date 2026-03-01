
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../types';
import { 
  Shield, 
  Globe, 
  Heart, 
  Briefcase, 
  Users, 
  ChevronUp, 
  Zap, 
  Fingerprint,
  MousePointer2,
  ArrowRightLeft
} from 'lucide-react';
import { cn } from '../../lib/utils';

const PrototypeSwitcher: React.FC = () => {
  const { role, setPrototypeRole } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Check if user has already opened the menu this session
    const interacted = sessionStorage.getItem('persona_interacted');
    if (interacted) setHasInteracted(true);
  }, []);

  const roles: { id: UserRole; label: string; sub: string; icon: React.ReactNode; color: string }[] = [
    { id: 'admin', label: 'Strategic Admin', sub: 'National HQ Control', icon: <Shield size={14} />, color: 'bg-red-600' },
    { id: 'coordinator', label: 'Sector Coordinator', sub: 'Regional Ops Hub', icon: <Globe size={14} />, color: 'bg-indigo-600' },
    { id: 'volunteer', label: 'Field Unit', sub: 'Active Response Node', icon: <Heart size={14} />, color: 'bg-blue-600' },
    { id: 'resource_manager', label: 'Logistics Lead', sub: 'Supply Depot Management', icon: <Briefcase size={14} />, color: 'bg-emerald-600' },
    { id: 'community', label: 'Citizen Portal', sub: 'Civilian Hazard Intel', icon: <Users size={14} />, color: 'bg-amber-500' },
  ];

  const handleSwitch = (newRole: UserRole) => {
    setPrototypeRole(newRole);
    setIsOpen(false);
    sessionStorage.setItem('persona_interacted', 'true');
    setHasInteracted(true);
    navigate('/dashboard');
  };

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col items-start gap-4">
      {/* TOOLTIP HINT - Only shows if they haven't used it yet */}
      {!hasInteracted && !isOpen && (
        <div className="bg-yellow-500 text-[#002147] px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest animate-bounce shadow-xl flex items-center gap-2 border-2 border-white">
          <MousePointer2 size={12} /> Click to Switch User Roles
        </div>
      )}

      {isOpen && (
        <div className="bg-white border-2 border-[#002147] p-4 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,33,71,0.3)] flex flex-col gap-2 animate-in slide-in-from-bottom-6 duration-500 w-72">
          <div className="px-4 py-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <Fingerprint size={14} className="text-[#002147]" />
              <p className="text-[10px] font-black text-[#002147] uppercase tracking-widest leading-none">Persona Selector</p>
            </div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Instant access to all demo dashboards</p>
          </div>

          <div className="space-y-1">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSwitch(r.id)}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all w-full group text-left",
                  role === r.id 
                    ? "bg-[#002147] text-white shadow-lg shadow-blue-900/20" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#002147]"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl text-white shadow-md transition-transform group-hover:scale-110",
                  role === r.id ? "bg-white/20" : r.color
                )}>
                  {r.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{r.label}</p>
                  <p className={cn(
                    "text-[7px] font-bold uppercase tracking-tight",
                    role === r.id ? "text-blue-200" : "text-slate-400"
                  )}>{r.sub}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-2 p-3 bg-slate-50 rounded-2xl flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <p className="text-[8px] font-black uppercase text-slate-400">Prototype Environment 2.5v</p>
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "px-6 py-5 bg-[#002147] text-white rounded-[2rem] shadow-2xl flex items-center gap-4 border-2 transition-all group overflow-hidden relative",
          isOpen ? "border-yellow-500" : "border-white/10 hover:border-yellow-500/50",
          !hasInteracted && "animate-pulse ring-4 ring-yellow-500/30"
        )}
      >
        {/* Animated background element */}
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className={cn(
          "p-2.5 rounded-2xl shadow-xl transition-all duration-500",
          isOpen ? "bg-yellow-500 text-[#002147] rotate-180" : "bg-white/10 text-yellow-500 group-hover:rotate-12"
        )}>
          <ArrowRightLeft size={20} strokeWidth={3} />
        </div>

        <div className="text-left relative z-10">
          <p className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.3em] leading-none mb-1.5">Demo Console</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-white uppercase tracking-tighter leading-none">
              {role?.replace('_', ' ')} <span className="text-white/40">View</span>
            </p>
          </div>
        </div>

        <div className={cn(
          "ml-2 transition-transform duration-500",
          isOpen && "rotate-180"
        )}>
          <ChevronUp size={20} className="text-yellow-500" />
        </div>
      </button>

      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(234, 179, 8, 0); }
          100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
        }
        .animate-pulse-strategic {
          animation: pulse-ring 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default PrototypeSwitcher;
