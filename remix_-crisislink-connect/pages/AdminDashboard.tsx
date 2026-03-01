import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '../components/layout/Header';
import { 
  Database, 
  Terminal, 
  Zap, 
  ShieldCheck,
  Server,
  UserPlus,
  Loader2,
  FileText,
  Phone,
  Clock,
  ArrowRight,
  ClipboardCheck,
  RefreshCw,
  Code,
  Skull,
  BarChart3,
  Target,
  Activity,
  CheckCircle2,
  TrendingUp,
  MapPin,
  ShieldAlert,
  Star,
  ZapOff,
  LayoutDashboard,
  MessageSquareQuote,
  Send,
  Eye,
  Radio,
  SignalHigh,
  PhoneOff,
  History,
  MessageSquare
} from 'lucide-react';
import { promoteToAdmin, deployTestReview } from '../lib/seedData';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { formatDateTime, cn, getSeverityColor } from '../lib/utils';
import { Incident } from '../types';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { profile, user, loading } = useAuth();
  const navigate = useNavigate();

  // Tactical State
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [isLoadingTactical, setIsLoadingTactical] = useState(true);

  // Debrief Form State
  const [reporterName, setReporterName] = useState('');
  const [reporterRole, setReporterRole] = useState('CITIZEN');
  const [debriefContent, setDebriefContent] = useState('');
  const [operationalEfficiency, setOperationalEfficiency] = useState(5);
  const [isArchiving, setIsArchiving] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const fetchTacticalData = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingTactical(true);
    try {
      // Single Source of Truth for Incidents
      const { data: incData, error: incErr } = await (supabase.from('incidents').select('*') as any);
      if (incErr) throw incErr;
      setAllIncidents(incData || []);

      // Fetch Reviews
      const { data: revData, error: revErr } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (revErr) throw revErr;
      setAllReviews(revData || []);
    } catch (err) {
      console.error("Tactical Data Sync Error:", err);
    } finally {
      setIsLoadingTactical(false);
    }
  }, []);

  useEffect(() => {
    if (profile) {
      fetchTacticalData();

      // ESTABLISH REAL-TIME UPLINK
      const channel = supabase.channel('admin_global_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
          console.debug("ADMIN_SYNC: Incident delta detected.");
          fetchTacticalData(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
          console.debug("ADMIN_SYNC: Review delta detected.");
          fetchTacticalData(true);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile, fetchTacticalData]);

  // Derived Tactical Queues
  const debriefQueue = useMemo(() => {
    return allIncidents.filter(i => i.status === 'resolved' && (i.feedback_status === 'pending' || !i.feedback_status));
  }, [allIncidents]);

  const stats = useMemo(() => {
    const resolved = allIncidents.filter(i => i.status === 'resolved');
    const total = allIncidents.length;
    const successRate = total > 0 ? Math.round((resolved.length / total) * 100) : 0;
    
    const avgRating = allReviews.length > 0 
      ? (allReviews.reduce((acc, curr) => acc + (curr.rating || 0), 0) / allReviews.length).toFixed(1)
      : "0.0";

    return {
      totalResolved: resolved.length,
      successRate,
      avgRating,
      criticalStabilized: resolved.filter(i => i.severity === 'critical').length
    };
  }, [allIncidents, allReviews]);

  const handleSelfPromotion = async () => {
    if (!user) return;
    await promoteToAdmin(user.id, user.email || '');
  };

  const startDebriefProcess = (incident: Incident) => {
    setReporterName(incident.reporter_name || 'Anonymous Responder');
    setReporterRole('CITIZEN');
    setDebriefContent('');
    setSelectedIncidentId(incident.id);
    const formElement = document.getElementById('debrief-form');
    formElement?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDebriefArchival = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName || !debriefContent) return;
    setIsArchiving(true);
    
    const success = await deployTestReview({
      full_name: reporterName,
      role: reporterRole.toUpperCase(),
      content: debriefContent,
      rating: operationalEfficiency,
      is_verified: true,
      incident_id: selectedIncidentId
    });

    if (success) {
      if (selectedIncidentId) {
        await (supabase.from('incidents') as any)
          .update({ feedback_status: 'completed' })
          .eq('id', selectedIncidentId);
        fetchTacticalData(true);
      }
      alert("MISSION DEBRIEF ARCHIVED: Review live in public feed.");
      setReporterName('');
      setDebriefContent('');
      setSelectedIncidentId(null);
    }
    setIsArchiving(false);
  };

  if (loading || !profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <RefreshCw className="animate-spin text-red-600 mb-4" size={32} />
      <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Syncing Admin Deck</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Strategic Administrator</span>
            </div>
            <h1 className="text-4xl font-black text-[#002147] tracking-tight uppercase">National Command Hub</h1>
          </div>
          <button onClick={() => fetchTacticalData()} className="p-4 bg-white border border-slate-200 text-[#002147] rounded-2xl flex items-center gap-2 group shadow-sm active:scale-95 transition-all">
            <RefreshCw size={18} className={cn(isLoadingTactical && "animate-spin")} />
            <span className="text-[10px] font-black uppercase tracking-widest">Re-Sync Intelligence Feed</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Missions Secured</p>
             <p className="text-6xl font-black text-[#002147] tracking-tighter">{stats.totalResolved}</p>
          </div>
          <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quality Index</p>
             <p className="text-6xl font-black text-[#002147] tracking-tighter">{stats.avgRating}</p>
          </div>
          <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Success Rate</p>
             <p className="text-6xl font-black text-blue-600 tracking-tighter">{stats.successRate}%</p>
          </div>
          <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Critical Stabilized</p>
             <p className="text-6xl font-black text-red-600 tracking-tighter">{stats.criticalStabilized}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
             <h3 className="text-xl font-black text-[#002147] uppercase tracking-widest mb-6 flex items-center gap-3">
               <FileText size={20} className="text-blue-500" /> Mission Debrief Queue
             </h3>
             {isLoadingTactical ? (
               <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>
             ) : debriefQueue.length > 0 ? (
               <div className="space-y-4">
                 {debriefQueue.map(inc => (
                   <div key={inc.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-6 group hover:border-blue-500 transition-all">
                     <div className="flex-grow">
                       <h4 className="font-black text-[#002147] text-lg uppercase tracking-tight">{inc.title}</h4>
                       <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Reporter: {inc.reporter_name} • Signal: {inc.reporter_phone || 'UNKNOWN'}</p>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => startDebriefProcess(inc)} className="px-10 py-4 bg-[#002147] text-white font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 border-b-4 border-yellow-500">
                            Manual Debrief <ArrowRight size={14} />
                        </button>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                 <p className="text-sm font-black text-slate-400 uppercase tracking-widest">All Mission Nodes Resolved</p>
               </div>
             )}
          </div>

          <div className="space-y-8">
            <div className="bg-[#002147] p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden border-b-8 border-yellow-500">
               <div className="absolute -right-4 -top-4 opacity-10 rotate-12"><ShieldCheck size={140} /></div>
               <div className="relative z-10">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-500 mb-6 flex items-center gap-2"><Activity size={16} /> Operational HUD</h4>
                  <div className="space-y-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                         <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Sector Connectivity</p>
                         <p className="text-xs font-black text-emerald-500 uppercase tracking-tighter">OPTIMAL LINK</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                         <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Strategic Coverage</p>
                         <p className="text-xs font-black text-blue-400 uppercase tracking-tighter">100% VISIBILITY</p>
                      </div>
                  </div>
               </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 border-b-4 border-yellow-500">
               <button onClick={handleSelfPromotion} className="w-full py-4 bg-[#002147] text-white font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-slate-900 transition-all shadow-lg active:scale-95">
                 Promote to Admin
               </button>
            </div>
          </div>
        </div>

        <div id="debrief-form" className="mb-12">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm border-b-4 border-blue-500">
            <div className="mb-8">
                <h3 className="text-xl font-black text-[#002147] uppercase tracking-widest mb-2 flex items-center gap-3">
                  <FileText size={20} className="text-blue-500" /> Log Mission Debrief
                </h3>
            </div>
            <form onSubmit={handleDebriefArchival} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reporter Identification</label>
                  <input required type="text" value={reporterName} onChange={(e) => setReporterName(e.target.value)} placeholder="Full Name" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#002147] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Force Category</label>
                  <select value={reporterRole} onChange={(e) => setReporterRole(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#002147] outline-none">
                    <option value="CITIZEN">CITIZEN</option>
                    <option value="RESPONDER">RESPONDER</option>
                    <option value="COORDINATOR">COORDINATOR</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mission Summary / Field Notes</label>
                <textarea required rows={4} value={debriefContent} onChange={(e) => setDebriefContent(e.target.value)} placeholder="Summary of the mission resolution..." className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#002147] outline-none resize-none" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setOperationalEfficiency(star)} className="p-2 transition-all">
                      <Star size={20} fill={operationalEfficiency >= star ? "#eab308" : "none"} stroke="currentColor" className={operationalEfficiency >= star ? "text-yellow-500" : "text-slate-300"} />
                    </button>
                  ))}
                </div>
                <button disabled={isArchiving || !reporterName || !debriefContent || !selectedIncidentId} type="submit" className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center gap-3 border-b-4 border-blue-800 shadow-lg">
                  {isArchiving ? <Loader2 size={16} className="animate-spin" /> : <><ClipboardCheck size={16} /> Archive & Publish</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;