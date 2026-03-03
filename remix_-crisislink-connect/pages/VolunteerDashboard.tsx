
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Clock, 
  Navigation, 
  Loader2, 
  Activity, 
  RefreshCw,
  Signal,
  Satellite,
  ShieldAlert,
  Target,
  CheckCircle,
  AlertTriangle,
  Send,
  X,
  MessageSquare,
  History,
  Maximize2,
  ChevronRight,
  User,
  Radio
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, INDIA_CENTER } from '../integrations/supabase/client';
import { Incident, Volunteer, FieldReport } from '../types';
import { cn, getSeverityColor, formatDateTime } from '../lib/utils';

// CUSTOM MARKER ICONS
const createIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapController = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom, { animate: true, duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
};

const VolunteerDashboard: React.FC = () => {
  const { profile, user, loading, updateProfile } = useAuth();
  const [isAvailable, setIsAvailable] = useState(profile?.is_online ?? true);
  const [missions, setMissions] = useState<Incident[]>([]);
  const [nearbyIncidents, setNearbyIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingSitRep, setIsSubmittingSitRep] = useState<string | null>(null);
  const [sitRepText, setSitRepText] = useState('');
  
  // LIVE LOCATION STATE
  const [gpsStatus, setGpsStatus] = useState<'locked' | 'searching' | 'failed'>('searching');
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const geoWatchId = useRef<number | null>(null);

  const transmitPosition = async (lat: number, lng: number) => {
    if (!user?.id || !isAvailable || isNaN(lat) || isNaN(lng)) return;
    try {
      setCurrentLocation([lat, lng]);
      const { error } = await (supabase.from('volunteers') as any)
        .update({ 
          latitude: lat, 
          longitude: lng,
          last_seen: new Date().toISOString()
        })
        .eq('profile_id', user.id);
      
      if (error) throw error;
      setGpsStatus('locked');
      setLastPing(new Date());
    } catch (e) {
      console.error("Uplink Error:", e);
      setGpsStatus('failed');
    }
  };

  const startTelemetryStream = () => {
    if (!navigator.geolocation) {
      setGpsStatus('failed');
      return;
    }
    setGpsStatus('searching');
    navigator.geolocation.getCurrentPosition(
      (pos) => transmitPosition(pos.coords.latitude, pos.coords.longitude),
      () => setGpsStatus('failed'),
      { enableHighAccuracy: true }
    );
    geoWatchId.current = navigator.geolocation.watchPosition(
      (pos) => transmitPosition(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        console.warn("GPS Access Denied:", err);
        setGpsStatus('failed');
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const stopTelemetryStream = () => {
    if (geoWatchId.current !== null) {
      navigator.geolocation.clearWatch(geoWatchId.current);
      geoWatchId.current = null;
    }
    setGpsStatus('failed');
  };

  const fetchData = async () => {
    if (!user?.id || !profile) return;
    try {
      const { data: iData } = await (supabase.from('incidents').select('*') as any)
        .ilike('city', `%${profile.city}%`)
        .neq('status', 'resolved');
      
      const allIncidents = (iData || []).filter((i: Incident) => 
        typeof i.latitude === 'number' && !isNaN(i.latitude) && 
        typeof i.longitude === 'number' && !isNaN(i.longitude)
      );
      
      // Filter assigned vs nearby
      setMissions(allIncidents.filter((i: Incident) => i.assigned_volunteers?.includes(user.id)));
      setNearbyIncidents(allIncidents.filter((i: Incident) => !i.assigned_volunteers?.includes(user.id)));
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    if (profile && !loading) {
      fetchData();
      const channel = supabase.channel('volunteer_live_intel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => fetchData())
        .subscribe();
      
      if (isAvailable && profile?.is_approved) {
        startTelemetryStream();
      }
      return () => {
        supabase.removeChannel(channel);
        stopTelemetryStream();
      };
    }
  }, [user?.id, profile, loading, isAvailable]);

  const toggleAvailability = async () => {
    if (loading || !user?.id) return;
    const nextVal = !isAvailable;
    setIsAvailable(nextVal);
    try {
      await (supabase.from('volunteers') as any).update({ availability: nextVal }).eq('profile_id', user.id);
      await updateProfile({ is_online: nextVal });
    } catch (e) { console.error(e); }
  };

  const submitSitRep = async (incidentId: string) => {
    if (!sitRepText.trim() || !profile) return;
    setIsSubmittingSitRep(incidentId);
    try {
      const incident = missions.find(m => m.id === incidentId);
      if (!incident) return;

      const newReport: FieldReport = {
        id: Math.random().toString(36).substr(2, 9),
        volunteer_id: user?.id,
        volunteer_name: profile.full_name || 'Unit',
        text: sitRepText.trim(),
        timestamp: new Date().toISOString()
      };

      const updatedReports = [...(incident.field_reports || []), newReport];
      
      const { error } = await (supabase.from('incidents') as any)
        .update({ field_reports: updatedReports })
        .eq('id', incidentId);

      if (error) throw error;
      setSitRepText('');
      await fetchData();
    } catch (err) {
      console.error("SitRep Fail:", err);
      alert("SIGNAL FAILURE: Intel not transmitted.");
    } finally {
      setIsSubmittingSitRep(null);
    }
  };

  const mapCenter = useMemo((): [number, number] => {
    if (currentLocation && !isNaN(currentLocation[0])) return currentLocation;
    if (missions.length > 0) {
      const first = missions[0];
      if (!isNaN(first.latitude) && !isNaN(first.longitude)) {
        return [first.latitude, first.longitude];
      }
    }
    return INDIA_CENTER;
  }, [currentLocation, missions]);

  if (loading || isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <RefreshCw className="animate-spin text-red-600 mb-4" size={32} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Strategic Link...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-12 py-10">
        
        {/* HEADER HUB */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 border-b border-slate-200 pb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-1 bg-red-600"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#002147]">Field Unit Terminal</span>
            </div>
            <h1 className="text-4xl font-black text-[#002147] tracking-tight uppercase">Dossier: {profile?.full_name}</h1>
            
            <div className="flex flex-wrap items-center gap-4 mt-4">
               <div className={cn(
                 "flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all",
                 gpsStatus === 'locked' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm' :
                 gpsStatus === 'searching' ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse' :
                 'bg-red-50 text-red-600 border border-red-100'
               )}>
                  <Satellite size={10} className={cn(gpsStatus === 'searching' && "animate-spin")} />
                  {gpsStatus === 'locked' ? 'Telemetry: Locked' : gpsStatus === 'searching' ? 'GPS: Searching' : 'GPS: Lost Signal'}
               </div>
               {lastPing && (
                 <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase">
                    <Clock size={10} /> Last Pulse: {lastPing.toLocaleTimeString()}
                 </div>
               )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={toggleAvailability} className={cn("px-10 py-5 font-black uppercase tracking-widest text-[11px] rounded-2xl border-b-4 shadow-xl transition-all", isAvailable ? 'bg-[#002147] text-white border-yellow-500' : 'bg-slate-200 text-slate-500 border-slate-300')}>
              {isAvailable ? 'Status: Active-Duty' : 'Status: Stealth-Mode'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* LEFT: MISSION & INTEL CARDS */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* ACTIVE MISSIONS */}
            <section className="space-y-6">
              <h2 className="text-xl font-black text-[#002147] uppercase tracking-widest flex items-center gap-3">
                <Target size={20} className="text-red-600 animate-pulse" /> 
                Assigned Mission Deck ({missions.length})
              </h2>
              
              {missions.length > 0 ? (
                missions.map((mission) => (
                  <div key={mission.id} className="bg-white border border-slate-200 shadow-sm rounded-[3rem] overflow-hidden transition-all group">
                    <div className="flex flex-col xl:flex-row">
                      {/* Mission Summary */}
                      <div className="p-8 xl:w-1/2 border-r border-slate-100 relative">
                        <div className={cn("absolute left-0 top-0 bottom-0 w-2", getSeverityColor(mission.severity).split(' ')[0])}></div>
                        <div className="flex justify-between items-start mb-6">
                          <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase", getSeverityColor(mission.severity))}>{mission.severity}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Clock size={12} /> {formatDateTime(mission.created_at)}</span>
                        </div>
                        <h3 className="text-3xl font-black text-[#002147] uppercase tracking-tight leading-none mb-4">{mission.title}</h3>
                        <p className="text-slate-600 font-medium leading-relaxed italic mb-8">"{mission.description}"</p>
                        
                        <div className="flex flex-wrap gap-4">
                           <a href={`https://www.google.com/maps/dir/?api=1&destination=${mission.latitude},${mission.longitude}`} target="_blank" rel="noopener noreferrer" className="px-6 py-4 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl flex items-center gap-2 border-b-4 border-yellow-500 shadow-lg hover:bg-black transition-all">
                             <Navigation size={14} /> Waypoint GPS
                           </a>
                           <div className="px-6 py-4 bg-slate-50 text-slate-500 text-[10px] font-black uppercase rounded-xl flex items-center gap-2 border border-slate-100">
                             <MapPin size={14} className="text-red-600" /> {mission.address || mission.city}
                           </div>
                        </div>
                      </div>

                      {/* Live Intel Submission & Feed */}
                      <div className="p-8 xl:w-1/2 bg-slate-50/50 flex flex-col">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2">
                           <History size={14} /> Field Intel Hub
                        </h4>
                        
                        <div className="flex-grow overflow-y-auto max-h-[250px] space-y-4 mb-6 no-scrollbar">
                           {mission.field_reports && mission.field_reports.length > 0 ? (
                             mission.field_reports.slice().reverse().map((rep, idx) => (
                               <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative">
                                  <div className="flex justify-between items-center mb-2">
                                     <p className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1"><User size={10} /> {rep.volunteer_name}</p>
                                     <p className="text-[8px] font-bold text-slate-400">{new Date(rep.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                  </div>
                                  <p className="text-xs font-bold text-slate-700 leading-relaxed italic">"{rep.text}"</p>
                               </div>
                             ))
                           ) : (
                             <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-10">
                                <MessageSquare size={32} className="mb-2" />
                                <p className="text-[9px] font-black uppercase">Awaiting primary signals</p>
                             </div>
                           )}
                        </div>

                        <div className="relative">
                           <input 
                              type="text" 
                              value={isSubmittingSitRep === mission.id ? sitRepText : ''}
                              onChange={(e) => { setIsSubmittingSitRep(mission.id); setSitRepText(e.target.value); }}
                              onKeyPress={(e) => e.key === 'Enter' && submitSitRep(mission.id)}
                              placeholder="Transmit SitRep..." 
                              className="w-full pl-6 pr-14 py-4 bg-white border-2 border-slate-200 rounded-2xl text-xs font-bold text-[#002147] focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none shadow-inner"
                           />
                           <button 
                            onClick={() => submitSitRep(mission.id)}
                            disabled={isSubmittingSitRep === mission.id && !sitRepText.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#002147] text-white rounded-xl hover:bg-blue-600 transition-all shadow-md"
                           >
                              {isSubmittingSitRep === mission.id && sitRepText.trim() ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
                  <CheckCircle className="text-slate-200 mx-auto mb-4" size={64} />
                  <h3 className="text-2xl font-black text-[#002147] uppercase tracking-tight">Sector All-Clear</h3>
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-2">Standing by for command directives...</p>
                </div>
              )}
            </section>

            {/* NEARBY SIGNALS (LIVE INTEL) */}
            <section className="space-y-6">
               <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                  <Radio size={20} className="text-blue-500" />
                  Nearby Signals
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {nearbyIncidents.map((inc) => (
                    <div key={inc.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1", getSeverityColor(inc.severity).split(' ')[0])}></div>
                        <div className="flex justify-between items-center mb-4">
                           <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase", getSeverityColor(inc.severity))}>{inc.severity}</span>
                           <p className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1"><MapPin size={10} /> {inc.city}</p>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2 line-clamp-1">{inc.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 italic mb-4">"{inc.description}"</p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                           <span className="text-[8px] font-black uppercase text-slate-400">Status: {inc.status}</span>
                           <Link to="/map" className="text-[8px] font-black uppercase text-blue-600 flex items-center gap-1 group-hover:underline">Strategic Intercept <ChevronRight size={10} /></Link>
                        </div>
                    </div>
                  ))}
                  {nearbyIncidents.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-slate-50 border border-slate-100 rounded-3xl opacity-50">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">No additional sector signals detected</p>
                    </div>
                  )}
               </div>
            </section>
          </div>

          {/* RIGHT: TACTICAL HUD */}
          <aside className="lg:col-span-4 space-y-10">
            
            {/* TACTICAL MAP PANEL */}
            <div className="bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-2xl flex flex-col h-[600px] relative border-b-8 border-yellow-500 overflow-hidden">
               <div className="flex items-center justify-between mb-6 relative z-10">
                  <h3 className="font-black text-[#002147] text-lg flex items-center gap-3 uppercase tracking-widest">
                    <Activity size={20} className="text-red-600 animate-pulse" /> 
                    Tactical Grid
                  </h3>
                  <Link to="/map" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[#002147] transition-all"><Maximize2 size={20} /></Link>
               </div>
               
               <div className="flex-grow rounded-[2.5rem] overflow-hidden bg-slate-100 border border-slate-200 relative shadow-inner">
                  <MapContainer center={mapCenter} zoom={13} className="w-full h-full" zoomControl={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
                    <MapController center={mapCenter} zoom={currentLocation ? 14 : 12} />
                    
                    {/* VOLUNTEER POSITION */}
                    {currentLocation && !isNaN(currentLocation[0]) && (
                      <Marker position={currentLocation} icon={createIcon('blue')}>
                         <Popup closeButton={false}>
                            <p className="text-[10px] font-black uppercase text-black">Your Position (Locked)</p>
                         </Popup>
                      </Marker>
                    )}

                    {/* MISSION MARKERS */}
                    {missions.map(m => (
                      !isNaN(m.latitude) && !isNaN(m.longitude) && (
                        <Marker key={m.id} position={[m.latitude, m.longitude]} icon={createIcon('red')}>
                           <Popup closeButton={false}>
                              <p className="text-[10px] font-black uppercase text-black">{m.title}</p>
                              <p className="text-[8px] font-bold text-red-600 uppercase">ASSIGNED MISSION</p>
                           </Popup>
                        </Marker>
                      )
                    ))}

                    {/* OTHER SECTOR SIGNALS */}
                    {nearbyIncidents.map(m => (
                      !isNaN(m.latitude) && !isNaN(m.longitude) && (
                        <Marker key={m.id} position={[m.latitude, m.longitude]} icon={createIcon('gold')}>
                           <Popup closeButton={false}>
                              <p className="text-[10px] font-black uppercase text-black">{m.title}</p>
                              <p className="text-[8px] font-bold text-amber-600 uppercase">NEARBY SIGNAL</p>
                           </Popup>
                        </Marker>
                      )
                    ))}
                  </MapContainer>
               </div>
               
               <div className="mt-8 space-y-4 px-2">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-600 rounded-full shadow-lg"></div>
                        <span className="text-[9px] font-black uppercase text-slate-900 tracking-widest">Your Pulse</span>
                     </div>
                     <span className="text-[8px] font-mono text-slate-400">SYNC_OK</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-600 rounded-full shadow-lg"></div>
                        <span className="text-[9px] font-black uppercase text-slate-900 tracking-widest">Active Missions</span>
                     </div>
                     <span className="text-[8px] font-mono text-slate-400">{missions.length} NODES</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg"></div>
                        <span className="text-[9px] font-black uppercase text-slate-900 tracking-widest">Nearby Intelligence</span>
                     </div>
                     <span className="text-[8px] font-mono text-slate-400">{nearbyIncidents.length} SIGNALS</span>
                  </div>
               </div>
            </div>

            {/* SECTOR STATISTICS */}
            <div className="bg-[#002147] p-10 rounded-[3.5rem] text-white border-b-8 border-yellow-500 text-center relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Signal size={140} fill="white" /></div>
               <div className="relative z-10">
                  <ShieldAlert size={48} className="text-yellow-500 mx-auto mb-6" />
                  <p className="text-7xl font-black mb-2 tracking-tighter">{missions.length + nearbyIncidents.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-8">Sector Events Logged</p>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-xl font-black text-emerald-400">{missions.length}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest">In Progress</p>
                     </div>
                     <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-xl font-black text-blue-400">{nearbyIncidents.length}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest">Available</p>
                     </div>
                  </div>
               </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default VolunteerDashboard;
