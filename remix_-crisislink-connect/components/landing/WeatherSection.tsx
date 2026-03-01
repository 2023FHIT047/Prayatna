
import React from 'react';
import { CloudRain, Wind, Droplets, Thermometer, Zap } from 'lucide-react';

const WeatherSection: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden group">
      <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
               <Thermometer size={16} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest">Atmospheric Node: Mumbai</h3>
         </div>
         <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase text-slate-400">Live Feed</span>
         </div>
      </div>

      <div className="p-10 flex-grow grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
           <div className="flex items-baseline gap-2">
              <span className="text-7xl font-black text-slate-900 tracking-tighter">34°</span>
              <span className="text-2xl font-black text-slate-300">C</span>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Ambient Air Temp • Updated 1min ago</p>
           
           <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <CloudRain size={12} /> <span className="text-[9px] font-black uppercase tracking-widest">Precip</span>
                 </div>
                 <p className="text-sm font-black text-slate-900">0.00mm</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Wind size={12} /> <span className="text-[9px] font-black uppercase tracking-widest">Wind</span>
                 </div>
                 <p className="text-sm font-black text-slate-900">8.0km/h</p>
              </div>
           </div>
        </div>

        <div className="relative aspect-square bg-slate-50 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center shadow-inner overflow-hidden group-hover:scale-105 transition-transform">
           <div className="absolute top-4 left-4">
              <Zap size={20} className="text-orange-500" />
           </div>
           <div className="flex flex-col items-center">
              <div className="text-4xl font-black text-slate-900 mb-1">44%</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Humidity</p>
           </div>
           <div className="mt-6 px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl">
              Forecast: Stable
           </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherSection;
