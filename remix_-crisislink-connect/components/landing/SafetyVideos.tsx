
import React, { useRef } from 'react';
import { Play, ChevronLeft, ChevronRight, Film, Globe } from 'lucide-react';

const videos = [
  {
    id: 'avvBpyh1kdE',
    title: 'Earthquake Protocol',
    subtitle: 'Institutional Training Module',
    thumbnail: 'https://img.youtube.com/vi/avvBpyh1kdE/hqdefault.jpg'
  },
  {
    id: 'y16aMLeh91Q',
    title: 'Flood Awareness',
    subtitle: 'Urban Mitigation Series',
    thumbnail: 'https://img.youtube.com/vi/y16aMLeh91Q/hqdefault.jpg'
  },
  {
    id: 'yNPb4Q90ylY',
    title: 'Fire Prevention',
    subtitle: 'Hazard Control Training',
    thumbnail: 'https://img.youtube.com/vi/yNPb4Q90ylY/hqdefault.jpg'
  },
  {
    id: 'TN_HSDSdxGw',
    title: 'Storm Defensive',
    subtitle: 'Cyclonic Activity Response',
    thumbnail: 'https://img.youtube.com/vi/TN_HSDSdxGw/hqdefault.jpg'
  }
];

const SafetyVideos: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-12 bg-transparent relative overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-12 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-1.5 bg-[#002147] text-white shadow-md rounded-sm">
              <Film size={18} />
            </div>
            <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#002147]">Media Training Center</h2>
          </div>
          <h3 className="text-2xl font-black text-[#002147] tracking-tight uppercase">Public Education Modules</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')} className="p-4 bg-white border border-slate-200 text-[#002147] hover:bg-[#002147] hover:text-white transition-all shadow-sm"><ChevronLeft size={20} /></button>
          <button onClick={() => scroll('right')} className="p-4 bg-white border border-slate-200 text-[#002147] hover:bg-[#002147] hover:text-white transition-all shadow-sm"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar gap-8 px-4 md:px-[calc((100vw-1536px)/2+3rem)] py-4"
      >
        {videos.map((v) => (
          <div key={v.id} className="flex-none w-[320px] md:w-[450px]">
            <a 
              href={`https://www.youtube.com/watch?v=${v.id}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="aspect-video bg-slate-900 relative overflow-hidden border-b-4 border-yellow-500 shadow-xl group-hover:scale-[1.02] transition-transform duration-500">
                <img src={v.thumbnail} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700" alt={v.title} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:bg-red-600 transition-all duration-300 shadow-2xl">
                    <Play className="text-white fill-white ml-1" size={24} />
                  </div>
                </div>
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 text-[8px] font-black text-white uppercase tracking-widest">
                   <Globe size={10} /> Certified Training
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-lg font-black text-[#002147] group-hover:text-red-600 transition-colors leading-tight">{v.title}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{v.subtitle}</p>
              </div>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SafetyVideos;
