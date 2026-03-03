import React, { useState, useEffect, useMemo, memo } from 'react';
import Header from '../components/layout/Header';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Clock, 
  Megaphone, 
  ShieldCheck, 
  ChevronRight, 
  Map as MapIcon, 
  Loader2, 
  Maximize2, 
  Minimize2,
  Target,
  ArrowLeft,
  User,
  Radio,
  Building2
} from 'lucide-react';
import { getSeverityColor, cn, formatDateTime } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase, INDIA_CENTER } from '../integrations/supabase/client';
import { Incident, ResourceCenter } from '../types';

type TabType = 'feed' | 'my-reports' | 'resources' | 'safety';

const createIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapInvalidator = () => {
  const map = useMap();
  useEffect(() => {
    const sync = () => requestAnimationFrame(() => map.invalidateSize());
    sync();
    const t = setTimeout(sync, 500);
    return () => clearTimeout(t);
  }, [map]);
  return null;
};

const MapController = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

const CommunityDashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [reports, setReports] = useState<Incident[]>([]);
  const [centers, setCenters] = useState<ResourceCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapMaximized, setIsMapMaximized] = useState(false);

  const fetchData = async () => {
    const { data: repData } = await (supabase.from('incidents').select('*') as any).order('created_at', { ascending: false });
    const { data: centData } = await (supabase.from('resource_centers').select('*') as any);
    
    // Include reported incidents
    setReports((repData || []).filter((r: any) => 
      typeof r.latitude === 'number' && typeof r.longitude === 'number' &&
      (r.status === 'active' || r.status === 'reported' || r.status === 'resolved')
    ));
    setCenters((centData || []).filter((c: any) => typeof c.latitude === 'number' && typeof c.longitude === 'number'));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('community_global_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resource_centers' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const myReports = useMemo(() => reports.filter(r => r.reporter_id === user?.id), [reports, user?.id]);
  const feedReports = useMemo(() => reports.filter(r => 
    r.reporter_id !== user?.id && 
    ((r.city || '').toLowerCase() === (profile?.city || '').toLowerCase() || (r.city || '').toLowerCase() === 'unspecified')
  ), [reports, user?.id, profile?.city]);
  
  const visibleReports = useMemo(() => {
    if (activeTab === 'my-reports') return myReports;
    if (activeTab === 'feed') return feedReports;
    return reports.filter(r => 
      (r.city || '').toLowerCase() === (profile?.city || '').toLowerCase() || (r.city || '').toLowerCase() === 'unspecified'
    );
  }, [activeTab, myReports, feedReports, reports, profile?.city]);

  // Dynamically calculate map center: Prefer latest mission, then user city center, then India center
  const initialMapState = useMemo(() => {
    if (visibleReports.length > 0) {
      return { center: [visibleReports[0].latitude, visibleReports[0].longitude] as [number, number], zoom: 12 };
    }
    return { center: INDIA_CENTER, zoom: 4 };
  }, [visibleReports]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-12 py-10">
        
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-1.5 bg-yellow-500"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#002147]">Resident Command Node</span>
            </div>
            <h1 className="text-5xl font-black text-[#002147] tracking-tight uppercase leading-none">Namaste, {profile?.full_name?.split(' ')[0]}</h1>
          </div>
          <Link to="/report" className="px-10 py-5 bg-[#002147] text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-2xl hover:bg-slate-900 transition-all flex items-center gap-3 border-b-4 border-yellow-500">
            <Megaphone size={18} /> Transmit Incident Signal
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex border-b border-slate-200 mb-10 overflow-x-auto no-scrollbar gap-10">
              {[
                { id: 'feed', label: 'Community Feed' },
                { id: 'my-reports', label: 'My Reports' },
                { id: 'resources', label: 'Resources' },
                { id: 'safety', label: 'Safety Protocols' }
              ].map((t) => (
                <button 
                  key={t.id} 
                  onClick={() => setActiveTab(t.id as TabType)} 
                  className={cn(
                    "flex items-center gap-3 py-5 text-[11px] font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap", 
                    activeTab === t.id ? "border-yellow-500 text-[#002147]" : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  {t.id === 'my-reports' && <User size={14} />}
                  {t.id === 'feed' && <Radio size={14} className={cn(activeTab === 'feed' && "animate-pulse")} />}
                  {t.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-[#002147]" size={40} /></div>
            ) : (
              <div className="space-y-6">
                {(activeTab === 'feed' || activeTab === 'my-reports') && (
                  visibleReports.length > 0 ? (
                    visibleReports.map((report) => (
                      <div key={report.id} className="bg-white p-10 border border-slate-200 shadow-sm rounded-[2.5rem] hover:shadow-xl transition-all group overflow-hidden relative">
                        <div className={cn("absolute left-0 top-0 bottom-0 w-2", report.status === 'reported' ? 'bg-amber-500' : getSeverityColor(report.severity).split(' ')[0])}></div>
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex gap-3">
                             <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm", report.status === 'reported' ? 'bg-amber-100 text-amber-800 border border-amber-200' : getSeverityColor(report.severity))}>
                               {report.status === 'reported' ? 'Awaiting Vetting' : report.severity}
                             </span>
                             {activeTab === 'feed' && <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">Reporter: {report.reporter_name?.split(' ')[0] || 'Citizen'}</span>}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock size={12} /> {formatDateTime(report.created_at)}</span>
                        </div>
                        <h3 className="font-black text-slate-900 text-3xl mb-4 uppercase tracking-tight leading-none group-hover:text-red-600 transition-colors">{report.title}</h3>
                        <p className="text-slate-600 text-xl mb-8 leading-relaxed italic">"{report.description}"</p>
                        <div className="flex items-center gap-3 text-slate-500 text-xs font-bold uppercase"><MapPin size={18} className="text-red-600" /> {report.address || report.city}</div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-24 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
                      <ShieldCheck className="text-slate-200 mx-auto mb-6" size={64} />
                      <h3 className="text-3xl font-black text-[#002147] mb-2 uppercase tracking-tight">
                        {activeTab === 'my-reports' ? "No Signals Transmitted" : "Sector All-Clear"}
                      </h3>
                      <p className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">
                        {activeTab === 'my-reports' ? "You haven't reported any incidents yet." : "No active signals from other residents in your grid."}
                      </p>
                      {activeTab === 'my-reports' && (
                        <Link to="/report" className="mt-8 inline-flex items-center gap-2 text-red-600 font-black uppercase text-[11px] tracking-widest hover:text-red-700">
                          Submit Your First Report <ChevronRight size={16} />
                        </Link>
                      )}
                    </div>
                  )
                )}

                {activeTab === 'resources' && (
                  <div className="bg-white p-24 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
                    <MapIcon className="text-slate-200 mx-auto mb-6" size={64} />
                    <h3 className="text-3xl font-black text-[#002147] mb-2 uppercase tracking-tight">Resource Directory</h3>
                    <p className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">Accessing localized supply points and shelter data...</p>
                  </div>
                )}

                {activeTab === 'safety' && (
                  <div className="bg-white p-24 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
                    <ShieldCheck className="text-slate-200 mx-auto mb-6" size={64} />
                    <h3 className="text-3xl font-black text-[#002147] mb-2 uppercase tracking-tight">Safety Protocol Manual</h3>
                    <p className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">Loading institutional survival guides and NDMA SOPs...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-10">
            <div className="bg-white p-10 border border-slate-200 shadow-2xl rounded-[3.5rem] relative flex flex-col h-[600px] border-b-8 border-yellow-500">
               <div className="flex items-center justify-between mb-8 shrink-0">
                 <h3 className="font-black text-[#002147] text-xl flex items-center gap-3 uppercase tracking-widest">
                   <Target size={24} className="text-red-600 animate-pulse" /> 
                   {activeTab === 'my-reports' ? 'My Activity Map' : 'Sector Map'}
                 </h3>
                 <button onClick={() => setIsMapMaximized(true)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[#002147] transition-all"><Maximize2 size={20} /></button>
               </div>
               
               <div className="flex-grow rounded-[2rem] overflow-hidden bg-slate-100 border border-slate-200 relative shadow-inner">
                  <MapContainer center={initialMapState.center} zoom={initialMapState.zoom} className="w-full h-full" zoomControl={false}>
                    <MapInvalidator />
                    <MapController center={initialMapState.center} zoom={initialMapState.zoom} />
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
                    
                    {/* VISIBLE INCIDENT MARKERS */}
                    {visibleReports.map(report => (
                       <Marker 
                        key={report.id} 
                        position={[report.latitude, report.longitude]} 
                        icon={report.reporter_id === user?.id ? createIcon('blue') : (report.status === 'active' ? createIcon('red') : createIcon('orange'))} 
                       >
                         <Popup closeButton={false}>
                           <div className="text-[10px] font-black uppercase text-black">
                             <p className="border-b border-slate-100 pb-1 mb-1">{report.title}</p>
                             <p className="text-slate-400 text-[8px]">{report.reporter_id === user?.id ? 'YOUR REPORT' : 'COMMUNITY SIGNAL'}</p>
                           </div>
                         </Popup>
                       </Marker>
                    ))}

                    {/* RESOURCE CENTERS (Filtered to City) */}
                    {centers.filter(c => (c.city || '').toLowerCase() === (profile?.city || '').toLowerCase()).map(cent => (
                      <Marker key={cent.id} position={[cent.latitude, cent.longitude]} icon={createIcon('green')}>
                         <Popup closeButton={false}>
                            <div className="text-[10px] font-black uppercase text-emerald-700">
                               <p className="border-b border-emerald-50 pb-1 mb-1 flex items-center gap-1"><Building2 size={10} /> {cent.name}</p>
                               <p className="text-slate-400 text-[8px]">ACTIVE SUPPORT HUB</p>
                            </div>
                         </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
               </div>
               
               <div className="mt-6 space-y-3 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full shadow-lg"></div>
                    <span className="text-[9px] font-black uppercase text-slate-900">Your Transmissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full shadow-lg"></div>
                    <span className="text-[9px] font-black uppercase text-slate-900">Community Hazards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg"></div>
                    <span className="text-[9px] font-black uppercase text-slate-900">Sector Hubs</span>
                  </div>
               </div>
               
               <Link to="/map" className="w-full mt-8 py-5 bg-slate-950 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-2xl hover:bg-black transition-all rounded-2xl shrink-0">
                 Full Strategic Overlay <ChevronRight size={18} />
               </Link>
            </div>
          </aside>
        </div>
      </main>

      {isMapMaximized && (
        <div className="fixed inset-0 z-[3000] bg-slate-950 flex flex-col animate-in fade-in duration-300">
           <div className="p-8 bg-slate-900 border-b border-white/10 flex items-center justify-between z-[3001]">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Tactical Overlay</h2>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Viewing: {activeTab === 'my-reports' ? 'Personal Logs' : 'Community Signals'}</p>
              </div>
              <button onClick={() => setIsMapMaximized(false)} className="px-8 py-4 bg-white text-slate-900 font-black uppercase tracking-widest text-[11px] rounded-2xl flex items-center gap-3 shadow-2xl hover:bg-slate-100 transition-all">
                <ArrowLeft size={18} /> Back to Dashboard
              </button>
           </div>
           <div className="flex-grow">
             <MapContainer center={initialMapState.center} zoom={initialMapState.zoom} className="w-full h-full">
                <MapInvalidator />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
                {visibleReports.map(report => (
                   <Marker 
                    key={report.id} 
                    position={[report.latitude, report.longitude]} 
                    icon={report.reporter_id === user?.id ? createIcon('blue') : (report.status === 'active' ? createIcon('red') : createIcon('orange'))} 
                   />
                ))}
                {centers.map(cent => (
                   <Marker key={cent.id} position={[cent.latitude, cent.longitude]} icon={createIcon('green')} />
                ))}
             </MapContainer>
           </div>
        </div>
      )}
    </div>
  );
};

export default memo(CommunityDashboard);