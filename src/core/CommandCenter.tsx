import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PenTool, LayoutDashboard, Send, Sparkles, Workflow, Wand2, Command, X, ArrowLeft, Settings, BarChart3, Blocks, Flag } from "lucide-react";
import { cn } from "../lib/utils";

export function CommandCenter({ isOpen, onClose, onNavigate }: { isOpen: boolean, onClose: () => void, onNavigate: (module: any) => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allCommands = [
    { title: "توليد صورة جديدة", icon: <Wand2 size={16} />, module: "media", color: "text-purple-400" },
    { title: "كتابة سكريبت فيديو", icon: <PenTool size={16} />, module: "studio", color: "text-emerald-400" },
    { title: "إنشاء أتمتة جديدة", icon: <Workflow size={16} />, module: "automation", color: "text-amber-400" },
    { title: "نشر محتوى", icon: <Send size={16} />, module: "publishing", color: "text-indigo-400" },
    { title: "لوحة التحكم - Dashboard", icon: <LayoutDashboard size={16} />, module: "dashboard", color: "text-blue-400" },
    { title: "إدارة التكاملات", icon: <Blocks size={16} />, module: "integrations", color: "text-orange-400" },
    { title: "نظام الحملات - Campaign OS", icon: <Flag size={16} />, module: "campaigns", color: "text-cyan-400" },
    { title: "الإعدادات", icon: <Settings size={16} />, module: "settings", color: "text-slate-400" },
    { title: "التقارير التحليلية", icon: <BarChart3 size={16} />, module: "analytics", color: "text-yellow-400" },
  ];

  const normalize = (str: string) => str.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');

  const filteredCommands = query
    ? allCommands.filter(cmd => {
        const nQuery = normalize(query);
        return normalize(cmd.title).includes(nQuery) || 
               cmd.module.toLowerCase().includes(nQuery) ||
               nQuery.split(' ').some(word => normalize(cmd.title).includes(word) || cmd.module.toLowerCase().includes(word));
      })
    : allCommands;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Command Palette */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden flex flex-col"
        >
          {/* Input Area */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
            <Search className="text-slate-400" size={20} />
            <input 
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب اسم الأداة أو الأمر، مثل: حملات، نشر، أتمتة..."
              className="flex-1 bg-transparent border-none outline-none text-slate-200 text-lg placeholder:text-slate-500"
              dir="auto"
            />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">ESC</span>
              <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Results Area */}
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
            <div className="flex flex-col gap-1">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((action, actionIdx) => (
                  <button 
                    key={`cmd-${action.module}-${actionIdx}`} 
                    onClick={() => { onNavigate(action.module); onClose(); }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/80 transition-colors text-right group"
                  >
                     <div className="flex items-center gap-3">
                       <div className={cn("p-1.5 rounded-lg bg-slate-950 border border-slate-800", action.color)}>{action.icon}</div>
                       <span className="text-sm font-bold text-slate-300 group-hover:text-white">{action.title}</span>
                     </div>
                     <ArrowLeft size={16} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500">لا توجد نتائج مطابقة لـ "{query}"</div>
              )}
            </div>
          </div>

          <div className="bg-slate-950/50 p-3 border-t border-slate-800 text-[10px] font-bold text-slate-500 flex justify-between items-center">
            <span>استخدم الأسهم للتنقل و Enter للاختيار</span>
            <div className="flex gap-2">
               <span>Search by <strong className="text-slate-400">AI Core Intelligence</strong></span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
