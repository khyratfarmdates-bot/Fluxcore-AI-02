import React, { useState, useEffect } from 'react';
import { Workflow } from './types';
import { Plus, Play, Pause, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { onSnapshot } from 'firebase/firestore';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { toast } from '../lib/soundToast';
import { automationService } from '../services/automation';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function WorkflowList({ onEdit }: { onEdit: (w: Workflow) => void }) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const { activeBrand } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    if (!activeBrand) return;
    setLoading(true);
    
    // Using production service with proper query
    const q = automationService.getWorkflowsQuery(activeBrand.id);
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Workflow));
      setWorkflows(data);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error('حدث خطأ أثناء جلب سير العمل');
      setLoading(false);
    });
    return () => unsub();
  }, [activeBrand]);

  const toggleActive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const wf = workflows.find(w => w.id === id);
    if (!wf) return;
    
    try {
      await automationService.toggleActive(id, wf.active);
      toast.success(!wf.active ? 'تم تفعيل سير العمل' : 'تم إيقاف سير العمل');
    } catch(err:any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmation({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.id) {
       try {
         await automationService.delete(deleteConfirmation.id);
         toast.success('تم الحذف بنجاح');
       } catch(err: any) {
         toast.error(err.message);
       }
    }
    setDeleteConfirmation({ isOpen: false, id: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-white">سير العمل الخاص بك</h3>
          <p className="text-sm text-slate-400 mt-1">قم بإدارة أتمتة المحتوى الخاصة بك</p>
        </div>
        <button 
          onClick={() => onEdit({ 
            id: Date.now().toString(), 
            brandId: activeBrand?.id || '',
            title: 'سير عمل جديد', 
            description: '', 
            active: false, 
            steps: [], 
            status: 'Idle' 
          })}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus size={18} /> إنشاء جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows.map(w => (
          <div key={w.id} onClick={() => onEdit(w)} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col gap-4 relative overflow-hidden">
            <div className={`absolute top-0 w-full h-1 left-0 right-0 ${w.active ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
            
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h4 className="font-bold text-white text-lg">{w.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{w.description}</p>
              </div>
              <div className="flex gap-2 items-center">
                <button onClick={(e) => toggleActive(e, w.id)} className={`p-2 rounded-lg transition-colors ${w.active ? 'bg-slate-800 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {w.active ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <div className="relative group/menu">
                  <button onClick={(e) => e.stopPropagation()} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white group-focus-within/menu:text-white">
                    <MoreVertical size={16} />
                  </button>
                  <div className="absolute top-10 left-0 bg-slate-800 border border-slate-700 p-2 rounded-xl scale-0 group-focus-within/menu:scale-100 origin-top-left flex flex-col gap-1 z-20 transition-all w-32 shadow-xl">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(w); }} className="w-full text-right px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg flex items-center gap-2">
                      <Edit2 size={14} /> تعديل
                    </button>
                    <button onClick={(e) => handleDelete(e, w.id)} className="w-full text-right px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2">
                       <Trash2 size={14} /> حذف
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/60 pt-4 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-500">
               <div className="flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${w.active ? (w.status === 'Running' ? 'bg-indigo-500 animate-pulse' : 'bg-amber-500') : 'bg-slate-700'}`}></span>
                 {w.status}
               </div>
               {w.lastRun && <span>آخر تشغيل: {w.lastRun.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        title="تأكيد حذف سير العمل"
        message="هل أنت متأكد من حذف سير العمل؟ لا يمكن الاستمرار في المهام المجدولة ضمن هذا السير بعد الحذف."
        confirmText="حذف"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, id: null })}
      />
    </div>
  );
}
