import React from 'react';
import { Users, UserPlus, Shield, Mail, MoreVertical } from 'lucide-react';

export function TeamManager() {
  return (
    <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto custom-scrollbar pr-2">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-black text-white">إدارة الفريق</h2>
          <p className="text-sm text-slate-500 font-medium">إدارة الأدوار والصلاحيات لأعضاء وكالتك</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-black transition-all">
          <UserPlus size={16} /> دعوة عضو جديد
        </button>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-950/50 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">العضو</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">الدور</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">الحالة</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            <MemberRow name="أحمد محمد" email="ahmed@agency.com" role="مدير (Admin)" status="نشط" />
            <MemberRow name="سارة خالد" email="sara@agency.com" role="محرر محتوى" status="نشط" />
            <MemberRow name="خالد علي" email="khaled@agency.com" role="محلل بيانات" status="نشط" />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MemberRow({ name, email, role, status }: any) {
  return (
    <tr className="hover:bg-slate-800/20 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
            {name[0]}
          </div>
          <div>
            <div className="text-sm font-bold text-white">{name}</div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1"><Mail size={10} /> {email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Shield size={12} className="text-indigo-400" /> {role}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase">
          {status}
        </div>
      </td>
      <td className="px-6 py-4 text-left">
        <button className="p-2 text-slate-600 hover:text-white"><MoreVertical size={16} /></button>
      </td>
    </tr>
  );
}
