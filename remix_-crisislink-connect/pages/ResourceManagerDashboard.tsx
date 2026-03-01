import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { 
  Package, 
  Truck, 
  Plus, 
  MapPin, 
  Building2, 
  Loader2, 
  LayoutDashboard, 
  History, 
  Send, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowRight,
  TrendingUp, 
  BrainCircuit, 
  X,
  RefreshCw,
  ShieldCheck,
  Building,
  Edit2,
  Activity,
  Signal,
  Target,
  Minus,
  Info,
  ChevronRight,
  Clock,
  Box,
  Database,
  MessageSquare,
  Users,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../integrations/supabase/client';
import { Resource, ResourceCenter, Incident, FieldReport, Dispatch, DispatchStatus } from '../types';
import { formatDateTime, cn, getSeverityColor } from '../lib/utils';

const ResourceManagerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [center, setCenter] = useState<ResourceCenter | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [supportedIncidents, setSupportedIncidents] = useState<Incident[]>([]);
  const [activePipeline, setActivePipeline] = useState<Dispatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  
  const [showDispatchModal, setShowDispatchModal] = useState<Resource | null>(null);
  const [dispatchTarget, setDispatchTarget] = useState<Incident | null>(null);
  const [dispatchQuantity, setDispatchQuantity] = useState<number>(0);
  
  const [showResourceForm, setShowResourceForm] = useState<{show: boolean, editing: Resource | null}>({ show: false, editing: null });
  const [selectedIncidentForIntel, setSelectedIncidentForIntel] = useState<Incident | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    quantity: number;
    unit: string;
    status: 'available' | 'deployed' | 'maintenance';
  }>({
    name: '',
    type: 'General',
    quantity: 0,
    unit: 'Units',
    status: 'available'
  });

  useEffect(() => {
    if (showResourceForm.editing) {
      setFormData({
        name: showResourceForm.editing.name,
        type: showResourceForm.editing.type,
        quantity: showResourceForm.editing.quantity,
        unit: showResourceForm.editing.unit,
        status: showResourceForm.editing.status
      });
    } else {
      setFormData({
        name: '',
        type: 'General',
        quantity: 0,
        unit: 'Units',
        status: 'available'
      });
    }
  }, [showResourceForm.editing, showResourceForm.show]);

  const fetchDashboardData = async (silent = false) => {
    if (!profile || !profile.assigned_center_id) {
      setIsLoading(false);
      return;
    }
    
    if (!silent) setIsLoading(true);
    else setIsRefetching(true);

    try {
      const { data: centerData, error: cErr } = await (supabase.from('resource_centers') as any)
        .select('*')
        .eq('id', profile.assigned_center_id)
        .single();
      
      if (cErr) throw cErr;
      setCenter(centerData);

      const { data: resData } = await (supabase.from('resources') as any)
        .select('*')
        .eq('center_id', profile.assigned_center_id);
      setResources(resData || []);

      const { data: incData } = await (supabase.from('incidents') as any)
        .select('*')
        .eq('city', profile.city)
        .neq('status', 'resolved')
        .contains('assigned_centers', [profile.assigned_center_id]);
      
      setSupportedIncidents(incData || []);

      // Update the active intel modal if it's open
      if (selectedIncidentForIntel) {
        const updated = (incData || []).find((i: Incident) => i.id === selectedIncidentForIntel.id);
        if (updated) setSelectedIncidentForIntel(updated);
      }

      const { data: dispatchData } = await (supabase.from('dispatches') as any)
        .select('*')
        .eq('center_id', profile.assigned_center_id)
        .order('created_at', { ascending: false });
      
      setActivePipeline(dispatchData || []);
    } catch (err: any) {
      console.error("Logistics Fetch Error:", err);
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const channel = supabase.channel('logistics_master_sync_v5')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => fetchDashboardData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => fetchDashboardData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatches' }, () => fetchDashboardData(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, selectedIncidentForIntel?.id]);

  const updateDispatchStatus = async (dispatch: Dispatch, nextStatus: DispatchStatus) => {
    if (isProcessingAction) return;
    setIsProcessingAction(true);
    try {
      const { error } = await (supabase.from('dispatches') as any)
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', dispatch.id);

      if (error) throw error;
      fetchDashboardData(true);
    } catch (err: any) {
      console.error("Status Update Error:", err);
      alert("Status update failed: " + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.assigned_center_id || !center) {
      alert("Error: You are not assigned to a Resource Hub.");
      return;
    }
    
    if (isProcessingAction) return;
    setIsProcessingAction(true);

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        quantity: formData.quantity,
        unit: formData.unit,
        status: formData.status,
        center_id: profile.assigned_center_id,
        city: center.city,
        latitude: center.latitude,
        longitude: center.longitude
      };

      let result;
      if (showResourceForm.editing) {
        result = await (supabase.from('resources') as any)
          .update(payload)
          .eq('id', showResourceForm.editing.id);
      } else {
        result = await (supabase.from('resources') as any)
          .insert([payload]);
      }

      if (result.error) throw result.error;

      setShowResourceForm({ show: false, editing: null });
      await fetchDashboardData(true);
      alert("Resource successfully synchronized with Operational Grid.");
    } catch (err: any) {
      console.error("Inventory Save Error:", err);
      alert("DATABASE REJECTION: " + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDispatch = async () => {
    if (isProcessingAction || !showDispatchModal || !dispatchTarget || dispatchQuantity <= 0) return;
    
    if (dispatchQuantity > showDispatchModal.quantity) {
      alert(t("Requested quantity exceeds stock.", "अनुरोधित मात्रा स्टॉक से अधिक है।"));
      return;
    }

    setIsProcessingAction(true);
    try {
      const newQuantity = showDispatchModal.quantity - dispatchQuantity;
      const { error: invErr } = await (supabase.from('resources') as any).update({ quantity: newQuantity }).eq('id', showDispatchModal.id);
      if (invErr) throw invErr;

      const { error: disErr } = await (supabase.from('dispatches') as any).insert([{
        resource_id: showDispatchModal.id,
        incident_id: dispatchTarget.id,
        center_id: center?.id,
        resource_name: showDispatchModal.name,
        incident_title: dispatchTarget.title,
        quantity: dispatchQuantity,
        unit: showDispatchModal.unit,
        status: 'preparing' as const
      }]);
      if (disErr) throw disErr;

      setShowDispatchModal(null);
      await fetchDashboardData(true);
      alert("Mission Sortie Transmitted.");
    } catch (err: any) {
      console.error("Dispatch Error:", err);
      alert("TRANSCEIVER ERROR: " + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white"><Loader2 className="animate-spin" /></div>;

  if (!profile?.assigned_center_id) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Header />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-200 text-center">
             <div className="w-20 h-20 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-8"><ShieldCheck size={40} /></div>
             <h2 className="text-3xl font-black text-[#002147] uppercase mb-4">Unassigned Node</h2>
             <p className="text-slate-500 font-medium mb-8">Your account is not linked to a Resource Center. Contact an administrator to map your User UUID to a Hub ID.</p>
             <button onClick={() => window.location.reload()} className="w-full py-4 bg-[#002147] text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 border-b-4 border-yellow-500"><RefreshCw size={14} /> Re-Sync Hub Status</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />
      
      <div className="bg-slate-950 text-white py-12 px-8 border-b-8 border-blue-600 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12"><Building size={240} /></div>
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
           <div className="flex items-center gap-8">
              <div className="p-6 bg-blue-600 rounded-[2.5rem] shadow-xl"><Building2 size={40} /></div>
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">{center?.name || t('Logistics Node', 'लॉजिस्टिक्स नोड')}</h1>
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
                   <MapPin size={12} /> {center?.city} • {t('Strategic Hub Active', 'रणनीतिक हब सक्रिय')}
                </p>
              </div>
           </div>
           <div className="flex gap-12">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('In Transit', 'मार्ग में')}</p>
                <p className="text-3xl font-black uppercase text-amber-500">
                  {activePipeline.filter(p => p.status === 'transit').length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('Total Dispatches', 'कुल प्रेषण')}</p>
                <p className="text-3xl font-black uppercase text-white">
                  {activePipeline.length}
                </p>
              </div>
           </div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          
          <section>
            <div className="flex justify-between items-end mb-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Truck size={20} className="text-amber-500" /> {t('Active Logistics Pipeline', 'सक्रिय रसद पाइपलाइन')}
              </h3>
            </div>

            <div className="space-y-4">
              {activePipeline.length > 0 ? activePipeline.map((dispatch) => (
                <div key={dispatch.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 hover:shadow-md transition-all">
                   <div className="flex items-center gap-6 flex-grow">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center border-b-4 shadow-lg",
                        dispatch.status === 'preparing' ? "bg-blue-50 text-blue-600 border-blue-200" :
                        dispatch.status === 'transit' ? "bg-amber-50 text-amber-600 border-amber-200 animate-pulse" :
                        "bg-emerald-50 text-emerald-600 border-emerald-200"
                      )}>
                         <Box size={24} />
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-slate-900 uppercase mb-1">{dispatch.resource_name}</h4>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">{dispatch.quantity} {dispatch.unit} • {formatDateTime(dispatch.created_at)}</p>
                         <p className="text-[10px] font-black text-blue-600 uppercase mt-1">Target: {dispatch.incident_title}</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                      {[
                        { id: 'preparing', label: 'Pack' },
                        { id: 'transit', label: 'Transit' },
                        { id: 'delivered', label: 'Reached' }
                      ].map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                          <button
                            disabled={dispatch.status === 'delivered' || isProcessingAction}
                            onClick={() => {
                              if (dispatch.status === 'preparing' && step.id === 'transit') updateDispatchStatus(dispatch, 'transit');
                              if (dispatch.status === 'transit' && step.id === 'delivered') updateDispatchStatus(dispatch, 'delivered');
                            }}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                              dispatch.status === step.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-300",
                              (dispatch.status === 'transit' && step.id === 'preparing') || (dispatch.status === 'delivered' && step.id !== 'delivered') ? "text-emerald-500" : ""
                            )}
                          >
                            {step.label}
                          </button>
                          {idx < 2 && <ChevronRight size={14} className="text-slate-200" />}
                        </div>
                      ))}
                   </div>
                </div>
              )) : (
                <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                   <Signal size={40} className="mx-auto text-slate-200 mb-4" />
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No active shipments in pipeline</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="flex justify-between items-end mb-8 border-t border-slate-200 pt-12">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <LayoutDashboard size={20} className="text-blue-600" /> {t('Inventory Deck', 'इन्वेंट्री डेक')}
              </h3>
              <button 
                onClick={() => setShowResourceForm({ show: true, editing: null })}
                className="px-8 py-4 bg-[#002147] text-white rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl border-b-4 border-yellow-500"
              >
                <Plus size={16} /> {t('Provision Asset', 'संपत्ति प्रदान करें')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources.map((item) => (
                <div key={item.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Package size={24} /></div>
                    <div className="flex gap-2">
                       <button onClick={() => { setShowDispatchModal(item); setDispatchTarget(null); setDispatchQuantity(0); }} className="p-3 bg-slate-950 text-white rounded-xl hover:bg-emerald-600 transition-all"><Send size={18} /></button>
                       <button onClick={() => setShowResourceForm({ show: true, editing: item })} className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={18} /></button>
                    </div>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 uppercase mb-4">{item.name}</h4>
                  <div className="flex justify-between items-end">
                     <p className="text-4xl font-black text-slate-900">{item.quantity} <span className="text-[11px] text-slate-400 font-bold uppercase ml-1">{item.unit}</span></p>
                     <span className="text-[9px] font-black uppercase bg-slate-100 px-3 py-1 rounded-full">{item.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-8 border-t border-slate-200 pt-12">
              <Target size={20} className="text-orange-500" /> {t('Strategic Objectives', 'रणनीतिक उद्देश्य')} ({supportedIncidents.length}/4)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {supportedIncidents.map(inc => (
                <div key={inc.id} className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm hover:border-blue-500 transition-all group">
                   <div className="flex justify-between items-center mb-6">
                      <span className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase", getSeverityColor(inc.severity))}>{inc.severity}</span>
                      <button 
                        onClick={() => setSelectedIncidentForIntel(inc)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        title="View Live Intel"
                      >
                        <Signal size={20} className="animate-pulse" />
                      </button>
                   </div>
                   <h4 className="text-2xl font-black text-slate-900 uppercase mb-4">{inc.title}</h4>
                   <p className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-2 mb-8"><MapPin size={14} className="text-red-600" /> {inc.address || inc.city}</p>
                   
                   <div className="grid grid-cols-2 gap-2">
                     <Link to="/map" className="flex-1 py-4 bg-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 hover:bg-slate-900 hover:text-white transition-all">
                        {t('Map Intercept', 'मैप इंटरसेप्ट')} <ArrowUpRight size={16} />
                     </Link>
                     <button 
                       onClick={() => setSelectedIncidentForIntel(inc)}
                       className="flex-1 py-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 hover:bg-blue-600 hover:text-white transition-all"
                     >
                        {t('Live Intel', 'लाइव इंटेलिजेंस')} <Eye size={16} />
                     </button>
                   </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-10">
           <div className="bg-slate-950 p-10 rounded-[3.5rem] shadow-2xl border-b-8 border-blue-600 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none rotate-12"><BrainCircuit size={140} /></div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-500 mb-8 flex items-center gap-3">
                <ShieldCheck size={20} /> {t('Hub Intelligence', 'हब इंटेलिजेंस')}
              </h4>
              <p className="text-sm font-bold italic text-slate-300 opacity-90 mb-10">
                {t('"Strategic hubs are restricted to 4 concurrent missions to prevent supply chain breakage and ensure rapid tactical deployment."', '"रणनीतिक हब 4 मिशनों तक सीमित हैं ताकि आपूर्ति श्रृंखला बनी रहे और त्वरित तैनाती सुनिश्चित हो सके।"')}
              </p>
           </div>

           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col h-[500px]">
              <h4 className="text-[11px] font-black uppercase text-slate-400 mb-8 flex items-center gap-3">
                <History size={20} className="text-blue-600" /> {t('Operational Log', 'परिचालन लॉग')}
              </h4>
              <div className="flex-grow overflow-y-auto space-y-6 no-scrollbar">
                 {activePipeline.map(log => (
                   <div key={log.id} className={cn("border-l-4 pl-4 py-2", log.status === 'delivered' ? "border-emerald-500" : "border-blue-600")}>
                      <p className="text-xs font-black text-slate-900 uppercase">
                        {log.status === 'delivered' ? 'COMPLETED' : 'DISPATCHED'}: {log.quantity} {log.resource_name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Target: {log.incident_title}</p>
                   </div>
                 ))}
                 {activePipeline.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                      <Truck size={48} className="mb-4" />
                      <p className="text-[10px] font-black uppercase">{t('No Dispatches Today', 'आज कोई तैनाती नहीं')}</p>
                   </div>
                 )}
              </div>
           </div>
        </aside>
      </main>

      {/* MODAL: LIVE MISSION INTELLIGENCE (SITREPS) */}
      {selectedIncidentForIntel && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20 flex flex-col max-h-[90vh]">
              <div className="p-8 bg-slate-950 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-6">
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border-b-4", getSeverityColor(selectedIncidentForIntel.severity))}>
                      <Signal size={32} className="animate-pulse" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{t('Strategic Mission Monitoring', 'रणनीतिक मिशन निगरानी')}</p>
                       <h2 className="text-3xl font-black uppercase tracking-tight leading-none">{selectedIncidentForIntel.title}</h2>
                    </div>
                 </div>
                 <button onClick={() => setSelectedIncidentForIntel(null)} className="p-2 hover:bg-white/10 rounded-full text-white transition-all"><X size={24} /></button>
              </div>
              
              <div className="flex-grow p-10 overflow-y-auto no-scrollbar bg-slate-50 grid grid-cols-1 lg:grid-cols-2 gap-10">
                 {/* LEFT: MISSION SUMMARY & VOLUNTEERS */}
                 <div className="space-y-8">
                    <div>
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Info size={14} /> Mission Objective</h4>
                       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200">
                          <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{selectedIncidentForIntel.description}"</p>
                          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                             <MapPin size={12} className="text-red-600" /> {selectedIncidentForIntel.address || selectedIncidentForIntel.city}
                          </div>
                       </div>
                    </div>

                    <div>
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Users size={14} /> Assigned Force Units</h4>
                       <div className="space-y-3">
                          {selectedIncidentForIntel.assigned_volunteers && selectedIncidentForIntel.assigned_volunteers.length > 0 ? (
                            selectedIncidentForIntel.assigned_volunteers.map((vId) => (
                              <div key={vId} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Activity size={16} /></div>
                                    <span className="text-[11px] font-black uppercase text-slate-900">Unit UID: {vId.slice(0, 8)}</span>
                                 </div>
                                 <span className={cn(
                                    "px-3 py-1 rounded text-[8px] font-black uppercase text-white",
                                    selectedIncidentForIntel.volunteer_tasks?.[vId] === 'completed' ? 'bg-emerald-600' :
                                    selectedIncidentForIntel.volunteer_tasks?.[vId] === 'in_progress' ? 'bg-blue-600 animate-pulse' : 'bg-slate-400'
                                 )}>
                                    {selectedIncidentForIntel.volunteer_tasks?.[vId] || 'Pending'}
                                 </span>
                              </div>
                            ))
                          ) : (
                            <div className="py-8 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
                               <p className="text-[9px] font-black uppercase text-slate-300">No units deployed yet</p>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* RIGHT: LIVE FIELD SITREPS */}
                 <div>
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><History size={14} /> Field Intelligence Feed (SitReps)</h4>
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 h-[400px] flex flex-col">
                       <div className="flex-grow overflow-y-auto space-y-6 no-scrollbar pr-2">
                          {selectedIncidentForIntel.field_reports && selectedIncidentForIntel.field_reports.length > 0 ? (
                            selectedIncidentForIntel.field_reports.slice().reverse().map((report, idx) => (
                              <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative group">
                                 <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                       <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center"><Users size={12} /></div>
                                       <p className="text-[9px] font-black text-[#002147] uppercase tracking-widest">{report.volunteer_name}</p>
                                    </div>
                                    <p className="text-[8px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10} /> {new Date(report.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                 </div>
                                 <p className="text-xs font-medium text-slate-600 leading-relaxed italic">"{report.text}"</p>
                              </div>
                            ))
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center grayscale">
                               <MessageSquare size={48} className="mb-4" />
                               <p className="text-[10px] font-black uppercase tracking-widest">Awaiting primary field signals...</p>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="p-8 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>
                       <span className="text-[9px] font-black uppercase text-slate-400">Live Telemetry Synchronized</span>
                    </div>
                 </div>
                 <button onClick={() => setSelectedIncidentForIntel(null)} className="px-10 py-4 bg-[#002147] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-xl">Close Intel Deck</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: PROVISION ASSET (ADD/EDIT) */}
      {showResourceForm.show && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 bg-slate-950 text-white flex justify-between items-center relative">
               <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{showResourceForm.editing ? t('Modify Strategic Asset', 'रणनीतिक संपत्ति संशोधित करें') : t('Initialize New Asset', 'नई संपत्ति प्रारंभ करें')}</p>
                  <h2 className="text-3xl font-black uppercase tracking-tight">{t('Resource Provisioning', 'संसाधन प्रावधान')}</h2>
               </div>
               <button onClick={() => setShowResourceForm({ show: false, editing: null })} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSaveResource} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Asset Nomenclature', 'संपत्ति का नाम')}</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Oxygen Cylinders" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Force Capacity Type', 'क्षमता प्रकार')}</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase outline-none">
                    <option value="General">General Relief</option>
                    <option value="Medical">Medical Support</option>
                    <option value="Food">Nutrition/Rations</option>
                    <option value="Equipment">Tactical Equipment</option>
                    <option value="Personnel">Staff/Force</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Inventory Volume', 'इन्वेंट्री वॉल्यूम')}</label>
                  <input required type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Standard Unit', 'मानक इकाई')}</label>
                  <input required type="text" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} placeholder="Units, KG, Liters..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowResourceForm({ show: false, editing: null })} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-[11px] uppercase rounded-2xl hover:bg-slate-200 transition-all">{t('Cancel', 'रद्द करें')}</button>
                <button disabled={isProcessingAction} type="submit" className="flex-[2] py-4 bg-[#002147] text-white font-black text-[11px] uppercase rounded-2xl hover:bg-slate-900 shadow-xl transition-all border-b-4 border-yellow-500">
                  {isProcessingAction ? <Loader2 size={16} className="animate-spin" /> : (showResourceForm.editing ? t('Update Strategic Registry', 'रणनीतिक रजिस्ट्री अपडेट करें') : t('Commit to Operational Grid', 'ग्रिड को प्रतिबद्ध करें'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRECISION DISPATCH */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh] animate-in zoom-in duration-300">
            <div className="lg:w-1/3 bg-slate-950 p-12 text-white flex flex-col justify-between">
              <div>
                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Signal size={14} className="animate-pulse" /> {t('Precision Dispatch', 'सटीक प्रेषण')}</p>
                 <h2 className="text-4xl font-black uppercase leading-none mb-8">{t('Deploy Asset', 'संपत्ति तैनात करें')}</h2>
                 <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Package size={24} /></div>
                       <div><p className="text-lg font-black">{showDispatchModal.name}</p></div>
                    </div>
                 </div>
              </div>
            </div>
            
            <div className="lg:w-2/3 p-12 overflow-y-auto no-scrollbar space-y-10">
               <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3"><Target size={20} className="text-blue-600" /> {t('Strategic Targeting', 'रणनीतिक लक्ष्यीकरण')}</h3>
                  <button onClick={() => setShowDispatchModal(null)} className="p-3 bg-slate-100 text-slate-400 rounded-full hover:bg-red-600 hover:text-white transition-all"><X size={24} /></button>
               </div>

               <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto no-scrollbar p-1">
                  {supportedIncidents.map(inc => (
                    <button 
                      key={inc.id}
                      onClick={() => { setDispatchTarget(inc); setDispatchQuantity(Math.floor(showDispatchModal.quantity * 0.2) || 1); }}
                      className={cn("w-full p-6 border-2 rounded-[2.5rem] flex justify-between items-center transition-all text-left", dispatchTarget?.id === inc.id ? "border-emerald-600 bg-emerald-50" : "border-slate-50 hover:border-blue-500")}
                    >
                       <div>
                          <p className="text-sm font-black text-slate-900 uppercase mb-1">{inc.title}</p>
                          <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase text-white", inc.severity === 'critical' ? 'bg-red-600' : 'bg-blue-600')}>{inc.severity}</span>
                       </div>
                       {dispatchTarget?.id === inc.id ? <CheckCircle2 size={28} className="text-emerald-600" /> : <ArrowRight size={20} className="text-slate-300" />}
                    </button>
                  ))}
               </div>

               {dispatchTarget && (
                 <div className="space-y-8">
                    <div className="flex items-center gap-10 bg-slate-900 p-8 rounded-[3rem] shadow-2xl">
                       <button onClick={() => setDispatchQuantity(Math.max(1, dispatchQuantity - 1))} className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 shadow-lg"><Minus size={24} /></button>
                       <div className="text-center flex-grow">
                          <input type="number" value={dispatchQuantity} onChange={(e) => setDispatchQuantity(parseInt(e.target.value) || 0)} className="w-full bg-transparent text-6xl font-black text-white text-center outline-none" />
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-2">{showDispatchModal.unit}</p>
                       </div>
                       <button onClick={() => setDispatchQuantity(Math.min(showDispatchModal.quantity, dispatchQuantity + 1))} className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 shadow-lg"><Plus size={24} /></button>
                    </div>

                    <button 
                      onClick={handleDispatch}
                      disabled={isProcessingAction || dispatchQuantity <= 0}
                      className="w-full py-6 bg-emerald-600 text-white font-black uppercase tracking-[0.4em] text-sm rounded-3xl shadow-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-4 disabled:opacity-30 border-b-8 border-emerald-800"
                    >
                      {isProcessingAction ? <Loader2 size={24} className="animate-spin" /> : <><CheckCircle2 size={24} /> {t('Transmit Mission Sortie', 'मिशन सॉर्टि भेजें')}</>}
                    </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceManagerDashboard;