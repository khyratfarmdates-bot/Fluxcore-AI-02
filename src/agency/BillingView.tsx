import React from "react";
import { CreditCard, Check, Zap, Building2, Crown } from "lucide-react";
import { cn } from "../lib/utils";

const PLANS = [
  { 
    id: "pro", 
    name: "مستقل (Pro)", 
    price: "49$", 
    desc: "للمستقلين وصناع المحتوى المنفردين",
    icon: <Zap size={24} className="text-amber-400" />,
    features: ["مساحة عمل واحدة", "توليد محتوى غير محدود", "100 جدولة شهرياً", "دعم فني عادي"]
  },
  { 
    id: "agency", 
    name: "وكالة (Agency)", 
    price: "199$", 
    desc: "لوظائف الفريق وإدارة العملاء المتعددين",
    icon: <Building2 size={24} className="text-emerald-400" />,
    popular: true,
    features: ["حتى 10 مساحات عمل (عملاء)", "5 أعضاء فريق", "نظام الموافقة Approval", "الوضع المخصص للعميل (Client Mode)"]
  },
  { 
    id: "enterprise", 
    name: "أعمال (Enterprise)", 
    price: "مخصص", 
    desc: "للفرق الكبيرة وحجم العمل الضخم",
    icon: <Crown size={24} className="text-indigo-400" />,
    features: ["مساحات عمل غير محدودة", "أعضاء فريق غير محدود", "White-label كامل", "API نيتف", "دعم فني مخصص"]
  },
];

export function BillingView() {
  return (
    <div className="flex flex-col h-full gap-8 overflow-y-auto custom-scrollbar pb-10">
      
      {/* Current Usage Widget */}
      <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-8 shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <CreditCard size={28} />
          </div>
          <div>
            <h3 className="font-bold text-white text-xl mb-1">خطة الوكالة (Agency Plan)</h3>
            <p className="text-sm font-medium text-slate-400">تدفع شهرياً. التجديد القادم في 1 مايو 2026</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors border border-slate-700">
             ملخص الفواتير
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {PLANS.map(plan => (
           <div key={plan.id} className={cn(
             "bg-slate-900/50 border rounded-[32px] p-8 flex flex-col hover:-translate-y-1 transition-transform duration-300 relative",
             plan.popular ? "border-emerald-500/50 shadow-2xl shadow-emerald-900/20" : "border-slate-800/80"
           )}>
             {plan.popular && (
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                 الأكثر اختياراً
               </div>
             )}
             
             <div className="mb-6 flex justify-between items-start">
               <div>
                 <h4 className="font-bold text-xl text-white mb-2">{plan.name}</h4>
                 <div className="flex items-end gap-1">
                   <span className="text-3xl font-black text-white">{plan.price}</span>
                   {plan.price !== "مخصص" && <span className="text-sm text-slate-500 font-medium mb-1">/ شهري</span>}
                 </div>
               </div>
               <div className="p-3 bg-slate-950 rounded-xl">{plan.icon}</div>
             </div>
             
             <p className="text-sm text-slate-400 font-medium mb-8 pb-8 border-b border-slate-800">{plan.desc}</p>
             
             <div className="flex flex-col gap-4 flex-1 mb-8">
               {plan.features.map((f, i) => (
                 <div key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                   <Check size={16} className={cn(plan.popular ? "text-emerald-400" : "text-indigo-400")} />
                   {f}
                 </div>
               ))}
             </div>
             
             <button className={cn(
               "w-full font-bold py-3.5 rounded-xl text-sm transition-all focus:scale-95",
               plan.id === "agency" ? "bg-slate-800 text-slate-400 cursor-default" : 
               plan.popular ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : 
               "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
             )}>
               {plan.id === "agency" ? "خطتك الحالية" : "ترقية الخطة"}
             </button>
           </div>
         ))}
      </div>

    </div>
  )
}
