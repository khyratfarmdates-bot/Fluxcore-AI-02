import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Star, 
  Target,
  Zap,
  MousePointer2
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";
import { onboardingService, UserExperienceProfile } from "./OnboardingService";
import { auth } from "../lib/firebase";

export function MissionControl() {
  const [profile, setProfile] = useState<UserExperienceProfile | null>(null);

  useEffect(() => {
    async function load() {
      const user = auth.currentUser;
      if (user) {
        const p = await onboardingService.getProfile(user.uid);
        setProfile(p);
      }
    }
    load();
  }, []);

  const missions = [
    { id: 'ident-1', title: 'تنسيق العلامة التجارية', desc: 'حدد هوية علامتك التجارية لتدريب الذاكرة التنفيذية.', points: 50 },
    { id: 'studio-1', title: 'الشرارة الأولى', desc: 'أنشئ مسودة محتوى باستخدام استوديو الذكاء الاصطناعي.', points: 30 },
    { id: 'auto-1', title: 'انعدام الجاذبية', desc: 'فعّل أول سير عمل مؤتمت لك.', points: 100 },
    { id: 'pub-1', title: 'البث العالمي', desc: 'انشر بنجاح منشوراً على منصة التواصل الاجتماعي.', points: 40 },
  ];

  if (!profile) return null;

  const score = onboardingService.calculateConfidenceScore(profile);

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 font-mono">
       <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                <Trophy size={24} />
             </div>
             <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tighter">تقدم المهمة</h3>
                <div className="flex items-center gap-2">
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">نتيجة الثقة:</div>
                   <div className="text-[10px] font-black text-amber-500">{score}%</div>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-white/5 rounded-xl">
             <span className="text-[10px] font-black text-white uppercase">المستوى: {profile.level}</span>
          </div>
       </div>

       <div className="grid grid-cols-1 gap-3">
          {missions.map(m => {
            const isCompleted = profile.completedMissions.includes(m.id);
            return (
              <div key={m.id} className={cn(
                "p-4 rounded-2xl border transition-all flex items-center justify-between group",
                isCompleted ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-950/50 border-white/5 hover:border-slate-800"
              )}>
                 <div className="flex items-center gap-4">
                    {isCompleted ? (
                      <CheckCircle2 size={20} className="text-emerald-500" />
                    ) : (
                      <Circle size={20} className="text-slate-700" />
                    )}
                    <div>
                       <h4 className={cn("text-[11px] font-black uppercase tracking-tight", isCompleted ? "text-emerald-400" : "text-white")}>
                          {m.title}
                       </h4>
                       <p className="text-[9px] font-bold text-slate-500 mt-0.5">{m.desc}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-500">
                       <Star size={10} fill="currentColor" /> +{m.points}
                    </div>
                    {!isCompleted && (
                      <button className="p-2 rounded-lg bg-slate-900 border border-white/5 text-slate-500 hover:text-white transition-all">
                         <ArrowRight size={14} />
                      </button>
                    )}
                 </div>
              </div>
            );
          })}
       </div>

       <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">الفتح التالي: مختبر الوسائط المتقدم</span>
          </div>
          <button className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
             عرض جميع المهام <ArrowRight size={12} />
          </button>
       </div>
    </div>
  );
}
