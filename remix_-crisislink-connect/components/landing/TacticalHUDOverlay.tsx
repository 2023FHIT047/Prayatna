
import React, { useState, useEffect } from 'react';

const TacticalHUDOverlay: React.FC = () => {
  const [coords, setCoords] = useState({ lat: 19.0760, lng: 72.8777 });
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCoords({
        lat: 19.0760 + (Math.random() - 0.5) * 0.001,
        lng: 72.8777 + (Math.random() - 0.5) * 0.001
      });
      const newLog = `0x${Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase()}_SIG_RECV`;
      setLogs(prev => [newLog, ...prev].slice(0, 15));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden 2xl:block pointer-events-none select-none">
      {/* Corner Brackets - Framing the Viewport */}
      <div className="fixed top-6 left-6 w-24 h-24 border-l-2 border-t-2 border-slate-900/10 z-[100]"></div>
      <div className="fixed top-6 right-6 w-24 h-24 border-r-2 border-t-2 border-slate-900/10 z-[100]"></div>
      <div className="fixed bottom-6 left-6 w-24 h-24 border-l-2 border-b-2 border-slate-900/10 z-[100]"></div>
      <div className="fixed bottom-6 right-6 w-24 h-24 border-r-2 border-b-2 border-slate-900/10 z-[100]"></div>

      {/* LEFT COMMAND RAIL: System Logs & Node Status */}
      <div className="fixed left-0 top-0 bottom-0 w-20 flex flex-col justify-between py-12 px-4 z-[90] border-r border-slate-100/50 bg-white/30 backdrop-blur-[2px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <div className="w-8 h-1 bg-red-600 mb-2"></div>
            <p className="text-[8px] font-mono font-black text-slate-900 tracking-tighter">NODE_77</p>
            <p className="text-[7px] font-mono text-slate-400">UPTIME: 100%</p>
          </div>
          
          <div className="flex flex-col gap-2 pt-8">
            <p className="text-[8px] font-mono font-black text-slate-300 uppercase rotate-90 origin-left translate-x-1 mb-12">SYSTEM_LOGS</p>
            {logs.map((log, i) => (
              <p key={i} className="text-[7px] font-mono text-slate-400 opacity-40">{log}</p>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="w-1 h-32 bg-slate-100 rounded-full overflow-hidden">
            <div className="w-full bg-red-600 animate-pulse h-1/2"></div>
          </div>
          <p className="text-[8px] font-mono font-black text-slate-400 rotate-90 uppercase tracking-widest">Signal_Str</p>
        </div>
      </div>

      {/* RIGHT COMMAND RAIL: Geo-Intel & Telemetry */}
      <div className="fixed right-0 top-0 bottom-0 w-20 flex flex-col justify-between py-12 px-4 z-[90] border-l border-slate-100/50 bg-white/30 backdrop-blur-[2px]">
        <div className="text-right space-y-6">
          <div>
            <p className="text-[9px] font-mono font-black text-slate-900">INTEL_GRID</p>
            <p className="text-[7px] font-mono text-slate-400">SEC_LEVEL_4</p>
          </div>
          
          <div className="flex flex-col gap-3 pt-4">
            <div className="flex flex-col items-end">
              <span className="text-[7px] font-mono font-black text-slate-300">LATITUDE</span>
              <span className="text-[9px] font-mono font-black text-red-600">{coords.lat.toFixed(4)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[7px] font-mono font-black text-slate-300">LONGITUDE</span>
              <span className="text-[9px] font-mono font-black text-red-600">{coords.lng.toFixed(4)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 rounded-full border border-dashed border-slate-300 flex items-center justify-center animate-spin-slow">
            <div className="w-1 h-4 bg-slate-900 rounded-full"></div>
          </div>
          <p className="text-[8px] font-mono font-black text-slate-400 rotate-90 uppercase tracking-widest whitespace-nowrap">Compass_Active</p>
          <div className="w-8 h-1 bg-slate-900 mt-4"></div>
        </div>
      </div>

      {/* Vertical Data Streams (Background Gutter) */}
      <div className="fixed left-[84px] top-0 bottom-0 w-px bg-slate-100 opacity-50 z-[80]"></div>
      <div className="fixed right-[84px] top-0 bottom-0 w-px bg-slate-100 opacity-50 z-[80]"></div>
    </div>
  );
};

export default TacticalHUDOverlay;
