import React from 'react';
import { Lightbulb, Brain, Zap } from 'lucide-react';

export function InsightsTab() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-indigo-500/10 border border-indigo-500/20 p-8 rounded-[32px]">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
            <Brain size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">AI Insights Engine</h3>
            <p className="text-sm text-slate-400 font-medium">تحليلات متقدمة مدعومة بالذكاء الاصطناعي لفهم سلوك المحتوى</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-black text-slate-500 uppercase mb-4 flex items-center gap-2">
              <Zap size={14} className="text-amber-500" /> اقتراح تحسين
            </h4>
            <p className="text-sm text-slate-300 font-bold leading-relaxed">
              تحليل المنشورات الأخيرة يشير إلى أن استخدام "النبرة التعليمية" في TikTok يزيد التفاعل بنسبة 24%.
            </p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-black text-slate-500 uppercase mb-4 flex items-center gap-2">
              <Lightbulb size={14} className="text-indigo-400" /> فرصة محتوى
            </h4>
            <p className="text-sm text-slate-300 font-bold leading-relaxed">
              هناك نقص في المحتوى التقني المبسط في مجالك حالياً. هذا هو الوقت المناسب لإطلاق سلسلة "كيف تعمل".
            </p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-black text-slate-500 uppercase mb-4 flex items-center gap-2">
              <Brain size={14} className="text-purple-400" /> تحليل الشخصية
            </h4>
            <p className="text-sm text-slate-300 font-bold leading-relaxed">
              الجمهور يتفاعل بشكل أفضل مع شخصية "الخبير الودود" مقارنة بـ "المؤسسة الرسمية".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
