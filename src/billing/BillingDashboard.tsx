import React, { useState } from "react";
import { CreditCard, Check, Zap, Building2, Crown, Download, Receipt, AlertCircle, TrendingUp, History } from "lucide-react";
import { cn } from "../lib/utils";
import { PricingConfig } from "../core/billing/PricingConfig";

export function BillingDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "plans" | "invoices">("overview");

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-hidden">
      <header className="flex justify-between items-center shrink-0 mb-6 relative z-10 gap-4 border-b border-slate-800/80 pb-6">
         <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-1">
              <CreditCard className="text-emerald-400" size={20} /> الفواتير والاشتراكات
            </h2>
            <p className="text-sm font-medium text-slate-400">إدارة الباقة الحالية، استهلاك الموارد، وتاريخ الفواتير لمساحة العمل.</p>
         </div>
      </header>

      <div className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 shadow-sm w-fit mb-6 shrink-0">
          <button onClick={() => setActiveTab("overview")} className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === "overview" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>نظرة عامة والاستهلاك</button>
          <button onClick={() => setActiveTab("plans")} className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === "plans" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>تغيير الباقة</button>
          <button onClick={() => setActiveTab("invoices")} className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all", activeTab === "invoices" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>الفواتير والدفع</button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
         {activeTab === "overview" && <BillingOverview />}
         {activeTab === "plans" && <PlansUpgrade />}
         {activeTab === "invoices" && <InvoicesView />}
      </div>
    </div>
  );
}

function BillingOverview() {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Current Plan Widget */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-[32px] p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6 w-full">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Building2 size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h3 className="font-bold text-white text-xl">صانع المحتوى (Creator)</h3>
               <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-emerald-500/20">Active</span>
            </div>
            <p className="text-sm font-medium text-slate-400">تُجدد تلقائياً بقيمة $19 في 1 مايو 2026. بطاقة تنتهي بـ 4242</p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
           <button className="flex-1 md:flex-none border border-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors">
             إلغاء الاشتراك
           </button>
           <button className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors shadow-lg shadow-indigo-500/20">
             ترقية الباقة
           </button>
        </div>
      </div>

      <h3 className="font-bold text-white text-lg mt-4">معدل الاستهلاك (Usage Details)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <UsageMeter title="أرصدة الذكاء الاصطناعي" used={850} limit={1000} icon={<Zap size={16}/>} color="indigo" />
         <UsageMeter title="مساحات العمل" used={1} limit={1} icon={<Building2 size={16}/>} color="emerald" alert />
         <UsageMeter title="أعضاء الفريق" used={1} limit={1} icon={<History size={16}/>} color="purple" alert />
         <UsageMeter title="الملفات الشخصية المربوطة" used={8} limit={10} icon={<TrendingUp size={16}/>} color="amber" />
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-amber-500/80 mt-2">
        <AlertCircle size={18} className="shrink-0" />
        <p className="text-sm font-medium leading-relaxed">
          انتبه: رصيدك في بعض الموارد (مساحات العمل، الفرق) وصل للحد الأقصى. يرجى الترقية لإضافة المزيد من العملاء أو دعوة فريقك السحابي.
        </p>
      </div>

    </div>
  )
}

function UsageMeter({ title, used, limit, icon, color, alert }: any) {
  const percent = limit === -1 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isUnlimited = limit === -1;
  const isWarning = percent >= 85 && alert;

  const colors = {
    indigo: "text-indigo-400 bg-indigo-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    purple: "text-purple-400 bg-purple-500/10",
  };

  const progressColors = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-[24px] p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
         <div className="flex items-center gap-2">
           <div className={cn("p-1.5 rounded-lg", colors[color as keyof typeof colors])}>{icon}</div>
           <span className="text-xs font-bold text-slate-300">{title}</span>
         </div>
         {isWarning && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>}
      </div>

      <div>
        <div className="flex justify-between items-end mb-2">
           <span className="text-2xl font-black text-white">{used}</span>
           <span className="text-xs font-bold text-slate-500 mb-1">/ {isUnlimited ? "Unlimited" : limit}</span>
        </div>
        
        {!isUnlimited && (
          <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div className={cn("h-full rounded-full transition-all duration-1000", isWarning ? "bg-rose-500" : progressColors[color as keyof typeof progressColors])} style={{ width: `${percent}%` }}></div>
          </div>
        )}
      </div>
    </div>
  )
}

function PlansUpgrade() {
  const plans = PricingConfig.getAllPlans();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
       {plans.map(plan => (
         <div key={plan.id} className={cn(
           "bg-slate-900/40 border rounded-[32px] p-6 flex flex-col relative transition-transform duration-300",
           plan.id === "agency" ? "border-indigo-500/50 shadow-2xl shadow-indigo-900/20" : "border-slate-800/80 hover:border-slate-700"
         )}>
           {plan.id === "agency" && (
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">صُنع للوكالات</div>
           )}
           <h3 className="text-lg font-bold text-white mb-4">{plan.name}</h3>
           <div className="flex items-end gap-1 mb-6 pb-6 border-b border-slate-800">
             <span className="text-3xl font-black text-white">${plan.priceMonthly}</span>
             <span className="text-xs text-slate-500 font-bold mb-1">/ شهري</span>
           </div>

           <div className="flex-1 space-y-3 mb-6">
              <FeatureItem text={`${plan.limits.monthlyCredits} رصيد ذكاء اصطناعي`} active={true} />
              <FeatureItem text={plan.limits.workspaces === -1 ? "مساحات عمل لا محدودة" : `${plan.limits.workspaces} مساحات عمل`} active={true} />
              <FeatureItem text={plan.limits.teamMembers === -1 ? "فريق عمل لا محدود" : `${plan.limits.teamMembers} أعضاء فريق`} active={true} />
              <FeatureItem text={`ربط ${plan.limits.socialProfiles} حساب اجتماعي`} active={true} />
              <FeatureItem text="توليد الفيديو بالذكاء الاصطناعي" active={plan.limits.canUseVideoAI} />
              <FeatureItem text="الأستوديو الصوتي الشامل" active={plan.limits.canUseVoiceAI} />
              <FeatureItem text="بناء مسارات الأتمتة (Zaps)" active={plan.limits.canUseAutomations} />
              <FeatureItem text="هوية مخصصة للعميل White-label" active={plan.limits.hasWhiteLabel} />
           </div>

           <button className={cn(
             "w-full py-3 rounded-xl font-bold text-sm transition-all focus:scale-95 shadow-lg",
             plan.id === "creator" ? "bg-slate-800 border border-slate-700 text-slate-400 cursor-default" : 
             plan.id === "agency" ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-slate-100 hover:bg-white text-slate-900"
           )}>
              {plan.id === "creator" ? "باقتك الحالية" : "اختيار الباقة"}
           </button>
         </div>
       ))}
    </div>
  )
}

function FeatureItem({ text, active }: { text: string, active: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 text-xs font-bold", active ? "text-slate-300" : "text-slate-600 opacity-50")}>
       {active ? <Check size={14} className="text-emerald-400 shrink-0" /> : <div className="w-3.5 h-px bg-slate-700 shrink-0"></div>}
       {text}
    </div>
  )
}

function InvoicesView() {
  const invoices = [
    { id: "INV-2026-003", date: "May 01, 2026", amount: "$19.00", status: "Upcoming", pdf: false },
    { id: "INV-2026-002", date: "Apr 01, 2026", amount: "$19.00", status: "Paid", pdf: true },
    { id: "INV-2026-001", date: "Mar 01, 2026", amount: "$0.00", status: "Paid", pdf: true }, // Free trial or zero cost
  ];

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-[32px] p-6 max-w-4xl">
       <div className="flex justify-between items-center mb-6">
         <h3 className="font-bold text-white text-lg">سجل الفواتير</h3>
         <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">إعدادات بطاقة الدفع (Credit Card)</button>
       </div>

       <div className="overflow-hidden rounded-2xl border border-slate-800/50 relative">
          <table className="w-full text-right text-sm">
            <thead className="text-slate-500 font-bold border-b border-slate-800 bg-slate-950/50">
              <tr>
                <th className="py-4 px-6 font-medium">رقم الفاتورة</th>
                <th className="py-4 px-6 font-medium">التاريخ</th>
                <th className="py-4 px-6 font-medium">المبلغ</th>
                <th className="py-4 px-6 font-medium">الحالة</th>
                <th className="py-4 px-6 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-slate-900/20">
               {invoices.map((inv, i) => (
                 <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-300 flex items-center gap-2">
                       <Receipt size={14} className="text-slate-500"/> {inv.id}
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-mono text-xs">{inv.date}</td>
                    <td className="py-4 px-6 font-bold text-slate-200">{inv.amount}</td>
                    <td className="py-4 px-6">
                       <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-950 border", inv.status === "Paid" ? "text-emerald-400 border-emerald-500/20" : "text-amber-400 border-amber-500/20")}>
                         {inv.status}
                       </span>
                    </td>
                    <td className="py-4 px-6 text-left">
                       {inv.pdf && (
                         <button className="text-slate-500 hover:text-white p-1.5 transition-colors tooltip" title="تحميل PDF">
                           <Download size={16} />
                         </button>
                       )}
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
       </div>
    </div>
  )
}
