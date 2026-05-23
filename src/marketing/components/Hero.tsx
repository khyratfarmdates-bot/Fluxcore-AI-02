import React from "react";
import { motion, useTransform } from "framer-motion";
import { ArrowLeft, Sparkles, Zap, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";

export function Hero({ onLogin, scrollY }: { onLogin: () => void, scrollY: any }) {
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 0.9]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full opacity-50 mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[400px] bg-purple-600/20 blur-[100px] rounded-full opacity-40 mix-blend-screen pointer-events-none"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dbqsymaia/image/upload/v1704207914/grid_rnxw2m.png')] bg-center opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <motion.div 
        style={{ y: y2, opacity, scale }}
        className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center max-w-5xl"
      >
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, delay: 0.1 }}
           className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-2 mb-8 backdrop-blur-md"
        >
          <Sparkles size={14} /> <span>نظام التشغيل الذكي لصناع المحتوى والوكالات</span>
        </motion.div>

        <motion.h1 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, delay: 0.2 }}
           className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-6 leading-[1.1] [text-wrap:balance]"
        >
          مستقبل <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-400 via-purple-400 to-indigo-400 animate-gradient bg-300%">إدارة المحتوى</span><br />
          يبدأ من هنا.
        </motion.h1>

        <motion.p
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, delay: 0.3 }}
           className="text-lg md:text-xl text-slate-400 font-medium max-w-3xl mb-10 leading-relaxed"
        >
          أتمتة شاملة، توليد ذكي بضغطة زر، وتوزيع على جميع المنصات في آنٍ واحد. 
          حول ساعات من العمل إلى دقائق واستفد من نظام Fluxcore AI 02 الاحترافي.
        </motion.p>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, delay: 0.4 }}
           className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <button onClick={onLogin} className="w-full sm:w-auto bg-white text-slate-950 px-8 py-4 rounded-2xl text-base font-black flex items-center justify-center gap-2 transition-all hover:scale-105 hover:bg-slate-100 shadow-[0_0_40px_rgba(255,255,255,0.15)] group">
            ابدأ تجربتك المجانية <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <button className="w-full sm:w-auto border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all backdrop-blur-sm">
             <Zap size={18} className="text-amber-400" /> مشاهدة العرض التعريفي
          </button>
        </motion.div>
        
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.5, delay: 0.6 }}
           className="mt-8 flex items-center gap-6 text-xs font-bold text-slate-500"
        >
           <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> لا يتطلب بطاقة ائتمان</span>
           <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> إعداد في 3 دقائق</span>
           <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> متوافق مع كافة المنصات</span>
        </motion.div>
      </motion.div>

      {/* Hero Dashboard Preview */}
      <motion.div
         style={{ y: y1 }}
         initial={{ opacity: 0, y: 100 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
         className="mt-20 w-full max-w-6xl px-6 relative z-20 perspective-[2000px]"
      >
        <div className="relative rounded-[2rem] border border-white/10 bg-slate-950/80 p-2 shadow-2xl backdrop-blur-2xl transform-gpu rotate-x-[3deg] group">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent rounded-[2rem] pointer-events-none"></div>
          
          <div className="rounded-[1.5rem] overflow-hidden border border-slate-800/80 bg-slate-900 relative">
             <div className="absolute top-0 left-0 right-0 h-12 bg-slate-950 border-b border-slate-800 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                   <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                   <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="mx-auto w-48 h-6 bg-slate-900 rounded-md border border-slate-800"></div>
             </div>
             <img src="https://i.imgur.com/KerOBYX.png" alt="Dashboard Mockup" className="w-full h-auto mt-12 opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700" />
             
             {/* Floating UI Elements over image */}
             <div className="absolute bottom-10 left-10 p-4 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl animate-bounce-slow">
                <div className="flex items-center gap-3">
                   <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl"><CheckCircle2 size={20}/></div>
                   <div>
                     <div className="text-sm font-bold text-white mb-0.5">تم النشر بنجاح</div>
                     <div className="text-xs text-slate-400">على 4 منصات معاً</div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </motion.div>
      
      {/* Scroll indicator */}
      <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 1 }}
         className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 animate-pulse"
      >
        <span className="text-[10px] font-black uppercase tracking-widest">اكتشف المزيد</span>
        <ChevronDown size={16} />
      </motion.div>
    </section>
  );
}
