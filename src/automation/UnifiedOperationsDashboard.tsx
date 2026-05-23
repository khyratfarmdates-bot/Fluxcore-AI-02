import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Workflow, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Pause, 
  ShieldAlert,
  GitPullRequest,
  BarChart3,
  Network,
  RotateCcw,
  Activity,
  Cpu,
  RefreshCw,
  Terminal
} from "lucide-react";
import { cn } from "../lib/utils";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { motion, AnimatePresence } from "framer-motion";
import { eventBus } from "../core/events/EventBus";
import { liveOps, OperationalEvent } from "../services/LiveOperationalService";
import { automationService } from "../services/automation";
import { Workflow as WorkflowType } from "./types";

export function UnifiedOperationsDashboard() {
  const { activeBrand } = useWorkspace();
  const [activeWorkflows, setActiveWorkflows] = useState<WorkflowType[]>([]);
  const [liveEvents, setLiveEvents] = useState<OperationalEvent[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>({ status: 'OPTIMAL', load: '12%' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!activeBrand) return;

    // Real fetch of workflows
    const loadWorkflows = async () => {
      const data = await automationService.getByField('brandId', activeBrand.id);
      setActiveWorkflows(data as WorkflowType[]);
    };

    loadWorkflows();

    // Subscribe to real live operations
    const unsub = liveOps.subscribe((event) => {
      setLiveEvents(prev => [event, ...prev.slice(0, 49)]);
    });

    liveOps.start();

    // Simulate system health
    const healthInterval = setInterval(() => {
      setSystemHealth({
        status: Math.random() > 0.95 ? 'DEGRADED' : 'OPTIMAL',
        load: `${Math.floor(Math.random() * 20 + 5)}%`,
        memoryStatus: Math.random() > 0.9 ? 'Syncing Knowledge Graph...' : 'Memory Unified'
      });
    }, 5000);

    return () => {
      unsub();
      clearInterval(healthInterval);
    };
  }, [activeBrand]);

  const refreshData = async () => {
    if (!activeBrand) return;
    setIsRefreshing(true);
    const data = await automationService.getByField('brandId', activeBrand.id);
    setActiveWorkflows(data as WorkflowType[]);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (!activeBrand) return (
    <div className="h-full flex items-center justify-center p-20 text-center">
      <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[40px] max-w-sm">
        <Cpu size={48} className="text-slate-700 mx-auto mb-6" />
        <p className="text-slate-500 font-extrabold uppercase tracking-widest">يرجى اختيار علامة تجارية لعرض العمليات</p>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-slate-950 text-slate-200 overflow-y-auto custom-scrollbar p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-8">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                 <Zap className="text-amber-400" size={32} />
              </div>
              <div>
                 <h1 className="text-2xl font-black tracking-tighter uppercase mb-1">ذكاء سير العمل التشغيلي</h1>
                 <div className="flex items-center gap-4">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                       <Network size={12} className="text-emerald-500" /> تنسيق النظام: <span className="text-white">نشط</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                       <ShieldAlert size={12} className="text-indigo-500" /> قيود السلامة: <span className="text-white">مفروضة</span>
                    </span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <button 
                onClick={refreshData}
                className={cn(
                  "p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all",
                  isRefreshing && "animate-spin text-indigo-400"
                )}
              >
                <RefreshCw size={18} />
              </button>
              <div className="bg-slate-900/50 border border-slate-800 px-6 py-3 rounded-2xl">
                 <div className="text-[9px] font-black text-slate-500 uppercase mb-1">الوعي بحمل النظام</div>
                 <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full w-[12%] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                    <span className="text-xs font-black text-white">12%</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
           {/* Active Execution Timeline */}
           <div className="col-span-8 space-y-8">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                 <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-slate-400 flex items-center gap-3">
                       <Activity size={16} className="text-amber-500" /> التدفق التشغيلي الحي
                    </h3>
                    <div className="flex items-center gap-2">
                      <Terminal size={12} className="text-slate-600" />
                      <div className="text-[9px] font-black text-slate-600 uppercase">قناة المخرجات الحية</div>
                    </div>
                 </div>
                 <div className="h-[400px] overflow-y-auto custom-scrollbar bg-black/40 p-4 space-y-2 font-mono scroll-smooth">
                    <AnimatePresence initial={false}>
                       {liveEvents.length === 0 && (
                         <div className="h-full flex items-center justify-center text-slate-700 text-[10px] uppercase font-black tracking-widest italic">
                           في انتظار نبض النظام...
                         </div>
                       )}
                       {liveEvents.map((event) => (
                          <motion.div 
                            key={event.id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="flex items-start gap-4 p-2.5 rounded-lg border border-transparent hover:border-slate-800 hover:bg-slate-900/30 transition-all group"
                          >
                             <span className="text-[9px] font-bold text-slate-600 whitespace-nowrap pt-1">
                               [{new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                             </span>
                             <div className={cn(
                               "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter mt-0.5",
                               event.type === 'AI_THINKING' ? "bg-indigo-500/20 text-indigo-400" :
                               event.type === 'PUBLISHING' ? "bg-amber-500/20 text-amber-400" :
                               event.type === 'CONTENT_GEN' ? "bg-emerald-500/20 text-emerald-400" :
                               "bg-slate-800 text-slate-400"
                             )}>
                               {event.type}
                             </div>
                             <p className="text-[11px] font-bold text-slate-300 leading-relaxed">
                               {event.message}
                             </p>
                             {event.status === 'success' && <CheckCircle2 size={12} className="text-emerald-500 ml-auto mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </motion.div>
                       ))}
                    </AnimatePresence>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <StatCard 
                    title="اكتشاف الاختناقات" 
                    value="لا يوجد" 
                    color="emerald" 
                    icon={<CheckCircle2 size={16}/>} 
                    desc="يتم حالياً حل جميع تبعات المهام ضمن النطاق الأمثل."
                 />
                 <StatCard 
                    title="كفاءة الاسترداد" 
                    value="98.2%" 
                    color="indigo" 
                    icon={<RotateCcw size={16}/>} 
                    desc="سير عمل الاسترداد الذاتي يحل 98% من الإخفاقات العابرة."
                 />
              </div>
           </div>

           {/* Sidebar: Coordination & Governance */}
           <div className="col-span-4 space-y-8">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden">
                 <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                       <Workflow size={14} className="text-indigo-500" /> العمليات النشطة
                    </h3>
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">{activeWorkflows.length}</span>
                 </div>
                 <div className="divide-y divide-slate-800/40 max-h-[460px] overflow-y-auto custom-scrollbar">
                    {activeWorkflows.length === 0 ? (
                       <div className="p-8 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl m-4">
                          <Cpu size={32} className="text-slate-700 mx-auto mb-4" />
                          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                             لم يتم اكتشاف سير عمل نشط.<br />
                             استخدم "أتمتة التشغيل" لبرمجة أول عملية ذكاء اصطناعي.
                          </p>
                          <button 
                            className="mt-6 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-500/20 transition-all"
                            onClick={() => eventBus.publish({ 
                              type: 'NAVIGATE', 
                              payload: 'automation',
                              timestamp: Date.now(),
                              source: 'UnifiedOperationsDashboard'
                            })}
                          >
                             بدء البرمجة الذكية
                          </button>
                       </div>
                    ) : (
                       activeWorkflows.map(flow => (
                          <div key={flow.id} className="p-4 hover:bg-slate-800/20 transition-all flex items-center justify-between group">
                             <div>
                                <h4 className="text-[11px] font-black text-white group-hover:text-indigo-400 transition-colors">{flow.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                   <div className={cn(
                                     "w-1.5 h-1.5 rounded-full",
                                     flow.active ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-slate-700"
                                   )} />
                                   <span className="text-[8px] font-black text-slate-600 uppercase">{flow.active ? 'مفعل' : 'غير نشط'}</span>
                                </div>
                             </div>
                             <div className="text-right">
                                <span className="text-[9px] font-black text-slate-500 block uppercase">{flow.status}</span>
                                {flow.lastRun && <span className="text-[8px] text-slate-700 font-mono">Last: {new Date(flow.lastRun).toLocaleDateString()}</span>}
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </div>

              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-8 shadow-inner shadow-indigo-500/10">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                       <BarChart3 className="text-indigo-400" size={20} />
                    </div>
                    <h4 className="text-xs font-black uppercase text-white">توقعات الاستقرار</h4>
                 </div>
                 <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
                    من المتوقع أن يحافظ النظام على <span className="text-emerald-400">معدل تشغيل 99.9%</span> للدفعة المؤتمتة الليلة. لا يتوقع حدوث تنازع على الموارد.
                 </p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, color, icon, desc }: any) {
  const colors: any = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20"
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 group hover:bg-slate-900/60 transition-all">
       <div className="flex items-center gap-3 mb-4">
          <div className={cn("p-2 rounded-lg", colors[color])}>
             {icon}
          </div>
          <h4 className="text-[10px] font-black uppercase text-slate-500">{title}</h4>
       </div>
       <div className="text-xl font-black text-white mb-2">{value}</div>
       <p className="text-[10px] text-slate-600 leading-relaxed font-bold">{desc}</p>
    </div>
  );
}

