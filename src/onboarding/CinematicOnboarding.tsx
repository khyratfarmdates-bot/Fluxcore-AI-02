import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  Target, 
  Rocket, 
  ShieldCheck, 
  Users, 
  Zap, 
  Layout, 
  MousePointer2,
  ChevronLeft,
  ChevronRight,
  Cpu
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { onboardingService, UserLevel } from "./OnboardingService";

interface Step {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  visual: React.ReactNode;
}

export function CinematicOnboarding({ user, onComplete }: { user: any, onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [goal, setGoal] = useState<string | null>(null);

  const steps: Step[] = [
    {
      id: 0,
      title: "مرحباً بك في الذكاء التنفيذي",
      subtitle: "مستقبل استراتيجية المحتوى",
      description: "Fluxcore AI 02 ليس مجرد منصة؛ إنه نظام تنفيذي منسق متعدد الوكلاء مصمم للارتقاء بعلامتك التجارية إلى البعد التالي.",
      visual: <FloatingVisual />
    },
    {
      id: 1,
      title: "حدد مهمتك",
      subtitle: "تنسيق موجه نحو الهدف",
      description: "كيف يمكن للوكلاء مساعدتك؟ حدد هدفك الأساسي لمعايرة المحرك التنفيذي.",
      visual: <GoalSelection onSelect={setGoal} selected={goal} />
    },
    {
      id: 2,
      title: "اختيار المستوى",
      subtitle: "تصميم التجربة",
      description: "يحدد مستوى خبرتك مقدار التعقيد الذي نكشفه. يمكننا إدارة كل شيء، أو منحك السيطرة التكتيكية الكاملة.",
      visual: <LevelSelection onSelect={setLevel} selected={level} />
    },
    {
      id: 3,
      title: "جاهز للانطلاق",
      subtitle: "مزامنة الوكلاء...",
      description: "استراتيجي المحتوى، ومنتجو الوسائط، ومديرو التحليلات يتماشون الآن مع هوية علامتك التجارية.",
      visual: <LaunchSync />
    }
  ];

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
       if (level && goal) {
         await onboardingService.saveProfile({
           userId: user.uid,
           level,
           goal,
           completedMissions: [],
           onboardingStep: 4,
           lastActiveLevel: level,
           isExperienceLoaded: true
         });
         onComplete();
       }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col font-mono selection:bg-indigo-500/30 overflow-hidden">
      {/* Background Cinematic Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full animate-pulse" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/5 blur-[120px] rounded-full" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay" />
      </div>

      {/* Progress Scale */}
      <div className="absolute top-12 left-12 flex flex-col gap-2">
         <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2">حالة المعايرة</div>
         <div className="flex gap-1.5">
            {steps.map((s, i) => (
              <div key={s.id} className={cn(
                "h-1 transition-all duration-700 rounded-full",
                i <= step ? "w-8 bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)]" : "w-4 bg-white/5"
              )} />
            ))}
         </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 relative z-10">
         {/* Left: Interactive Visual */}
         <div className="flex items-center justify-center p-20 relative border-r border-white/5 bg-slate-950/30 backdrop-blur-sm">
            <AnimatePresence mode="wait">
               <motion.div
                 key={step}
                 initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                 animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                 exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                 transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                 className="w-full flex justify-center"
               >
                  {steps[step].visual}
               </motion.div>
            </AnimatePresence>
         </div>

         {/* Right: Copy & Actions */}
         <div className="flex flex-col justify-center p-20 gap-10">
            <AnimatePresence mode="wait">
               <motion.div
                 key={step}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
               >
                  <div className="mb-4">
                     <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                        Phase {step + 1}
                     </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{steps[step].subtitle}</h4>
                  <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-6 leading-none">
                     {steps[step].title}
                  </h2>
                  <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-md">
                     {steps[step].description}
                  </p>
               </motion.div>
            </AnimatePresence>

            <div className="pt-10 flex items-center gap-6">
               <button 
                 disabled={(step === 1 && !goal) || (step === 2 && !level)}
                 onClick={handleNext}
                 className="group relative px-10 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.15)] disabled:opacity-30 disabled:hover:scale-100 overflow-hidden"
               >
                  <span className="relative z-10 flex items-center gap-3">
                     {step === steps.length - 1 ? 'إطلاق النظام' : 'المضي قدماً'} <ArrowRight size={18} />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
               </button>
               
               <div className="text-[10px] font-black text-slate-600 flex items-center gap-2">
                  <MousePointer2 size={12} /> TAB أو انقر للمتابعة
               </div>
            </div>
         </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-12 right-12 flex items-center gap-4">
         <div className="text-right">
            <div className="text-[10px] font-black text-white uppercase tracking-tighter">نظام Fluxcore AI 02 الذكي</div>
            <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">v02.0.5 تم توفيره</div>
         </div>
         <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Cpu size={24} />
         </div>
      </div>
    </div>
  );
}

function FloatingVisual() {
  return (
    <div className="relative w-80 h-80">
       <motion.div 
         animate={{ rotate: 360 }}
         transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
         className="absolute inset-0 border-2 border-dashed border-indigo-500/20 rounded-full"
       />
       <motion.div 
         animate={{ rotate: -360 }}
         transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
         className="absolute inset-8 border border-white/5 rounded-full outline outline-1 outline-white/5 outline-offset-8"
       />
       <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-500 shadow-[0_0_80px_rgba(99,102,241,0.5)] flex items-center justify-center">
             <Cpu size={48} className="text-white" />
          </div>
       </div>
    </div>
  );
}

function GoalSelection({ onSelect, selected }: any) {
  const goals = [
     { id: 'monetize', title: 'تحقيق الدخل من المحتوى', icon: <Zap size={24}/>, desc: 'تحقيق أقصى قدر من الإيرادات عبر المنصات.' },
     { id: 'automate', title: 'أتمتة كاملة', icon: <Rocket size={24}/>, desc: 'دع الوكلاء يديرون الآلة.' },
     { id: 'strategy', title: 'استراتيجية العلامة التجارية', icon: <Target size={24}/>, desc: 'تركيز عميق على الهوية والسرد.' }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
       {goals.map(g => (
         <button
           key={g.id}
           onClick={() => onSelect(g.id)}
           className={cn(
             "p-6 rounded-3xl border transition-all duration-300 text-left group",
             selected === g.id ? "bg-indigo-500 text-white border-indigo-400 shadow-xl" : "bg-slate-900/50 border-white/5 hover:border-slate-700"
           )}
         >
           <div className="flex items-center gap-4 mb-2">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", selected === g.id ? "bg-white/20" : "bg-slate-950 text-slate-500 group-hover:text-white")}>
                 {g.icon}
              </div>
              <h4 className="font-black uppercase text-xs tracking-tight">{g.title}</h4>
           </div>
           <p className={cn("text-[10px] font-bold leading-relaxed", selected === g.id ? "text-white/80" : "text-slate-500")}>
              {g.desc}
           </p>
         </button>
       ))}
    </div>
  );
}

function LevelSelection({ onSelect, selected }: any) {
  const levels: {id: UserLevel, title: string, desc: string}[] = [
    { id: 'beginner', title: 'مشغل (Operative)', desc: 'تجربة موجهة. قرارات مؤتمتة.' },
    { id: 'pro', title: 'مهندس (Architect)', desc: 'تحكم مباشر في الوكيل. صلاحيات تقنية.' },
    { id: 'enterprise', title: 'تنفيذي (Executive)', desc: 'تنسيق على نطاق واسع. متعدد العلامات التجارية.' }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
       {levels.map(l => (
         <button
           key={l.id}
           onClick={() => onSelect(l.id)}
           className={cn(
             "p-6 rounded-3xl border transition-all duration-300 text-left group",
             selected === l.id ? "bg-emerald-500 text-white border-emerald-400 shadow-xl" : "bg-slate-900/50 border-white/5 hover:border-slate-700"
           )}
         >
           <div className="flex items-center gap-4 mb-2">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", selected === l.id ? "bg-white/20" : "bg-slate-950 text-slate-500 group-hover:text-white")}>
                 <Layout size={20} />
              </div>
              <h4 className="font-black uppercase text-xs tracking-tight">{l.title}</h4>
           </div>
           <p className={cn("text-[10px] font-bold leading-relaxed", selected === l.id ? "text-white/80" : "text-slate-500")}>
              {l.desc}
           </p>
         </button>
       ))}
    </div>
  );
}

function LaunchSync() {
  const agents = [
    { name: 'استراتيجي المحتوى', key: 'CONTENT_STRATEGIST' },
    { name: 'منتج الوسائط', key: 'MEDIA_PRODUCER' },
    { name: 'مدير التحليلات', key: 'ANALYTICS_DIRECTOR' },
    { name: 'مهندس الأتمتة', key: 'AUTOMATION_ARCHITECT' }
  ];
  
  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
       {agents.map((a, i) => (
         <motion.div
           key={a.key}
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: i * 0.2 }}
           className="flex items-center gap-6 p-4 bg-slate-900/40 border border-white/5 rounded-2xl"
         >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <div className="flex-1">
               <div className="text-[10px] font-black text-white uppercase tracking-tight">{a.name}</div>
               <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">الحالة: قيد التهيئة...</div>
            </div>
            <div className="text-[9px] font-black text-emerald-500 tracking-widest">جاهز</div>
         </motion.div>
       ))}
       <motion.div 
         initial={{ scaleY: 0 }}
         animate={{ scaleY: 1 }}
         transition={{ delay: 1, duration: 1.5 }}
         className="h-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)]" 
       />
    </div>
  );
}
