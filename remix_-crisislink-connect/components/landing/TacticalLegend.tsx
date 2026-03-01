
import React from 'react';
import { Users, Heart, Briefcase, Globe, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

const TacticalLegend: React.FC = () => {
  const roles = [
    { id: 'community', label: 'Community', icon: <Users size={16} />, desc: 'Primary reporters for hazards.' },
    { id: 'volunteer', label: 'Volunteer', icon: <Heart size={16} />, desc: 'Field responders for missions.' },
    { id: 'manager', label: 'Resource Mgr', icon: <Briefcase size={16} />, desc: 'Logistics distribution.' },
    { id: 'coordinator', label: 'Coordinator', icon: <Globe size={16} />, desc: 'Sector command deployment.' },
  ];

  const markers = [
    { label: 'Critical', color: 'bg-red-600', desc: 'Life-threatening events.' },
    { label: 'High', color: 'bg-orange-500', desc: 'Severe property risk.' },
    { label: 'Medium', color: 'bg-yellow-500', desc: 'Controlled hazards.' },
    { label: 'Low', color: 'bg-blue-500', desc: 'General observation.' },
  ];

  return (
    <section className="bg-white py-12 border-b border-slate-100">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Roles Briefing */}
        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-md">
              <Info size={16} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 leading-none">Personnel Protocols</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-red-500 transition-colors group text-left">
                <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                  {role.icon}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-900 tracking-wider leading-none mb-1">{role.label}</p>
                  <p className="text-[10px] text-slate-400 font-bold leading-tight">{role.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Symbology Briefing */}
        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-600 text-white rounded-xl shadow-md">
              <AlertTriangle size={16} />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 leading-none">Tactical Symbology</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {markers.map((marker) => (
              <div key={marker.label} className="flex flex-col items-center text-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm group hover:border-red-200 transition-colors">
                <div className={cn("w-3 h-3 rounded-full mb-3 shadow-inner group-hover:scale-125 transition-transform", marker.color)}></div>
                <p className="text-[9px] font-black uppercase text-slate-900 mb-1 tracking-widest">{marker.label}</p>
                <p className="text-[8px] text-slate-400 font-bold leading-tight">{marker.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default TacticalLegend;
