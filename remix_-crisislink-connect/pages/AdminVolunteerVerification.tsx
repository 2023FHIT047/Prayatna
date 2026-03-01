import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/layout/Header';
import { 
  UserCheck, 
  ShieldAlert, 
  ShieldCheck, 
  Loader2, 
  Mail, 
  MapPin, 
  Clock, 
  Search,
  Users,
  Briefcase,
  Heart,
  Globe,
  Fingerprint,
  CheckCircle,
  XCircle,
  X,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Droplets,
  Activity,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Profile } from '../types';
import { cn } from '../lib/utils';

const AdminVolunteerVerification: React.FC = () => {
  const { profile: adminProfile } = useAuth();
  const [responders, setResponders] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchResponders = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await (supabase.from('profiles') as any)
        .select('*')
        .in('role', ['volunteer', 'coordinator', 'resource_manager']);
      
      if (error) throw error;
      setResponders(data || []);
    } catch (err: any) {
      console.error("Verification Fetch Error:", err);
      setErrorMessage(err.message || "Failed to fetch personnel registry.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResponders();

    // LIVE PROFILE SYNC
    const channel = supabase.channel('personnel_verify_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchResponders(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchResponders]);

  const handleToggleApproval = async (profileId: string, currentStatus: boolean | null) => {
    const isNowApproved = !!currentStatus;
    const nextStatus = !isNowApproved;
    
    // 1. OPTIMISTIC UI UPDATE: Change state locally first for instant feedback
    setResponders(prev => prev.map(r => r.id === profileId ? { ...r, is_approved: nextStatus } : r));
    
    setIsUpdating(profileId);
    setErrorMessage(null);
    
    try {
      const { error } = await (supabase.from('profiles') as any)
        .update({ is_approved: nextStatus })
        .eq('id', profileId);
      
      if (error) {
        // Rollback on failure
        setResponders(prev => prev.map(r => r.id === profileId ? { ...r, is_approved: isNowApproved } : r));
        throw error;
      }
      
      // Success feedback
      console.log(`Personnel Clearance Synchronized: ${profileId} set to ${nextStatus}`);
      
      // Force a silent re-fetch just in case the Realtime channel missed a beat
      await fetchResponders(true);
    } catch (err: any) {
      console.error("Toggle Approval Failure:", err);
      setErrorMessage(`CLEARANCE ERROR: ${err.message || "Failed to synchronize with master node."}`);
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredResponders = responders.filter(r => {
    const matchesSearch = (r.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (r.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (r.city || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const isApproved = !!r.is_approved;
    
    if (filter === 'approved') return matchesSearch && isApproved === true;
    if (filter === 'pending') return matchesSearch && isApproved === false;
    return matchesSearch;
  });

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'coordinator': return <Globe size={18} className="text-indigo-500" />;
      case 'volunteer': return <Heart size={18} className="text-red-500" />;
      case 'resource_manager': return <Briefcase size={18} className="text-emerald-500" />;
      default: return <Users size={18} className="text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-1 bg-red-600"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#002147]">Personnel Verification Node</span>
            </div>
            <h1 className="text-4xl font-black text-[#002147] tracking-tight uppercase">Responder Registry</h1>
            <p className="text-slate-500 mt-2 font-medium">Verify credentials and grant operational clearance to institutional personnel.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => fetchResponders()}
              className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-blue-600 transition-all shadow-sm"
              title="Refresh Registry"
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-8 p-6 bg-red-50 border-l-4 border-red-600 flex items-center justify-between animate-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <AlertTriangle className="text-red-600" size={24} />
              <div>
                <p className="text-xs font-black text-red-800 uppercase tracking-widest">Protocol Warning</p>
                <p className="text-sm font-medium text-red-700 mt-1">{errorMessage}</p>
              </div>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <Search size={14} /> Filter Parameters
              </h3>
              
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, city..." 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-[#002147] focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="mt-8 space-y-2">
                {[
                  { id: 'pending', label: 'Awaiting Clearance', icon: <Clock size={14} /> },
                  { id: 'approved', label: 'Verified Force', icon: <ShieldCheck size={14} /> },
                  { id: 'all', label: 'Total Registry', icon: <Users size={14} /> }
                ].map((t) => (
                  <button 
                    key={t.id}
                    onClick={() => setFilter(t.id as any)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      filter === t.id ? "bg-[#002147] text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    <span className="flex items-center gap-3">{t.icon}{t.label}</span>
                    <span className="opacity-50">{responders.filter(r => t.id === 'all' ? true : (t.id === 'approved' ? !!r.is_approved : !r.is_approved)).length}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#002147] p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden border-b-4 border-yellow-500">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none rotate-12"><ShieldCheck size={120} /></div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-300 mb-6">Tactical Protocol</h4>
              <p className="text-xs font-bold leading-relaxed italic opacity-80">
                "Verify responder credentials against institutional databases before granting operational access to the command grid."
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {isLoading ? (
              <div className="py-24 text-center bg-white rounded-[3rem] border border-slate-100">
                <Loader2 className="animate-spin mx-auto text-red-600 mb-4" size={48} />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Querying Personnel Registry...</p>
              </div>
            ) : filteredResponders.length > 0 ? (
              filteredResponders.map(responder => {
                const isApproved = !!responder.is_approved;
                const isExpanded = expandedId === responder.id;
                
                return (
                  <div key={responder.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden group hover:border-[#002147] transition-all">
                    <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                      <div className="flex gap-6">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner group-hover:bg-red-50 transition-colors">
                          {getRoleIcon(responder.role)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-slate-100 text-[#002147] text-[9px] font-black uppercase tracking-widest rounded-full border border-slate-200">{responder.role}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin size={12} /> {responder.city} Hub</span>
                          </div>
                          <h3 className="text-2xl font-black text-[#002147] uppercase tracking-tight leading-none mb-2">{responder.full_name}</h3>
                          <p className="text-sm font-bold text-slate-500 flex items-center gap-2"><Mail size={14} className="text-slate-300" /> {responder.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <button 
                          onClick={() => handleToggleApproval(responder.id, responder.is_approved)}
                          disabled={isUpdating === responder.id}
                          className={cn(
                            "flex-grow md:flex-none px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all shadow-xl border-b-4",
                            isApproved 
                              ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white" 
                              : "bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-500"
                          )}
                        >
                          {isUpdating === responder.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : isApproved ? (
                            <><XCircle size={16} /> Revoke Clearance</>
                          ) : (
                            <><UserCheck size={16} /> Grant Clearance</>
                          )}
                        </button>
                        <button 
                          onClick={() => setExpandedId(isExpanded ? null : responder.id)}
                          className={cn("p-4 bg-slate-100 text-slate-400 rounded-xl hover:text-[#002147] transition-all", isExpanded && "bg-[#002147] text-white")}
                        >
                          <ChevronRight size={20} className={cn("transition-transform", isExpanded && "rotate-90")} />
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="px-8 pb-8 pt-4 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Fingerprint size={14} /> Identification Vetting</h4>
                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{responder.id_type || 'ID Not Set'}</p>
                              <p className="text-sm font-black text-slate-900">{responder.id_number || 'PENDING_UPLOAD'}</p>
                              <div className="mt-3 pt-3 border-t border-slate-100">
                                <p className="text-[9px] font-mono text-slate-400 break-all">UUID: {responder.id}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity size={14} /> Operational Profile</h4>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Blood Group</span>
                                <span className="text-sm font-black text-red-600 flex items-center gap-1"><Droplets size={12} /> {responder.blood_group || '??'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Experience</span>
                                <span className="text-sm font-black text-slate-900">{responder.experience_years || 0} Years</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Specialty</span>
                                <span className="text-[10px] font-black text-blue-600 uppercase">{(responder as any).specialization || (responder as any).department || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText size={14} /> Personnel Bio</h4>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 h-full">
                               <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                                 {responder.bio ? `"${responder.bio}"` : "No institutional bio provided by responder."}
                               </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-100 flex flex-col items-center">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                    <Users size={40} />
                 </div>
                 <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">No Responders Found</h3>
                 <p className="text-xs text-slate-400 mt-2 font-medium">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminVolunteerVerification;