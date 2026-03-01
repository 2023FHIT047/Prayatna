
import React, { useState, useEffect } from 'react';
import { Megaphone, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const TacticalTicker: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const alerts = [
    { type: 'ADVISORY', text: 'Monsoon preparedness drills scheduled for Delhi-NCR regions on 25th March.' },
    { type: 'NEWS', text: 'New AI-Verified Incident Reporting module is now live for all citizen users.' },
    { type: 'INFO', text: 'Contact 1070 for National Disaster Helpline or 1078 for NDRF response.' },
    { type: 'UPDATE', text: 'Mumbai Coastal Road emergency lanes successfully integrated into the Tactical Map.' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % alerts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#ffcc00] border-y border-black/5 py-3 overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-12 flex items-center gap-8">
        {/* News Label */}
        <div className="flex items-center gap-3 bg-[#002147] text-white px-6 py-1.5 rounded-sm shrink-0 shadow-lg">
          <Megaphone size={14} className="animate-bounce" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">Latest Updates</span>
        </div>

        {/* Scrolling Content Area */}
        <div className="flex-grow flex items-center relative h-6 overflow-hidden">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={cn(
                "absolute inset-0 flex items-center gap-4 transition-all duration-1000 ease-in-out whitespace-nowrap",
                idx === currentIndex ? "translate-x-0 opacity-100" : (idx < currentIndex ? "-translate-x-full opacity-0" : "translate-x-full opacity-0")
              )}
            >
              <span className="text-[10px] font-black uppercase bg-black/10 px-2 py-0.5 rounded tracking-widest text-[#002147]">{alert.type}</span>
              <span className="text-xs sm:text-sm font-bold text-[#002147] tracking-tight">{alert.text}</span>
            </div>
          ))}
        </div>

        {/* View All */}
        <button className="hidden md:flex items-center gap-2 shrink-0 group">
          <span className="text-[10px] font-black text-[#002147] uppercase tracking-widest border-b border-[#002147]/20">Archive</span>
          <ArrowRight size={14} className="text-[#002147] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default TacticalTicker;
