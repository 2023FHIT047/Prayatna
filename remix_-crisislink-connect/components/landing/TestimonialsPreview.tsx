
import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareQuote, Star, ArrowRight, Quote, ShieldCheck, Loader2, User, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { useLanguage } from '../../contexts/LanguageContext';

const TestimonialsPreview: React.FC = () => {
  // We keep the hook call to re-render when language changes if needed, 
  // but remove the unused 't' variable to fix potential undefined references.
  const { language } = useLanguage();
  
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews-preview'],
    queryFn: async () => {
      // Joining with incidents to get the mission title
      const { data, error } = await supabase
        .from('reviews')
        .select('*, incidents(title)')
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    }
  });

  return (
    <section className="py-24 bg-white relative overflow-hidden border-t border-slate-100">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none">
        <Quote size={300} />
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-1 bg-yellow-500"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#002147]">The National Pulse</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-[#002147] tracking-tight uppercase leading-none">Voices from the Grid</h2>
            <p className="text-slate-500 mt-6 font-medium text-lg">
              Transparency through testimony. Read real-time feedback linked to active and resolved missions across the national grid.
            </p>
          </div>
          <Link 
            to="/reviews" 
            className="px-10 py-5 bg-[#002147] text-white rounded shadow-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 transition-all flex items-center gap-3 border-b-4 border-yellow-500 active:scale-95"
          >
            Explore National Feedback <ArrowRight size={16} />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="animate-spin text-[#002147] mx-auto" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.length > 0 ? (
              reviews.map((review: any) => (
                <div key={review.id} className="bg-[#f8fafc] p-10 rounded-[2.5rem] border border-slate-100 flex flex-col hover:border-yellow-500 transition-all group relative hover:shadow-xl hover:shadow-slate-200/50">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} stroke="currentColor" />
                      ))}
                    </div>
                    {review.incidents?.title && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 shadow-sm animate-in fade-in zoom-in duration-300">
                        <Target size={10} className="shrink-0" />
                        <span className="text-[8px] font-black uppercase tracking-widest truncate max-w-[120px]">Mission: {review.incidents.title}</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-slate-700 font-medium leading-relaxed italic mb-8 flex-grow">
                    "{review.content.length > 180 ? `${review.content.substring(0, 180)}...` : review.content}"
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-6 mt-auto">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#002147] border border-slate-100 shadow-sm">
                         <User size={20} />
                       </div>
                       <div>
                         <h4 className="font-black text-[#002147] text-[11px] uppercase tracking-tight">{review.full_name}</h4>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{review.role}</p>
                       </div>
                    </div>
                    {review.is_verified && (
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-500 shadow-sm border border-slate-100" title="Verified Sector Feedback">
                        <ShieldCheck size={18} />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                <MessageSquareQuote size={40} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Standing by for field signals...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialsPreview;
