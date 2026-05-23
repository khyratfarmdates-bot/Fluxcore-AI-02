import React, { useState, useEffect, useRef } from "react";
import { 
  Boxes, 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Folder, 
  Trash2, 
  Download, 
  Play, 
  Pause, 
  Volume2, 
  Music,
  Loader2,
  AlertTriangle,
  FileDown,
  Sliders,
  RotateCw,
  X,
  Check
} from "lucide-react";
import { db, auth } from "../../lib/firebase";
import { collection, query, where, getDocs, setDoc, deleteDoc, doc, orderBy, serverTimestamp } from "firebase/firestore";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

export function MediaAssets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'audio' | 'video'>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { activeBrand } = useWorkspace();

  // States for Image Editor Modal
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editFilter, setEditFilter] = useState<'none' | 'grayscale' | 'sepia' | 'neon' | 'warm' | 'cool' | 'blur'>('none');
  const [editRotation, setEditRotation] = useState<0 | 90 | 180 | 270>(0);
  const [editFlipH, setEditFlipH] = useState(false);
  const [editFlipV, setEditFlipV] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleOpenEditor = (asset: any) => {
    setEditingAsset(asset);
    setEditName(asset.name || "صورة_معدلة.jpg");
    setEditFilter('none');
    setEditRotation(0);
    setEditFlipH(false);
    setEditFlipV(false);
  };

  const handleRotate = () => {
    setEditRotation(prev => {
      if (prev === 0) return 90;
      if (prev === 90) return 180;
      if (prev === 180) return 270;
      return 0;
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAsset) return;
    setIsSavingEdit(true);
    toast.info("جاري معالجة التعديلات وتطبيق الفلاتر البصرية...");

    try {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = editingAsset.url;

      await new Promise<void>((resolve, reject) => {
        image.onload = async () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("فشل الحصول على سياق الرسم 2D"));
              return;
            }

            const is90or270 = editRotation === 90 || editRotation === 270;
            const origW = image.naturalWidth || image.width;
            const origH = image.naturalHeight || image.height;
            const width = is90or270 ? origH : origW;
            const height = is90or270 ? origW : origH;

            // Cap resolution to preserve high quality but stay within size limits
            const maxDim = 800;
            let scale = 1;
            if (Math.max(width, height) > maxDim) {
              scale = maxDim / Math.max(width, height);
            }

            const finalWidth = Math.round(width * scale);
            const finalHeight = Math.round(height * scale);

            canvas.width = finalWidth;
            canvas.height = finalHeight;

            // Translate origin to center
            ctx.translate(finalWidth / 2, finalHeight / 2);

            // Apply flip scale
            const scaleX = editFlipH ? -1 : 1;
            const scaleY = editFlipV ? -1 : 1;
            ctx.scale(scaleX, scaleY);

            // Apply rotation
            ctx.rotate((editRotation * Math.PI) / 180);

            // Apply canvas visual filters
            let canvasFilter = "none";
            if (editFilter === "grayscale") canvasFilter = "grayscale(100%)";
            else if (editFilter === "sepia") canvasFilter = "sepia(100%)";
            else if (editFilter === "neon") canvasFilter = "contrast(120%) saturate(180%) hue-rotate(300deg)";
            else if (editFilter === "warm") canvasFilter = "sepia(30%) saturate(130%) brightness(110%) hue-rotate(10deg)";
            else if (editFilter === "cool") canvasFilter = "saturate(90%) brightness(105%) hue-rotate(190deg) sepia(10%)";
            else if (editFilter === "blur") canvasFilter = "blur(4px)";
            
            ctx.filter = canvasFilter;

            // Draw image centered at origin
            const drawW = is90or270 ? finalHeight : finalWidth;
            const drawH = is90or270 ? finalWidth : finalHeight;
            ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);

            // Compress to standard JPEG to stay safely within Firestore 1MB limits
            const quality = 0.75;
            const compressedBase64 = canvas.toDataURL("image/jpeg", quality);

            toast.info("جاري تحديث قاعدة البيانات الرقمية السحابية...");

            // Update Firestore document with updated image and updated name
            await setDoc(doc(db, "media_assets", editingAsset.id), {
              ...editingAsset,
              name: editName,
              url: compressedBase64,
              size: Math.round(compressedBase64.length * 0.75), // approximate size in bytes
              updatedAt: serverTimestamp()
            }, { merge: true });

            toast.success("تم تعديل وحفظ الصورة بنجاح! ✨");
            
            // Update local state directly
            setAssets(prev => prev.map(item => {
              if (item.id === editingAsset.id) {
                return {
                  ...item,
                  name: editName,
                  url: compressedBase64,
                  size: Math.round(compressedBase64.length * 0.75)
                };
              }
              return item;
            }));

            setEditingAsset(null);
            resolve();
          } catch (e) {
            reject(e);
          }
        };
        image.onerror = (e) => {
          reject(new Error("فشل تحميل الصورة المصدر للمعالجة."));
        };
      });
    } catch (err: any) {
      console.error("Save Edit Error:", err);
      toast.error("فشل تعديل وحفظ الصورة: " + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const fetchAssets = async () => {
    if (!auth.currentUser || !activeBrand) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "media_assets"),
        where("brandId", "==", activeBrand.id),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssets(data);
    } catch (e) {
      console.error("fetchAssets Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [activeBrand]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser || !activeBrand) return;

    // Check size limit (Firestore limits doc to 1MB, so let's limit Base64 converted file to 900KB)
    const MAX_SIZE = 900 * 1024; // 900KB
    if (file.size > MAX_SIZE) {
      toast.error(
        `حجم الملف كبير جداً (${(file.size / 1024 / 1024).toFixed(2)}MB). الحد الأقصى المسموح به هو 900KB لضمان الأداء السحابي الفائق. يرجى ضغط الملف أو اختيار ملف أصغر.`,
        { duration: 6000 }
      );
      return;
    }

    setIsUploading(true);
    toast.info("جاري تهيئة الملف وترميزه بنظام Base64...");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        
        // Detect Type
        let detectedType: 'image' | 'audio' | 'video' = 'image';
        if (file.type.startsWith('audio/')) {
          detectedType = 'audio';
        } else if (file.type.startsWith('video/')) {
          detectedType = 'video';
        }

        // Compliant Asset ID matching validation `^[a-zA-Z0-9_\-]+$`
        const cleanNamePart = file.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        const assetId = `asset_${Date.now()}_${cleanNamePart}_${Math.random().toString(36).substring(2, 6)}`;

        toast.info("جاري الرفع والحفظ في مكتبة الأصول السحابية...");

        // Save doc
        await setDoc(doc(db, "media_assets", assetId), {
          brandId: activeBrand.id,
          userId: auth.currentUser.uid,
          name: file.name,
          type: detectedType,
          url: base64Data,
          size: file.size,
          createdAt: serverTimestamp()
        });

        toast.success("تم رفع وحفظ الأصل بنجاح في مكتبتك الرقمية! 🎉");
        fetchAssets();
      };
      reader.onerror = () => {
        throw new Error("فشل قراءة وترميز ملف الأصول المحلي.");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("حدث خطأ أثناء رفع الأصل: " + err.message);
    } finally {
      setIsUploading(false);
      // Reset input value to allow uploading same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا الأصل نهائياً من مكتبتك؟")) return;
    
    toast.info("جاري حذف الأصل...");
    try {
      await deleteDoc(doc(db, "media_assets", assetId));
      toast.success("تم حذف الأصل بنجاح.");
      
      // Stop playing if deleted active audio
      if (playingId === assetId) {
        if (audioRef.current) audioRef.current.pause();
        setPlayingId(null);
      }

      setAssets(prev => prev.filter(item => item.id !== assetId));
    } catch (e: any) {
      toast.error("فشل الحذف: " + e.message);
    }
  };

  const togglePlayAudio = (id: string, base64Url: string) => {
    if (playingId === id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(base64Url);
      audioRef.current = audio;
      setPlayingId(id);
      audio.play().catch(e => {
        console.error("Playback error:", e);
        toast.error("عذراً، فشل تشغيل هذا الملف الصوتي.");
        setPlayingId(null);
      });
      audio.onended = () => {
        setPlayingId(null);
      };
    }
  };

  // Helper to format file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter list
  const filteredAssets = assets.filter(item => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  return (
    <div className="flex flex-col h-full gap-6">
       
       {/* Input file helper */}
       <input 
         type="file" 
         ref={fileInputRef} 
         onChange={handleFileChange}
         accept="image/*,audio/*,video/*"
         className="hidden" 
       />

       {/* Header */}
       <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
         <div className="text-right w-full sm:w-auto">
            <h2 className="text-xl font-black text-white flex items-center justify-end sm:justify-start gap-2 mb-1">
              <Boxes className="text-indigo-400" size={20} /> إدارة الأصول والوسائط
            </h2>
            <p className="text-sm font-medium text-slate-400">مكتبتك الرقمية المركزية لرفع وتنظيم الصور والشعارات والصوتيات والوسائط الترويجية.</p>
         </div>
         
         <button 
           disabled={isUploading}
           onClick={handleUploadClick}
           className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/15"
         >
           {isUploading ? (
             <>
               <Loader2 size={16} className="animate-spin" /> جاري الحفظ...
             </>
           ) : (
             <>
               <Upload size={16} /> رفع أصل جديد
             </>
           )}
         </button>
       </div>

       {/* Main Workspace Layout */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 overflow-hidden pb-10">
          
          {/* Categories Sidebar */}
          <div className="col-span-1 border border-slate-800 bg-slate-900/40 rounded-[32px] p-4 flex flex-col gap-2 backdrop-blur-sm h-fit">
             <div className="text-xs font-black text-slate-500 uppercase tracking-widest px-3 mb-2 text-right">أقسام المكتبة</div>
             
             <button 
               onClick={() => setFilterType('all')}
               className={cn(
                 "flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all w-full",
                 filterType === 'all' 
                   ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                   : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
               )}
             >
               <Folder size={18} className={filterType === 'all' ? "text-white" : "text-indigo-400"} />
               <span className="flex-1 text-right mr-3">كل الأصول</span>
             </button>
             
             <button 
               onClick={() => setFilterType('image')}
               className={cn(
                 "flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all w-full",
                 filterType === 'image' 
                   ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                   : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
               )}
             >
               <ImageIcon size={18} className={filterType === 'image' ? "text-white" : "text-indigo-400"} />
               <span className="flex-1 text-right mr-3">الصور والتصاميم</span>
             </button>
             
             <button 
               onClick={() => setFilterType('audio')}
               className={cn(
                 "flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all w-full",
                 filterType === 'audio' 
                   ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                   : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
               )}
             >
               <Music size={18} className={filterType === 'audio' ? "text-white" : "text-indigo-400"} />
               <span className="flex-1 text-right mr-3">الملفات الصوتية</span>
             </button>
             
             <button 
               onClick={() => setFilterType('video')}
               className={cn(
                 "flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all w-full",
                 filterType === 'video' 
                   ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                   : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
               )}
             >
               <Video size={18} className={filterType === 'video' ? "text-white" : "text-indigo-400"} />
               <span className="flex-1 text-right mr-3">مقاطع الفيديو</span>
             </button>
          </div>

          {/* Media Grid Content */}
          <div className="col-span-1 md:col-span-3 border border-slate-800 bg-slate-900/30 rounded-[32px] p-6 flex flex-col overflow-y-auto custom-scrollbar">
             
             {loading ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 py-10 font-bold gap-2">
                   <Loader2 size={18} className="animate-spin text-indigo-400" /> جاري تحميل المكتبة...
                </div>
             ) : filteredAssets.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-16">
                   <Boxes size={56} className="opacity-10 mb-4 text-indigo-400" />
                   <p className="font-black text-slate-300">مكتبة العناصر فارغة حالياً في هذا القسم</p>
                   <p className="text-xs text-slate-600 mt-1 max-w-sm">قم برفع الصور أو المستندات الصوتية مباشرة للوصول السريع ومشاركتها مع موديولات الذكاء الاصطناعي.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                   {filteredAssets.map(asset => (
                      <div 
                        key={asset.id} 
                        className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden group hover:border-slate-700 transition-all flex flex-col justify-between"
                      >
                         
                         {/* Thumbnail Render based on Asset Type */}
                         {asset.type === 'image' ? (
                            <div className="w-full aspect-video bg-slate-900 relative overflow-hidden flex items-center justify-center">
                               <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                            </div>
                         ) : asset.type === 'audio' ? (
                            <div className="w-full aspect-video bg-slate-900/60 flex flex-col items-center justify-center gap-2 p-4 relative border-b border-slate-800/40">
                               <div className={cn(
                                 "w-12 h-12 rounded-xl flex items-center justify-center border transition-all shadow-inner",
                                 playingId === asset.id
                                   ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 scale-105"
                                   : "bg-slate-950 border-slate-800 text-indigo-400"
                               )}>
                                 <Volume2 size={22} className={playingId === asset.id ? "animate-pulse" : ""} />
                               </div>
                               <button 
                                 onClick={() => togglePlayAudio(asset.id, asset.url)}
                                 className={cn(
                                   "absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2 text-xs font-bold border-b border-slate-850",
                                   playingId === asset.id ? "opacity-100 bg-slate-950/50" : ""
                                 )}
                               >
                                 {playingId === asset.id ? (
                                    <span className="flex items-center gap-1.5 bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg border border-rose-500/30"><Pause size={12} fill="currentColor" /> إيقاف الصوت</span>
                                 ) : (
                                    <span className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg border border-indigo-500 hover:bg-indigo-500"><Play size={12} fill="currentColor" /> استماع</span>
                                 )}
                               </button>
                            </div>
                         ) : (
                            /* Video Render fallback/thumbnail */
                            <div className="w-full aspect-video bg-slate-900 relative overflow-hidden flex flex-col items-center justify-center gap-2 border-b border-slate-800/40">
                               {asset.url.startsWith('data:video') ? (
                                  <video src={asset.url} controls className="w-full h-full object-cover" />
                               ) : (
                                  <>
                                    <Video size={36} className="text-slate-600" />
                                    <span className="text-[10px] text-slate-500 font-bold">معاينة الفيديو غير متاحة</span>
                                  </>
                               )}
                            </div>
                         )}

                         {/* Details & Actions Footer */}
                         <div className="p-4 bg-slate-950 space-y-3">
                            <div className="text-right">
                               <p className="text-xs font-black text-slate-200 truncate leading-relaxed" title={asset.name} dir="ltr">
                                 {asset.name}
                               </p>
                               <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-mono font-bold">
                                  <span>{formatBytes(asset.size || 0)}</span>
                                  <span className="bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded text-[9px] text-slate-400 uppercase tracking-widest">
                                    {asset.type}
                                  </span>
                               </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2 border-t border-slate-800/60 pt-2.5">
                               <button 
                                 onClick={() => handleDeleteAsset(asset.id)}
                                 className="p-2 bg-slate-900/60 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 rounded-xl transition-all flex items-center justify-center active:scale-95"
                                 title="حذف الأصل"
                               >
                                 <Trash2 size={13} />
                               </button>
                               
                               {asset.type === 'image' && (
                                 <button 
                                   onClick={() => handleOpenEditor(asset)}
                                   className="p-2 bg-slate-900/60 hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400 border border-slate-800 hover:border-indigo-500/20 rounded-xl transition-all flex items-center justify-center active:scale-95"
                                   title="تعديل وتجميل الصورة"
                                 >
                                   <Sliders size={13} />
                                 </button>
                               )}
                               
                               <a 
                                 href={asset.url}
                                 download={asset.name}
                                 className="flex-1 bg-slate-900/80 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800/80 hover:border-slate-700 rounded-xl text-center text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 py-2 active:scale-95"
                               >
                                 <FileDown size={13} /> تحميل الملف
                               </a>
                            </div>
                         </div>

                      </div>
                   ))}
                </div>
             )}

           </div>
           
        </div>

       {/* Modal for Image Editing */}
       {editingAsset && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all">
           <div className="bg-slate-900/90 border border-slate-800 rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
                 <button 
                   onClick={() => setEditingAsset(null)}
                   className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"
                 >
                   <X size={20} />
                 </button>
                 <h3 className="text-lg font-black text-white flex items-center gap-2">
                   <Sliders className="text-indigo-400" size={18} /> تعديل وتجميل الصورة الرقمية
                 </h3>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                 
                 {/* Visual Preview */}
                 <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden aspect-square md:aspect-auto md:h-full min-h-[300px]">
                    <div className="absolute inset-2 flex items-center justify-center">
                       <img 
                         src={editingAsset.url} 
                         alt="Preview" 
                         className="max-w-full max-h-full object-contain rounded-lg shadow-lg transition-all duration-200"
                         style={{
                           filter: 
                             editFilter === 'grayscale' ? 'grayscale(1)' :
                             editFilter === 'sepia' ? 'sepia(1)' :
                             editFilter === 'neon' ? 'contrast(1.2) saturate(1.8) hue-rotate(300deg)' :
                             editFilter === 'warm' ? 'sepia(0.3) saturate(1.3) brightness(1.1) hue-rotate(10deg)' :
                             editFilter === 'cool' ? 'saturate(0.9) brightness(1.05) hue-rotate(190deg) sepia(0.1)' :
                             editFilter === 'blur' ? 'blur(2px)' : 'none',
                           transform: `rotate(${editRotation}deg) scaleX(${editFlipH ? -1 : 1}) scaleY(${editFlipV ? -1 : 1})`
                         }}
                       />
                    </div>
                 </div>

                 {/* Editing Controls */}
                 <div className="flex flex-col gap-5 text-right justify-between">
                    <div className="space-y-5">
                       {/* Name Editing */}
                       <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 block">اسم الملف</label>
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-indigo-500 focus:outline-none transition-all text-right"
                            dir="ltr"
                          />
                       </div>

                       {/* Transformations */}
                       <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 block">التحويرات الهندسية</label>
                          <div className="grid grid-cols-3 gap-2">
                             <button 
                               onClick={() => setEditFlipV(prev => !prev)}
                               className={cn(
                                 "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5 font-bold text-xs",
                                 editFlipV 
                                   ? "bg-indigo-600/10 border-indigo-500 text-indigo-400" 
                                   : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                               )}
                             >
                                <span className="text-[10px]">انعكاس رأسي</span>
                             </button>

                             <button 
                               onClick={() => setEditFlipH(prev => !prev)}
                               className={cn(
                                 "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5 font-bold text-xs",
                                 editFlipH 
                                   ? "bg-indigo-600/10 border-indigo-500 text-indigo-400" 
                                   : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                               )}
                             >
                                <span className="text-[10px]">انعكاس أفقي</span>
                             </button>

                             <button 
                               onClick={handleRotate}
                               className="flex flex-col items-center justify-center p-3 rounded-xl border bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 transition-all gap-1.5 font-bold text-xs"
                             >
                                <RotateCw size={14} className="text-indigo-400" />
                                <span className="text-[10px]">تدوير 90°</span>
                             </button>
                          </div>
                       </div>

                       {/* Visual Filters */}
                       <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 block">الفلاتر واللمسات البصرية</label>
                          <div className="grid grid-cols-2 gap-2">
                             {[
                               { id: 'none', name: 'الأصلي' },
                               { id: 'grayscale', name: 'أحادي رمادي' },
                               { id: 'sepia', name: 'عتيق كلاسيكي' },
                               { id: 'neon', name: 'سايبر نيون' },
                               { id: 'warm', name: 'إشراقة دافئة' },
                               { id: 'cool', name: 'استوديو بارد' },
                               { id: 'blur', name: 'تنعيم خلفي' },
                             ].map((filt) => (
                               <button 
                                 key={filt.id}
                                 onClick={() => setEditFilter(filt.id as any)}
                                 className={cn(
                                   "py-2.5 px-4 rounded-xl border text-xs font-bold text-center transition-all",
                                   editFilter === filt.id
                                     ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10"
                                     : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                                 )}
                               >
                                 {filt.name}
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 border-t border-slate-800/60 pt-4 shrink-0">
                       <button 
                         onClick={() => setEditingAsset(null)}
                         className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 text-center"
                       >
                         إلغاء
                       </button>
                       <button 
                         disabled={isSavingEdit}
                         onClick={handleSaveEdit}
                         className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/15"
                       >
                         {isSavingEdit ? (
                           <>
                             <Loader2 size={16} className="animate-spin" /> جاري الحفظ...
                           </>
                         ) : (
                           <>
                             <Check size={16} /> حفظ التعديلات
                           </>
                         )}
                       </button>
                    </div>

                 </div>

              </div>

           </div>
         </div>
       )}
    </div>
  );
}
