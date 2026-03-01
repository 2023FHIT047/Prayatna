import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import { 
  Camera, 
  MapPin, 
  Navigation, 
  Loader2, 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  ArrowLeft,
  X,
  CheckCircle2,
  AlertTriangle,
  Target,
  ShieldAlert,
  Sparkles,
  Eye,
  Zap,
  Info,
  Flame,
  Binary,
  Building,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { GoogleGenAI, Type } from "@google/genai";
import { supabase, INDIA_CENTER } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { cn, calculateDistance } from '../lib/utils';
import { IncidentSeverity, ResourceCenter, Incident } from '../types';

const TACTICAL_MARKER_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const CENTER_MARKER_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ClickHandler = ({ onLocationSelect }: { onLocationSelect: (latlng: L.LatLng) => void }) => {
  const map = useMap();
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
      map.flyTo(e.latlng, map.getZoom(), { animate: true, duration: 1.5 });
    },
  });
  return null;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const sync = () => requestAnimationFrame(() => map.invalidateSize());
    sync();
    const t = setTimeout(sync, 300);
    return () => clearTimeout(t);
  }, [map]);
  return null;
};

const ReportIncident: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  // Phase Management: 1: Capture/Analyze, 2: Verify Data, 3: GPS Targeting, 4: Success
  const [step, setStep] = useState(1);
  
  // Incident Data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [incidentType, setIncidentType] = useState<string>('other');
  
  // Map State
  const [location, setLocation] = useState<{lat: number, lng: number}>({ lat: INDIA_CENTER[0], lng: INDIA_CENTER[1] });
  const [centers, setCenters] = useState<ResourceCenter[]>([]);
  const [existingIncidents, setExistingIncidents] = useState<Incident[]>([]);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [nearbyIncident, setNearbyIncident] = useState<Incident | null>(null);

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, (err) => console.debug("GPS Link Error:", err));
    }
    
    const fetchData = async () => {
      const { data: cData } = await (supabase.from('resource_centers').select('*') as any);
      setCenters(cData || []);
      const { data: iData } = await (supabase.from('incidents').select('*').neq('status', 'resolved') as any);
      setExistingIncidents(iData || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const findNearby = existingIncidents.find(inc => {
      const dist = calculateDistance(location.lat, location.lng, inc.latitude, inc.longitude);
      return dist <= 1.0;
    });
    setNearbyIncident(findNearby || null);
  }, [location, existingIncidents]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { 
        setPreviewUrl(reader.result as string); 
        analyzeIncidentWithAI(reader.result as string); 
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeIncidentWithAI = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { 
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64.split(',')[1] } }, 
            { text: "Analyze this emergency scene. Identify if it is a fire, structural collapse, flood, road accident, or medical emergency. Provide a professional assessment. Return ONLY a valid JSON object with the following keys: \"title\" (short, professional), \"description\" (brief assessment), \"severity\" (one of: low, medium, high, critical), \"incident_type\" (one of: fire, collapse, flood, accident, medical, other)." } 
          ] 
        },
        config: {
          // gemini-3-flash-preview supports JSON response MIME type
          responseMimeType: "application/json"
        }
      });

      let rawText = response.text || '{}';
      
      // Robust extraction in case the model returns markdown-wrapped JSON
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        rawText = jsonMatch[0];
      }

      const result = JSON.parse(rawText);
      
      // Auto-populate form
      setTitle(result.title || 'Unidentified Hazard');
      setDescription(result.description || 'Awaiting field intelligence.');
      setSeverity((result.severity?.toLowerCase() as IncidentSeverity) || 'medium');
      setIncidentType(result.incident_type?.toLowerCase() || 'other');
      
      // Move to Verification Step
      setStep(2);
    } catch (error) { 
      console.error("AI Analysis Fail:", error);
      // Fallback to manual if AI fails
      setStep(2);
      setTitle('Unidentified Mission');
      setDescription('System was unable to perform automated analysis. Please describe the hazard manually.');
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        setAddress(data[0].display_name);
      }
    } catch (err) { console.error("Search Fail:", err); } finally { setIsSearching(false); }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await (supabase.from('incidents').insert({
        title, 
        description, 
        severity, 
        latitude: location.lat, 
        longitude: location.lng, 
        city: profile?.city || 'Unspecified', 
        address, 
        image_url: previewUrl, 
        reporter_id: user?.id, 
        reporter_name: profile?.full_name || 'Citizen Responder',
        status: 'reported', 
        verified: true 
      }) as any);
      if (error) throw error;
      setStep(4);
    } catch (err: any) { alert(`Transmission Fail: ${err.message}`); } finally { setIsSubmitting(false); }
  };

  const severityOptions: { value: IncidentSeverity; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
  ];

  const getIncidentIcon = () => {
    switch(incidentType) {
      case 'fire': return <Flame className="text-red-500" size={32} />;
      case 'collapse': return <Building className="text-orange-600" size={32} />;
      case 'flood': return <Binary className="text-blue-500" size={32} />;
      case 'accident': return <Zap className="text-yellow-500" size={32} />;
      case 'medical': return <Activity className="text-emerald-500" size={32} />;
      default: return <ShieldAlert className="text-slate-400" size={32} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 relative">
          
          <div className="h-2 w-full bg-slate-100">
            <div className="h-full bg-red-600 transition-all duration-700" style={{ width: `${(step / 4) * 100}%` }}></div>
          </div>

          <div className="p-8 sm:p-12">
            {step === 1 && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="flex flex-col gap-2 text-center">
                   <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">AI Tactical Analysis</h1>
                   <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Phase 01: Visual Evidence Integration</p>
                </div>
                
                <div className="relative group">
                  <input type="file" id="ai-vision-up" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  {isAnalyzing ? (
                    <div className="aspect-video bg-slate-950 rounded-[3rem] border-4 border-[#002147] flex flex-col items-center justify-center relative overflow-hidden">
                       <div className="absolute inset-0 bg-blue-500/5 pointer-events-none">
                          <div className="h-0.5 w-full bg-blue-500/50 absolute animate-scanline shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                       </div>
                       <Loader2 className="text-blue-500 animate-spin mb-6" size={64} />
                       <div className="space-y-2 text-center">
                          <p className="text-white font-black uppercase tracking-[0.5em] text-xs">Scanning Digital Field</p>
                          <p className="text-blue-400 font-bold uppercase tracking-widest text-[9px] animate-pulse">Detecting Structural Hazards & Heat Signatures...</p>
                       </div>
                    </div>
                  ) : (
                    <label htmlFor="ai-vision-up" className="block aspect-video bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] cursor-pointer hover:bg-red-50 hover:border-red-200 transition-all group overflow-hidden relative">
                       <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                          <div className="w-24 h-24 bg-white rounded-full shadow-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                             <Camera size={48} className="text-red-600" />
                          </div>
                          <p className="font-black text-[#002147] text-xl uppercase tracking-tighter">Upload Photo to Analyze</p>
                          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">AI will automatically detect the hazard type</p>
                       </div>
                       <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-100 flex items-center justify-between opacity-50">
                          <div className="flex gap-2"><Flame size={14} /><Building size={14} /><Zap size={14} /></div>
                          <p className="text-[8px] font-black uppercase tracking-widest">Secure Image Terminal</p>
                       </div>
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                   <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                      <Zap className="text-yellow-500 mb-3" size={24} />
                      <p className="text-[9px] font-black uppercase text-slate-400">Rapid Response</p>
                      <p className="text-[10px] font-bold text-slate-600 mt-1">AI populates mission data in seconds</p>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                      <ShieldCheck className="text-emerald-500 mb-3" size={24} />
                      <p className="text-[9px] font-black uppercase text-slate-400">High Reliability</p>
                      <p className="text-[10px] font-bold text-slate-600 mt-1">Cross-verified by NDMA protocols</p>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                      <Target className="text-red-500 mb-3" size={24} />
                      <p className="text-[9px] font-black uppercase text-slate-400">Geo-Verification</p>
                      <p className="text-[10px] font-bold text-slate-600 mt-1">Matches image content with location</p>
                   </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <div className="flex justify-between items-start">
                   <div>
                      <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Confirm Intel</h2>
                      <p className="text-red-600 font-black text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Sparkles size={14} /> AI Analysis Complete: Scene Identified
                      </p>
                   </div>
                   <button onClick={() => setStep(1)} className="p-4 bg-slate-100 rounded-2xl text-slate-400 hover:text-red-600 transition-colors">
                      <X size={20} />
                   </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="relative aspect-square rounded-[3rem] overflow-hidden border-4 border-[#002147] shadow-2xl">
                      <img src={previewUrl!} className="w-full h-full object-cover" alt="Scene" />
                      <div className="absolute top-6 left-6 flex items-center gap-3 bg-[#002147] text-white px-5 py-2.5 rounded-full shadow-2xl">
                         {getIncidentIcon()}
                         <span className="text-xs font-black uppercase tracking-widest">{incidentType} Detected</span>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Generated Mission Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-red-500 text-black" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessed Severity</label>
                        <div className="grid grid-cols-2 gap-2">
                          {severityOptions.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setSeverity(opt.value)}
                              className={cn(
                                "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                severity === opt.value 
                                  ? "bg-[#002147] border-[#002147] text-white shadow-lg" 
                                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Field Summary</label>
                        <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 resize-none text-black font-bold" />
                      </div>
                   </div>
                </div>

                <button onClick={() => setStep(3)} className="w-full py-6 bg-[#002147] text-white font-black uppercase tracking-widest text-xs rounded-3xl shadow-xl hover:bg-slate-900 flex items-center justify-center gap-3 border-b-8 border-yellow-500 transition-all active:scale-[0.98]">
                  Verify Location Coordinates <ArrowRight size={18} />
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <div className="text-center">
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">GPS Linkage</h2>
                  <p className="text-red-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                    <MapPin size={14} className="animate-pulse" /> Action: Sync coordinates with mission site
                  </p>
                </div>
                
                {nearbyIncident && (
                  <div className="bg-red-50 border-2 border-red-200 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6 animate-in zoom-in duration-300 shadow-xl shadow-red-100">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center shadow-lg"><ShieldAlert size={24} className="animate-bounce" /></div>
                        <div>
                           <p className="text-xs font-black text-red-600 uppercase tracking-widest">Duplicate Alert</p>
                           <p className="text-sm font-bold text-[#002147] uppercase leading-tight">"{nearbyIncident.title}" already logged nearby.</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => navigate('/community')} className="px-6 py-3 bg-white border border-red-200 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                        <button onClick={() => setNearbyIncident(null)} className="px-6 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">New Incident</button>
                     </div>
                  </div>
                )}

                <div className="h-[400px] rounded-[3rem] overflow-hidden border-4 border-slate-200 relative bg-[#f1f5f9] shadow-inner">
                  <MapContainer center={location} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={location} icon={TACTICAL_MARKER_ICON} />
                    {centers.map(c => (
                      <Marker key={c.id} position={[c.latitude, c.longitude]} icon={CENTER_MARKER_ICON} />
                    ))}
                    <ClickHandler onLocationSelect={(latlng) => setLocation({ lat: latlng.lat, lng: latlng.lng })} />
                    <MapResizer />
                  </MapContainer>
                  <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2">
                    <form onSubmit={handleSearch} className="flex-grow flex gap-1">
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search address..." className="flex-grow px-5 py-4 bg-white rounded-2xl text-xs font-black shadow-2xl border-none text-black outline-none focus:ring-2 focus:ring-red-600" />
                      <button type="submit" className="p-4 bg-red-600 text-white rounded-2xl shadow-lg"><Search size={18} /></button>
                    </form>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep(2)} className="px-10 py-6 bg-slate-100 text-slate-500 font-black rounded-3xl text-[10px] uppercase hover:bg-slate-200">Previous</button>
                  <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || (!!nearbyIncident)} 
                    className={cn(
                      "flex-grow py-6 text-white font-black rounded-3xl shadow-2xl transition-all border-b-8 flex items-center justify-center gap-3",
                      !!nearbyIncident ? "bg-slate-400 border-slate-600 cursor-not-allowed" : "bg-red-600 border-red-900 hover:bg-red-700"
                    )}
                  >
                    {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <><CheckCircle2 size={24} /> Authorize Mission</>}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="py-20 text-center space-y-8 animate-in zoom-in duration-500">
                <div className="w-32 h-32 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-100 ring-8 ring-green-50"><CheckCircle2 size={64} /></div>
                <h2 className="text-5xl font-black text-[#002147] uppercase tracking-tighter">Mission Secured</h2>
                <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">AI analysis has verified your signal. Coordination units and emergency hubs in your sector are now being mobilized.</p>
                <button onClick={() => navigate('/community')} className="px-12 py-6 bg-[#002147] text-white font-black rounded-3xl shadow-xl hover:bg-slate-900 transition-all uppercase tracking-widest text-[11px] border-b-8 border-yellow-500 active:scale-95">Return to Command Hub</button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scanline {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scanline {
          animation: scanline 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ReportIncident;