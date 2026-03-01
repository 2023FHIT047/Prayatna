
import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/layout/Header';
import { 
  UserCog, 
  Building2, 
  Fingerprint, 
  Link as LinkIcon, 
  Unlink, 
  Loader2, 
  ShieldAlert, 
  ShieldCheck, 
  Server,
  ArrowRight,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Profile, ResourceCenter } from '../types';

const AdminPersonnelAllocation: React.FC = () => {
  const { profile } = useAuth();
  const [resourceManagers, setResourceManagers] = useState<Profile[]>([]);
  const [hubs, setHubs] = useState<ResourceCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);

  const fetchTacticalData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      // Fetch Resource Managers
      const { data: mData, error: mErr } = await (supabase.from('profiles') as any)
        .select('*')
        .eq('role', 'resource_manager');
      if (mErr) throw mErr;
      
      // Fetch Resource Centers
      const { data: hData, error: hErr } = await (supabase.from('resource_centers') as any).select('*');
      if (hErr) throw hErr;

      setResourceManagers(mData || []);
      setHubs(hData || []);
    } catch (err) {
      console.error("Tactical Personnel Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTacticalData();

    // LIVE ALLOCATION SYNC
    const channel = supabase.channel('personnel_allocation_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchTacticalData(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resource_centers' }, () => {
        fetchTacticalData(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTacticalData]);

  const handleAssignManager = async (managerId: string, centerId: string | null) => {
    setIsAssigning(managerId);
    try {
      // 1. Update Profile (source of truth for the Manager's dashboard)
      const { error: pError } = await (supabase.from('profiles') as any)
        .update({ assigned_center_id: centerId })
        .eq('id', managerId);
      
      if (pError) throw pError;

      // 2. Update Resource Center (inverse lookup)
      if (centerId) {
        await (supabase.from('resource_centers') as any)
          .update({ manager_id: managerId })
          .eq('id', centerId);
      } else {
        // If unlinking, find center that had this manager and clear it
        await (supabase.from('resource_centers') as any)
          .update({ manager_id: null })
          .eq('manager_id', managerId);
      }

      // Local state updates via Realtime listeners
      alert(centerId ? "LOGISTICS LINK ESTABLISHED" : "PERSONNEL RETURNED TO POOL");
    } catch (err) {
      console.error("Assignment Error:", err);
      alert("SIGNAL FAILURE: Could not sync allocation with the grid.");
    } finally {
      setIsAssigning(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Logistics Management Suite</span>
              <span className="bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1">
                <Server size={10} /> Sector: {profile?.city || 'HQ'}
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase tracking-tighter">Hub Personnel Allocation</h1>
            <p className="text-slate-500 font-medium">Map Logistics Responders to regional Resource Centers.</p>
          </div>
          <button onClick={() => fetchTacticalData()} className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-emerald-600 transition-all shadow-sm active:scale-95">
             <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main List */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none -rotate-12"><Building2 size={160} /></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Logistics Manager Registry</h4>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Sync Active</span>
                 </div>
              </div>

              {isLoading ? (
                <div className="py-20 text-center"><Loader2 size={32} className="animate-spin mx-auto text-emerald-500" /></div>
              ) : resourceManagers.length > 0 ? (
                <div className="space-y-4 relative z-10">
                  {resourceManagers.map(mgr => {
                    const currentHub = hubs.find(h => h.id === mgr.assigned_center_id);
                    return (
                      <div key={mgr.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 hover:border-emerald-500 transition-all group shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-md">
                                 <Fingerprint size={24} />
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{mgr.full_name}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{mgr.email}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              {currentHub ? (
                                <div className="flex items-center gap-4">
                                   <div className="text-right">
                                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Operational Hub</p>
                                      <p className="text-xs font-black text-slate-700 uppercase">{currentHub.name}</p>
                                   </div>
                                   <button 
                                     disabled={isAssigning === mgr.id}
                                     onClick={() => handleAssignManager(mgr.id, null)}
                                     className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg hover:rotate-12"
                                     title="Sever Tactical Link"
                                   >
                                     <Unlink size={18} />
                                   </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                   <select 
                                     className="bg-white border border-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                                     onChange={(e) => {
                                       if (e.target.value) handleAssignManager(mgr.id, e.target.value);
                                     }}
                                     defaultValue=""
                                   >
                                     <option value="" disabled>Select Terminal Hub</option>
                                     {hubs.filter(h => !h.manager_id).map(h => (
                                       <option key={h.id} value={h.id}>{h.name} ({h.city})</option>
                                     ))}
                                   </select>
                                   <div className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-sm">
                                      <LinkIcon size={18} />
                                   </div>
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                   <ShieldAlert className="mx-auto text-slate-300 mb-4" size={32} />
                   <p className="text-xs font-black text-slate-400 uppercase">No logistics personnel detected in this sector.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
             <div className="bg-emerald-600 p-10 rounded-[3rem] shadow-2xl border-b-8 border-white/20 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none rotate-12"><ShieldCheck size={140} /></div>
                <div className="relative z-10">
                   <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-8">Tactical Briefing</h4>
                   <p className="text-sm font-bold leading-relaxed mb-8 opacity-90 italic">
                     "Each Supply Hub must be synchronized with a verified Resource Manager to authorize sortie dispatches and inventory procurement across the regional grid."
                   </p>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 p-5 rounded-3xl border border-white/10">
                         <p className="text-3xl font-black">{resourceManagers.length}</p>
                         <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Logistics Total</p>
                      </div>
                      <div className="bg-white/10 p-5 rounded-3xl border border-white/10">
                         <p className="text-3xl font-black">{resourceManagers.filter(m => m.assigned_center_id).length}</p>
                         <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Active Links</p>
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center shrink-0 border border-blue-100">
                   <UserCog size={32} />
                </div>
                <div>
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Operational Sync</h4>
                   <p className="text-xs text-slate-500 font-medium leading-relaxed">Manager Dashboards will populate instantly upon allocation.</p>
                </div>
             </div>

             <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2"><UserCheck size={14} /> Allocation Protocol</h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></div>
                    <p className="text-[10px] font-medium text-slate-400">Hub IDs are unique to their geographic sectors.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></div>
                    <p className="text-[10px] font-medium text-slate-400">Managers can only oversee ONE hub at a time.</p>
                  </li>
                </ul>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPersonnelAllocation;
