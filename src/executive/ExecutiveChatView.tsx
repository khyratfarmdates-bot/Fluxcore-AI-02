import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Bot, 
  User, 
  Terminal, 
  Sparkles, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Command,
  ChevronDown,
  Layers,
  Zap,
  ArrowUpRight
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { executiveEngine } from "./ExecutiveEngine";
import { safeStringify } from "../lib/safe-stringify";
import { ExecutiveMessage, ExecutionStep } from "./types";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { eventBus } from "../core/events/EventBus";

export function ExecutiveChatView() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ExecutiveMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { activeBrand } = useWorkspace();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeBrand) {
      setMessages(executiveEngine.getMessages(activeBrand.id));
    }
    
    // Listen for step updates
    const unsubscribe = eventBus.subscribe("EXECUTIVE_STEP_UPDATE", (event) => {
      if (activeBrand) {
        setMessages([...executiveEngine.getMessages(activeBrand.id)]);
      }
    });

    return () => unsubscribe();
  }, [activeBrand]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (overrideInput?: string) => {
    const textToProcess = (overrideInput || input).trim();
    if (!textToProcess || !activeBrand) return;

    if (!overrideInput) setInput("");
    setIsTyping(true);

    try {
      await executiveEngine.processMessage(textToProcess, {
        brandId: activeBrand.id,
        workspaceId: activeBrand.id // using brandId as workspaceId for now
      });
      setMessages([...executiveEngine.getMessages(activeBrand.id)]);
    } catch (error) {
      console.error("Executive Engine Error:", error);
      // We could add a local UI message here if needed
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-full bg-[#050505] text-slate-200 overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative z-10 max-w-5xl mx-auto border-x border-slate-900 shadow-2xl">
        
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-xl border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
              <Command size={20} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                بيئة التشغيل التنفيذية
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase font-black tracking-widest">
                  نشط
                </span>
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                متصل بـ Fluxcore AI 02 Core OS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end mr-4">
              <span className="text-[10px] text-slate-500 uppercase font-black">ذاكرة العلامة التجارية</span>
              <span className="text-xs font-bold text-white">{activeBrand?.name}</span>
            </div>
            <button className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all">
              <Activity size={18} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-1000">
              <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500/20 to-amber-500/20 rounded-[40px] flex items-center justify-center border border-white/5 shadow-2xl relative group">
                <div className="absolute inset-0 bg-white/5 rounded-[40px] blur-sm group-hover:blur-md transition-all" />
                <Bot size={48} className="text-indigo-400 relative z-10" />
              </div>
              <div className="space-y-4 max-w-md">
                <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
                  كيف يمكنني المساعدة في إدارة علامتك التجارية اليوم؟
                </h1>
                <p className="text-slate-400 font-medium leading-relaxed">
                  أنا هنا للتنسيق بين أدواتك، توليد المحتوى، تحليل الأداء، وتنفيذ خططك التسويقية بشكل متكامل.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
                {[
                  "حلل أداء آخر منشوراتنا",
                  "صمم خطة لمحتوى الأسبوع القادم",
                  "أتمتة عملية نشر منشورات X",
                  "أعطني ملخصاً عن حالة العلامة التجارية"
                ].map((hint, i) => (
                  <button 
                    key={i}
                    onClick={() => setInput(hint)}
                    className="p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl text-left text-sm font-bold text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group"
                  >
                    <span className="flex items-center justify-between">
                      {hint}
                      <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div 
                key={`chat-msg-${msg.id || i}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-6 max-w-4xl",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
                  msg.role === "user" ? "bg-slate-800 border-slate-700" : "bg-indigo-600/10 border-indigo-500/30"
                )}>
                  {msg.role === "user" ? <User size={20} /> : <Bot size={20} className="text-indigo-400" />}
                </div>

                <div className={cn(
                  "flex flex-col gap-4",
                  msg.role === "user" ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-6 rounded-[28px] text-lg font-medium leading-[1.6] shadow-sm",
                    msg.role === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-slate-900/80 backdrop-blur-md border border-slate-800/80 text-slate-200 rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>

                  {msg.plan && msg.plan.length > 0 && (
                    <ExecutionTimeline steps={msg.plan} />
                  )}

                  {msg.options && msg.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 w-full mt-4">
                      {msg.options.map((opt) => (
                        <button 
                          key={opt.id}
                          onClick={() => {
                            if (opt.type === "choice") {
                              handleSend(opt.label);
                            } else if (opt.type === "action") {
                              // If it's an action, we might want to trigger a specific tool or event
                              if (opt.value?.toolName) {
                                // We can't easily execute tools from UI without going through engine
                                // so let's send a technical message to the engine
                                handleSend(`EXECUTE_TOOL: ${opt.value.toolName} ${safeStringify(opt.value.args || {})}`);
                              } else {
                                handleSend(opt.label);
                              }
                            }
                          }}
                          className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-sm font-bold group text-right"
                        >
                          <ChevronDown size={14} className={cn("text-slate-600", opt.type === 'action' ? "rotate-0 text-indigo-500" : "rotate-90")} />
                          <span className="text-slate-300 group-hover:text-white">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.suggestions && msg.suggestions.length > 0 && (
                     <div className="flex gap-2 flex-wrap mt-2">
                       {msg.suggestions.map((s, i) => (
                         <button 
                           key={i} 
                           onClick={() => handleSend(s)}
                           className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white transition-all"
                         >
                           {s}
                         </button>
                       ))}
                     </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <div className="flex gap-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center">
                <Sparkles size={20} className="text-indigo-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* Input Dock */}
        <div className="p-8 shrink-0 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-[32px] opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative flex items-center bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-2 pr-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <Terminal size={20} className="text-slate-500 mr-4" />
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="تحدث معي كمدير تنفيذي لعملك..."
                className="flex-1 bg-transparent border-none outline-none text-base py-4 text-white placeholder:text-slate-600 font-medium"
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="w-12 h-12 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white rounded-[24px] flex items-center justify-center transition-all shadow-lg active:scale-95"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutionTimeline({ steps }: { steps: ExecutionStep[] }) {
  const completedCount = steps.filter(s => s.status === "completed").length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 space-y-6 shadow-2xl relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
            <Zap size={16} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white/90">
              مخطط التنفيذ الذكي
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Workflow: Hybrid Autonomous Mode</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">
            {Math.round(progress)}%
          </span>
          <span className="text-[8px] text-slate-600 font-bold uppercase">
            {completedCount} / {steps.length} Tasks
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => (
          <motion.div 
            key={`${step.id}-${idx}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl border transition-all relative overflow-hidden",
              step.status === "completed" ? "bg-emerald-500/5 border-emerald-500/20" : 
              step.status === "running" ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.05)]" :
              "bg-slate-950/50 border-slate-800"
            )}
          >
            {step.status === "running" && (
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent pointer-events-none"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            )}
            
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border relative z-10",
              step.status === "completed" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
              step.status === "running" ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]" :
              "bg-slate-900 border-slate-800 text-slate-500"
            )}>
              {step.status === "completed" ? <CheckCircle2 size={16} /> :
               step.status === "running" ? <RefreshCw size={16} className="animate-spin" /> :
               <Clock size={16} />}
            </div>
            <div className="flex-1 relative z-10">
              <p className={cn(
                "text-sm font-bold tracking-tight",
                step.status === "completed" ? "text-emerald-400" :
                step.status === "running" ? "text-white" : "text-slate-500"
              )}>
                {step.title}
              </p>
              {step.error && <p className="text-[10px] text-rose-500 mt-1 font-medium bg-rose-500/5 p-2 rounded-lg border border-rose-500/20">{step.error}</p>}
            </div>
            {step.status === "completed" && (
              <div className="text-[9px] bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-emerald-500/20">
                Verified
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function RefreshCw({ size, className }: any) {
  return <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}><Zap size={size} className={className} /></motion.div>;
}
