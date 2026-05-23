import React from 'react';
import { Activity, Clock, User, CheckCircle2, MessageSquare } from 'lucide-react';

export function ActivityTimeline() {
  return (
    <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto custom-scrollbar pr-2">
      <div className="mb-8">
        <h2 className="text-xl font-black text-white">سجل النشاط</h2>
        <p className="text-sm text-slate-500 font-medium">تتبع جميع التغييرات والإجراءات عبر وكالتك</p>
      </div>

      <div className="relative space-y-6 before:absolute before:right-[23px] before:top-4 before:bottom-0 before:w-px before:bg-slate-800">
        <TimelineItem 
          icon={<CheckCircle2 size={16} className="text-emerald-500" />}
          user="أحمد محمد"
          action="وافق على"
          target="حملة الصيف 2024"
          time="منذ 15 دقيقة"
        />
        <TimelineItem 
          icon={<MessageSquare size={16} className="text-indigo-400" />}
          user="سارة خالد"
          action="أضافت تعليقاً على"
          target="بوست انستجرام - العيد"
          time="منذ ساعة"
        />
        <TimelineItem 
          icon={<User size={16} className="text-slate-400" />}
          user="النظام"
          action="أنشأ مساحة عمل لـ"
          target="عميل جديد: متجر العود"
          time="منذ 3 ساعات"
        />
      </div>
    </div>
  );
}

function TimelineItem({ icon, user, action, target, time }: any) {
  return (
    <div className="relative flex items-start gap-8 pr-12 group">
      <div className="absolute right-0 w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center z-10 group-hover:border-slate-600 transition-colors shadow-lg">
        {icon}
      </div>
      <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 group-hover:bg-slate-900/60 transition-all">
        <div className="flex justify-between items-center mb-1">
          <div className="text-sm font-bold text-white leading-none">
            {user} <span className="text-slate-500 font-medium mx-1">{action}</span> {target}
          </div>
          <div className="text-[10px] text-slate-600 font-bold flex items-center gap-1"><Clock size={10} /> {time}</div>
        </div>
      </div>
    </div>
  );
}
