import React, { useEffect, useState } from "react";
import { X, Clock, Trash2, Loader2, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export function HistoryView({
  onSelect,
  onClose,
}: {
  onSelect: (saved: any) => void;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    const load = async () => {
      try {
        const { db, auth } = await import("../lib/firebase");
        const { collection, query, where, orderBy, limit, onSnapshot } =
          await import("firebase/firestore");
        const q = query(
          collection(db, "generations"),
          where("userId", "==", auth.currentUser?.uid || ""),
          orderBy("createdAt", "desc"),
          limit(50),
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          setHistory(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          );
          setLoading(false);
        }, (error) => {
          console.error("History onSnapshot error:", error);
          setLoading(false);
        });
      } catch (err) {
        console.error("Failed to load history", err);
        setLoading(false);
      }
    };
    load();
    return () => unsubscribe();
  }, []);

  const deleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const { db } = await import("../lib/firebase");
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "generations", id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800/50 w-80">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 sticky top-0 z-10">
        <h3 className="font-bold flex items-center gap-2">
          <Clock size={16} className="text-slate-400" /> السجل
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded-md text-slate-500 hover:text-slate-300"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-8 text-slate-600">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center p-8 text-slate-500 text-sm">
            لا توجد عمليات توليد سابقة.
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className="p-3 bg-slate-950/20 hover:bg-slate-800 rounded-xl cursor-pointer group transition-colors border border-transparent hover:border-slate-700 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                  {item.contentType}
                </span>
                <span className="text-[10px] text-slate-500">
                  {item.createdAt
                    ? formatDistanceToNow(item.createdAt.toDate(), {
                        addSuffix: true,
                        locale: ar,
                      })
                    : "الآن"}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-300 line-clamp-2 leading-relaxed">
                {item.idea}
              </p>

              <button
                onClick={(e) => deleteItem(e, item.id)}
                className="absolute left-2 bottom-2 p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
