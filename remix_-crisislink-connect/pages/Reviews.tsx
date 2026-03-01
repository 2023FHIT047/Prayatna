
import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/landing/Footer';
import { MessageSquareQuote, Star, User, ShieldCheck, Loader2, Quote, RefreshCw, Target } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Review {
  id: string;
  full_name: string;
  role: string;
  content: string;
  rating: number;
  created_at: string;
  is_verified: boolean;
  incidents?: {
    title: string;
  };
}

const Reviews: React.FC = () => {
  const { language } = useLanguage();
  
  // Fetch Reviews from Supabase with Incident join
  const { data: reviews = [], isLoading, isRefetching } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, incidents(title)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Review[];
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc]">
      <Header />
      
      <main className="flex-grow">
        {/* Institutional Hero */}
        <section className="bg-[#002147] py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <Quote size={400} className="absolute -right-20 -top-20 text-white" />
          </div>
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-12 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 mb-6">
                <MessageSquareQuote size={16} className="text-yellow-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Official Testimony Hub</span>
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-white leading-tight uppercase tracking-tight">
                National <br />
                <span className="text-yellow-500">Feedback Hub</span>
              </h2>
              <p className="text-lg text-slate-300 font-medium mt-6 leading-relaxed">
                A verified repository of testimonials from responders, volunteers, and community leaders across the national grid.
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-20">
          
          {/* Review Feed Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 pb-10 mb-12 gap-6">
            <div>
              <h3 className="text-2xl font-black text-[#002147] uppercase tracking-tight flex items-center gap-3">
                Verified Signals
                {(isLoading || isRefetching) && <RefreshCw size={18} className="animate-spin text-slate-400" />}
              </h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Institutional Quality Index: 4.8 / 5.0</p>
            </div>
            <div className="flex text-yellow-500 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
              {[1,2,3,4,5].map(i => <Star key={i} size={20} fill="currentColor" className="mx-0.5" />)}
            </div>
          </div>

          {/* Testimonials List */}
          <div className="space-y-12">
            {isLoading ? (
              <div className="py-24 text-center">
                <Loader2 size={48} className="animate-spin mx-auto text-[#002147]" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-6">Synchronizing Records...</p>
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="bg-white p-10 border border-slate-200 shadow-sm relative group hover:border-yellow-500 transition-all animate-in fade-in slide-in-from-bottom-4 rounded-[2.5rem]">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-[#002147] border border-slate-100 shadow-inner group-hover:bg-[#002147] group-hover:text-white transition-all">
                        <User size={32} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 leading-tight uppercase text-lg">{review.full_name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                          {review.role} <span className="w-1 h-1 bg-slate-300 rounded-full"></span> {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {review.is_verified && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 shadow-sm">
                          <ShieldCheck size={16} />
                          <span className="text-[9px] font-black uppercase tracking-widest leading-none">Verified Dispatch</span>
                        </div>
                      )}
                      {review.incidents?.title && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 shadow-sm">
                          <Target size={14} className="shrink-0" />
                          <span className="text-[9px] font-black uppercase tracking-widest leading-none">Mission: {review.incidents.title}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex text-yellow-500 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill={i < review.rating ? "currentColor" : "none"} stroke="currentColor" className="mx-0.5" />
                    ))}
                  </div>

                  <p className="text-slate-600 text-xl leading-relaxed italic font-medium">
                    "{review.content}"
                  </p>
                  
                  {/* Decorative Corner Icon */}
                  <div className="absolute top-10 right-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                    <Quote size={80} />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-32 text-center bg-[#f8fafc] border-2 border-dashed border-slate-200 rounded-[3rem]">
                 <MessageSquareQuote size={56} className="mx-auto text-slate-200 mb-6" />
                 <p className="text-lg font-black text-slate-400 uppercase tracking-widest">No signals currently archived</p>
                 <p className="text-sm text-slate-400 mt-2">Awaiting primary field reports from sector command.</p>
              </div>
            )}
          </div>

          {/* Audit Footer */}
          <div className="mt-24 pt-12 border-t border-slate-100 text-center">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">CrisisLink National Audit Trail • Sector Alpha Verified</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Reviews;
