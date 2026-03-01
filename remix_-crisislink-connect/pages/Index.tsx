import React from 'react';
import Header from '../components/layout/Header';
import HeroSection from '../components/landing/HeroSection';
import SituationalAwareness from '../components/landing/SituationalAwareness';
import HowItWorks from '../components/landing/HowItWorks';
import DosDonts from '../components/landing/DosDonts';
import SafetyVideos from '../components/landing/SafetyVideos';
import TestimonialsPreview from '../components/landing/TestimonialsPreview';
import Footer from '../components/landing/Footer';
import OurActivity from '../components/landing/OurActivity';
import TacticalTicker from '../components/landing/TacticalTicker';
import AboutUs from '../components/landing/AboutUs';
import { Shield, Map as MapIcon, Activity, LayoutDashboard, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] selection:bg-yellow-100 relative overflow-x-hidden">
      {/* Institutional Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#002147 1px, transparent 1px), linear-gradient(90deg, #002147 1px, transparent 1px)', backgroundSize: '100px 100px' }}></div>
      </div>

      <Header />
      
      <main className="flex-grow relative z-10">
        {/* Phase 1: Institutional Hero */}
        <HeroSection />

        {/* Phase 2: Latest Announcements Ticker */}
        <TacticalTicker />
        
        {/* Phase 3: Dashboard Indicators */}
        <div className="bg-white py-12 lg:py-16 border-b border-slate-200 shadow-sm relative overflow-hidden">
           {/* Decorative Background Icon */}
          <div className="absolute -right-20 top-0 opacity-[0.02] rotate-12 pointer-events-none">
            <Globe size={400} />
          </div>
          
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8">
              <SituationalAwareness />
            </div>
            <div className="lg:col-span-4 flex flex-col justify-center bg-slate-50 rounded-[2.5rem] p-10 border border-slate-200 shadow-inner">
               <div className="mb-8">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="w-4 h-1 bg-red-600 rounded-full"></div>
                   <span className="text-[10px] font-black text-[#002147] uppercase tracking-[0.3em]">Sector Intelligence</span>
                 </div>
                 <h4 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Activity Pulse</h4>
                 <p className="text-xs text-slate-500 font-medium mt-2">Real-time force distribution across active Indian sectors.</p>
               </div>
               <div className="flex-grow">
                 <OurActivity />
               </div>
            </div>
          </div>
        </div>

        {/* Phase 4: About the Authority */}
        <AboutUs />

        {/* Phase 5: Procedural Pipeline */}
        <HowItWorks />

        {/* Phase 6: Public Guidance (Do's & Don'ts) */}
        <div className="bg-white border-y border-slate-100">
          <DosDonts />
        </div>

        {/* Phase 7: The Media Vault */}
        <div className="bg-[#f8fafc] py-16">
          <SafetyVideos />
        </div>

        {/* Phase 8: National Testimonials */}
        <TestimonialsPreview />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;