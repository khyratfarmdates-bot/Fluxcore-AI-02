import React from 'react';
import { Zap } from 'lucide-react';

export function CreditsDisplay() {
  return (
    <div className="flex flex-col items-center justify-center bg-slate-900/80 px-2 py-3 rounded-xl border border-slate-800/80 backdrop-blur-sm gap-1.5 text-center w-full">
      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
        <Zap size={14} fill="currentColor" className="animate-pulse" />
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[8px] font-black text-slate-500 uppercase leading-none mb-1">الرصيد المتبقي</span>
        <span className="text-[11px] font-black text-white leading-none tracking-tight">
          4,820 <span className="text-indigo-400 text-[8px] font-bold">نقطة</span>
        </span>
      </div>
    </div>
  );
}
