import React, { useState, useEffect } from "react";
import { Activity, Clock, Image as ImageIcon, Video, AlertCircle, RefreshCw, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { useWorkspace } from "../../contexts/WorkspaceContext";

export function GenerationQueue() {
  const { activeBrand } = useWorkspace();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!activeBrand) return;

    const q = query(
      collection(db, "generations"),
      where("brandId", "==", activeBrand.id),
      where("userId", "==", auth.currentUser?.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Queue listener error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeBrand]);

  const activeTasks = tasks.filter(t => t.status === 'processing' || t.status === 'pending');

  return (
    <div className="absolute bottom-6 left-6 z-40 select-none">
      
      {/* Collapsed Pill State */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-350 cursor-pointer active:scale-95 select-none hover:scale-102",
            activeTasks.length > 0
              ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-300 hover:border-indigo-400/60"
              : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-900/80 hover:border-slate-700"
          )}
        >
          {activeTasks.length > 0 ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-xs font-black">جاري المعالجة... ({activeTasks.length})</span>
            </>
          ) : (
            <>
              <Clock size={13} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-350">طابور التوليد</span>
            </>
          )}
        </button>
      )}

      {/* Expanded Details Card */}
      {isOpen && (
        <div 
          className="w-80 bg-slate-950/90 border border-slate-800 rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-lg flex flex-col max-h-[380px] overflow-hidden text-right animate-in fade-in slide-in-from-bottom-4 transition-all duration-300"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-900 shrink-0">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-350 transition-colors p-1"
            >
              <X size={14} />
            </button>
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-indigo-400 animate-pulse" />
              <h3 className="text-xs font-black text-white">طابور التوليد الحقيقي</h3>
              <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-indigo-500/20">
                {activeTasks.length} نشط
              </span>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2.5 pr-1 max-h-[220px]">
            {loading ? (
              <div className="flex justify-center py-6"><RefreshCw className="animate-spin text-slate-600" size={18} /></div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-2">
                 <Clock size={20} className="opacity-45" />
                 <p className="text-[11px] font-bold">طابور العمل خالي تماماً</p>
              </div>
            ) : (
              tasks.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-slate-900/35 border border-slate-800/60 p-3 rounded-2xl relative overflow-hidden group transition-all hover:border-slate-700/80"
                >
                   {/* Processing progress bar indicator */}
                   {item.status === "processing" && (
                     <div 
                       className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                       style={{ width: `${item.progress || 30}%` }}
                     />
                   )}
                   
                   <div className="flex gap-2.5 relative z-10">
                     <div className={cn("p-1.5 rounded-lg shrink-0 h-fit text-slate-400", 
                       item.contentType === "video" ? "bg-purple-500/10 text-purple-400" : "bg-emerald-500/10 text-emerald-400"
                     )}>
                       {item.contentType === "video" ? <Video size={13} /> : <ImageIcon size={13} />}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-[10px] font-bold text-slate-300 truncate mb-1" dir="auto" title={item.params?.prompt || item.goal}>
                         {item.params?.prompt || item.goal}
                       </p>
                       
                       <div className="flex items-center justify-between">
                         <span className={cn(
                           "text-[9px] font-black uppercase flex items-center gap-1",
                           item.status === 'success' || item.result ? "text-emerald-400" : "text-slate-500"
                         )}>
                            {item.status === 'processing' ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                <span>جاري المعالجة {item.progress || 30}%</span>
                              </>
                            ) : item.result || item.status === 'success' ? (
                              <span>مكتمل بنجاح</span>
                            ) : (
                              <span>في الانتظار</span>
                            )}
                         </span>
                         {item.result && (
                           <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 rounded border border-emerald-500/20 font-black">جاهز</span>
                         )}
                       </div>
                     </div>
                   </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Warning Banner */}
          <div className="mt-3 shrink-0 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-2.5 flex gap-2 text-amber-500/80">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold leading-normal">
              المهام مستمرة بالخلفية وتُحفظ تلقائياً في مكتبة أصولك.
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
