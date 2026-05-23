import React, { useState, useEffect } from "react";
import { CheckCircle2, Clock, AlertCircle, RefreshCw, MoreVertical } from "lucide-react";
import { cn } from "../lib/utils";
import { onSnapshot } from 'firebase/firestore';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { toast } from '../lib/soundToast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { publishingService, type PublishingTask } from "../services/publishing";
import { ConfirmDialog } from "../components/ConfirmDialog";

export function PublishingQueue() {
  const [queue, setQueue] = useState<PublishingTask[]>([]);
  const { activeBrand } = useWorkspace();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    if (!activeBrand) return;
    const q = publishingService.getQueueQuery(activeBrand.id);
    
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PublishingTask));
      setQueue(data);
    }, (error) => {
      console.error(error);
      toast.error("فشل في جلب قائمة النشر");
    });
    
    return () => unsub();
  }, [activeBrand]);

  const stats = {
    publishing: queue.filter(i => i.status === 'publishing').length,
    published: queue.filter(i => i.status === 'published').length,
    scheduled: queue.filter(i => i.status === 'queued' || i.status === 'scheduled').length,
    failed: queue.filter(i => i.status === 'failed').length
  };

  const handleRetry = async (id: string) => {
    try {
      await publishingService.retryTask(id);
      toast.success("تمت الإضافة لقائمة الانتظار مجدداً");
    } catch(err: any) {
       toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmation({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.id) {
       try {
         await publishingService.delete(deleteConfirmation.id);
         toast.success('تم الحذف');
       } catch(err: any) {
         toast.error(err.message);
       }
    }
    setDeleteConfirmation({ isOpen: false, id: null });
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <StatCard title="قيد النشر" count={stats.publishing} color="indigo" />
        <StatCard title="تم النشر (هذا الشهر)" count={stats.published} color="emerald" />
        <StatCard title="مجدولة/انتظار" count={stats.scheduled} color="amber" />
        <StatCard title="فشلت" count={stats.failed} color="rose" />
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="font-bold text-slate-200">المهام وقائمة الانتظار</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-900 sticky top-0 text-slate-500 font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-6 font-medium w-1/2">المحتوى</th>
                <th className="py-3 px-6 font-medium">المنصة</th>
                <th className="py-3 px-6 font-medium">الوقت</th>
                <th className="py-3 px-6 font-medium">الحالة</th>
                <th className="py-3 px-6 font-medium max-w-[80px]">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {queue.length === 0 && (
                 <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">لا يوجد بيانات</td>
                 </tr>
              )}
              {queue.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-200 whitespace-pre-wrap line-clamp-2 leading-relaxed">{item.content?.substring(0, 80)}...</td>
                  <td className="py-4 px-6 text-slate-400 font-bold">{item.platform}</td>
                  <td className="py-4 px-6 text-slate-400 text-xs text-left" dir="ltr">
                    {item.scheduledTime ? formatDistanceToNow(item.scheduledTime?.toDate?.() || new Date(item.scheduledTime), { addSuffix:true, locale: ar }) : 'غير محدد'}
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-4 px-6">
                     {item.status === 'failed' ? (
                        <button onClick={() => handleRetry(item.id)} className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-rose-500/20">
                          <RefreshCw size={12}/> إعادة حاول
                        </button>
                     ) : (
                        <button onClick={() => handleDelete(item.id)} className="text-slate-500 hover:text-rose-400 p-1"><MoreVertical size={16}/></button>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        title="تأكيد الحذف"
        message="هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف المنشور"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, id: null })}
      />
    </div>
  );
}

function StatCard({ title, count, color }: { title: string, count: number, color: string }) {
  const colors = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  }
  return (
    <div className={cn("p-6 rounded-[24px] border border-slate-800 bg-slate-900/50 flex flex-col gap-2 relative overflow-hidden")}>
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</span>
      <span className={cn("text-4xl font-black", colors[color as keyof typeof colors].split(" ")[0])}>{count}</span>
      <div className={cn("absolute -bottom-4 -left-4 w-24 h-24 blur-[40px] opacity-20 rounded-full", colors[color as keyof typeof colors].split(" ")[1])} />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'publishing') return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-md"><RefreshCw size={12} className="animate-spin"/> قيد النشر</span>
  if (status === 'published') return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md"><CheckCircle2 size={12}/> تم النشر</span>
  if (status === 'scheduled') return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md"><Clock size={12}/> مجدول</span>
  if (status === 'failed') return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-md"><AlertCircle size={12}/> فشل</span>
  return null;
}
