import React from "react";
import { Check, Star } from "lucide-react";
import { cn } from "../../lib/utils";

const PLANS = [
  {
    title: "المبتدئ (Free)",
    price: "0",
    desc: "للتجربة وصناع المحتوى المبتدئين.",
    features: ["توليد 10 منشورات مجانية", "نشر يدوي", "مساحة عمل واحدة"],
    buttonLabel: "ابدأ مجاناً",
    highlight: false
  },
  {
    title: "صانع المحتوى (Creator)",
    price: "19",
    desc: "لكل صانع محتوى يبحث عن النمو.",
    features: ["توليد غير محدود", "جدولة حتى 100 منشور", "الشخصيات ونبرة الصوت", "دعم أولوية"],
    buttonLabel: "ترقية إلى الخطة",
    highlight: true
  },
  {
    title: "الوكالة (Agency)",
    price: "99",
    desc: "للوكالات لخدمة عدة عملاء.",
    features: ["10 مساحات عمل (عملاء)", "إضافة 5 أعضاء فريق", "وضع العميل Client Mode", "سير عمل الموافقات"],
    buttonLabel: "ترقية إلى الخطة",
    highlight: false
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 relative z-10 bg-slate-950">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">أسعار بسيطة، بدون مفاجآت</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium">
            اختر الخطة المناسبة لحجم عملك وتقنيات الذكاء الاصطناعي التي تحتاجها في رحلتك.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <div key={i} className={cn(
              "rounded-[32px] p-8 flex flex-col relative transition-transform duration-300 hover:-translate-y-2",
              plan.highlight 
                ? "bg-slate-900 border border-indigo-500/50 shadow-2xl shadow-indigo-900/20" 
                : "bg-slate-900/40 border border-slate-800"
            )}>
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                  <Star size={12} /> الأكثر شيوعاً
                </div>
              )}
              
              <h3 className="text-xl font-bold text-white mb-2">{plan.title}</h3>
              <p className="text-sm text-slate-400 font-medium pb-6 mb-6 border-b border-slate-800">{plan.desc}</p>
              
              <div className="flex items-end gap-1 mb-8">
                <span className="text-4xl font-black text-white">${plan.price}</span>
                <span className="text-sm text-slate-500 font-bold mb-1.5">/ شهري</span>
              </div>
              
              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                    <Check size={18} className={plan.highlight ? "text-indigo-400" : "text-emerald-400"} />
                    {f}
                  </div>
                ))}
              </div>
              
              <button className={cn(
                "w-full py-4 rounded-2xl font-bold text-sm transition-all focus:scale-95 shadow-lg",
                plan.highlight 
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20" 
                  : "bg-slate-800 hover:bg-slate-700 text-white"
              )}>
                {plan.buttonLabel}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
