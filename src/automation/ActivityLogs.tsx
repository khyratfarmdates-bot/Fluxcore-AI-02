import React, { useState, useEffect } from 'react';
import { ActivityLog } from './types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useWorkspace } from '../contexts/WorkspaceContext';

export function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const { activeBrand } = useWorkspace();

  useEffect(() => {
    if (!activeBrand || !auth.currentUser) return;
    const q = query(
      collection(db, 'automation_logs'), 
      where('brandId', '==', activeBrand.id), 
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'), 
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data: ActivityLog[] = [];
      snapshot.forEach(doc => {
        const item = doc.data();
        data.push({
          id: doc.id,
          workflowId: item.workflowId,
          workflowTitle: item.workflowTitle,
          action: item.action,
          status: item.status,
          details: item.details,
          timestamp: item.timestamp?.toDate() || new Date()
        });
      });
      setLogs(data);
    });
    return () => unsub();
  }, [activeBrand]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-black text-white">سجل النشاطات</h3>
        <p className="text-sm text-slate-400 mt-1">تتبع أداء الأتمتة وعمليات التوليد السابقة</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-800 bg-slate-900/50 text-xs font-bold uppercase tracking-widest text-slate-500">
          <div className="col-span-1">الحالة</div>
          <div className="col-span-4">سير العمل</div>
          <div className="col-span-4">الإجراء الفرعي</div>
          <div className="col-span-3 text-left">الوقت</div>
        </div>
        
        <div className="divide-y divide-slate-800/50">
          {logs.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
               لا يوجد سجلات نشاط مسجلة حتى الآن.
            </div>
          )}
          {logs.map(log => (
            <div key={log.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-900/20 transition-colors">
              <div className="col-span-1 flex justify-center">
                {log.status === 'Success' && <CheckCircle2 size={18} className="text-emerald-500" />}
                {log.status === 'Failed' && <div title={log.details}><XCircle size={18} className="text-rose-500" /></div>}
                {log.status === 'Warning' && <AlertCircle size={18} className="text-amber-500" />}
              </div>
              <div className="col-span-4">
                <span className="text-sm font-bold text-slate-200">{log.workflowTitle}</span>
              </div>
              <div className="col-span-4 flex flex-col">
                <span className="text-sm text-slate-400">{log.action}</span>
                {log.details && <span className="text-[10px] text-rose-400 mt-1">{log.details}</span>}
              </div>
              <div className="col-span-3 text-left text-xs font-medium text-slate-500">
                {formatDistanceToNow(log.timestamp, { addSuffix: true, locale: ar })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
