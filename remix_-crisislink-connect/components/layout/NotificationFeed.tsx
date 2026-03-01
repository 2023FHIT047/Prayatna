
import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Notification } from '../../types';
import { 
  AlertTriangle, 
  Truck, 
  CheckCircle, 
  Info, 
  X, 
  Radio,
  Signal,
  Target
} from 'lucide-react';
import { cn } from '../../lib/utils';

const NotificationFeed: React.FC = () => {
  const [alerts, setAlerts] = useState<Notification[]>([]);

  useEffect(() => {
    // ESTABLISH REAL-TIME LINK TO SYSTEM BROADCASTS
    const channel = supabase.channel('global_broadcasts')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications' 
      }, (payload: any) => {
        // DEFENSIVE: Guard against undefined or empty payloads
        if (!payload || !payload.new) {
          return;
        }

        const newAlert = payload.new as Notification;
        
        // Ensure the alert has a valid ID before adding to state
        if (!newAlert || !newAlert.id) return;

        setAlerts(prev => {
          // Prevent duplicates and filter out any accidental undefined/nulls
          const existing = (prev || []).filter(a => a && a.id);
          if (existing.find(a => a.id === newAlert.id)) return existing;
          return [newAlert, ...existing].slice(0, 5);
        });
        
        // Auto-dismiss after 8 seconds
        setTimeout(() => {
          removeAlert(newAlert.id);
        }, 8000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const removeAlert = (id: string) => {
    setAlerts(prev => (prev || []).filter(a => a && a.id !== id));
  };

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="fixed top-24 right-6 z-[9999] w-full max-w-sm flex flex-col gap-3 pointer-events-none">
      {alerts.map((alert) => {
        // Extra safety check during map
        if (!alert || !alert.id) return null;
        
        return (
          <div 
            key={alert.id}
            className={cn(
              "pointer-events-auto bg-white border-2 rounded-2xl shadow-2xl p-5 flex gap-4 animate-in slide-in-from-right-4 duration-500 overflow-hidden relative group",
              alert.type === 'hazard' ? "border-red-500" :
              alert.type === 'logistics' ? "border-blue-500" :
              alert.type === 'success' ? "border-emerald-500" : "border-slate-800"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg text-white",
              alert.type === 'hazard' ? "bg-red-600" :
              alert.type === 'logistics' ? "bg-blue-600" :
              alert.type === 'success' ? "bg-emerald-600" : "bg-slate-900"
            )}>
              {alert.type === 'hazard' && <AlertTriangle size={24} className="animate-pulse" />}
              {alert.type === 'logistics' && <Truck size={24} />}
              {alert.type === 'success' && <CheckCircle size={24} />}
              {alert.type === 'info' && <Info size={24} />}
            </div>

            <div className="flex-grow">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                  {alert.title}
                </h4>
                <button onClick={() => removeAlert(alert.id)} className="text-slate-300 hover:text-red-600 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-tighter">
                {alert.message}
              </p>
              {alert.sector && (
                <div className="mt-2 flex items-center gap-2">
                   <Target size={10} className="text-slate-400" />
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sector: {alert.sector}</span>
                </div>
              )}
            </div>

            {/* Tactical Scanning Animation */}
            <div className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20 w-full">
              <div className="h-full bg-current animate-progress-alert"></div>
            </div>
          </div>
        );
      })}
      
      <style>{`
        @keyframes progress-alert {
          0% { width: 100%; }
          100% { width: 0%; }
        }
        .animate-progress-alert {
          animation: progress-alert 8s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default NotificationFeed;
