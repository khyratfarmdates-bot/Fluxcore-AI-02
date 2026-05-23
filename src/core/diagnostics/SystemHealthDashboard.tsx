import React, { useState, useEffect } from "react";
import { Activity, ShieldCheck, Cpu, Database, Share2, AlertCircle, RefreshCw } from "lucide-react";
import { healthService, SystemHealthStatus } from "../../services/SystemHealthService";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { cn } from "../../lib/utils";

export function SystemHealthDashboard() {
  const { activeBrand } = useWorkspace();
  const [status, setStatus] = useState<SystemHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const runCheck = async () => {
    setLoading(true);
    const result = await healthService.checkFullStatus(activeBrand?.id);
    setStatus(result);
    setLoading(false);
  };

  useEffect(() => {
    runCheck();
    const interval = setInterval(runCheck, 60000);
    return () => clearInterval(interval);
  }, [activeBrand]);

  if (!status && loading) return <div className="p-10 text-center text-slate-500 animate-pulse font-black">جاري تشخيص الأنظمة...</div>;

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
           <h3 className="text-xl font-black text-white flex items-center gap-3 italic">
              <Activity className="text-indigo-400" /> System Metrics & Health
           </h3>
           <p className="text-sm text-slate-500 font-medium">تشخيص حي لاستقرار طبقاتFluxcore AI 02.</p>
        </div>
        <button onClick={runCheck} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
           <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <HealthCard 
            title="Firebase RTDB" 
            status={status?.firebase || 'error'} 
            icon={<Database size={20} />} 
         />
         <HealthCard 
            title="AI Strategic Core" 
            status={status?.ai || 'error'} 
            icon={<Cpu size={20} />} 
         />
         <HealthCard 
            title="Integrations Layer" 
            status={Object.values(status?.integrations || {}).every(s => s === 'healthy') ? 'healthy' : 'degraded'} 
            icon={<Share2 size={20} />} 
         />
         <HealthCard 
            title="Identity & Auth" 
            status={status?.auth === 'authenticated' ? 'healthy' : 'error'} 
            icon={<ShieldCheck size={20} />} 
         />
      </div>

      {status && Object.keys(status.integrations).length > 0 && (
        <div className="pt-6 border-t border-slate-800">
           <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Platform Health Details</h4>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(status.integrations).map(([key, val]) => (
                 <div key={key} className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className={cn("w-2 h-2 rounded-full", val === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500')}></div>
                    <span className="text-xs font-black text-slate-300 capitalize">{key}</span>
                 </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}

function HealthCard({ title, status, icon }: { title: string, status: string, icon: React.ReactNode }) {
  const isHealthy = status === 'healthy';
  return (
    <div className={cn(
       "p-5 rounded-3xl border transition-all",
       isHealthy ? "bg-emerald-500/5 border-emerald-500/10" : "bg-rose-500/5 border-rose-500/10"
    )}>
       <div className="flex justify-between items-center mb-4">
          <div className={cn("p-2.5 rounded-2xl", isHealthy ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
             {icon}
          </div>
          {isHealthy ? <ShieldCheck size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-rose-500" />}
       </div>
       <div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">{title}</div>
          <div className={cn("text-sm font-black italic capitalize", isHealthy ? "text-emerald-400" : "text-rose-400")}>
             {status === 'healthy' ? 'Operational' : 'Issues Detected'}
          </div>
       </div>
    </div>
  );
}
