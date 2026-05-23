import React, { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Map, 
  Target, 
  Zap, 
  Award, 
  TrendingUp, 
  Brain,
  Layers,
  History,
  Lock,
  Compass
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";
import { onboardingService, UserExperienceProfile, UserLevel } from "./OnboardingService";
import { auth } from "../lib/firebase";

export function LearningDashboard() {
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

  if (!profile) return null;

  const score = onboardingService.calculateConfidenceScore(profile);

  return (
    <div className="h-full bg-slate-950 text-slate-200 flex flex-col font-mono overflow-hidden">
      <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.1)]">
               <GraduationCap className="text-indigo-400" size={32} />
            </div>
            <div>
               <h1 className="text-2xl font-black tracking-tighter uppercase mb-1">أكاديمية الذكاء الاصطناعي ومسار التعلم</h1>
               <div className="flex items-center gap-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                     <Brain size={12} className="text-indigo-500" /> المزامنة المعرفية: <span className="text-white">نشط</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                     <TrendingUp size={12} className="text-amber-500" /> منحنى النمو: <span className="text-white">إيجابي</span>
                  </span>
               </div>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left: User Stats & Level */}
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 text-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="relative z-10">
                    <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-indigo-500/50 mx-auto mb-6 flex items-center justify-center text-3xl font-black text-indigo-400 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                       {profile.level.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">{profile.level} مشغل</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">تحقق التجربة: {score}%</p>
                    
                    <div className="w-full bg-slate-950 rounded-full h-2 mb-6">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${score}%` }}
                         className="h-full bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                       />
                    </div>

                    <button className="w-full py-3 bg-white text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
                       ترقية الصلاحيات
                    </button>
                 </div>
              </div>

              <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Award size={14} className="text-amber-500" /> الكفاءات المكتسبة
                 </h3>
                 <div className="space-y-3">
                    <SkillBadge label="تنسيق المحتوى" progress={80} />
                    <SkillBadge label="تفويض الوكيل" progress={65} />
                    <SkillBadge label="خرائط المعرفة" progress={40} />
                    <SkillBadge label="محفزات الأتمتة" progress={profile.completedMissions.length > 0 ? 90 : 20} />
                 </div>
              </div>
           </div>

           {/* Right: Learning Roadmap */}
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-3">
                       <Compass size={18} className="text-indigo-400" /> خارطة الطريق التشغيلية
                    </h3>
                    <div className="text-[9px] font-bold text-slate-500 uppercase">مهام تفاعلية</div>
                 </div>

                 <div className="relative space-y-12 pl-12">
                    <div className="absolute left-[23px] top-4 bottom-4 w-px bg-white/5" />
                    
                    <RoadmapNode 
                       active={true}
                       title="الأساس: الهوية"
                       desc="مزامنة الحمض النووي لعلامتك التجارية مع الذاكرة التنفيذية."
                       icon={<Target size={18} />}
                       status="تم توفيره"
                    />
                    <RoadmapNode 
                       active={profile.level !== 'beginner'}
                       title="تكتيكي: محرك المحتوى"
                       desc="أتقن الاستوديو لإنشاء سرديات متعددة المنصات."
                       icon={<Zap size={18} />}
                       status={profile.level !== 'beginner' ? "نشط" : "مغلق"}
                    />
                    <RoadmapNode 
                       active={score > 80}
                       title="استراتيجي: النطاق العالمي"
                       desc="انشر سير عمل مستقل لحضور العلامة التجارية على مدار الساعة."
                       icon={<Layers size={18} />}
                       status={score > 80 ? "نشط" : "مشفر"}
                    />
                    <RoadmapNode 
                       active={false}
                       title="مدير: مختبر الوكلاء المتعددين"
                       desc="تدريب متقدم للوكلاء المخصصين وبروتوكولات الحقن."
                       icon={<Lock size={18} />}
                       status="مقيد"
                    />
                 </div>
              </div>

              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-[2.5rem] p-10 flex items-center justify-between">
                 <div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">جاهز لمحاكاة مباشرة؟</h4>
                    <p className="text-xs text-slate-400 font-bold max-w-sm mb-6">سيرشدك الذكاء الاصطناعي الخاص بنا عبر سيناريو واقعي لاختبار مهاراتك التنفيذية.</p>
                    <button className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                       بدء محاكاة المهمة
                    </button>
                 </div>
                 <div className="w-24 h-24 bg-slate-950 rounded-[2rem] border border-white/5 flex items-center justify-center opacity-50">
                    <History size={40} className="text-indigo-400" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function SkillBadge({ label, progress }: any) {
   return (
      <div className="space-y-2">
         <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-white uppercase tracking-tight">{label}</span>
            <span className="text-[10px] font-black text-slate-600 uppercase">{progress}%</span>
         </div>
         <div className="bg-slate-950 rounded-full h-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5" />
            <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
               className="absolute top-0 bottom-0 bg-indigo-500 rounded-full" 
            />
         </div>
      </div>
   );
}

function RoadmapNode({ active, title, desc, icon, status }: any) {
   return (
      <div className={cn("relative transition-opacity", active ? "opacity-100" : "opacity-30")}>
         <div className={cn(
            "absolute left-[-47px] top-0 w-12 h-12 rounded-2xl flex items-center justify-center z-10 transition-all",
            active ? "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]" : "bg-slate-900 text-slate-700"
         )}>
            {icon}
         </div>
         <div className="flex items-center justify-between">
            <div>
               <h4 className="text-xs font-black text-white uppercase tracking-tight mb-1">{title}</h4>
               <p className="text-[10px] font-bold text-slate-500 max-w-md">{desc}</p>
            </div>
            <div className={cn(
               "px-3 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase border",
               status === "PROVISIONED" || status === "ACTIVE" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-slate-950 border-white/5 text-slate-600"
            )}>
               {status}
            </div>
         </div>
      </div>
   );
}
