import React, { useState, useEffect } from "react";
import { Check, X, MessageSquare, Clock, User } from "lucide-react";
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { toast } from '../lib/soundToast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export function ApprovalWorkflow() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const { activeBrand } = useWorkspace();
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    if (!activeBrand || !auth.currentUser) return;
    const q = query(
      collection(db, 'publishing_queue'), 
      where('brandId', '==', activeBrand.id),
      where('userId', '==', auth.currentUser.uid),
      where('status', '==', 'pending_approval')
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setApprovals(data);
      if (selected && !data.find(d => d.id === selected.id)) {
         setSelected(null);
      }
    });
    
    return () => unsub();
  }, [activeBrand]);

  const handleAction = async (id: string, action: 'queued' | 'rejected') => {
     try {
        await updateDoc(doc(db, 'publishing_queue', id), { status: action });
        toast.success("تم التحديث بنجاح");
     } catch(err) {
        toast.error("حدث خطأ");
     }
  }

  return (
    <div className="flex h-full gap-6">
      <div className="w-1/3 bg-slate-900/50 border border-slate-800 rounded-[24px] p-4 flex flex-col gap-2 overflow-y-auto">
        <h3 className="font-bold text-slate-300 text-sm mb-2 px-2">بانتظار الموافقة ({approvals.length})</h3>
        
        {approvals.map(item => (
          <div key={item.id} onClick={() => setSelected(item)} className={`p-4 bg-slate-950 border rounded-xl cursor-pointer hover:border-indigo-500/50 transition-colors ${selected?.id === item.id ? 'border-indigo-500' : 'border-slate-800'}`}>
            <h4 className="font-bold text-slate-200 text-sm mb-2">{item.content?.substring(0, 30)}...</h4>
            <div className="flex items-center justify-between text-xs text-slate-500">
               <span className="flex items-center gap-1"><User size={12}/> {item.platform}</span>
               <span className="flex items-center gap-1"><Clock size={12}/> {item.createdAt ? formatDistanceToNow(item.createdAt.toDate(), { locale: ar }) : ''}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 bg-slate-900/30 border border-slate-800 rounded-[32px] p-8 flex flex-col items-center justify-center text-slate-500 text-center relative">
        
        {!selected ? (
          <div className="max-w-md space-y-4 opacity-50">
             <MessageSquare size={48} className="mx-auto text-slate-700" />
             <h2 className="text-xl font-bold">حدد عنصراً للمراجعة</h2>
             <p className="text-sm">يمكنك هنا الموافقة على المنشورات، طلب تعديلات، أو رفضها، وترك تعليقات لفريق العمل.</p>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col text-right">
             <h2 className="text-xl font-bold text-white mb-4">تفاصيل المنشور ({selected.platform})</h2>
             <pre className="text-right text-slate-300 whitespace-pre-wrap font-sans bg-slate-900 border border-slate-800 p-6 rounded-2xl flex-1 overflow-y-auto custom-scrollbar leading-relaxed">
               {selected.content}
             </pre>
             <div className="flex gap-4 mt-6 justify-center">
                <button onClick={() => handleAction(selected.id, 'queued')} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all"><Check size={18}/> تفويض / موافقة للجدولة</button>
                <button onClick={() => handleAction(selected.id, 'rejected')} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-bold transition-all"><X size={18}/> رفض</button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
