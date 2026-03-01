
import React from 'react';
import { ArrowRight, ShieldCheck, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection: React.FC = () => {
  return (
    <section className="relative h-[550px] flex items-center overflow-hidden bg-[#002147]">
      {/* Background Graphic - Tactical Command Center Visual */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1587573089734-09cb99c7a0b4?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover opacity-40 mix-blend-overlay scale-105" 
          alt="Crisis Control Command Center" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#002147] via-[#002147]/85 to-transparent"></div>
        {/* Subtle Map Mesh Overlay */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      </div>
      
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-12 relative z-10 w-full">
        <div className="max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 animate-in fade-in slide-in-from-left-4 duration-500">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500">
              National Response Infrastructure
            </span>
          </div>

          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight uppercase animate-in fade-in slide-in-from-bottom-4 duration-700">
            Disaster Resilience <br />
            <span className="text-yellow-400 font-black">Through Intelligence</span>
          </h2>

          <p className="text-lg sm:text-xl text-slate-300 font-medium max-w-2xl leading-relaxed animate-in fade-in duration-1000">
            Our mission is to minimize the loss of life and property by integrating advanced AI verification, localized reporting, and coordinated volunteer mobilization across all Indian sectors.
          </p>

          <div className="flex flex-wrap gap-5 pt-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <Link to="/map" className="px-10 py-5 bg-yellow-500 text-[#002147] font-black text-xs uppercase tracking-[0.2em] rounded shadow-2xl hover:bg-yellow-400 transition-all flex items-center gap-3">
              View National Map <ArrowRight size={18} />
            </Link>
            <Link to="/auth?tab=register" className="px-10 py-5 bg-white/10 text-white font-black text-xs uppercase tracking-[0.2em] rounded backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all flex items-center gap-3">
              Join National Force
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-12 pt-12 border-t border-white/10 opacity-60">
             <div className="flex items-center gap-4">
                <ShieldCheck className="text-yellow-500" size={24} />
                <div className="text-white">
                  <p className="text-2xl font-black">1.2K</p>
                  <p className="text-[9px] font-black uppercase tracking-widest">Responders</p>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <Globe className="text-yellow-500" size={24} />
                <div className="text-white">
                  <p className="text-2xl font-black">18+</p>
                  <p className="text-[9px] font-black uppercase tracking-widest">Urban Hubs</p>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="text-white">
                  <p className="text-2xl font-black">100%</p>
                  <p className="text-[9px] font-black uppercase tracking-widest">Verified Feed</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
