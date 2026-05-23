import React from "react";
import { Users, Briefcase, Activity, TrendingUp, AlertCircle, ArrowUpRight } from "lucide-react";
import { cn } from "../lib/utils";

export function AgencyDashboard({ onNavigate }: { onNavigate: (tab: any) => void }) {
  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
        <StatCard title="العملاء النشطين" value="12" trend="+2 هذا الشهر" icon={<Briefcase size={20}/>} color="indigo" onClick={() => onNavigate("clients")} />
        <StatCard title="أعضاء الفريق" value="8" trend="مكتمل" icon={<Users size={20}/>} color="emerald" onClick={() => onNavigate("team")} />
        <StatCard title="منشورات تمت الموافقة عليها" value="142" trend="+15% عن الأسبوع الماضي" icon={<TrendingUp size={20}/>} color="amber" />
        <StatCard title="تعديلات مطلوبة" value="5" trend="تتطلب الانتباه" icon={<AlertCircle size={20}/>} color="rose" alert />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        {/* Recent Client Activity */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800/80 rounded-[32px] p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white flex items-center gap-2">أحدث نشاط للعملاء</h3>
            <button onClick={() => onNavigate("activity")} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              عرض السجل كاملاً <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="flex-1 space-y-4">
            <ActivityRow client="مطعم الطهي" action="وافق على" target="منشور الإطلاق" status="approved" time="منذ 10 دقائق" />
            <ActivityRow client="عيادة بسمائل" action="طلب تعديل في" target="حملة العناية بالبشرة" status="revision" time="منذ ساعة" />
            <ActivityRow client="شركة التقنية" action="ترك تعليقاً على" target="مسودة الإعلان المستهدف" status="comment" time="منذ 3 ساعات" />
            <ActivityRow client="متجر الأناقة" action="وافق على" target="خطة محتوى شهر مايو" status="approved" time="أمس" />
          </div>
        </div>

        {/* Quick Actions & Workspace Status */}
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-[32px] p-6 flex flex-col gap-6">
           <h3 className="font-bold text-white">إجراءات سريعة</h3>
           <div className="grid gap-3">
             <button onClick={() => onNavigate("clients")} className="p-4 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700/50 text-right transition-colors flex items-center gap-4 group">
               <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:scale-110 transition-transform"><Briefcase size={20}/></div>
               <div>
                  <div className="text-sm font-bold text-white">إضافة عميل جديد</div>
                  <div className="text-xs text-slate-400">إعداد مساحة عمل جديدة</div>
               </div>
             </button>
             <button onClick={() => onNavigate("team")} className="p-4 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700/50 text-right transition-colors flex items-center gap-4 group">
               <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform"><Users size={20}/></div>
               <div>
                  <div className="text-sm font-bold text-white">دعوة عضو فريق</div>
                  <div className="text-xs text-slate-400">Manage Editor/Admin roles</div>
               </div>
             </button>
           </div>
           
           <h3 className="font-bold text-white mt-4 border-t border-slate-800/80 pt-6">استهلاك الخطة (Subscription)</h3>
           <div className="space-y-4">
             <div>
               <div className="flex justify-between text-xs font-bold mb-2">
                 <span className="text-slate-400">مساحات العمل المسموحة</span>
                 <span className="text-white">12 / 20</span>
               </div>
               <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500 w-[60%] rounded-full"></div>
               </div>
             </div>
             <div>
               <div className="flex justify-between text-xs font-bold mb-2">
                 <span className="text-slate-400">المنشورات المولدة (هذا الشهر)</span>
                 <span className="text-white">4,230 / 10,000</span>
               </div>
               <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 w-[42%] rounded-full"></div>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, trend, icon, color, alert, onClick }: any) {
  const colors = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  }
  return (
    <div onClick={onClick} className={cn("p-6 rounded-[24px] border border-slate-800/80 bg-slate-900/50 flex flex-col gap-4 relative overflow-hidden group hover:border-slate-700/80 transition-colors", onClick && "cursor-pointer")}>
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</span>
        <div className={cn("p-2 rounded-xl", colors[color as keyof typeof colors])}>{icon}</div>
      </div>
      <div>
        <div className="text-4xl font-black text-white">{value}</div>
        <div className={cn("text-xs font-bold mt-2", alert ? "text-rose-400 animate-pulse" : "text-slate-500")}>{trend}</div>
      </div>
    </div>
  )
}

function ActivityRow({ client, action, target, status, time }: any) {
  const isApproved = status === "approved";
  const isRevision = status === "revision";
  return (
    <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:bg-slate-800/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className={cn("w-2 h-2 rounded-full", isApproved ? "bg-emerald-500" : isRevision ? "bg-rose-500" : "bg-amber-500")}></div>
        <div className="text-sm">
          <span className="font-bold text-slate-200">{client}</span>
          <span className="text-slate-500 mx-1">{action}</span>
          <span className="font-bold text-slate-300">{target}</span>
        </div>
      </div>
      <div className="text-xs font-medium text-slate-500">{time}</div>
    </div>
  )
}
