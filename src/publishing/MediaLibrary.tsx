import React, { useState, useEffect, useRef } from "react";
import { UploadCloud, Folder, FileImage, Search, Filter, Loader2, Trash2, ExternalLink } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot, setDoc, doc, serverTimestamp, deleteDoc, orderBy } from "firebase/firestore";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { generateId } from "../lib/ids";
import { toast } from '../lib/soundToast';

interface MediaAsset {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  userId: string;
  brandId: string;
  createdAt: any;
}

export function MediaLibrary() {
  const { activeBrand } = useWorkspace();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    if (!activeBrand || !auth.currentUser) {
      setAssets([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "media_assets"),
      where("brandId", "==", activeBrand.id),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedAssets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MediaAsset, "id">),
      }));
      fetchedAssets = fetchedAssets.sort((a, b) => {
        const tA = a.createdAt?.toMillis?.() || 0;
        const tB = b.createdAt?.toMillis?.() || 0;
        return tB - tA;
      });
      setAssets(fetchedAssets);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeBrand]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBrand || !auth.currentUser) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 2 ميجابايت (لأغراض البث التجريبي)");
      return;
    }

    setUploading(true);
    const id = generateId();

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        await setDoc(doc(db, "media_assets", id), {
          name: file.name,
          type: file.type,
          url: base64,
          size: file.size,
          userId: auth.currentUser!.uid,
          brandId: activeBrand.id,
          createdAt: serverTimestamp(),
        });
        
        toast.success("تم رفع الملف بنجاح");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("فشل رفع الملف: " + error.message);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
     setDeleteConfirmation({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.id) {
       try {
         await deleteDoc(doc(db, "media_assets", deleteConfirmation.id));
         toast.success("تم حذف الملف");
       } catch (err: any) {
         toast.error("فشل الحذف: " + err.message);
       }
    }
    setDeleteConfirmation({ isOpen: false, id: null });
  };

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl shrink-0 gap-4">
        <div className="flex items-center gap-4 w-full md:w-1/2">
          <div className="relative flex-1">
             <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
             <input 
               type="text" 
               placeholder="البحث في مكتبة الوسائط..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2.5 pr-10 pl-4 text-sm outline-none text-slate-200 focus:border-indigo-500/50 transition-all font-sans" 
             />
          </div>
          <button className="p-2.5 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            <Filter size={16} />
          </button>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white px-6 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            {uploading ? (
              <><Loader2 size={16} className="animate-spin" /> جاري الرفع...</>
            ) : (
              <><UploadCloud size={16} /> رفع وسائط جديدة</>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-900/30 border border-slate-800 rounded-[32px] p-6 lg:p-8 overflow-y-auto custom-scrollbar">
        
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
          </div>
        ) : (
          <>
            <h3 className="text-sm font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
              <Folder size={18} className="text-amber-500" /> المجلدات الذكية
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
               {["صور الهوية", "الحملات", "المنتجات", "الأرشيف"].map(folder => (
                 <div key={folder} className="p-4 bg-slate-900/50 border border-slate-800/50 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 hover:border-indigo-500/30 transition-all group">
                   <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                     <Folder size={20} className="text-amber-500" />
                   </div>
                   <span className="font-bold text-xs text-slate-300">{folder}</span>
                 </div>
               ))}
            </div>

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileImage size={18} className="text-indigo-500" /> جميع الوسائط المستخرجة
              </h3>
              <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-1 rounded-full font-bold">
                {filteredAssets.length} ملف
              </span>
            </div>
            
            {filteredAssets.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center gap-4 opacity-40">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
                   <FileImage size={32} className="text-slate-600" />
                </div>
                <p className="text-sm font-bold text-slate-500">لا توجد وسائط حالياً. ابدأ برفع أول ملف لك.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                 {filteredAssets.map((asset) => (
                   <div key={asset.id} className="group flex flex-col gap-3">
                     <div className="aspect-square bg-slate-800 rounded-[24px] border border-slate-700 overflow-hidden relative shadow-lg shadow-black/20 group-hover:border-indigo-500/50 transition-all">
                       <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                       
                       <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleDelete(asset.id)}
                              className="p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg backdrop-blur-md border border-red-500/30 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="flex flex-col gap-1">
                             <span className="text-[10px] font-black text-white truncate">{asset.name}</span>
                             <span className="text-[8px] font-bold text-slate-400">{formatSize(asset.size)}</span>
                          </div>
                       </div>

                       <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <a 
                           href={asset.url} 
                           target="_blank" 
                           rel="noreferrer"
                           className="p-2 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-lg backdrop-blur-md border border-indigo-500/30 transition-all block"
                         >
                            <ExternalLink size={14} />
                         </a>
                       </div>
                     </div>
                     <span className="text-[10px] text-slate-500 font-bold px-1 truncate text-center">{asset.name}</span>
                   </div>
                 ))}
              </div>
            )}
          </>
        )}

      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        title="تأكيد حذف الملف"
        message="هل أنت متأكد من حذف هذا الملف نهائياً؟ قد يؤثر ذلك على المنشورات المرتبطة."
        confirmText="حذف الملف"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, id: null })}
      />
      </div>
    </div>
  );
}

