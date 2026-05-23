import React, { useState } from "react";
import { Users, CreditCard, Activity, Server, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";
import { cn } from "../lib/utils";

export function AdminDashboard() {
  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-hidden">
      <header className="flex justify-between items-center shrink-0 mb-6 relative z-10 border-b border-slate-800/80 pb-6">
         <div>
            <h2 className="text-xl font-black text-rose-400 flex items-center gap-2 mb-1">
              <Server size={20} /> لوحة تحكم المنصة (SaaS Admin)
            </h2>
            <p className="text-sm font-medium text-slate-400">لوحة القيادة الرئيسية لإدارة المنصة، مراقبة الإيرادات، صحة النظام واستهلاك الـ AI Providers.</p>
         </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 pb-10">
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="إجمالي الإيرادات (MRR)" value="$14,250" trend="+12% الشهر الماضي" icon={<DollarSign size={20}/>} color="emerald" />
            <div className="p-6 rounded-[24px] border border-slate-800 bg-slate-900/40 flex justify-between flex-col">
              <div className="text-xs font-bold text-slate-500 mb-2">توزيع الباقات النشطة</div>
              <div className="space-y-2">
                 <div className="flex justify-between text-xs font-mono"><span className="text-indigo-400">Pro</span><span className="text-white">124</span></div>
                 <div className="flex justify-between text-xs font-mono"><span className="text-emerald-400">Agency</span><span className="text-white">42</span></div>
                 <div className="flex justify-between text-xs font-mono"><span className="text-slate-500">Free</span><span className="text-white">2.4k</span></div>
              </div>
            </div>
            <StatCard title="صحة النظام (Core)" value="99.9%" trend="الأنظمة مستقرة" icon={<Activity size={20}/>} color="indigo" />
            <StatCard title="تنبيهات الاستهلاك الذكي" value="3" trend="Runway API Limit قريب" icon={<AlertTriangle size={20}/>} color="rose" alert />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-[32px] p-6 lg:p-8">
               <h3 className="font-bold text-white mb-6 flex items-center gap-2">أحدث الاشتراكات <TrendingUp size={16} className="text-indigo-400"/></h3>
               <div className="space-y-4">
                  <UserRow name="وكالة التسويق الرقمي" plan="Agency" amount="$99" time="الآن" />
                  <UserRow name="أحمد محمد" plan="Creator" amount="$19" time="منذ 15 دقيقة" />
                  <UserRow name="شركة التقنية المتقدمة" plan="Pro" amount="$49" time="منذ ساعة" />
                  <UserRow name="سارة ديزاين" plan="Creator" amount="$19" time="أمس" />
               </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/80 rounded-[32px] p-6 lg:p-8 flex flex-col">
               <h3 className="font-bold text-white mb-6 flex items-center gap-2">استهلاك موفري الذكاء الاصطناعي <CloudLightning size={16} className="text-amber-400"/></h3>
               <div className="space-y-6 flex-1">
                  <ProviderUsage name="Gemini (Google)" used={12.4} limit={20} unit="M Tokens" color="bg-indigo-500" />
                  <ProviderUsage name="OpenAI (GPT-4o)" used={4.8} limit={10} unit="M Tokens" color="bg-emerald-500" />
                  <ProviderUsage name="Runway (Gen-3)" used={942} limit={1000} unit="Generations" color="bg-rose-500" warning />
                  <ProviderUsage name="ElevenLabs" used={1.2} limit={5} unit="M Characters" color="bg-amber-500" />
               </div>
            </div>
         </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon, color, alert }: any) {
  const colors = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  }
  return (
    <div className={cn("p-6 rounded-[24px] border border-slate-800/80 bg-slate-900/40 flex flex-col gap-4 relative overflow-hidden group hover:border-slate-700/80 transition-colors")}>
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</span>
        <div className={cn("p-2 rounded-xl", colors[color as keyof typeof colors])}>{icon}</div>
      </div>
      <div>
        <div className="text-4xl font-black text-white">{value}</div>
        <div className={cn("text-[10px] uppercase font-bold mt-2", alert ? "text-rose-400 animate-pulse" : "text-emerald-400")}>{trend}</div>
      </div>
    </div>
  )
}

function UserRow({ name, plan, amount, time }: any) {
  return (
    <div className="flex justify-between items-center p-3 hover:bg-slate-800/30 rounded-xl transition-colors">
       <div>
         <div className="font-bold text-sm text-slate-200 mb-1">{name}</div>
         <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest">
           <span className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">{plan}</span>
           <span className="text-slate-500">{time}</span>
         </div>
       </div>
       <div className="font-black text-white">{amount}</div>
    </div>
  )
}

function ProviderUsage({ name, used, limit, unit, color, warning }: any) {
  const p = Math.round((used/limit) * 100);
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
         <span className="text-sm font-bold text-slate-300">{name}</span>
         <span className={cn("text-xs font-mono font-bold", warning ? "text-rose-400" : "text-slate-500")}>{used} / {limit} {unit}</span>
      </div>
      <div className="h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
        <div className={cn("h-full rounded-full", warning ? "bg-rose-500 animate-pulse" : color)} style={{ width: `${p}%` }}></div>
      </div>
    </div>
  )
}

// Dummy icon for internal use 
import { Zap as CloudLightning } from "lucide-react";
