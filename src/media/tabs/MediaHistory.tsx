import React, { useEffect, useState, useRef } from "react";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { History, Image as ImageIcon, Video, RefreshCcw, Play, Pause, Download, Volume2, Sparkles } from "lucide-react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

export function MediaHistory() {
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { activeBrand } = useWorkspace();

  const fetchHistory = async () => {
    if (!auth.currentUser || !activeBrand) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "generations"),
        where("brandId", "==", activeBrand.id),
        orderBy("createdAt", "desc"),
        limit(24)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGenerations(data);
    } catch (e) {
      console.error("fetchHistory Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [activeBrand]);

  const togglePlayVoice = (id: string, base64Url: string) => {
    if (playingId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      toast.info("تم إيقاف تشغيل الصوت.");
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      toast.info("جاري بدء تشغيل التعليق الصوتي...");
      const audio = new Audio(base64Url);
      audioRef.current = audio;
      setPlayingId(id);
      audio.play().catch((e) => {
        console.error("Playback error:", e);
        toast.error("فشل تشغيل الصوت، قد يكون التنسيق غير مدعوم.");
        setPlayingId(null);
      });
      audio.onended = () => {
        setPlayingId(null);
      };
      audio.onerror = () => {
        setPlayingId(null);
        toast.error("حدث خطأ أثناء تشغيل الملف الصوتي.");
      };
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
       <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shrink-0 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <History className="text-indigo-400" size={20} /> سجل التوليد
            </h2>
            <p className="text-sm font-medium text-slate-400">سجل متكامل لتصفح واستماع وتحميل وتصاميم الذكاء الاصطناعي السابقة.</p>
         </div>
         <button onClick={fetchHistory} className="p-2.5 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors text-slate-400 hover:text-white">
            <RefreshCcw size={16} />
         </button>
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
             <div className="text-slate-500 py-10 text-center font-bold flex items-center justify-center gap-2">
               <RefreshCcw size={16} className="animate-spin text-indigo-400" /> جاري تحميل السجل...
             </div>
          ) : generations.length === 0 ? (
             <div className="text-slate-500 py-20 text-center flex flex-col items-center justify-center">
                 <History size={48} className="opacity-10 mb-4" />
                 <p className="font-bold text-slate-400">سجل التوليد فارغ حالياً</p>
                 <p className="text-xs text-slate-600 mt-1">ابدأ بتوليد الصور أو التعليقات الصوتية لتظهر هنا تلقائياً.</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pr-2 pb-24">
                 {generations.map(gen => (
                     <div key={gen.id} className="bg-slate-900/60 border border-slate-800/80 rounded-[24px] overflow-hidden group hover:border-slate-700 transition-all flex flex-col justify-between backdrop-blur-sm">
                         
                         {gen.contentType === 'voice' ? (
                             /* Premium Voice Player Component */
                             <div className="w-full aspect-square bg-slate-950/60 flex flex-col justify-between p-5 relative group/audio border-b border-slate-800/50">
                               <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                                    تعليق صوتي
                                  </span>
                               </div>

                               <div className="flex-1 flex flex-col items-center justify-center gap-3 pt-6">
                                 <div className={cn(
                                   "w-16 h-16 rounded-2xl flex items-center justify-center transition-all border shadow-lg",
                                   playingId === gen.id 
                                     ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 scale-105 shadow-emerald-500/5" 
                                     : "bg-slate-900 border-slate-800 text-indigo-400 group-hover/audio:border-slate-700"
                                 )}>
                                   <Volume2 size={32} className={playingId === gen.id ? "animate-pulse" : ""} />
                                 </div>
                                 <span className="text-[11px] text-slate-400 font-bold font-mono">
                                   {gen.params?.voice ? `الصوت: ${gen.params.voice}` : "محرك التوليد"}
                                 </span>
                               </div>
                               
                               <div className="flex gap-2.5 w-full mt-2 relative z-10">
                                 <button 
                                   onClick={() => togglePlayVoice(gen.id, gen.result)}
                                   className={cn(
                                     "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border active:scale-95",
                                     playingId === gen.id
                                       ? "bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                                       : "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/15"
                                   )}
                                 >
                                   {playingId === gen.id ? (
                                     <>
                                       <Pause size={14} className="fill-current" /> إيقاف التشغيل
                                     </>
                                   ) : (
                                     <>
                                       <Play size={14} className="fill-current ml-0.5" /> استماع فوري
                                     </>
                                   )}
                                 </button>
                                 
                                 <a
                                   href={gen.result}
                                   download={`voice-${gen.id}.wav`}
                                   className="p-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition-all flex items-center justify-center active:scale-95"
                                   title="تحميل الملف الصوتي"
                                 >
                                   <Download size={14} />
                                 </a>
                               </div>
                             </div>
                         ) : (gen.contentType === 'image' && (gen.result?.startsWith('data:image') || gen.result?.startsWith('http'))) ? (
                             /* Generated Image Display */
                             <div className="w-full aspect-square bg-slate-950 overflow-hidden relative group/img border-b border-slate-850">
                               <img src={gen.result} alt="Generated Asset" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                               <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                 <a 
                                   href={gen.result} 
                                   download={`image-${gen.id}.jpg`} 
                                   className="w-full py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-center text-xs font-bold text-white hover:bg-white hover:text-slate-950 transition-colors flex items-center justify-center gap-1.5"
                                 >
                                   <Download size={14} /> تحميل الصورة
                                 </a>
                               </div>
                             </div>
                         ) : (
                             /* General Text Card */
                             <div className="w-full aspect-square bg-slate-950/40 p-5 flex flex-col justify-between border-b border-slate-800/50">
                               <div className="text-xs text-slate-400 leading-relaxed overflow-hidden text-right line-clamp-6" dir="auto">
                                 {gen.result || "توليد ذكاء اصطناعي فارغ"}
                               </div>
                               <div className="text-[10px] text-slate-500 font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded w-max">
                                 نص / وصف
                               </div>
                             </div>
                         )}
                         
                         {/* Card Footer Info */}
                         <div className="p-4 bg-slate-900/30 text-right">
                           <p className="text-xs font-black text-slate-200 truncate leading-relaxed" dir="auto">
                             {gen.params?.prompt || gen.goal || "توليد ذكي تلقائي"}
                           </p>
                           <p className="text-[9px] text-slate-500 font-bold mt-1.5 flex items-center gap-1 justify-end">
                             {gen.createdAt ? new Date(gen.createdAt.toDate ? gen.createdAt.toDate() : gen.createdAt).toLocaleDateString('ar-EG', {
                               year: 'numeric',
                               month: 'short',
                               day: 'numeric',
                               hour: '2-digit',
                               minute: '2-digit'
                             }) : "الآن"}
                           </p>
                         </div>

                     </div>
                 ))}
             </div>
          )}
       </div>
    </div>
  );
}
