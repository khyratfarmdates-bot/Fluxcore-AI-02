import React, { useState, useEffect } from "react";
import { 
  Bot, 
  Cpu, 
  Activity, 
  Zap, 
  ShieldCheck, 
  Globe, 
  BarChart3, 
  PenTool, 
  Share2, 
  Box,
  Layers,
  History,
  Terminal,
  ChevronRight,
  Youtube
} from "lucide-react";
import { cn } from "../lib/utils";
import { AGENT_REGISTRY, AgentRole } from "./agents/AgentRegistry";
import { safeStringify } from "../lib/safe-stringify";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { motion, AnimatePresence } from "framer-motion";
import { BaseService } from "../services/base";
import { AgentTask } from "./agents/BaseAgent";

export function ExecutiveAgentDashboard() {
  const { activeBrand } = useWorkspace();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentRole | null>(null);
  const taskService = new BaseService<AgentTask>('agent_tasks');

  useEffect(() => {
    async function fetchTasks() {
      if (!activeBrand) return;
      const allTasks = await taskService.getAll();
      setTasks(allTasks.filter(t => t.brandId === activeBrand.id).sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime()));
    }
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [activeBrand]);

  if (!activeBrand) return <div className="p-20 text-center text-slate-500 font-black">SELECT BRAND FOR AGENT ORCHESTRATION</div>;

  return (
    <div className="h-full bg-slate-950 text-slate-200 overflow-hidden flex flex-col font-mono">
      {/* Header */}
      <div className="p-8 border-b border-white/5 bg-slate-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.15)]">
               <Cpu className="text-indigo-400" size={32} />
            </div>
            <div>
               <h1 className="text-2xl font-black tracking-tighter uppercase mb-1">Multi-Agent Executive Control</h1>
               <div className="flex items-center gap-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                     <Globe size={12} className="text-emerald-500" /> Distributed Intelligence: <span className="text-white">Active</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                     <ShieldCheck size={12} className="text-indigo-500" /> Permission Guard: <span className="text-white">Hardened</span>
                  </span>
               </div>
            </div>
         </div>
      </div>

      <div className="flex-1 grid grid-cols-12 overflow-hidden">
         {/* Sidebar: Agents Registry */}
         <div className="col-span-4 border-r border-white/5 overflow-y-auto custom-scrollbar p-6 space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6 flex items-center gap-2">
               <Bot size={14} className="text-indigo-400" /> Active Agent Fleet
            </h3>
            {AGENT_REGISTRY.map((agent) => (
              <button
                key={agent.role}
                onClick={() => setSelectedAgent(agent.role)}
                className={cn(
                  "w-full p-6 rounded-3xl border transition-all duration-300 text-left group relative overflow-hidden",
                  selectedAgent === agent.role 
                    ? "bg-indigo-500/10 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.1)]" 
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-600"
                )}
              >
                <div className="flex items-center gap-4 mb-4">
                   <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center",
                      selectedAgent === agent.role ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400 group-hover:text-white"
                   )}>
                      {getAgentIcon(agent.role)}
                   </div>
                   <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-tight">{agent.role.replace('_', ' ')}</h4>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active System</span>
                   </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-bold mb-4 line-clamp-2">
                   {agent.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                   {agent.capabilities.slice(0, 3).map(cap => (
                     <span key={cap} className="text-[7px] font-black uppercase px-2 py-1 bg-slate-950 border border-white/10 rounded-full text-slate-400">
                        {cap}
                     </span>
                   ))}
                </div>
              </button>
            ))}
         </div>

         {/* Main View: Task Timeline & Activity */}
         <div className="col-span-8 overflow-y-auto custom-scrollbar bg-slate-950/50 p-8 space-y-10">
            {/* Real-time Task Timeline */}
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                     <History size={14} className="text-amber-500" /> Collaborative Execution Log
                  </h3>
                  <div className="text-[9px] font-black text-slate-600 bg-slate-900 px-3 py-1 rounded-full border border-white/5">
                     {tasks.length} OPERATIONS LOGGED
                  </div>
               </div>

               <div className="space-y-4">
                  <AnimatePresence initial={false}>
                     {tasks.length === 0 ? (
                       <div className="py-20 text-center border-2 border-dashed border-slate-900 rounded-[3rem]">
                          <Terminal size={40} className="mx-auto text-slate-800 mb-4" />
                          <p className="text-xs font-black text-slate-600 uppercase tracking-widest">
                             Awaiting first agent delegation...
                          </p>
                       </div>
                     ) : (
                       tasks.map((task) => (
                         <motion.div
                           key={task.id}
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 group hover:border-white/10 transition-colors"
                         >
                            <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center">
                                     {getAgentIcon(task.agentRole)}
                                  </div>
                                  <div>
                                     <div className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter mb-0.5">{task.agentRole}</div>
                                     <div className="text-xs font-bold text-white uppercase">{task.objective}</div>
                                  </div>
                               </div>
                               <div className={cn(
                                  "px-3 py-1 rounded-full text-[9px] font-black uppercase border",
                                  task.status === 'completed' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                                  task.status === 'in_progress' ? "bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse" :
                                  "bg-rose-500/10 border-rose-500/30 text-rose-500"
                               )}>
                                  {task.status}
                               </div>
                            </div>
                            
                            {task.result && (
                              <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-white/5 overflow-x-auto">
                                 <pre className="text-[9px] text-slate-500 leading-relaxed">
                                    {safeStringify(task.result, 2)}
                                 </pre>
                              </div>
                            )}

                            <div className="mt-4 flex items-center justify-between text-[8px] font-black text-slate-700 uppercase">
                               <span className="flex items-center gap-2"><Clock size={10}/> {task.assignedAt.toLocaleTimeString()}</span>
                               {task.completedAt && (
                                 <span className="text-emerald-500/50">COMPLETED IN {((task.completedAt.getTime() - task.assignedAt.getTime()) / 1000).toFixed(1)}S</span>
                               )}
                            </div>
                         </motion.div>
                       ))
                     )}
                  </AnimatePresence>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function getAgentIcon(role: AgentRole) {
  switch (role) {
    case 'CONTENT_STRATEGIST': return <PenTool size={16} />;
    case 'PUBLISHING_OFFICER': return <Share2 size={16} />;
    case 'ANALYTICS_DIRECTOR': return <BarChart3 size={16} />;
    case 'AUTOMATION_ARCHITECT': return <Zap size={16} />;
    case 'MEDIA_PRODUCER': return <Box size={16} />;
    case 'BRAND_INTELLIGENCE': return <ShieldCheck size={16} />;
    case 'AUDIENCE_ARCHITECT': return <Globe size={16} />;
    case 'WORKFLOW_OPS': return <Layers size={16} />;
    case 'YOUTUBE_GROWTH_SPECIALIST': return <Youtube size={16} />;
    default: return <Bot size={16} />;
  }
}

function Clock({ size, className }: any) {
  return <History size={size} className={className} />;
}
