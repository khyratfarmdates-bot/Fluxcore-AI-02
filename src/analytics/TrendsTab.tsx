import React from 'react';
import { TrendingUp, Globe, Hash, Zap } from 'lucide-react';

export function TrendsTab() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[32px]">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
            <TrendingUp size={20} className="text-pink-500" /> اتجاهات السوق الصاعدة
          </h3>
          <div className="space-y-4">
            <TrendItem label="#الذكاء_الاصطناعي" growth="+145%" importance="high" />
            <TrendItem label="#ريادة_الأعمال" growth="+82%" importance="medium" />
            <TrendItem label="#صناعة_المحتوى" growth="+34%" importance="low" />
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[32px]">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
            <Globe size={20} className="text-indigo-500" /> مراقبة المنافسين (AI Analysis)
          </h3>
          <div className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800 border-dashed text-center">
            <p className="text-xs text-slate-500 font-bold">يتم حالياً تحليل تحركات المنافسين في السوق...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendItem({ label, growth, importance }: { label: string, growth: string, importance: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-900 rounded-lg text-slate-400">
          <Hash size={16} />
        </div>
        <span className="font-bold text-slate-200">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-black text-emerald-500">{growth}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${importance === 'high' ? 'bg-rose-500' : importance === 'medium' ? 'bg-amber-500' : 'bg-slate-500'}`}></div>
      </div>
    </div>
  );
}
