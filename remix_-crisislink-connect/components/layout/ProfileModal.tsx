import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, User, Phone, Mail, Shield, Activity, ShieldCheck, Heart, Briefcase, Globe, Terminal, LogOut, Camera, Loader2, MapPin, Satellite, Navigation, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("GPS Hardware Not Detected");
      return;
    }

    setIsFetchingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentCoords(coords);
        
        // If they are a volunteer, sync to the database immediately
        if (profile?.role === 'volunteer') {
          try {
            await (supabase.from('volunteers') as any)
              .update({ 
                latitude: coords.lat, 
                longitude: coords.lng,
                last_seen: new Date().toISOString()
              })
              .eq('profile_id', profile.id);
          } catch (e) {
            console.error("Telemetry Sync Error:", e);
          }
        }
        setIsFetchingLocation(false);
      },
      (error) => {
        console.error("GPS Error:", error);
        setLocationError("Signal Blocked or Timeout");
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (isOpen && profile?.role === 'volunteer') {
      fetchCurrentLocation();
    }
  }, [isOpen, profile?.role]);

  if (!isOpen || !profile) return null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSignOut = async () => {
    onClose();
    await signOut();
    navigate('/');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const { error } = await (supabase.from('profiles') as any)
          .update({ avatar_url: base64 })
          .eq('id', profile.id);
        
        if (error) throw error;
        
        await updateProfile({ avatar_url: base64 });
        alert("Digital Identity Updated: Your profile photo has been synchronized.");
      } catch (err) {
        console.error("Avatar update failed:", err);
        alert("System Error: Failed to synchronize avatar with the Grid.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'admin': return <Shield size={32} />;
      case 'coordinator': return <Globe size={32} />;
      case 'volunteer': return <Heart size={32} />;
      case 'resource_manager': return <Briefcase size={32} />;
      default: return <User size={32} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#002147]/90 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className="relative w-full max-w-3xl bg-white shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col border border-white/20 rounded-[3rem]">
        
        <div className="h-48 bg-[#002147] relative flex items-end px-12 pb-8 border-b-4 border-yellow-500">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">{getRoleIcon(profile.role)}</div>
          <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"><X size={24} /></button>

          <div className="flex items-center gap-8 relative z-10">
            <div 
              onClick={handleAvatarClick}
              className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center text-[#002147] border-4 border-white/10 relative group cursor-pointer overflow-hidden"
            >
              {isUploading ? (
                <Loader2 size={32} className="animate-spin" />
              ) : profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getRoleIcon(profile.role)
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                <Camera size={20} className="mb-1" />
                <span className="text-[8px] font-black uppercase">Change</span>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
            <div className="text-white">
               <div className="flex items-center gap-3 mb-2">
                 <span className="bg-yellow-500 text-[#002147] px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest">{profile.role} Profile</span>
               </div>
               <h2 className="text-3xl font-black tracking-tight uppercase leading-none">{profile.full_name}</h2>
               <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.4em] mt-2">{profile.city} Sector Hub</p>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-8 overflow-y-auto max-h-[60vh] no-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3"><Terminal size={16} /> Data Parameters</h3>
                 <div className="space-y-5">
                    <div className="flex items-center gap-4 group">
                       <div className="w-10 h-10 bg-slate-50 text-[#002147] flex items-center justify-center rounded-xl group-hover:bg-yellow-500 group-hover:text-white transition-all"><Mail size={20} /></div>
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital ID</p>
                          <p className="text-sm font-bold text-slate-900">{profile.email}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                       <div className="w-10 h-10 bg-slate-50 text-[#002147] flex items-center justify-center rounded-xl group-hover:bg-yellow-500 group-hover:text-white transition-all"><Phone size={20} /></div>
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Signal Terminal</p>
                          <p className="text-sm font-bold text-slate-900">{profile.phone_number || 'OFFLINE'}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* TELEMETRY SECTION */}
              <div className="space-y-6">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3"><Satellite size={16} /> Live Telemetry</h3>
                 <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Navigation size={60} className="text-blue-500" /></div>
                    
                    {isFetchingLocation ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <RefreshCw className="animate-spin text-blue-500 mb-2" size={24} />
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Querying Satellite...</p>
                      </div>
                    ) : locationError ? (
                      <div className="text-center py-4">
                         <p className="text-red-500 text-xs font-black uppercase mb-2">{locationError}</p>
                         <button onClick={fetchCurrentLocation} className="text-[9px] font-black text-white underline uppercase">Retry Fix</button>
                      </div>
                    ) : currentCoords ? (
                      <div className="space-y-3 relative z-10">
                        <div className="flex justify-between items-center">
                           <span className="text-[8px] font-black text-slate-500 uppercase">Latitude</span>
                           <span className="text-xs font-mono font-black text-emerald-500">{currentCoords.lat.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-[8px] font-black text-slate-500 uppercase">Longitude</span>
                           <span className="text-xs font-mono font-black text-emerald-500">{currentCoords.lng.toFixed(6)}</span>
                        </div>
                        <button 
                          onClick={fetchCurrentLocation}
                          className="w-full mt-4 py-2 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 border-b-2 border-blue-800 active:translate-y-0.5"
                        >
                          <RefreshCw size={10} /> Refresh GPS Signal
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                         <button onClick={fetchCurrentLocation} className="px-6 py-2 bg-blue-600 text-white text-[9px] font-black uppercase rounded-xl">Locate Me</button>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3"><Activity size={16} /> Operational Profile</h3>
                 <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Functional Specialization</p>
                    <p className="text-sm font-black text-[#002147] uppercase">{(profile as any).specialization || (profile as any).department || 'Standard Protocol'}</p>
                    <div className="mt-4 pt-4 border-t border-slate-200">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Authorization ID</p>
                       <p className="text-[9px] font-mono text-slate-500 break-all">{profile.id}</p>
                    </div>
                 </div>
              </div>
              <div className="flex items-end">
                <div className="w-full bg-[#002147] p-8 rounded-[2rem] flex items-center justify-between text-white border-b-4 border-yellow-500 shadow-xl">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-yellow-500 border border-white/5"><ShieldCheck size={24} /></div>
                      <div>
                         <p className="text-[9px] font-black uppercase text-white/50 mb-0.5">Verification</p>
                         <p className="text-sm font-black tracking-tight uppercase">Verified Responder</p>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
            <button onClick={handleSignOut} className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center gap-3">
              De-Authorize <LogOut size={16} />
            </button>
            <button onClick={onClose} className="px-8 py-4 bg-[#002147] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg transition-all">Close Deck</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;