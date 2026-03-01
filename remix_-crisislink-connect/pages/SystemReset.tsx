
import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import { 
  Skull, 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  ShieldAlert, 
  RefreshCw,
  Power,
  Database,
  Lock,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const SystemReset: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleNuclearWipe = async () => {
    if (!isConfirmed || isWiping) return;

    setIsWiping(true);
    addLog("INITIATING NUCLEAR RESET PROTOCOL...");
    
    // Cascading deletion script
    const resetScript = `
      -- 1. Purge Operational Data
      DELETE FROM public.volunteers;
      DELETE FROM public.resources;
      DELETE FROM public.resource_centers;
      DELETE FROM public.incidents;
      DELETE FROM public.reviews;
      
      -- 2. Purge Profile Registry
      DELETE FROM public.profiles;
      
      -- 3. THE NUCLEAR CORE: Purge Authentication Registry
      DELETE FROM auth.users;
    `;

    try {
      addLog("Transmitting Kill-Signal to Master Node...");
      setProgress(20);
      
      const { error } = await supabase.rpc('exec_sql', { cmd: resetScript });
      
      if (error) throw error;

      setProgress(60);
      addLog("AUTHENTICATION REGISTRY PURGED.");
      addLog("PUBLIC SCHEMA EMPTIED.");
      
      setProgress(90);
      addLog("SYSTEM SELF-DESTRUCTING...");
      
      setTimeout(async () => {
        setProgress(100);
        addLog("WIPE COMPLETE. REDIRECTING...");
        await signOut();
        navigate('/');
      }, 2000);

    } catch (err: any) {
      addLog(`CRITICAL FAILURE: ${err.message}`);
      setIsWiping(false);
      setProgress(0);
      alert("RESET FAILED: Ensure you have run the master_setup.sql in your Supabase SQL Editor first.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-red-500">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-full bg-slate-900/50 border-2 border-red-900/50 rounded-[4rem] p-12 text-center shadow-2xl shadow-red-900/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
              <Skull size={300} />
           </div>

           <div className="relative z-10">
              <div className="w-24 h-24 bg-red-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-red-600/40 animate-pulse">
                 <Power size={48} />
              </div>

              <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">Total System Reset</h1>
              <p className="text-red-400 font-bold uppercase tracking-widest text-xs mb-10">Administrative Level: Nuclear</p>

              <div className="bg-black/50 border border-red-900/50 p-8 rounded-3xl mb-10 text-left">
                 <div className="flex items-center gap-3 text-red-500 mb-4 font-black uppercase text-[10px] tracking-widest">
                    <ShieldAlert size={16} /> Data Purge Scope
                 </div>
                 <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "Delete All 1,000+ Profiles",
                      "Wipe All Incident History",
                      "Empty Every Resource Depot",
                      "PURGE EVERY USER FROM AUTH"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div> {item}
                      </li>
                    ))}
                 </ul>
              </div>

              <div className="flex flex-col items-center gap-8">
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsConfirmed(!isConfirmed)}
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all",
                        isConfirmed ? "bg-red-600 border-red-600 text-white shadow-lg" : "border-red-900/30 text-red-900/30"
                      )}
                    >
                      {isConfirmed && <CheckCircle2 size={24} />}
                    </button>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">I confirm total data destruction</span>
                 </div>

                 {isWiping ? (
                   <div className="w-full space-y-4">
                      <div className="w-full h-3 bg-red-950 rounded-full overflow-hidden">
                         <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                      </div>
                      <div className="bg-black border border-red-900/30 rounded-2xl p-6 h-32 overflow-y-auto font-mono text-[10px] text-red-400 no-scrollbar">
                         {logs.map((log, i) => <div key={i}>{log}</div>)}
                      </div>
                   </div>
                 ) : (
                   <button 
                    disabled={!isConfirmed}
                    onClick={handleNuclearWipe}
                    className="group relative px-12 py-6 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-[0.4em] text-sm rounded-3xl shadow-2xl shadow-red-600/20 disabled:opacity-20 transition-all flex items-center gap-4"
                   >
                     <Skull size={20} className="group-hover:rotate-12 transition-transform" /> Execute System Wipe
                   </button>
                 )}
              </div>
           </div>
        </div>

        <button 
          onClick={() => navigate('/admin')}
          className="mt-12 flex items-center gap-3 text-slate-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Abort and Return to HQ
        </button>
      </main>
    </div>
  );
};

export default SystemReset;
