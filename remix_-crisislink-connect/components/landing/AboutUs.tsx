
import React, { useState } from 'react';
import { Info, Shield, Target, Award, ListChecks, ArrowRight, Building2, Radio } from 'lucide-react';
import { cn } from '../../lib/utils';

type Section = 'about' | 'facilities' | 'functions' | 'objectives';

const AboutUs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Section>('about');

  const content = {
    about: {
      title: "About Disaster Management",
      body: `The CrisisLink National Command Deck was established with a singular strategic aim: to minimize loss of life and property during complex disasters across the Indian subcontinent. 

      We coordinate seamlessly between central aid agencies, state-level responders, and localized volunteer hubs. Following the evolution of digital crisis response, our platform serves as a modern extension of traditional Disaster Management Units, utilizing AI to verify signals and expedite rescue decision-making.`,
      icon: <Info className="text-[#002147]" size={32} />,
      // Fix: Add empty list to ensure type consistency across the content union
      list: []
    },
    facilities: {
      title: "Strategic Facilities",
      body: "The CrisisLink platform is integrated with the following mission-critical infrastructure:",
      list: [
        "Direct Emergency Hotlines linked to NDRF/SDRF hubs.",
        "Real-time Weather Data ingestion from 60+ AWS sensor locations.",
        "Verified Multi-Source Incident Reporting Pipeline.",
        "Encrypted Volunteer Communication & Coordination Hubs.",
        "GIS-based Tactical Maps for spatial situational awareness.",
        "Resource Inventory Tracking across 18+ Urban Command Centers."
      ],
      icon: <Building2 className="text-yellow-600" size={32} />
    },
    functions: {
      title: "Operational Functions",
      body: "Key functions executed within our command infrastructure include:",
      list: [
        "Detection and Dissemination of early warning signals.",
        "Verification of field incident reports using AI analysis.",
        "Strategic routing of nearest responders to critical zones.",
        "Resource load-balancing across medical and food depots.",
        "Public education and survival protocol distribution."
      ],
      icon: <Radio className="text-red-600" size={32} />
    },
    objectives: {
      title: "Core Objectives",
      body: "Our strategic roadmap centers on national resilience and proactive defense:",
      list: [
        "Achieving zero-latency in emergency reporting and verification.",
        "Strengthening community-level responder networks (Aapda Mitra).",
        "Integrating Disaster Risk Reduction (DRR) into urban planning tools.",
        "Fostering a nationwide culture of data-driven preparedness."
      ],
      icon: <Target className="text-emerald-600" size={32} />
    }
  };

  const activeContent = content[activeTab];

  return (
    <section className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-12">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          {/* Vertical Menu */}
          <div className="lg:w-1/3 w-full">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-1 bg-red-600"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#002147]">Institutional Profile</span>
            </div>
            <h2 className="text-4xl font-black text-[#002147] tracking-tight uppercase mb-10">Who We Are</h2>
            
            <div className="space-y-1">
              {[
                { id: 'about', label: 'Identity & Mission', icon: <Shield size={18} /> },
                { id: 'facilities', label: 'Strategic Infrastructure', icon: <Award size={18} /> },
                { id: 'functions', label: 'Key Functions', icon: <ListChecks size={18} /> },
                { id: 'objectives', label: 'Primary Objectives', icon: <Target size={18} /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Section)}
                  className={cn(
                    "w-full flex items-center justify-between px-8 py-6 text-[11px] font-black uppercase tracking-[0.15em] transition-all border-l-4 text-left group",
                    activeTab === tab.id 
                      ? "bg-slate-50 text-[#002147] border-[#002147] shadow-sm" 
                      : "text-slate-400 hover:text-slate-600 border-transparent bg-white hover:bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {tab.icon}
                    {tab.label}
                  </div>
                  <ArrowRight size={16} className={cn("transition-transform", activeTab === tab.id ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0")} />
                </button>
              ))}
            </div>
          </div>

          {/* Detailed View Area */}
          <div className="lg:w-2/3 w-full bg-[#f8fafc] p-12 sm:p-16 border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
               {activeContent.icon}
            </div>
            
            <div className="relative z-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-3xl font-black text-[#002147] tracking-tight mb-8 border-b-2 border-yellow-500 pb-4 inline-block">{activeContent.title}</h3>
              <p className="text-slate-600 font-medium leading-relaxed mb-10 text-lg">
                {activeContent.body}
              </p>
              
              {activeContent.list && activeContent.list.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeContent.list.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 group">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></div>
                      <span className="text-sm font-bold text-slate-700 leading-snug group-hover:text-[#002147] transition-colors">{item}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-16 flex items-center gap-4">
                 <button className="px-8 py-4 bg-[#002147] text-white text-[10px] font-black uppercase tracking-widest rounded shadow-lg hover:bg-slate-900 transition-all">
                   View Detailed Reports
                 </button>
                 <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-all">
                   Organizational Chart
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
