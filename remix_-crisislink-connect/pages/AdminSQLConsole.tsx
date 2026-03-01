
import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/layout/Header';
import { 
  Terminal, 
  Play, 
  Trash2, 
  History, 
  Database, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Code,
  ShieldAlert,
  Save,
  ChevronRight,
  UserX,
  RefreshCw,
  Copy,
  TerminalSquare
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { NUCLEAR_SCRIPTS, executeStrategicCommand } from '../lib/strategicOps';

interface ConsoleLog {
  type: 'info' | 'success' | 'error' | 'command';
  msg: string;
  time: string;
}

const AdminSQLConsole: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [sql, setSql] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [rpcError, setRpcError] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  const addLog = (type: ConsoleLog['type'], msg: string) => {
    setLogs(prev => [...prev, { 
      type, 
      msg, 
      time: new Date().toLocaleTimeString() 
    }]);
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const executeSQL = async () => {
    if (!sql.trim() || isExecuting) return;
    
    const isNuclear = sql.includes('auth.users') || sql.includes('DELETE FROM');
    if (isNuclear && !window.confirm("WARNING: NUCLEAR PURGE DETECTED. Execute total data wipe?")) return;

    setIsExecuting(true);
    addLog('command', sql);
    setRpcError(false);
    
    const result = await executeStrategicCommand(sql);
    
    if (result.success) {
      addLog('success', "Strategic directive successfully transmitted and executed.");
      if (sql.includes('auth.users')) {
        addLog('info', "AUTH REGISTRY PURGED. SYSTEM SELF-DESTRUCTING...");
        setTimeout(async () => {
          await signOut();
          navigate('/');
        }, 3000);
      }
    } else {
      addLog('error', `DIRECTIVE FAILED: ${result.error}`);
      if (result.error?.includes('exec_sql')) {
        setRpcError(true);
      }
    }
    setIsExecuting(false);
  };

  const copySetupSql = () => {
    const setup = `CREATE OR REPLACE FUNCTION public.exec_sql(cmd text) RETURNS void AS $$ BEGIN EXECUTE cmd; END; $$ LANGUAGE plpgsql SECURITY DEFINER; GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;`;
    navigator.clipboard.writeText(setup);
    alert("Setup SQL copied. Paste this into your Supabase SQL Editor.");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-12">
        
        {rpcError && (
          <div className="mb-10 p-8 bg-red-900/20 border-2 border-red-500 rounded-[2.5rem] animate-in zoom-in duration-300 shadow-2xl shadow-red-500/10">
            <div className="flex items-center gap-4 mb-4">
               <ShieldAlert size={32} className="text-red-500 animate-pulse" />
               <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Strategic Interface Locked</h2>
            </div>
            <p className="text-red-200 font-medium mb-6">The "exec_sql" RPC function is missing. You must run the setup script in Supabase once to unlock this console.</p>
            <button 
              onClick={copySetupSql}
              className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-500 transition-all"
            >
              <Copy size={16} /> Copy Master Unlock SQL
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Strategic Intelligence</span>
              <span className="bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Bridge: SQL-CONSOLE-BETA</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase tracking-tighter">Tactical Command Terminal</h1>
            <p className="text-slate-500 font-medium">Execute raw infrastructure directives directly against the master node.</p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setLogs([])}
              className="px-6 py-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl hover:bg-slate-800 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2"
            >
              <Trash2 size={16} /> Clear Console
            </button>
            <button 
              onClick={() => navigate('/admin')}
              className="px-6 py-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl hover:bg-slate-800 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2"
            >
              <History size={16} /> Close Terminal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-6 flex items-center gap-2">
                <TerminalSquare size={16} /> Nuclear Presets
              </h3>
              <div className="space-y-3">
                <button onClick={() => setSql(NUCLEAR_SCRIPTS.PURGE_ALL_USERS)} className="w-full text-left p-4 bg-red-900/10 border border-red-900/30 rounded-2xl hover:bg-red-900/20 transition-all group">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest group-hover:animate-pulse">NUCLEAR USER PURGE</p>
                </button>
                <button onClick={() => setSql(NUCLEAR_SCRIPTS.RESET_SCHEMA)} className="w-full text-left p-4 bg-blue-900/10 border border-blue-900/30 rounded-2xl hover:bg-blue-900/20 transition-all group">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">RESET INFRASTRUCTURE</p>
                </button>
                <button onClick={() => setSql(NUCLEAR_SCRIPTS.CLEAN_MESSY_DATA)} className="w-full text-left p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:bg-slate-900 transition-all group">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CLEAN_ORPHAN_RECORDS</p>
                </button>
              </div>
            </div>

            <div className="p-8 bg-orange-900/10 border border-orange-900/30 rounded-[2.5rem]">
               <div className="flex items-center gap-2 text-orange-500 mb-4">
                  <AlertTriangle size={20} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Warning</span>
               </div>
               <p className="text-[10px] font-medium text-orange-200 leading-relaxed uppercase italic">
                 "Direct SQL bypasses all Row Level Security. Every command is executed as the Postgres superuser."
               </p>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6 px-2">
                 <div className="flex items-center gap-3">
                    <Database size={16} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Strategic Command Line</span>
                 </div>
                 <button 
                  disabled={isExecuting || !sql.trim() || rpcError}
                  onClick={executeSQL}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl flex items-center gap-2 transition-all disabled:opacity-30"
                 >
                   {isExecuting ? <Loader2 size={16} className="animate-spin" /> : <><Play size={14} fill="white" /> Execute Command</>}
                 </button>
              </div>
              
              <textarea 
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                placeholder="-- Input master directive (SQL)..."
                spellCheck={false}
                className="w-full h-56 bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 font-mono text-xs text-blue-400 focus:border-blue-500 focus:ring-0 transition-colors resize-none outline-none"
              />
            </div>

            <div className="bg-slate-950 border-2 border-slate-800 rounded-[2.5rem] h-[350px] flex flex-col shadow-2xl overflow-hidden">
               <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Terminal size={14} className="text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Master Node Feed</span>
                  </div>
               </div>
               
               <div 
                ref={terminalRef}
                className="flex-grow p-8 font-mono text-[10px] overflow-y-auto space-y-3 no-scrollbar"
               >
                 {logs.length > 0 ? logs.map((log, i) => (
                   <div key={i} className={cn(
                     "flex gap-4 border-l-2 pl-4",
                     log.type === 'error' ? "text-red-400 border-red-500" : 
                     log.type === 'success' ? "text-green-400 border-green-500" : 
                     log.type === 'command' ? "text-blue-400 border-blue-500" : "text-slate-400 border-slate-800"
                   )}>
                     <span className="opacity-30 shrink-0 select-none">[{log.time}]</span>
                     <span className="break-all whitespace-pre-wrap">{log.msg}</span>
                   </div>
                 )) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-10">
                      <Terminal size={48} />
                      <p className="text-[10px] font-black uppercase tracking-widest mt-4">Bridge Offline</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSQLConsole;
