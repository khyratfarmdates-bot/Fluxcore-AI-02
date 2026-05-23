import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Sparkles, ArrowLeft, Zap, Play, PlayCircle, Layers, CheckCircle2, ChevronDown, Monitor, Command, Workflow, PenTool, BarChart3, Users, Globe } from "lucide-react";
import { cn } from "../lib/utils";
import { Logo } from "../components/Logo";

import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { UseCases } from "./components/UseCases";
import { Pricing } from "./components/Pricing";
import { Footer } from "./components/Footer";

export function LandingView({ onLogin }: { onLogin: () => void }) {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  return (
    <div className="bg-[#030712] min-h-screen text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden" dir="rtl">
      
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled ? "bg-[#030712]/80 backdrop-blur-xl border-b border-white/5 py-4 shadow-2xl shadow-indigo-500/5" : "bg-transparent py-6"
        )}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <span className="font-black text-xl tracking-tight text-white flex items-center gap-1">
              Fluxcore AI 02<span className="text-indigo-400">.</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">المميزات</a>
            <a href="#usecases" className="hover:text-white transition-colors">الحلول</a>
            <a href="#pricing" className="hover:text-white transition-colors">الأسعار</a>
            <a href="#faq" className="hover:text-white transition-colors">الأسئلة الشائعة</a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="text-sm font-bold text-slate-300 hover:text-white transition-colors hidden md:block">
              تسجيل الدخول
            </button>
            <button onClick={onLogin} className="bg-white text-slate-950 hover:bg-slate-200 px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              ابدأ مجاناً <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      </motion.nav>

      <main>
        <Hero onLogin={onLogin} scrollY={scrollY} />
        <Features />
        <UseCases />
        <Pricing />
      </main>

      <Footer />
    </div>
  );
}
