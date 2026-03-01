import React, { useState, useEffect, useMemo, useLayoutEffect } from 'react';
import Header from '../components/layout/Header';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../contexts/AuthContext';
import { Search, Loader2, Clock, ArrowLeft, LayoutDashboard, Target, MapPin, X, Building2 } from 'lucide-react';
import { supabase, INDIA_CENTER } from '../integrations/supabase/client';
import { formatDateTime } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const TACTICAL_ICON = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => { 
    if (center) {
      map.setView(center, zoom, { animate: true }); 
    }
  }, [center, zoom, map]);
  return null;
};

const MapInvalidator = () => {
  const map = useMap();
  useLayoutEffect(() => {
    const sync = () => {
      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    };
    const container = map.getContainer();
    const observer = new ResizeObserver(sync);
    observer.observe(container);
    sync();
    const t = setTimeout(sync, 150);
    return () => {
      observer.disconnect();
      clearTimeout(t);
    };
  }, [map]);
  return null;
};

const LiveMap: React.FC = () => {
  const navigate = useNavigate();
  const [activeIncident, setActiveIncident] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(INDIA_CENTER);
  const [mapZoom, setMapZoom] = useState(5);

  const mapIcons = useMemo(() => ({
    critical: TACTICAL_ICON('red'),
    high: TACTICAL_ICON('orange'),
    medium: TACTICAL_ICON('yellow'),
    low: TACTICAL_ICON('blue'),
    reported: TACTICAL_ICON('gold'), // New color for pending reports
    resolved: TACTICAL_ICON('grey'),
    center: TACTICAL_ICON('green')
  }), []);

  const fetchData = async () => {
    const { data: incData } = await (supabase.from('incidents').select('*') as any).order('created_at', { ascending: false });
    const { data: centData } = await (supabase.from('resource_centers').select('*') as any);
    
    // ALLOW 'reported' incidents to be visible on the map
    setIncidents((incData || []).filter((i: any) => 
      (i.status === 'active' || i.status === 'resolved' || i.status === 'reported') && 
      typeof i.latitude === 'number' && typeof i.longitude === 'number'
    ));
    setCenters((centData || []).filter((c: any) => 
      typeof c.latitude === 'number' && typeof c.longitude === 'number'
    ));
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('live_map_global_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resource_centers' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        setMapZoom(12);
      }
    } catch (error) { console.error(error); } finally { setIsSearching(false); }
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <Header />
      <div className="flex-grow flex relative w-full h-full overflow-hidden bg-slate-100">
        <div className="w-80 border-r border-slate-200 h-full flex flex-col bg-white shadow-xl z-[1000] shrink-0 hidden lg:flex">
          <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
              <Target className="text-red-600" size={20} />
              National Grid
            </h2>
            <button onClick={() => navigate('/dashboard')} className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-all"><ArrowLeft size={18} /></button>
          </div>
          <div className="p-4 shrink-0">
            <form onSubmit={handleSearch} className="relative">
              {isSearching ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 text-red-600 animate-spin" size={18} /> : <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />}
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Search Sector..." 
                className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-xl outline-none text-xs font-bold focus:ring-2 focus:ring-red-500 transition-all text-black" 
              />
            </form>
          </div>
          <div className="flex-grow overflow-y-auto px-4 py-2 space-y-3 no-scrollbar">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Active Mission Signals</p>
            {incidents.map((incident) => (
              <div 
                key={incident.id} 
                onClick={() => { setActiveIncident(incident); setMapCenter([incident.latitude, incident.longitude]); setMapZoom(15); }} 
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${activeIncident?.id === incident.id ? 'border-red-500 bg-red-50' : 'border-slate-100 bg-white'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${incident.status === 'reported' ? 'bg-amber-500 text-white' : incident.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>
                    {incident.status === 'reported' ? 'PENDING' : incident.severity}
                  </span>
                </div>
                <h3 className="font-black text-slate-900 text-xs mb-1 uppercase tracking-tight">{incident.title}</h3>
                <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold"><Clock size={10} /> {formatDateTime(incident.created_at)}</div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
            <button onClick={() => navigate('/dashboard')} className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl border-b-4 border-yellow-500"><LayoutDashboard size={14} /> Exit Map View</button>
          </div>
        </div>
        
        <div className="flex-1 relative h-full bg-slate-200">
          <div className="absolute top-6 left-6 z-[1001] lg:hidden">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-4 bg-[#002147] text-white rounded-2xl shadow-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] border-b-4 border-yellow-500"
            >
              <ArrowLeft size={16} /> Exit
            </button>
          </div>

          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            className="w-full h-full"
            zoomControl={false}
          >
            <MapInvalidator />
            <ChangeView center={mapCenter} zoom={mapZoom} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
            
            {/* INCIDENT MARKERS */}
            {incidents.map((incident) => {
              let icon = mapIcons.low;
              if (incident.status === 'resolved') icon = mapIcons.resolved;
              else if (incident.status === 'reported') icon = mapIcons.reported;
              else if ((mapIcons as any)[incident.severity]) icon = (mapIcons as any)[incident.severity];

              return (
                <Marker 
                  key={incident.id} 
                  position={[incident.latitude, incident.longitude]} 
                  icon={icon}
                >
                  <Popup closeButton={false}>
                    <div className="min-w-[150px] p-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${incident.status === 'reported' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                        <h4 className="font-black text-slate-900 uppercase text-xs">{incident.title}</h4>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-tight italic mb-2">"{incident.description}"</p>
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Status: {incident.status}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* CENTER MARKERS */}
            {centers.map((center) => (
              <Marker 
                key={center.id} 
                position={[center.latitude, center.longitude]} 
                icon={mapIcons.center}
              >
                <Popup closeButton={false}>
                  <div className="min-w-[150px] p-1 text-black">
                    <h4 className="font-black text-emerald-700 mb-1 uppercase text-xs flex items-center gap-1"><Building2 size={12} /> {center.name}</h4>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{center.type} HUB</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <div className="absolute bottom-10 right-10 z-[1001] bg-white/90 backdrop-blur-md p-6 rounded-[2.5rem] shadow-2xl border border-white/20 hidden sm:block">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-red-600 text-white rounded-xl shadow-lg flex items-center justify-center"><Target size={20} className="animate-pulse" /></div>
                   <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Alerts</p><p className="text-xs font-black text-slate-900 uppercase">{incidents.length}</p></div>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-center"><Building2 size={20} /></div>
                   <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Support Nodes</p><p className="text-xs font-black text-slate-900 uppercase">{centers.length}</p></div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;