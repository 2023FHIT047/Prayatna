import React, { useState, useEffect, useLayoutEffect, memo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Shield, Zap, TrendingUp, Globe, Loader2, AlertTriangle, Target, Clock, MapPin, ArrowUpRight, Building2 } from 'lucide-react';
import { supabase, INDIA_CENTER } from '../../integrations/supabase/client';
import { Incident, ResourceCenter } from '../../types';
import { cn, formatDateTime, getSeverityColor } from '../../lib/utils';
import { Link } from 'react-router-dom';

const tacticalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const reportedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const centerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapController = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 12, { animate: true, duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

const MapInvalidator = () => {
  const map = useMap();
  useLayoutEffect(() => {
    const invalidate = () => requestAnimationFrame(() => map.invalidateSize());
    invalidate();
    const container = map.getContainer();
    const observer = new ResizeObserver(invalidate);
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
};

const SituationalAwareness: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [centers, setCenters] = useState<ResourceCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [focusedLocation, setFocusedLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    const fetchTacticalData = async () => {
      try {
        // INCLUDE 'reported' status so new signals show up immediately
        const { data: incData, error: incError } = await (supabase.from('incidents').select('*') as any)
          .in('status', ['active', 'reported'])
          .order('created_at', { ascending: false })
          .limit(8);
        
        if (incError) {
          console.error('Error fetching incidents:', incError);
        }

        const { data: centData, error: centError } = await (supabase.from('resource_centers').select('*') as any);
        
        if (centError) {
          console.error('Error fetching centers:', centError);
        }

        const filteredInc = (incData || []).filter((i: any) => typeof i.latitude === 'number' && typeof i.longitude === 'number');
        const filteredCent = (centData || []).filter((c: any) => typeof c.latitude === 'number' && typeof c.longitude === 'number');
        
        setIncidents(filteredInc);
        setCenters(filteredCent);
      } catch (err) {
        console.error('Unexpected error in situational awareness fetch:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTacticalData();

    const channel = supabase.channel('landing_global_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => fetchTacticalData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resource_centers' }, () => fetchTacticalData())
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="h-full flex flex-col bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden group min-h-[600px]">
      <div className="p-6 bg-slate-900 text-white flex justify-between items-center relative z-[1000]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/20">
            <Shield size={16} />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-1">National Situational Command</h3>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Unified Emergency Signal Receiver</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[8px] font-black uppercase text-slate-400">Tactical Feed: Active</span>
          </div>
        </div>
      </div>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        <div className="lg:col-span-4 border-r border-slate-100 flex flex-col bg-slate-50/50">
           <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <Target size={12} className="text-red-600" /> Active Mission Signals
              </span>
              <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[#002147]">{incidents.length} NODES</span>
           </div>
           
           <div className="flex-grow overflow-y-auto no-scrollbar p-4 space-y-3 max-h-[500px] lg:max-h-full">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-20 gap-4">
                   <Loader2 size={32} className="animate-spin text-slate-200" />
                   <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">Querying Satellite Grid</p>
                </div>
              ) : incidents.length > 0 ? (
                incidents.map(inc => (
                  <div 
                    key={inc.id} 
                    onMouseEnter={() => setFocusedLocation([inc.latitude, inc.longitude])}
                    onClick={() => setFocusedLocation([inc.latitude, inc.longitude])}
                    className={cn(
                      "p-5 rounded-[2rem] bg-white border transition-all cursor-pointer group/card shadow-sm hover:shadow-xl hover:shadow-red-500/5",
                      focusedLocation && focusedLocation[0] === inc.latitude ? "border-red-500 ring-1 ring-red-500" : "border-slate-100 hover:border-red-200"
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm", inc.status === 'reported' ? 'bg-amber-500 text-white' : getSeverityColor(inc.severity))}>
                        {inc.status === 'reported' ? 'PENDING' : inc.severity}
                      </span>
                      <span className="text-[8px] font-bold text-slate-300 uppercase flex items-center gap-1"><Clock size={10} /> {formatDateTime(inc.created_at)}</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 uppercase leading-tight mb-2 group-hover/card:text-red-600 transition-colors">{inc.title}</h4>
                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic mb-3 line-clamp-2">"{inc.description}"</p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                       <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1.5 truncate">
                         <MapPin size={10} className="text-red-600 shrink-0" /> {inc.city} Sector
                       </p>
                       <ArrowUpRight size={14} className="text-slate-300 group-hover/card:text-red-600 transition-colors" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 opacity-30 text-center">
                   <Zap size={32} className="mb-4 text-slate-200" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No active tactical signals</p>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-8 relative min-h-[400px] bg-slate-100">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm">
               <Loader2 className="animate-spin text-red-600" size={32} />
            </div>
          ) : (
            <MapContainer 
              center={focusedLocation || INDIA_CENTER} 
              zoom={focusedLocation ? 12 : 5} 
              className="w-full h-full"
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapInvalidator />
              <MapController center={focusedLocation} />
              
              {/* INCIDENT MARKERS */}
              {incidents.map(inc => (
                <Marker key={inc.id} position={[inc.latitude, inc.longitude]} icon={inc.status === 'reported' ? reportedIcon : tacticalIcon}>
                  <Popup closeButton={false}>
                    <div className="p-2 min-w-[140px]">
                      <p className="text-[11px] font-black text-slate-900 uppercase border-b border-slate-100 pb-1 mb-1.5">{inc.title}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase italic leading-tight mb-2">"{inc.description.slice(0, 60)}..."</p>
                      <div className="flex items-center gap-1 text-[8px] font-black text-red-600 uppercase">
                        <MapPin size={10} /> {inc.city} ({inc.status})
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* RESOURCE CENTER MARKERS */}
              {centers.map(cent => (
                <Marker key={cent.id} position={[cent.latitude, cent.longitude]} icon={centerIcon}>
                  <Popup closeButton={false}>
                    <div className="p-2 min-w-[140px]">
                      <p className="text-[11px] font-black text-emerald-700 uppercase border-b border-emerald-50 pb-1 mb-1.5 flex items-center gap-2">
                        <Building2 size={12} /> {cent.name}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{cent.type} Depot</p>
                      <div className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase mt-2">
                        <MapPin size={10} /> {cent.city}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
          
          <div className="absolute top-4 left-4 z-[500] pointer-events-none space-y-2">
             <div className="bg-slate-900/90 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3">
                <Globe size={14} className="text-red-600 animate-pulse" />
                <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">National Operational Grid</p>
             </div>
             <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200 shadow-xl flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest">Active Resource Depots</p>
             </div>
          </div>

          <div className="absolute bottom-6 right-6 z-[500]">
             <Link 
              to="/map" 
              className="flex items-center gap-2 px-6 py-3 bg-white text-[#002147] rounded-xl shadow-2xl border border-slate-200 font-black uppercase text-[9px] tracking-widest hover:bg-[#002147] hover:text-white transition-all group"
             >
                Strategic Overlay <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
             </Link>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Direct Hazard Signals</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Nodes</span>
            </div>
         </div>
         <div className="flex gap-4">
            <button className="text-[10px] font-black text-[#002147] hover:text-red-600 uppercase tracking-widest border-b border-[#002147]/20 transition-all">Protocol Feed</button>
            <Link to="/report" className="text-[10px] font-black text-red-600 hover:text-[#002147] uppercase tracking-widest border-b border-red-600/20 transition-all">Submit Signal</Link>
         </div>
      </div>
    </div>
  );
};

export default memo(SituationalAwareness);