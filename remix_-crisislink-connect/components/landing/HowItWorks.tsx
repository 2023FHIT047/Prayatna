
import React from 'react';
import { 
  Radar, 
  Smartphone, 
  Settings2, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Globe
} from 'lucide-react';
import { cn, downloadInstitutionalGuide } from '../../lib/utils';

const steps = [
  { 
    id: '01',
    title: 'Detection', 
    subtitle: 'EARLY WARNING',
    description: 'System-wide monitoring of environmental sensors and weather satellites for pre-disaster indicators.',
    icon: <Radar size={24} />,
    color: 'bg-[#002147]'
  },
  { 
    id: '02',
    title: 'Verification', 
    subtitle: 'AI FIELD INTEL',
    description: 'Instant analysis of citizen-reported data using multimodal AI to confirm event authenticity.',
    icon: <ShieldCheck size={24} />,
    color: 'bg-red-600'
  },
  { 
    id: '03',
    title: 'Mobilization', 
    subtitle: 'COMMAND HUB',
    description: 'Strategic deployment of localized volunteer forces and provisioning from regional resource depots.',
    icon: <Settings2 size={24} />,
    color: 'bg-[#002147]'
  },
  { 
    id: '04',
    title: 'Response', 
    subtitle: 'GROUND ACTION',
    description: 'On-site execution of rescue operations and continuous situation reports until sector is secured.',
    icon: <CheckCircle2 size={24} />,
    color: 'bg-emerald-600'
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section className="py-16 bg-[#f8fafc] border-b border-slate-200">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-1 bg-yellow-500"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#002147]">Operational Workflow</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-[#002147] tracking-tight uppercase">Tactical Response Pipeline</h2>
            <p className="text-slate-500 mt-4 font-medium text-lg leading-relaxed">
              Our structured approach ensures that information flows seamlessly from citizen awareness to institutional response.
            </p>
          </div>
          <button 
            onClick={downloadInstitutionalGuide}
            className="px-8 py-4 bg-[#002147] text-white rounded font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 shadow-xl transition-all"
          >
            Full Institutional Guide
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {steps.map((step, i) => (
            <div key={step.id} className="relative group">
              {/* Step Connection Detail */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-6 w-12 h-px border-t-2 border-dashed border-slate-200 z-0"></div>
              )}
              
              <div className="flex flex-col items-center lg:items-start">
                <div className={cn(
                  "w-20 h-20 rounded shadow-2xl flex items-center justify-center text-white mb-8 border-b-4 border-yellow-500 transform transition-transform group-hover:-translate-y-2",
                  step.color
                )}>
                  {step.icon}
                </div>
                
                <div className="text-center lg:text-left">
                  <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest block mb-2">{step.subtitle}</span>
                  <h3 className="text-2xl font-black text-[#002147] tracking-tight mb-4">{step.title}</h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                    "{step.description}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 p-10 bg-white border border-slate-200 rounded shadow-sm flex flex-col lg:flex-row items-center justify-between gap-10">
           <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-slate-50 rounded border border-slate-200 flex items-center justify-center text-[#002147]">
                <Globe size={40} />
              </div>
              <div>
                <h4 className="text-2xl font-black text-[#002147] tracking-tight">System Reliability</h4>
                <p className="text-slate-500 font-medium">All communication signals are end-to-end encrypted and verified by the National Command Deck.</p>
              </div>
           </div>
           <div className="flex gap-4">
              <div className="px-6 py-3 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded flex items-center gap-2 border border-red-100">
                <ShieldCheck size={14} /> Security Level 1-A
              </div>
              <button className="p-3 bg-slate-100 text-[#002147] rounded hover:bg-slate-200">
                 <ArrowRight size={20} />
              </button>
           </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
