import React from 'react';
import { Users, Shield, Heart, UserCheck } from 'lucide-react';

const OurActivity: React.FC = () => {
  const activities = [
    { label: "Community", icon: <Users size={18} /> },
    { label: "Volunteer", icon: <UserCheck size={18} /> },
    { label: "Rescue", icon: <Shield size={18} /> },
    { label: "Relief", icon: <Heart size={18} /> },
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      {activities.map((act, i) => (
        <div key={i} className="group relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 h-20 flex items-center px-6 gap-4 hover:bg-red-50 transition-colors">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
            {act.icon}
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Active Sector</p>
            <p className="text-xs font-black text-slate-900 uppercase">{act.label} Force</p>
          </div>
          <div className="ml-auto">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OurActivity;