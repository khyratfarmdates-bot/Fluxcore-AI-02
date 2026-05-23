import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Filter, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useWorkspace } from '../contexts/WorkspaceContext';

export function CalendarView() {
  const [view, setView] = useState<"month" | "week">("month");
  const [events, setEvents] = useState<any[]>([]);
  const { activeBrand } = useWorkspace();
  
  useEffect(() => {
    if (!activeBrand || !auth.currentUser) return;
    const q = query(
      collection(db, 'publishing_queue'), 
      where('brandId', '==', activeBrand.id),
      where('userId', '==', auth.currentUser.uid)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(doc => {
        const item = doc.data();
        if (item.scheduledTime) {
          const jsDate = item.scheduledTime.toDate?.() || new Date(item.scheduledTime);
          data.push({ 
            id: doc.id, 
            date: jsDate.getDate(), 
            month: jsDate.getMonth(),
            title: item.content?.substring(0, 30) + '...',
            platform: item.platform,
            time: jsDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            status: item.status
          });
        }
      });
      setEvents(data);
    });
    
    return () => unsub();
  }, [activeBrand]);

  // Dummy calendar grid generation
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full gap-4 pb-4">
      <div className="flex justify-between items-center bg-slate-900/50 border border-slate-800 p-4 rounded-2xl shrink-0">
        <div className="flex items-center gap-4">
           <h2 className="text-xl font-bold text-white">الشهر الحالي</h2>
           <div className="flex bg-slate-950 rounded-xl border border-slate-800 p-0.5">
             <button onClick={() => setView("month")} className={cn("px-3 py-1 text-xs font-bold rounded-lg transition-colors", view === "month" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300")}>شهري</button>
             <button onClick={() => setView("week")} className={cn("px-3 py-1 text-xs font-bold rounded-lg transition-colors", view === "week" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300")}>أسبوعي</button>
           </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 border border-slate-700 bg-slate-800 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors">
            <ChevronRight size={18} />
          </button>
          <button className="p-2 border border-slate-700 bg-slate-800 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors">
             <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden flex flex-col min-h-0">
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900 shrink-0">
          {["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map(d => (
            <div key={d} className="p-3 text-center text-xs font-bold text-slate-400 border-l border-slate-800/50 last:border-0">{d}</div>
          ))}
        </div>
        
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto custom-scrollbar">
          {days.map(day => {
            const dayEvents = events.filter(e => e.date === day);
            const isToday = day === new Date().getDate();
            
            return (
              <div key={day} className="border-b border-l border-slate-800/50 p-2 min-h-[100px] flex flex-col gap-1 group relative transition-colors hover:bg-slate-800/20">
                <div className="flex justify-between items-start">
                   <span className={cn("text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full", isToday ? "bg-indigo-600 text-white" : "text-slate-500")}>
                     {day}
                   </span>
                   <button className="opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-indigo-300 transition-opacity">
                     <Plus size={14}/>
                   </button>
                </div>
                
                <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-1 mt-1 no-scrollbar">
                  {dayEvents.map(ev => (
                    <div key={ev.id} className={cn(
                      "text-[10px] p-1.5 rounded-md truncate font-medium border-l-2 cursor-pointer hover:opacity-80 transition-opacity",
                      ev.status === 'published' ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" :
                      (ev.status === 'scheduled' || ev.status === 'queued') ? "bg-indigo-500/10 border-indigo-500 text-indigo-400" :
                      ev.status === 'failed' ? "bg-rose-500/10 border-rose-500 text-rose-400" :
                      "bg-slate-800 border-slate-600 text-slate-300"
                    )}>
                      {ev.time} - {ev.platform}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
