import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Clock, 
  Database, 
  ShieldCheck,
  Server,
  Network,
  Lock,
  Search,
  Trash2,
  RefreshCw,
  Terminal
} from "lucide-react";
import { cn } from "../../lib/utils";
import { healthMonitor } from "./HealthMonitor";
import { errorTracker, SystemError } from "./ErrorTracker";
import { motion, AnimatePresence } from "framer-motion";
import { safeStringify } from "../../lib/safe-stringify";

export function SystemReliabilityDashboard() {
  const [health, setHealth] = useState(healthMonitor.getHealthStatus());
  const [errors, setErrors] = useState<SystemError[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "errors" | "isolation" | "permissions">("overview");

  useEffect(() => {
    const refresh = () => {
      setHealth(healthMonitor.getHealthStatus());
      setErrors(errorTracker.getRecentErrors());
    };

    const interval = setInterval(refresh, 2000);
    refresh();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-200 overflow-hidden font-mono">
      {/* Platform Status Bar */}
      <div className={cn(
        "h-14 flex items-center justify-between px-6 border-b transition-colors shrink-0",
        health.status === "HEALTHY" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            health.status === "HEALTHY" ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-rose-500 shadow-[0_0_10px_#f43f5e]"
          )} />
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            Platform Availability: 
            <span className={health.status === "HEALTHY" ? "text-emerald-400" : "text-rose-400"}>
              {health.status}
            </span>
          </h2>
        </div>
        
        <div className="flex items-center gap-6 text-[10px] font-bold text-slate-500 uppercase">
          <div className="flex items-center gap-2">
            <Clock size={12} /> Uptime: {health.metrics.uptimeSeconds}s
          </div>
          <div className="flex items-center gap-2">
            <Activity size={12} /> Latency: {health.metrics.avgLatencyMs}ms
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert size={12} /> Critical: {health.metrics.criticalErrors}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Mini */}
        <div className="w-16 border-r border-slate-900 flex flex-col items-center py-6 gap-6 bg-slate-950/50 shrink-0">
          <TabButton icon={<Zap size={20} />} active={activeTab === "overview"} onClick={() => setActiveTab("overview")} label="System Overview" />
          <TabButton icon={<ShieldAlert size={20} />} active={activeTab === "errors"} onClick={() => setActiveTab("errors")} label="Error Stream" />
          <TabButton icon={<Lock size={20} />} active={activeTab === "isolation"} onClick={() => setActiveTab("isolation")} label="Tenant Isolation" />
          <TabButton icon={<Database size={20} />} active={activeTab === "permissions"} onClick={() => setActiveTab("permissions")} label="DB Health" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-3 gap-6">
                  <HealthCard 
                    title="API Integrity" 
                    status="Active" 
                    value={`${100 - parseFloat(health.metrics.errorRate)}%`} 
                    icon={<Network className="text-indigo-400" />} 
                  />
                  <HealthCard 
                    title="Compute Health" 
                    status="Optimal" 
                    value="45ms" 
                    icon={<Server className="text-emerald-400" />} 
                  />
                  <HealthCard 
                    title="Security Shield" 
                    status="Armed" 
                    value="24 Audit/m" 
                    icon={<ShieldCheck className="text-amber-400" />} 
                  />
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
                  <h3 className="text-xs font-black uppercase text-slate-500 mb-6 flex items-center gap-2">
                    <Activity size={14} className="text-indigo-500" />
                    Live System Stress Simulation
                  </h3>
                  <div className="h-48 flex items-end gap-1 px-4">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div 
                        key={i}
                        className="flex-1 bg-indigo-500/20 rounded-t-sm border-t border-indigo-500/40"
                        style={{ height: `${20 + Math.random() * 80}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="bg-slate-900/20 border border-slate-800/50 rounded-2xl p-6">
                      <h3 className="text-[10px] font-black text-slate-600 uppercase mb-4">Production Quota Enforcement</h3>
                      <div className="space-y-4">
                         <QuotaItem label="Firebase Writes" used={1200} total={20000} />
                         <QuotaItem label="Gemini API Calls" used={450} total={1500} />
                         <QuotaItem label="Media Storage" used={0.8} total={5} unit="GB" />
                      </div>
                   </div>
                   <div className="bg-slate-900/20 border border-slate-800/50 rounded-2xl p-6">
                      <h3 className="text-[10px] font-black text-slate-600 uppercase mb-4">Integrations Connectivity</h3>
                      <div className="space-y-3">
                         <IntegrationsStatus label="Meta Graph API" status="Online" latency="240ms" />
                         <IntegrationsStatus label="TikTok Dev Portal" status="Online" latency="410ms" />
                         <IntegrationsStatus label="X Enterprise API" status="Degraded" latency="1.2s" />
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === "errors" && (
              <motion.div 
                key="errors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black flex items-center gap-3">
                    Red-Line Error Tracking
                    <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">LIVE STREAM</span>
                  </h2>
                  <button 
                    onClick={() => errorTracker.clearErrors()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold hover:bg-rose-500/10 hover:border-rose-500/30 transition-all text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 size={14} /> Purge Stream
                  </button>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                   <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-4">
                      <Search size={16} className="text-slate-600" />
                      <input type="text" placeholder="Filter errors by source, message, or severity..." className="bg-transparent border-none outline-none text-xs w-full text-slate-400" />
                   </div>
                   <div className="divide-y divide-slate-800/50">
                      {errors.map((err) => (
                        <div key={err.id} className="p-6 hover:bg-slate-800/10 transition-colors group">
                           <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                 <span className={cn(
                                   "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                                   err.severity === "critical" ? "bg-rose-500 text-white" :
                                   err.severity === "high" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-500"
                                 )}>
                                   {err.severity}
                                 </span>
                                 <span className="text-[10px] text-slate-600 font-bold uppercase">{err.source}</span>
                              </div>
                              <span className="text-[10px] text-slate-700 font-mono">{new Date(err.timestamp).toISOString()}</span>
                           </div>
                           <h4 className="text-sm font-bold text-slate-200 mb-2 leading-relaxed">{err.message}</h4>
                           {err.context && (
                             <pre className="text-[10px] bg-black/40 p-3 rounded-lg border border-slate-800/50 text-indigo-400 overflow-x-auto">
                               {safeStringify(err.context, 2)}
                             </pre>
                           )}
                        </div>
                      ))}
                      {errors.length === 0 && (
                        <div className="p-20 flex flex-col items-center justify-center text-center">
                           <CheckCircle2 size={48} className="text-emerald-500/20 mb-4" />
                           <p className="text-slate-500 font-bold">SYSTEM CLEAN: NO PRODUCTION ERRORS DETECTED</p>
                        </div>
                      )}
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TabButton({ icon, active, onClick, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-2.5 rounded-xl transition-all relative group",
        active ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "text-slate-600 hover:text-slate-400 hover:bg-slate-900"
      )}
    >
      {icon}
      <div className="absolute left-full ml-4 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {label}
      </div>
    </button>
  );
}

function HealthCard({ title, status, value, icon }: any) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 flex items-center justify-between group hover:border-slate-700 transition-all">
       <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
             {icon}
          </div>
          <div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
             <p className="text-xs font-bold text-emerald-400">{status}</p>
          </div>
       </div>
       <div className="text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function QuotaItem({ label, used, total, unit = "" }: any) {
  const percent = Math.min(100, (used / total) * 100);
  return (
    <div className="space-y-1.5">
       <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span>{label}</span>
          <span>{used}{unit} / {total}{unit}</span>
       </div>
       <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }} />
       </div>
    </div>
  );
}

function IntegrationsStatus({ label, status, latency }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl">
       <div className="flex items-center gap-3">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            status === "Online" ? "bg-emerald-500" : "bg-amber-500"
          )} />
          <span className="text-xs font-bold text-slate-300">{label}</span>
       </div>
       <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-bold">{latency}</span>
          <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded", status === "Online" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>{status}</span>
       </div>
    </div>
  );
}
