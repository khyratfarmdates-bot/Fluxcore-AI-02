import React from "react";
import { Monitor, Command, Workflow, PenTool, BarChart3, Users, Globe, Settings2, PlayCircle } from "lucide-react";
import { cn } from "../../lib/utils";

const FEATURES = [
  {
    title: "مساعد ذكاء اصطناعي (AI Studio)",
    desc: "أدوات متكاملة لكتابة، إعادة صياغة، وتحسين المحتوى بلهجات وأساليب تناسب كل منصة أو علامة تجارية.",
    icon: <PenTool size={24} />,
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-500/10",
    text: "text-pink-400"
  },
  {
    title: "نظام جدولة متقدم (Unified Publishing)",
    desc: "أنشئ منشوراً واحداً، دع النظام يكيفه تلقائياً لـ(تيك توك، تويتر، لينكد إن، انستغرام) وانشره فوراً أو اجدوله.",
    icon: <Globe size={24} />,
    color: "from-indigo-500 to-blue-500",
    bg: "bg-indigo-500/10",
    text: "text-indigo-400"
  },
  {
    title: "مساحة عمل للوكالات (Agency Mode)",
    desc: "إدارة عشرات العملاء، دعوة فريق الدعم، نظام موافقات العميل (Approval Workflow) بسلاسة وأمان.",
    icon: <Users size={24} />,
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400"
  },
  {
    title: "أتمتة الأعمال (Automations)",
    desc: "اربط Fluxcore AI 02 بمصادر خارجية مثل RSS، أو اجعله يرد على التعليقات والرسائل تلقائياً بذكاء.",
    icon: <Workflow size={24} />,
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-500/10",
    text: "text-amber-400"
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 relative z-10 bg-slate-950">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">كل ما تحتاجه في مكان واحد</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium">
            تخلص من تشتت الأدوات واشتراكات التطبيقات المتعددة. لقد صممنا نظاماً يجمع
            التأليف، النشر، التحليل وإدارة الفرق في واجهة واحدة فائقة التميز.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {FEATURES.map((feature, i) => (
            <div key={i} className="group relative bg-slate-900/50 border border-slate-800 rounded-[32px] p-8 hover:bg-slate-800/50 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 rounded-[32px] transition-opacity duration-300 z-0 pointer-events-none" />
              <div className="relative z-10">
                <div className={cn("inline-flex p-4 rounded-2xl mb-6", feature.bg, feature.text)}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-400 font-medium leading-relaxed mb-8">
                  {feature.desc}
                </p>
                <button className={cn("text-sm font-bold flex items-center gap-2 group-hover:gap-3 transition-all", feature.text)}>
                  استكشف الميزة <PlayCircle size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
