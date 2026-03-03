
import React, { useState, useEffect, useMemo, memo } from 'react';
import Header from '../components/layout/Header';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Shield, 
  MapPin, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Building2,
  X,
  Plus,
  ArrowRight,
  Radio,
  Target,
  ShieldCheck,
  UserPlus,
  Unlink,
  Info,
  Megaphone,
  Clock,
  ExternalLink,
  Activity,
  Heart,
  ChevronRight,
  Wifi,
  WifiOff,
  Package,
  Droplets,
  Award,
  Box,
  MessageSquare,
  History,
  Lock,
  RefreshCw,
  ShieldAlert,
  Satellite,
  Search,
  Eye,
  Radar,
  Navigation
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, INDIA_BOUNDS, INDIA_CENTER } from '../integrations/supabase/client';
import { getSeverityColor, formatDateTime, cn, calculateDistance } from '../lib/utils';
import { Incident, Volunteer, ResourceCenter, Profile, Resource } from '../types';

type CoordinatorTab = 'incidents' | 'volunteers' | 'resources';

const markerStyles = `
  .responder-marker-container {
    position: relative;
    width: 24px;
    height: 24px;
  }
  .responder-pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 32px;
    height: 32px;
    background: rgba(37, 99, 235, 0.4);
    border-radius: 50%;
    animation: marker-pulse-anim 2s infinite;
  }
  .responder-pulse-onmission {
    background: rgba(16, 185, 129, 0.4);
  }
  @keyframes marker-pulse-anim {
    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
    100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
  }
  .responder-core {
    position: relative;
    width: 12px;
    height: 12px;
    background: #2563eb;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(37, 99, 235, 0.5);
    margin: 6px;
  }
  .responder-core-onmission {
    background: #10b981;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
  }
`;

const createIncidentIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const createResponderIcon = (onMission: boolean) => L.divIcon({
  className: 'custom-responder-icon',
  html: `<div class="responder-marker-container">
            <div class="responder-pulse ${onMission ? 'responder-pulse-onmission' : ''}"></div>
            <div class="responder-core ${onMission ? 'responder-core-onmission' : ''}"></div>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const MapController = ({ incident, assets, surveillanceMode, center, forceZoom }: { incident?: Incident | null, assets?: any[], surveillanceMode?: boolean, center?: [number, number], forceZoom?: number }) => {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0])) {
      map.flyTo(center, forceZoom || 13, { duration: 1.5 });
      return;
    }
    if (!incident || isNaN(incident.latitude)) return;
    const points: [number, number][] = [[incident.latitude, incident.longitude]];
    assets?.forEach(a => { if (a.latitude && !isNaN(a.latitude)) points.push([a.latitude, a.longitude]); });
    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], duration: 1.5 });
    } else {
      map.flyTo([incident.latitude, incident.longitude], 15, { duration: 1.5 });
    }
  }, [incident, assets, map, surveillanceMode, center, forceZoom]);
  return null;
};

const MapInvalidator = ({ trigger }: { trigger?: any }) => {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => { map.invalidateSize({ animate: true }); };
    invalidate();
    const timers = [
      setTimeout(invalidate, 50),
      setTimeout(invalidate, 250),
      setTimeout(invalidate, 1000),
      setTimeout(invalidate, 3000)
    ];
    return () => timers.forEach(clearTimeout);
  }, [map, trigger]);
  return null;
};

const CoordinatorDashboard: React.FC = () => {
  const { profile, user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<CoordinatorTab>('incidents');
  const [reports, setReports] = useState<Incident[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [allResponderProfiles, setAllResponderProfiles] = useState<Profile[]>([]);
  const [centers, setCenters] = useState<ResourceCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  
  const [broadcastText, setBroadcastText] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isSurveillanceActive, setIsSurveillanceActive] = useState(false);
  const [mapFocusOverride, setMapFocusOverride] = useState<[number, number] | null>(null);

  const [isDbVerified, setIsDbVerified] = useState<boolean | null>(null);

  const [viewingVolunteer, setViewingVolunteer] = useState<Profile | null>(null);
  const [viewingCenterInventory, setViewingCenterInventory] = useState<{ center: ResourceCenter, items: Resource[] } | null>(null);
  const [isFetchingInventory, setIsFetchingInventory] = useState(false);

  const fetchData = async (silent = false) => {
    if (!user?.id || !profile?.city) return;
    if (!silent) setIsLoading(true);

    try {
      const { data: freshProfile, error: pErr } = await supabase
        .from('profiles')
        .select('is_approved, city')
        .eq('id', user.id)
        .single();
      
      if (pErr) throw pErr;
      setIsDbVerified(freshProfile.is_approved);

      if (!freshProfile.is_approved) {
        setIsLoading(false);
        return;
      }

      const { data: rData, error: rErr } = await (supabase.from('incidents').select('*') as any).ilike('city', `%${freshProfile.city}%`);
      if (rErr) console.error("Incident Fetch Error:", rErr);
      console.log(`Fetched ${rData?.length || 0} incidents for city: ${freshProfile.city}`);
      if (rData && rData.length > 0) {
        console.log("Sample incident city:", rData[0].city);
      }
      const { data: vData } = await (supabase.from('volunteers') as any).select('*').ilike('city', `%${freshProfile.city}%`);
      const { data: cData } = await (supabase.from('resource_centers').select('*') as any).ilike('city', `%${freshProfile.city}%`);
      const { data: profData } = await (supabase.from('profiles') as any).select('*').ilike('city', `%${freshProfile.city}%`).in('role', ['volunteer', 'resource_manager']);
      
      // Filter out records with invalid coordinates early
      setReports((rData || []).filter((r: Incident) => !isNaN(r.latitude) && !isNaN(r.longitude)));
      setVolunteers(vData || []);
      setCenters((cData || []).filter((c: ResourceCenter) => !isNaN(c.latitude) && !isNaN(c.longitude)));
      setAllResponderProfiles(profData || []);
      
      if (selectedIncident) {
        const updated = (rData || []).find((r: Incident) => r.id === selectedIncident.id);
        if (updated) setSelectedIncident(updated);
      }
    } catch (err) { 
      console.error("Strategic Feed Interrupted:", err); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    if (profile && !authLoading) {
      fetchData();
      
      const channel = supabase.channel('coordinator_strategic_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => fetchData(true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteers' }, (payload: any) => {
           if (!payload || !payload.new) {
             fetchData(true);
             return;
           }

           if (payload.eventType === 'UPDATE') {
             setVolunteers(prev => (prev || []).map(v => v.id === payload.new.id ? { ...v, ...payload.new } : v));
           } else {
             fetchData(true);
           }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user?.id}` }, () => fetchData(true))
        .subscribe();
      
      return () => { supabase.removeChannel(channel); };
    }
  }, [user?.id, profile, authLoading]);

  const handleApproveIncident = async () => {
    if (!selectedIncident) return;
    setIsProcessing('approving');
    try {
      const { error } = await (supabase.from('incidents') as any)
        .update({ verified: true, status: 'active' })
        .eq('id', selectedIncident.id);
      if (error) throw error;
      await fetchData(true);
    } catch (err) { console.error(err); } finally { setIsProcessing(null); }
  };

  const handleSendEBS = async () => {
    if (!broadcastText.trim() || !profile) return;
    setIsProcessing('broadcasting');
    try {
      const { error } = await (supabase.from('notifications') as any).insert([{
        title: 'EMERGENCY BROADCAST',
        message: broadcastText.trim(),
        type: 'hazard',
        sector: profile.city,
        priority: 'critical'
      }]);

      if (error) throw error;
      
      setBroadcastText('');
      alert("SIGNAL TRANSMITTED: Emergency directive has been propagated across the sector grid.");
    } catch (err: any) {
      console.error("EBS Transmission Failure:", err);
      alert("SIGNAL FAILURE: Could not connect to the Emergency Broadcast Server.");
    } finally {
      setIsProcessing(null);
    }
  };

  const openCenterInventory = async (center: ResourceCenter) => {
    setIsFetchingInventory(true);
    try {
      const { data, error } = await (supabase.from('resources') as any).select('*').eq('center_id', center.id);
      if (error) throw error;
      setViewingCenterInventory({ center, items: data || [] });
    } catch (err) {
      console.error("Inventory Fetch Fail:", err);
      alert("SIGNAL FAILURE: Could not retrieve hub inventory.");
    } finally {
      setIsFetchingInventory(false);
    }
  };

  const toggleVolunteerAssignment = async (vData: any) => {
    if (!selectedIncident) return;
    
    const volunteerId = vData.profile_id;
    const isOccupiedElsewhere = vData.busyInOtherIncident;
    const isOnline = vData.is_online;
    const isCurrentlyInThisIncident = selectedIncident.assigned_volunteers?.includes(volunteerId);

    if (!isCurrentlyInThisIncident) {
      if (!isOnline) {
        alert("SIGNAL FAILURE: Unit is currently in Stealth Mode and cannot receive mission parameters.");
        return;
      }
      if (isOccupiedElsewhere) {
        alert("MISSION CONFLICT: Unit is already engaged in an active sector sortie.");
        return;
      }
    }

    setIsProcessing(`v-${volunteerId}`);
    try {
      const current = selectedIncident.assigned_volunteers || [];
      const updated = isCurrentlyInThisIncident ? current.filter(id => id !== volunteerId) : [...current, volunteerId];
      const { error } = await (supabase.from('incidents') as any).update({ assigned_volunteers: updated }).eq('id', selectedIncident.id);
      if (error) throw error;
      await fetchData(true);
    } catch (err) { console.error(err); } finally { setIsProcessing(null); }
  };

  const toggleCenterAssignment = async (centerId: string) => {
    if (!selectedIncident) return;
    setIsProcessing(`c-${centerId}`);
    try {
      const isAlreadyAssigned = (selectedIncident.assigned_centers || []).includes(centerId);
      const current = selectedIncident.assigned_centers || [];
      const updated = isAlreadyAssigned ? current.filter(id => id !== centerId) : [...current, centerId];
      const { error } = await (supabase.from('incidents') as any).update({ assigned_centers: updated }).eq('id', selectedIncident.id);
      if (error) throw error;
      await fetchData(true);
    } catch (err) { console.error(err); } finally { setIsProcessing(null); }
  };

  const resolveIncident = async () => {
    if (!selectedIncident || isResolving) return;
    setIsResolving(true);
    try {
      const { error } = await (supabase.from('incidents') as any).update({ status: 'resolved', feedback_status: 'pending', assigned_volunteers: [], assigned_centers: [] }).eq('id', selectedIncident.id);
      if (error) throw error;
      await fetchData(true);
      setSelectedIncident(null);
    } catch (err) { console.error(err); } finally { setIsResolving(false); }
  };

  const activeReports = reports.filter(r => r.status !== 'resolved');

  const nearbyAssets = useMemo(() => {
    if (!selectedIncident || isNaN(selectedIncident.latitude)) return { volunteers: [], centers: [] };
    const sortedVolunteers = [...volunteers].map(v => {
      const vProfile = allResponderProfiles.find(p => p.id === v.profile_id);
      const activeMissions = reports.filter(r => r.status !== 'resolved' && r.assigned_volunteers?.includes(v.profile_id));
      return {
        ...v,
        blood_group: vProfile?.blood_group,
        experience: vProfile?.experience_years,
        is_online: vProfile?.is_online ?? false,
        busyInOtherIncident: activeMissions.some(m => m.id !== selectedIncident.id),
        distance: calculateDistance(selectedIncident.latitude, selectedIncident.longitude, v.latitude || 0, v.longitude || 0)
      };
    }).sort((a, b) => a.distance - b.distance);
    const sortedCenters = [...centers].map(c => ({
      ...c,
      missionLoad: reports.filter(r => r.status !== 'resolved' && (r.assigned_centers || []).includes(c.id)).length,
      distance: calculateDistance(selectedIncident.latitude, selectedIncident.longitude, c.latitude, c.longitude)
    })).sort((a, b) => a.distance - b.distance);
    return { volunteers: sortedVolunteers, centers: sortedCenters };
  }, [selectedIncident, volunteers, centers, reports, allResponderProfiles]);

  const assignedAssetsOnMap = useMemo(() => {
    if (!selectedIncident) return [];
    return nearbyAssets.volunteers.filter(v => 
      selectedIncident.assigned_volunteers?.includes(v.profile_id) && 
      v.latitude && !isNaN(v.latitude) && 
      v.longitude && !isNaN(v.longitude)
    );
  }, [selectedIncident, nearbyAssets]);

  const surveillanceAssets = useMemo(() => {
    return volunteers.filter(v => v.availability && v.latitude && !isNaN(v.latitude) && v.longitude && !isNaN(v.longitude));
  }, [volunteers]);

  const SurveillanceCenter = useMemo((): [number, number] => {
    if (mapFocusOverride && !isNaN(mapFocusOverride[0])) return mapFocusOverride;
    if (surveillanceAssets.length > 0) {
      const first = surveillanceAssets[0];
      return [first.latitude!, first.longitude!];
    }
    return INDIA_CENTER;
  }, [surveillanceAssets, mapFocusOverride]);

  const locateVolunteerOnMap = (lat: number, lng: number) => {
    if (isNaN(lat) || isNaN(lng)) return;
    setViewingVolunteer(null);
    setIsSurveillanceActive(true);
    setMapFocusOverride([lat, lng]);
    setTimeout(() => {
       const el = document.getElementById('surveillance-anchor');
       el?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const getTimeSince = (dateStr: string) => {
     const last = new Date(dateStr).getTime();
     const now = new Date().getTime();
     const seconds = Math.floor((now - last) / 1000);
     if (seconds < 60) return `${seconds}s ago`;
     return `${Math.floor(seconds / 60)}m ago`;
  };

  if (authLoading || (isLoading && isDbVerified === null)) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f1f5f9]">
      <RefreshCw className="animate-spin text-red-600 mb-4" size={32} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verifying Strategic Link...</p>
    </div>
  );

  if (isDbVerified === false) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f1f5f9]">
        <Header />
        <main className="flex-grow flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden text-center p-12 relative">
             <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12"><Lock size={200} /></div>
             <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-red-100 shadow-xl shadow-red-100/50 relative z-10">
                <ShieldAlert size={48} />
             </div>
             <div className="relative z-10">
                <h2 className="text-4xl font-black text-[#002147] uppercase tracking-tighter mb-4">Command Authorization Required</h2>
                <div className="w-16 h-1 bg-yellow-500 mx-auto mb-8"></div>
                <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10">
                  Respected Coordinator {profile?.full_name}, your command credentials are being verified by the National Command Deck. 
                  <br /><br />
                  Operational access to sector intel and resource mobilization is restricted until authorized by a Strategic Administrator.
                </p>
                <button 
                  onClick={() => fetchData()}
                  className="w-full py-5 bg-[#002147] text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-3 border-b-4 border-yellow-500"
                >
                  <RefreshCw size={16} /> Re-Sync Connection
                </button>
             </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <style>{markerStyles}</style>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Sector Command Deck</span>
              <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1">
                <MapPin size={10} /> {profile?.city || 'HQ'}
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase tracking-tighter">Coordinator Dashboard</h1>
          </div>
          <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-red-100 flex items-center gap-4 group max-w-xl flex-grow">
             <div className="p-3 bg-red-600 text-white rounded-2xl"><Radio size={24} className="animate-pulse" /></div>
             <div className="flex-grow">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Emergency Signal (EBS)</p>
                <input 
                  type="text" 
                  value={broadcastText} 
                  onChange={(e) => setBroadcastText(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleSendEBS()}
                  placeholder="Direct command..." 
                  className="w-full bg-transparent border-none text-sm font-bold text-slate-900 focus:ring-0" 
                />
             </div>
             <button 
              disabled={isProcessing === 'broadcasting' || !broadcastText.trim()}
              onClick={handleSendEBS} 
              className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all flex items-center gap-2"
             >
                {isProcessing === 'broadcasting' ? <Loader2 size={12} className="animate-spin" /> : 'SEND'}
             </button>
          </div>
        </header>

        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar gap-10">
          {[
            { id: 'incidents', label: t('Incident Alerts', 'घटना अलर्ट'), icon: <AlertTriangle size={18} /> },
            { id: 'volunteers', label: t('Force Units', 'बल इकाइयां'), icon: <Users size={18} /> },
            { id: 'resources', label: t('Logistic Hubs', 'रसद हब'), icon: <Building2 size={18} /> }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as CoordinatorTab)} className={cn("flex items-center gap-2 px-8 py-4 text-sm font-black border-b-2 transition-all uppercase tracking-widest", activeTab === tab.id ? "border-red-600 text-red-600" : "border-transparent text-slate-400 hover:text-slate-600")}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="animate-in fade-in duration-500">
          {isLoading ? (
            <div className="p-20 text-center"><Loader2 className="animate-spin text-red-600 mb-4" size={48} /></div>
          ) : activeTab === 'incidents' ? (
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
              {activeReports.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {activeReports.map(report => (
                    <div key={report.id} className="p-8 flex flex-col md:flex-row justify-between md:items-center hover:bg-slate-50 transition-colors gap-6">
                      <div className="flex gap-6">
                        <div className={cn("w-2 rounded-full", report.status === 'reported' ? 'bg-amber-500 animate-pulse' : 'bg-red-600')}></div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", getSeverityColor(report.severity))}>{report.severity}</span>
                            {report.status === 'reported' ? (
                               <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1 border border-amber-200"><Clock size={10} /> Awaiting Vetting</span>
                            ) : (
                               <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1 border border-green-200"><ShieldCheck size={10} /> Live Incident</span>
                            )}
                          </div>
                          <h3 className="font-black text-2xl text-black tracking-tight uppercase leading-none">{report.title}</h3>
                        </div>
                      </div>
                      <button onClick={() => setSelectedIncident(report)} className="px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-600 transition-all flex items-center gap-2">
                        Strategic Control <ArrowRight size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-20 text-center"><CheckCircle className="text-green-500 mx-auto mb-4" size={48} /><p className="text-slate-800 font-bold uppercase">Sector All-Clear</p></div>
              )}
            </div>
          ) : activeTab === 'volunteers' ? (
            <div className="space-y-8">
               <div id="surveillance-anchor" className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
                     <Satellite size={18} className="text-blue-600" />
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global GPS Telemetry</p>
                        <p className="text-xs font-black text-slate-900 uppercase">{surveillanceAssets.length} Units Transmitting</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsSurveillanceActive(!isSurveillanceActive);
                      if (isSurveillanceActive) setMapFocusOverride(null);
                    }}
                    className={cn(
                      "px-8 py-4 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-xl flex items-center gap-3 border-b-4",
                      isSurveillanceActive ? "bg-red-600 text-white border-red-900" : "bg-[#002147] text-white border-yellow-500"
                    )}
                  >
                    {isSurveillanceActive ? <><X size={16} /> Disable Surveillance</> : <><Radar size={16} className="animate-spin-slow" /> Sector Surveillance Map</>}
                  </button>
               </div>

               {isSurveillanceActive && (
                 <div className="h-[500px] w-full bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden relative animate-in zoom-in duration-300">
                    <MapContainer 
                      center={SurveillanceCenter} 
                      zoom={mapFocusOverride ? 16 : (SurveillanceCenter[0] !== INDIA_CENTER[0] ? 12 : 5)} 
                      className="h-full w-full"
                      zoomControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapInvalidator trigger={volunteers} />
                      <MapController surveillanceMode={true} center={SurveillanceCenter} forceZoom={mapFocusOverride ? 16 : 12} />
                      {surveillanceAssets.map(v => (
                         <Marker 
                          key={v.id} 
                          position={[v.latitude!, v.longitude!]} 
                          icon={createResponderIcon(v.status === 'on_mission')}
                         >
                            <Popup closeButton={false}>
                               <div className="p-2 min-w-[150px]">
                                  <div className="flex items-center gap-2 mb-2">
                                     <div className={cn("w-2 h-2 rounded-full", v.status === 'on_mission' ? "bg-emerald-500" : "bg-blue-500")}></div>
                                     <p className="text-[10px] font-black uppercase text-slate-900">{v.full_name}</p>
                                  </div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Unit Status: {v.status.replace('_', ' ')}</p>
                                  <button 
                                    onClick={() => {
                                      const prof = allResponderProfiles.find(p => p.id === v.profile_id);
                                      if (prof) setViewingVolunteer(prof);
                                    }}
                                    className="w-full py-2 bg-slate-900 text-white text-[8px] font-black uppercase rounded-lg"
                                  >
                                    View Dossier
                                  </button>
                               </div>
                            </Popup>
                         </Marker>
                      ))}
                    </MapContainer>
                    <div className="absolute top-6 left-6 z-[1000] bg-slate-900/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-2xl">
                       <div className="flex items-center gap-3">
                          <Activity size={16} className="text-emerald-500 animate-pulse" />
                          <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Force Distribution Overlay</p>
                       </div>
                    </div>
                    <div className="absolute bottom-6 right-6 z-[1000] space-y-2">
                       <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-slate-200 shadow-xl flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                          <p className="text-[9px] font-black text-slate-900 uppercase">Unit Available</p>
                       </div>
                       <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-slate-200 shadow-xl flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                          <p className="text-[9px] font-black text-slate-900 uppercase">Unit Engaged</p>
                       </div>
                    </div>
                 </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {volunteers.map(v => {
                    const vProfile = allResponderProfiles.find(p => p.id === v.profile_id);
                    const isOnline = vProfile?.is_online;
                    const hasSignal = v.latitude && !isNaN(v.latitude) && v.longitude && !isNaN(v.longitude);
                    return (
                      <div key={v.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                          <div className={cn("absolute right-0 top-0 p-8 opacity-5", v.status === 'on_mission' ? "text-blue-600" : "text-slate-400")}>
                            <Heart size={80} />
                          </div>
                          <div className="flex items-center gap-4 mb-6">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", !isOnline ? 'bg-slate-300' : 'bg-blue-600')}>
                              <Users size={24} />
                            </div>
                            <div>
                              <h4 className="text-xl font-black text-black uppercase leading-none mb-1">{v.full_name}</h4>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-2.5 h-2.5 rounded-full", isOnline ? "bg-green-500 animate-pulse" : "bg-slate-300")}></div>
                                <span className={cn("text-[10px] font-black uppercase tracking-widest", isOnline ? "text-emerald-600" : "text-slate-400")}>
                                  {isOnline ? 'Operational (Online)' : 'Stealth Mode (Offline)'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                              <span className="text-slate-400">Specialization</span>
                              <span className="text-blue-600">{(vProfile as any)?.specialization || 'General'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                              <span className="text-slate-400">Experience</span>
                              <span className="text-slate-900">{vProfile?.experience_years || 0} Years</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                              <span className="text-slate-400">GPS Signal</span>
                              <span className={cn("flex items-center gap-1", !!hasSignal ? "text-emerald-600" : "text-slate-300")}>
                                <MapPin size={10} className={cn(!!hasSignal && "animate-bounce")} /> {hasSignal ? 'LOCKED' : 'LOST'}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => vProfile && setViewingVolunteer(vProfile)}
                              className="py-4 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                              Profile <ExternalLink size={12} />
                            </button>
                            <button 
                              disabled={!hasSignal}
                              onClick={() => v.latitude && v.longitude && locateVolunteerOnMap(v.latitude, v.longitude)}
                              className={cn(
                                "py-4 border-b-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                !!hasSignal ? "bg-blue-600 text-white border-blue-900 hover:bg-blue-500 shadow-lg" : "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed"
                              )}
                            >
                              Locate <Target size={12} />
                            </button>
                          </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          ) : activeTab === 'resources' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {centers.map(center => (
                <div key={center.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                   <div className="absolute right-0 top-0 p-8 opacity-5 text-orange-600">
                     <Building2 size={80} />
                   </div>
                   <div className="flex items-center gap-4 mb-6">
                     <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                       <Building2 size={24} />
                     </div>
                     <div>
                       <h4 className="text-xl font-black text-black uppercase leading-none mb-1">{center.name}</h4>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{center.type} HUB</span>
                     </div>
                   </div>
                   <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                         <MapPin size={14} className="text-red-600" /> {center.address}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                         <Activity size={14} className="text-emerald-500" /> Sector: {center.city}
                      </div>
                   </div>
                   <button 
                    onClick={() => openCenterInventory(center)}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 border-b-4 border-orange-600"
                   >
                      {isFetchingInventory ? <Loader2 size={14} className="animate-spin" /> : <><Package size={14} /> Inventory Deck</>} <ChevronRight size={14} />
                   </button>
                </div>
              ))}
            </div>
          ) : (
             <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Select Intelligence Tab</div>
          )}
        </div>

        {viewingVolunteer && (
          <div className="fixed inset-0 z-[3000] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20">
               <div className="h-40 bg-[#002147] relative flex items-end px-10 pb-6 border-b-4 border-yellow-500">
                  <div className="absolute top-0 right-0 p-10 opacity-5 text-white"><Heart size={120} /></div>
                  <button onClick={() => setViewingVolunteer(null)} className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"><X size={24} /></button>
                  <div className="flex items-center gap-6 relative z-10">
                     <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-[#002147] shadow-2xl border-2 border-white/20 overflow-hidden">
                        {viewingVolunteer.avatar_url ? <img src={viewingVolunteer.avatar_url} className="w-full h-full object-cover" alt="Unit" /> : <Users size={32} />}
                     </div>
                     <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-2">{viewingVolunteer.full_name}</h2>
                        <span className="bg-yellow-500 text-[#002147] px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest">{viewingVolunteer.role} Dossier</span>
                     </div>
                  </div>
               </div>
               
               <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-2"><Award size={14} /> Credentials</h4>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                           <span className="text-[10px] font-black text-slate-500 uppercase">Specialization</span>
                           <span className="text-xs font-black text-[#002147] uppercase">{(viewingVolunteer as any).specialization || 'Generalist'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                           <span className="text-[10px] font-black text-slate-500 uppercase">Experience</span>
                           <span className="text-xs font-black text-[#002147] uppercase">{viewingVolunteer.experience_years || 0} Missions</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                           <span className="text-[10px] font-black text-slate-500 uppercase">Blood Group</span>
                           <span className="text-xs font-black text-red-600 flex items-center gap-1"><Droplets size={12} /> {viewingVolunteer.blood_group || '--'}</span>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-6">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-2"><Satellite size={14} /> Unit Location</h4>
                     <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><Navigation size={48} className="text-blue-500" /></div>
                        {volunteers.find(v => v.profile_id === viewingVolunteer.id)?.latitude ? (
                          <div className="relative z-10 space-y-4">
                             <div className="flex justify-between items-center">
                                <span className="text-[8px] font-black text-slate-500 uppercase">GPS Position</span>
                                <span className="text-[10px] font-mono font-black text-emerald-500">
                                  {volunteers.find(v => v.profile_id === viewingVolunteer.id)?.latitude?.toFixed(4)}, {volunteers.find(v => v.profile_id === viewingVolunteer.id)?.longitude?.toFixed(4)}
                                </span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-[8px] font-black text-slate-500 uppercase">Last Signal</span>
                                <span className="text-[9px] font-black text-blue-400 uppercase">
                                  {volunteers.find(v => v.profile_id === viewingVolunteer.id)?.last_seen ? getTimeSince(volunteers.find(v => v.profile_id === viewingVolunteer.id)!.last_seen!) : 'N/A'}
                                </span>
                             </div>
                             <button 
                               onClick={() => {
                                  const v = volunteers.find(v => v.profile_id === viewingVolunteer.id);
                                  if (v?.latitude && v?.longitude) locateVolunteerOnMap(v.latitude, v.longitude);
                               }}
                               className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase rounded-xl flex items-center justify-center gap-2 border-b-2 border-blue-800 shadow-lg"
                             >
                                <Target size={14} /> Locate on Grid
                             </button>
                          </div>
                        ) : (
                          <div className="text-center py-4 relative z-10">
                             <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Signal Offline</p>
                          </div>
                        )}
                     </div>
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2"><Info size={14} /> Bio Intel</h4>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                           {viewingVolunteer.bio ? `"${viewingVolunteer.bio}"` : "No institutional bio provided by responder."}
                        </p>
                     </div>
                  </div>
               </div>
               <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button onClick={() => setViewingVolunteer(null)} className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all">Close Dossier</button>
               </div>
            </div>
          </div>
        )}

        {viewingCenterInventory && (
          <div className="fixed inset-0 z-[3000] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20 flex flex-col max-h-[85vh]">
               <div className="p-8 bg-slate-950 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg"><Building2 size={32} /></div>
                     <div>
                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Strategic Supply Deck</p>
                        <h2 className="text-3xl font-black uppercase tracking-tight leading-none">{viewingCenterInventory.center.name}</h2>
                     </div>
                  </div>
                  <button onClick={() => setViewingCenterInventory(null)} className="p-2 hover:bg-white/10 rounded-full text-white transition-all"><X size={24} /></button>
               </div>
               
               <div className="flex-grow p-10 overflow-y-auto no-scrollbar bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {viewingCenterInventory.items.length > 0 ? viewingCenterInventory.items.map((item) => (
                       <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
                          <div className="flex justify-between items-start mb-4">
                             <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600"><Package size={20} /></div>
                             <span className={cn("px-2 py-1 rounded text-[8px] font-black uppercase", item.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                               {item.status}
                             </span>
                          </div>
                          <h4 className="text-sm font-black text-black uppercase mb-1">{item.name}</h4>
                          <p className="text-2xl font-black text-slate-900">{item.quantity} <span className="text-[9px] text-slate-400 font-bold uppercase">{item.unit}</span></p>
                          <div className="mt-4 pt-4 border-t border-slate-50">
                             <p className="text-[8px] font-black text-slate-400 uppercase">Category: {item.type}</p>
                          </div>
                       </div>
                     )) : (
                       <div className="col-span-full py-20 text-center flex flex-col items-center">
                          <Box size={48} className="text-slate-200 mb-4" />
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Inventory Ledger Empty</p>
                       </div>
                     )}
                  </div>
               </div>
               
               <div className="p-8 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[9px] font-black uppercase text-slate-400">Available Resources</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                        <span className="text-[9px] font-black uppercase text-slate-400">Deployed / Transit</span>
                     </div>
                  </div>
                  <button onClick={() => setViewingCenterInventory(null)} className="px-10 py-4 bg-[#002147] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-xl">Close Supply Deck</button>
               </div>
            </div>
          </div>
        )}

        {selectedIncident && (
          <div className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-7xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20 flex flex-col lg:flex-row max-h-[95vh]">
              
              <div className="lg:w-1/4 bg-slate-950 p-10 text-white flex flex-col border-r border-white/5 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                   <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl", getSeverityColor(selectedIncident.severity))}>{selectedIncident.severity}</span>
                   <button onClick={() => setSelectedIncident(null)} className="p-3 hover:bg-white/10 rounded-full bg-white/5 transition-all"><X size={20} /></button>
                </div>
                <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter leading-none">{selectedIncident.title}</h2>
                <p className="text-slate-400 text-sm mb-8 italic">"{selectedIncident.description}"</p>
                
                {selectedIncident.image_url && (
                   <div className="aspect-video bg-slate-900 rounded-2xl mb-8 overflow-hidden border border-white/10">
                      <img src={selectedIncident.image_url} className="w-full h-full object-cover" alt="Ground Signal" />
                   </div>
                )}

                {selectedIncident.status === 'reported' ? (
                  <button onClick={handleApproveIncident} disabled={isProcessing === 'approving'} className="w-full mb-4 py-5 bg-amber-500 text-slate-900 font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-xl">
                    {isProcessing === 'approving' ? <Loader2 size={16} className="animate-spin" /> : <><Megaphone size={20} /> Validate Mission</>}
                  </button>
                ) : (
                  <div className="bg-green-600/20 text-green-400 border border-green-600/50 p-5 rounded-2xl mb-4 flex items-center gap-3">
                     <ShieldCheck size={20} />
                     <p className="text-[10px] font-black uppercase">Live Verification Active</p>
                  </div>
                )}

                <div className="mt-auto">
                  <button onClick={resolveIncident} className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3">Archive Mission</button>
                </div>
              </div>

              <div className="lg:w-3/4 flex flex-col bg-slate-50 overflow-hidden relative">
                 <div className="h-1/2 w-full relative shrink-0">
                    <MapContainer 
                      center={[selectedIncident.latitude, selectedIncident.longitude]} 
                      zoom={14} 
                      maxBounds={INDIA_BOUNDS}
                      maxBoundsViscosity={1.0}
                      minZoom={4}
                      style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }} 
                      zoomControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[selectedIncident.latitude, selectedIncident.longitude]} icon={createIncidentIcon('red')} />
                      {assignedAssetsOnMap.map(v => (
                         <Marker key={v.id} position={[v.latitude!, v.longitude!]} icon={createResponderIcon(true)} />
                      ))}
                      <MapInvalidator trigger={selectedIncident} />
                      <MapController incident={selectedIncident} assets={assignedAssetsOnMap} />
                    </MapContainer>
                    <div className="absolute top-4 left-4 z-[1000] bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl text-white border border-white/10">
                       <p className="text-[8px] font-black uppercase text-blue-400">Sector Control</p>
                       <p className="text-xs font-black uppercase">Target: {selectedIncident.address || 'Geo-Locked'}</p>
                    </div>
                 </div>
                 
                 <div className="flex-grow p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto no-scrollbar bg-white">
                    <div className="space-y-6">
                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3"><Users size={16} className="text-blue-600" /> Force Units</h4>
                       <div className="space-y-2">
                          {nearbyAssets.volunteers.map(v => {
                            const isAssigned = selectedIncident.assigned_volunteers?.includes(v.profile_id);
                            const taskStatus = selectedIncident.volunteer_tasks?.[v.profile_id] || 'pending';
                            return (
                              <button 
                                key={v.id} 
                                onClick={() => toggleVolunteerAssignment(v)} 
                                className={cn(
                                  "w-full p-4 border-2 rounded-2xl flex justify-between items-center transition-all", 
                                  isAssigned ? "border-blue-600 bg-blue-50" : "border-white bg-slate-50 hover:border-slate-300",
                                  (!v.is_online || v.busyInOtherIncident) && !isAssigned ? "opacity-60" : "opacity-100"
                                )}
                              >
                                 <div className="text-left">
                                   <p className="text-xs font-black uppercase text-black">{v.full_name}</p>
                                   <div className="flex items-center gap-3 mt-1">
                                      {isAssigned && (
                                        <div className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase", taskStatus === 'completed' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white')}>
                                          {taskStatus}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1">
                                         {v.is_online ? <Wifi size={10} className="text-emerald-500" /> : <WifiOff size={10} className="text-slate-400" />}
                                         <span className={cn("text-[8px] font-black uppercase", v.is_online ? "text-emerald-600" : "text-slate-400")}>
                                           {v.is_online ? 'Online' : 'Stealth'}
                                         </span>
                                      </div>
                                   </div>
                                 </div>
                                 {isAssigned ? <Unlink size={14} className="text-red-600" /> : <UserPlus size={14} className="text-blue-600" />}
                              </button>
                            );
                          })}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3"><Building2 size={16} className="text-orange-600" /> Support Hubs</h4>
                       <div className="space-y-2">
                          {nearbyAssets.centers.map(c => (
                            <button key={c.id} onClick={() => toggleCenterAssignment(c.id)} className={cn("w-full p-4 border-2 rounded-2xl flex justify-between items-center transition-all", selectedIncident.assigned_centers?.includes(c.id) ? "border-orange-600 bg-orange-50" : "border-white bg-slate-50 hover:border-slate-300")}>
                               <p className="text-xs font-black uppercase text-black">{c.name}</p>
                               {selectedIncident.assigned_centers?.includes(c.id) ? <Unlink size={14} className="text-red-600" /> : <Plus size={14} className="text-orange-600" />}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-3"><History size={16} className="text-red-600" /> Field Intel</h4>
                       <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                          {selectedIncident.field_reports && selectedIncident.field_reports.length > 0 ? (
                            selectedIncident.field_reports.slice().reverse().map((report, idx) => (
                              <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group">
                                 <div className="flex justify-between items-start mb-2">
                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{report.volunteer_name}</p>
                                    <p className="text-[8px] font-bold text-slate-400">{new Date(report.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                 </div>
                                 <p className="text-xs font-medium text-slate-700 leading-relaxed italic">"{report.text}"</p>
                              </div>
                            ))
                          ) : (
                            <div className="py-10 text-center flex flex-col items-center opacity-30">
                               <MessageSquare size={24} className="mb-2" />
                               <p className="text-[9px] font-black uppercase">No Field SitReps</p>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default memo(CoordinatorDashboard);
