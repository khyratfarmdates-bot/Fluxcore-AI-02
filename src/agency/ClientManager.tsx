import React, { useState } from "react";
import { Briefcase, Building, Folders, CheckSquare, Settings2, Plus, LogIn } from "lucide-react";
import { cn } from "../lib/utils";

const MOCK_CLIENTS = [
  { id: "c1", name: "مطعم الطهي الفاخر", workspaces: 2, status: "Active", plan: "Pro" },
  { id: "c2", name: "عيادة بسمائل", workspaces: 1, status: "Active", plan: "Basic" },
  { id: "c3", name: "متجر الأناقة", workspaces: 3, status: "Paused", plan: "Enterprise" },
];

export function ClientManager() {
  return (
    <div className="flex h-full gap-6">
      <div className="flex-1 bg-slate-900/40 border border-slate-800/80 rounded-[32px] p-6 flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl text-white flex items-center gap-2">
            <Building className="text-emerald-400" /> العملاء الحاليين
          </h3>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2">
             <Plus size={16} /> إضافة عميل جديد
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto custom-scrollbar content-start">
          {MOCK_CLIENTS.map((client) => (
            <div key={client.id} className="bg-slate-900 border border-slate-800 rounded-[28px] p-6 group hover:border-emerald-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                 <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center font-black text-xl">
                   {client.name.charAt(0)}
                 </div>
                 <span className={cn("text-[10px] font-bold px-2 py-1 rounded border", 
                   client.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-700")}>
                   {client.status}
                 </span>
              </div>
              
              <h4 className="font-bold text-lg text-white mb-1">{client.name}</h4>
              <div className="text-sm font-medium text-slate-500 mb-6 flex items-center gap-4">
                 <span className="flex items-center gap-1"><Folders size={14}/> {client.workspaces} مساحات</span>
                 <span className="flex items-center gap-1 text-slate-400">{client.plan}</span>
              </div>

              <div className="flex gap-2">
                 <button className="flex-1 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors flex justify-center items-center gap-1">
                   إدارة مساحات <Settings2 size={14}/>
                 </button>
                 <button className="flex-1 p-2 bg-slate-200 hover:bg-white text-slate-900 rounded-xl text-xs font-bold transition-colors flex justify-center items-center gap-1">
                   دخول (Client Mode) <LogIn size={14} />
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-80 shrink-0 bg-slate-900/60 border border-slate-800/80 rounded-[32px] p-6 flex flex-col">
        <h3 className="font-bold text-white mb-4">محاكاة Client Mode</h3>
        <p className="text-sm text-slate-400 leading-relaxed font-medium mb-6">
          "Client Mode" هو واجهة مخصصة ووايت-ليبل (White-label) يراها عميلك. تتيح للعميل رؤية جدولة المحتوى والموافقة عليه أو طلب تعديلات دون الوصول لإعدادات وكالتك أو باقي العملاء.
        </p>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl border-dashed opacity-70">
           <div className="flex items-center gap-2 mb-3 border-b border-slate-800/50 pb-2">
             <CheckSquare size={16} className="text-amber-400" />
             <span className="text-sm font-bold text-slate-300">Approval Pipeline</span>
           </div>
           <ul className="text-xs space-y-2 text-slate-500 font-medium">
             <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-700"></div> Draft (داخلي)</li>
             <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Review (ينتظر العميل)</li>
             <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Approved (جاهز)</li>
             <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Scheduled (مجدول)</li>
           </ul>
        </div>
      </div>
    </div>
  )
}
