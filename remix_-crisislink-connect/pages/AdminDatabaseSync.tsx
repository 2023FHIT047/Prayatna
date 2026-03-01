import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import { 
  Database, 
  Terminal, 
  Zap, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Server,
  Code,
  ArrowRight,
  Cpu,
  Trash2,
  Skull,
  UserX
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

/**
 * Admin Database Synchronization Terminal
 * Allows administrators to verify schema health and run strategic migrations.
 */
const AdminDatabaseSync: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'checking' | 'syncing' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [health, setHealth] = useState<{columnExists: boolean | null, userCount: number | null, notificationTable: boolean | null}>({ 
    columnExists: null,
    userCount: null,
    notificationTable: null
  });
  const [showConfirmWipe, setShowConfirmWipe] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const checkInfrastructureHealth = async () => {
    setStatus('checking');
    addLog("Initiating Infrastructure Health Check...");
    try {
      const { error: colError } = await supabase.from('incidents').select('reporter_phone').limit(1);
      const exists = !(colError && (colError.code === '42703' || colError.message.includes('reporter_phone')));
      
      const { error: notifyError } = await supabase.from('notifications').select('id').limit(1);
      const tableExists = !notifyError || notifyError.code !== '42P01';

      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      setHealth({ 
        columnExists: exists,
        userCount: count || 0,
        notificationTable: tableExists
      });

      if (!exists) addLog("CRITICAL: Column 'reporter_phone' missing from 'incidents' table.");
      if (!tableExists) addLog("WARNING: 'notifications' table not detected for EBS System.");
      addLog(`STATUS: Detected ${count || 0} active profiles in registry.`);
      
    } catch (err: any) {
      addLog(`ERROR: Health check failed - ${err.message}`);
    } finally {
      setStatus('idle');
    }
  };

  useEffect(() => {
    checkInfrastructureHealth();
  }, []);

  const runGlobalSync = async () => {
    setStatus('syncing');
    setLogs([]);
    addLog("Starting Global Infrastructure Synchronization...");

    const migrationScript = `
      -- 1. Profile Table Synchronization
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_center_id UUID;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_type TEXT;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_number TEXT;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_group TEXT;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
      
      -- 2. Incident Table Synchronization
      ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS reporter_name TEXT;
      ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS reporter_phone TEXT;
      ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS feedback_status TEXT DEFAULT 'pending';
      ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
      ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS address TEXT;

      -- 3. Notification Table Infrastructure (EBS Fix)
      CREATE TABLE IF NOT EXISTS public.notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          created_at TIMESTAMPTZ DEFAULT now(),
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT DEFAULT 'info',
          sector TEXT,
          priority TEXT DEFAULT 'normal'
      );

      -- 4. Security & Policy Authorization (RLS Fix)
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Global Unrestricted Access" ON public.profiles;
      CREATE POLICY "Global Unrestricted Access" ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);
      
      DROP POLICY IF EXISTS "Global Unrestricted Access" ON public.incidents;
      CREATE POLICY "Global Unrestricted Access" ON public.incidents FOR ALL TO public USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Global Notifications Read" ON public.notifications;
      CREATE POLICY "Global Notifications Read" ON public.notifications FOR SELECT TO public USING (true);

      DROP POLICY IF EXISTS "Global Notifications Insert" ON public.notifications;
      CREATE POLICY "Global Notifications Insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
      
      -- 5. Permissions Granting
      GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
    `;

    try {
      addLog("Transmitting SQL Migration Command to Master Node...");
      const { error } = await supabase.rpc('exec_sql', { cmd: migrationScript });
      
      if (error) throw error;

      addLog("SUCCESS: Database schema synchronized. EBS Authorization granted.");
      setStatus('success');
      setHealth(prev => ({ ...prev, columnExists: true, notificationTable: true }));
    } catch (err: any) {
      addLog(`SYNC FAILED: ${err.message}`);
      setStatus('error');
    }
  };

  const handleNuclearWipe = async () => {
    setStatus('syncing');
    addLog("WARNING: INITIALIZING NUCLEAR DATA PURGE...");
    const wipeScript = `
      DELETE FROM public.volunteers;
      DELETE FROM public.resources;
      DELETE FROM public.resource_centers;
      DELETE FROM public.incidents;
      DELETE FROM public.reviews;
      DELETE FROM public.notifications;
      DELETE FROM public.profiles;
      DELETE FROM auth.users;
    `;
    try {
      const { error } = await supabase.rpc('exec_sql', { cmd: wipeScript });
      if (error) throw error;
      addLog("SUCCESS: TOTAL DATA WIPEOUT ACHIEVED.");
      setStatus('success');
      setTimeout(async () => { await signOut(); navigate('/'); }, 4000);
    } catch (err: any) {
      addLog(`NUCLEAR WIPE FAILED: ${err.message}`);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">System Maintenance</span>
              <span className="bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">ID: INFRA-SYNC</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">Infrastructure Sync</h1>
            <p className="text-slate-500 font-medium">Verify and synchronize database schema with latest CrisisLink specifications.</p>
          </div>
          
          <button 
            onClick={checkInfrastructureHealth}
            disabled={status === 'checking' || status === 'syncing'}
            className="px-6 py-3 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <RefreshCw size={14} className={cn(status === 'checking' && "animate-spin")} /> Re-Check Health
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
               <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-2"><Database size={16} /> Schema Status</h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                     <span className="text-[10px] font-black uppercase text-slate-500">Reporter Phone Col</span>
                     {health.columnExists === null ? <Loader2 size={14} className="animate-spin text-slate-600" /> : health.columnExists ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-red-500" />}
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                     <span className="text-[10px] font-black uppercase text-slate-500">EBS Registry Table</span>
                     {health.notificationTable === null ? <Loader2 size={14} className="animate-spin text-slate-600" /> : health.notificationTable ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-red-500" />}
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                     <span className="text-[10px] font-black uppercase text-slate-500">Registry Count</span>
                     <span className="text-xs font-black text-white">{health.userCount ?? '--'}</span>
                  </div>
               </div>
            </div>

            <div className="bg-red-900/10 p-8 rounded-[2.5rem] border border-red-900/30">
               <h3 className="text-xs font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2"><Skull size={16} /> Danger Zone</h3>
               <p className="text-[10px] font-medium text-red-300 leading-relaxed mb-6 italic">Permanently erase all operational data and authentication records. This cannot be undone.</p>
               {!showConfirmWipe ? (
                 <button onClick={() => setShowConfirmWipe(true)} className="w-full py-3 bg-red-900/20 text-red-500 border border-red-900/50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Initial Nuclear Wipe</button>
               ) : (
                 <div className="space-y-3">
                   <button onClick={handleNuclearWipe} className="w-full py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"><UserX size={14} /> Confirm Wipe</button>
                   <button onClick={() => setShowConfirmWipe(false)} className="w-full py-3 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Abort</button>
                 </div>
               )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2"><Cpu size={16} /> Synchronization Console</h3>
                  <button 
                    onClick={runGlobalSync}
                    disabled={status === 'syncing' || status === 'checking'}
                    className="px-8 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 shadow-lg disabled:opacity-30 transition-all flex items-center gap-2"
                  >
                    {status === 'syncing' ? <Loader2 size={14} className="animate-spin" /> : <><Zap size={14} fill="white" /> Run Master Sync</>}
                  </button>
               </div>

               <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 h-64 overflow-y-auto font-mono text-[10px] text-blue-400 no-scrollbar space-y-2">
                  {logs.length > 0 ? logs.map((log, i) => (
                    <div key={i} className="flex gap-4">
                       <span className="text-slate-600 shrink-0 select-none">{'>'}</span>
                       <span className="break-all">{log}</span>
                    </div>
                  )) : (
                    <div className="h-full flex items-center justify-center text-slate-800 uppercase tracking-widest italic">Awaiting Directives...</div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDatabaseSync;