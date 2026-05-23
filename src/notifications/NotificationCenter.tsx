import React, { useState, useEffect } from 'react';
import { Bell, Check, Info, AlertTriangle, XCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { onSnapshot } from 'firebase/firestore';
import { notificationService, type Notification } from '../services/notification';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from '../lib/soundToast';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  useEffect(() => {
    const q = notificationService.getNotificationsQuery();
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }, (error) => {
      console.error(error);
    });
    return () => unsub();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead(notifications);
      toast.success("تم تحديد الكل كمقروء");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleClearAll = async () => {
     setDeleteConfirmation(true);
  };

  const confirmClearAll = async () => {
    try {
      await Promise.all(notifications.map(n => notificationService.delete(n.id)));
      toast.success("تم مسح التنبيهات");
    } catch(err: any) {
      toast.error(err.message);
    }
    setDeleteConfirmation(false);
  };

  return (
    <div className="relative pointer-events-auto">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-slate-900 border border-slate-800 rounded-full hover:bg-slate-800 transition-colors"
      >
        <Bell size={20} className={unreadCount > 0 ? "text-indigo-400" : "text-slate-400"} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-950">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 mt-4 w-80 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
              style={{ maxHeight: 'min(500px, 80vh)' }}
            >
              <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                <h3 className="font-black text-white">التنبيهات</h3>
                <div className="flex gap-2">
                   <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-slate-500 hover:text-indigo-400 transition-colors" title="تحديد الكل كمقروء">
                     تحديد الكل
                   </button>
                   <button onClick={handleClearAll} className="text-[10px] font-bold text-slate-500 hover:text-rose-400 transition-colors" title="مسح الكل">
                     <Trash2 size={12}/>
                   </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-600">
                       <Bell size={24} />
                    </div>
                    <p className="text-xs text-slate-500 font-bold">لا يوجد تنبيهات حالياً</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/50">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={cn(
                          "p-4 hover:bg-slate-800/30 transition-colors cursor-pointer relative group",
                          !n.read && "bg-indigo-500/[0.02]"
                        )}
                        onClick={() => !n.read && notificationService.markAsRead(n.id)}
                      >
                        {!n.read && <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                        <div className="flex gap-3">
                          <div className={cn(
                             "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center",
                             n.type === 'success' ? "bg-emerald-500/10 text-emerald-500" :
                             n.type === 'error' ? "bg-rose-500/10 text-rose-500" :
                             n.type === 'warning' ? "bg-amber-500/10 text-amber-500" :
                             "bg-indigo-500/10 text-indigo-400"
                          )}>
                             {n.type === 'success' && <CheckCircle2 size={20}/>}
                             {n.type === 'error' && <XCircle size={20}/>}
                             {n.type === 'warning' && <AlertTriangle size={20}/>}
                             {n.type === 'info' && <Info size={20}/>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{n.title}</h4>
                            <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-600 mt-2 block font-medium">
                               {n.createdAt ? formatDistanceToNow(n.createdAt.toDate?.() || new Date(n.createdAt), { addSuffix: true, locale: ar }) : 'الآن'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-slate-950/80 text-center border-t border-slate-800">
                 <button onClick={() => setIsOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">إغلاق</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={deleteConfirmation}
        title="تأكيد مسح التنبيهات"
        message="هل تريد مسح جميع التنبيهات؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="مسح الكل"
        onConfirm={confirmClearAll}
        onCancel={() => setDeleteConfirmation(false)}
      />
    </div>
  );
}
