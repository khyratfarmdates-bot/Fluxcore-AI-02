import React, { useState, useEffect } from "react";
import { Terminal, Shield, Activity, Database, AlertCircle, RefreshCcw, Lock, Flag, Cpu, Code2, ShieldCheck, Network, Zap, Bot, Puzzle, GraduationCap } from "lucide-react";
import { cn } from "../lib/utils";
import { observability } from "./infrastructure/ObservabilityLayer";
import { auditLogger } from "./security/AuditLogger";
import { featureFlags } from "./infrastructure/FeatureFlags";
import { SystemReliabilityDashboard } from "./monitoring/SystemReliabilityDashboard";
import { AIIdentityDashboard } from "../intelligence/AIIdentityDashboard";
import { KnowledgeVisualizationDashboard } from "../intelligence/KnowledgeVisualizationDashboard";
import { UnifiedOperationsDashboard } from "../automation/UnifiedOperationsDashboard";
import { ExecutiveAgentDashboard } from "../intelligence/ExecutiveAgentDashboard";
import { MarketplaceDashboard } from "../extensions/MarketplaceDashboard";
import { LearningDashboard } from "../onboarding/LearningDashboard";
import { eventBus } from "./events/EventBus";

export function DevConsoleView() {
  const [activeTab, setActiveTab] = useState<"observability" | "security" | "flags" | "secrets" | "logs" | "reliability" | "identity" | "knowledge" | "ops" | "agents" | "marketplace" | "learning">("observability");
  const [metrics, setMetrics] = useState(observability.getMetrics());
  const [logs, setLogs] = useState(auditLogger.getRecentLogs(20));

  useEffect(() => {
    const i = setInterval(() => {
      setMetrics(observability.getMetrics());
      setLogs(auditLogger.getRecentLogs(20));
    }, 2000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-hidden">
      <header className="flex justify-between items-center shrink-0 mb-6 relative z-10 gap-4 border-b border-slate-800/80 pb-6">
         <div>
            <h2 className="text-xl font-black flex items-center gap-2 mb-1" style={{ color: "#E2B714" }}>
              <Terminal size={20} /> Developer Console & Security
            </h2>
            <p className="text-sm font-medium text-slate-400 font-mono">system.infrastructure.monitor_active (Enterprise Grade)</p>
         </div>
      </header>

      <div className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 shadow-sm w-fit mb-6 shrink-0 font-mono text-xs overflow-x-auto">
          <button onClick={() => setActiveTab("observability")} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap", activeTab === "observability" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
             <Activity size={14}/> OBSERVABILITY
          </button>
          <button onClick={() => setActiveTab("reliability")} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap", activeTab === "reliability" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
             <ShieldCheck size={14}/> STABILITY & QA
          </button>
          <button onClick={() => setActiveTab("ops")} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap", activeTab === "ops" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
             <Zap size={14}/> SYSTEM_OPS (AI)
          </button>
          <button onClick={() => setActiveTab("knowledge")} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap", activeTab === "knowledge" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
             <Network size={14}/> SYSTEM AWARENESS
          </button>
          <button onClick={() => setActiveTab("marketplace")} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap", activeTab === "marketplace" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
             <Puzzle size={14}/> marketplace
          </button>
          <button onClick={() => setActiveTab("learning")} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap", activeTab === "learning" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
             <GraduationCap size={14}/> learning
          </button>
          <button onClick={() => setActiveTab("agents")} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap", activeTab === "agents" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
             <Bot size={14}/> EXEC_AGENTS
          </button>
          <button onClick={() => setActiveTab("identity")} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap", activeTab === "identity" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
             <Cpu size={14}/> AI IDENTITY & MEMORY
          </button>
          <button onClick={() => setActiveTab("security")} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap", activeTab === "security" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
             <Shield size={14}/> SECURITY & AUDIT
          </button>
          <button onClick={() => setActiveTab("flags")} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap", activeTab === "flags" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
             <Flag size={14}/> FEATURE FLAGS
          </button>
          <button onClick={() => setActiveTab("secrets")} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap", activeTab === "secrets" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
             <Lock size={14}/> SECRETS VAULT
          </button>
          <button onClick={() => setActiveTab("logs")} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap", activeTab === "logs" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
             <Code2 size={14}/> SYSTEM LOGS
          </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 font-mono">
         {activeTab === "observability" && <ObservabilityTab metrics={metrics} />}
         {activeTab === "reliability" && <SystemReliabilityDashboard />}
         {activeTab === "ops" && <UnifiedOperationsDashboard />}
         {activeTab === "knowledge" && <KnowledgeVisualizationDashboard />}
         {activeTab === "identity" && <AIIdentityDashboard />}
         {activeTab === "marketplace" && <MarketplaceDashboard />}
         {activeTab === "learning" && <LearningDashboard />}
         {activeTab === "agents" && <ExecutiveAgentDashboard />}
         {activeTab === "security" && <SecurityTab logs={logs} />}
         {activeTab === "flags" && <FeatureFlagsTab />}
         {activeTab === "secrets" && <SecretsVaultTab />}
         {activeTab === "logs" && <div className="text-slate-500 p-4 border border-slate-800 rounded-xl bg-slate-900/50">waiting for streaming logs...</div>}
      </div>
    </div>
  );
}

function ObservabilityTab({ metrics }: any) {
  return (
    <div className="flex flex-col gap-6" dir="ltr">
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <MetricBox title="Avg API Latency" value={`${metrics.avgLatencyMs}ms`} alert={metrics.avgLatencyMs > 800} />
         <MetricBox title="Memory Heap" value={`${metrics.memoryUsageMB} MB`} />
         <MetricBox title="Error Rate" value={`${metrics.apiRequests ? ((metrics.errors/metrics.apiRequests)*100).toFixed(2) : 0}%`} alert={metrics.errors > 10} />
         <MetricBox title="Queue Size" value={metrics.queueSize} />
       </div>
       
       <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2"><Cpu size={16}/> Node / Cluster Status</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-500">Region</span><span className="text-emerald-400">eu-west-2 (London)</span></div>
                <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-500">Active Connections</span><span className="text-white">{metrics.activeConnections}</span></div>
                <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-500">Uptime</span><span className="text-white">{metrics.uptime}s</span></div>
                <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-500">Total API Requests</span><span className="text-indigo-400">{metrics.apiRequests}</span></div>
             </div>
             <div className="h-40 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center">
                 <span className="text-slate-600 text-xs">Tracing Graph (coming soon)</span>
             </div>
          </div>
       </div>
    </div>
  )
}

function MetricBox({ title, value, alert }: any) {
  return (
    <div className={cn("p-4 rounded-xl border flex flex-col gap-2", alert ? "bg-rose-500/10 border-rose-500/30" : "bg-slate-900/50 border-slate-800")}>
       <span className="text-[#E2B714] text-xs font-bold uppercase">{title}</span>
       <span className={cn("text-2xl font-black", alert ? "text-rose-400" : "text-white")}>{value}</span>
    </div>
  )
}

function SecurityTab({ logs }: any) {
  return (
    <div className="flex flex-col gap-6" dir="ltr">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
            <Lock className="text-emerald-400" size={24}/>
            <div>
               <div className="text-emerald-400 font-bold text-sm">Secrets Vault</div>
               <div className="text-slate-300 text-xs mt-1">Encrypted & Locked</div>
            </div>
         </div>
         <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-3">
            <Shield className="text-indigo-400" size={24}/>
            <div>
               <div className="text-indigo-400 font-bold text-sm">RBAC Engine</div>
               <div className="text-slate-300 text-xs mt-1">Active & Enforcing</div>
            </div>
         </div>
         <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-center gap-3">
            <AlertCircle className="text-slate-400" size={24}/>
            <div>
               <div className="text-slate-400 font-bold text-sm">Threat Detection</div>
               <div className="text-slate-300 text-xs mt-1">0 Threats (24h)</div>
            </div>
         </div>
       </div>

       <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
             <h3 className="font-bold text-slate-300">Audit Logs (Realtime)</h3>
             <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-[10px] uppercase font-black tracking-widest">Live</span>
          </div>
          <table className="w-full text-left">
             <thead className="bg-slate-950 text-slate-500 border-b border-slate-800/50">
               <tr>
                 <th className="py-3 px-4 font-normal">TIMESTAMP</th>
                 <th className="py-3 px-4 font-normal">ACTION</th>
                 <th className="py-3 px-4 font-normal">RESOURCE</th>
                 <th className="py-3 px-4 font-normal">STATUS</th>
                 <th className="py-3 px-4 font-normal">USER</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-800/50">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                     <td className="py-3 px-4 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                     <td className="py-3 px-4 text-indigo-400 font-bold">{log.action}</td>
                     <td className="py-3 px-4 text-slate-300">{log.resourceType} : {log.resourceId}</td>
                     <td className="py-3 px-4">
                        <span className={cn("px-2 py-0.5 rounded", log.status === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>{log.status}</span>
                     </td>
                     <td className="py-3 px-4 text-slate-500">{log.userId}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">No logs yet. Perform actions in the app to see them here.</td></tr>}
             </tbody>
          </table>
       </div>
    </div>
  )
}

function FeatureFlagsTab() {
  const flags = featureFlags.getAll();
  
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6" dir="ltr">
       <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-white mb-1">Feature Flags</h3>
            <p className="text-xs text-slate-500">Manage rollout of new enterprise features.</p>
          </div>
       </div>

       <div className="space-y-3">
          {Object.entries(flags).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center p-4 bg-slate-950 border border-slate-800/80 rounded-xl">
               <span className="text-slate-300 font-bold">{key}</span>
               <div className={cn("px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full", val ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500")}>
                 {val ? "Enabled" : "Disabled"}
               </div>
            </div>
          ))}
       </div>
    </div>
  )
}

function SecretsVaultTab() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6" dir="ltr">
       <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-bold text-white mb-1 text-lg flex items-center gap-2">
              <Lock className="text-indigo-400" size={20}/> Encrypted Secrets Vault
            </h3>
            <p className="text-xs text-slate-500 font-sans">Secure storage for API keys, tokens, and provider secrets. KMS-backed.</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow flex items-center gap-2">
             + Manage Secrets
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VaultItem name="OPENAI_API_KEY" type="AI Provider" lastAccessed="2 mins ago" />
          <VaultItem name="STRIPE_SECRET_KEY" type="Billing" lastAccessed="1 hour ago" />
          <VaultItem name="GOOGLE_OAUTH_CLIENT_SECRET" type="Auth" lastAccessed="5 mins ago" />
          <VaultItem name="AWS_S3_ACCESS_KEY" type="Storage" lastAccessed="12 hours ago" />
       </div>
    </div>
  )
}

function VaultItem({ name, type, lastAccessed }: any) {
  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between group hover:border-slate-700 transition-colors">
       <div>
         <div className="text-slate-300 font-bold mb-1">{name}</div>
         <div className="flex items-center gap-3 text-[10px] text-slate-500 font-sans uppercase tracking-widest">
           <span>{type}</span>
           <span className="w-1 h-1 rounded-full bg-slate-700"></span>
           <span className="flex items-center gap-1"><Activity size={10}/> {lastAccessed}</span>
         </div>
       </div>
       <div className="text-emerald-400 text-xs px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">Secured</div>
    </div>
  )
}
