import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Image as ImageIcon, 
  Settings2, 
  Download, 
  RefreshCcw, 
  Layers, 
  Sliders, 
  Cpu, 
  Sun, 
  Video, 
  Loader2, 
  Trash2,
  Copy,
  Check
} from "lucide-react";
import { AIStylesSelect } from "../components/AIStylesSelect";
import { cn } from "../../lib/utils";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db, auth, uploadBase64ToStorage } from '../../lib/firebase';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { toast } from '../../lib/soundToast';

import { AICore } from "../../core/AICore";
import { providerManager } from "../../core/providers/ProviderManager";
import { eventBus } from "../../core/events/EventBus";
import { generateId } from "../../lib/ids";

// دالة مساعدة لضغط الصور وحفظها بحجم مثالي في Firestore (أقصى حد مسموح 1 ميغابايت لمنع أخطاء الحجم)
const compressImageForFirestore = async (base64Url: string, maxWidth = 480, maxHeight = 480, quality = 0.6): Promise<string> => {
  if (!base64Url || !base64Url.startsWith("data:image")) return base64Url;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64Url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // توليد نسخة JPEG خفيفة للغاية (بحجم نحو 40-70 كيلوبايت فقط!)
        resolve(canvas.toDataURL("image/jpeg", quality));
      } else {
        resolve(base64Url);
      }
    };
    img.onerror = () => resolve(base64Url);
  });
};

export function ImageGeneration() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { activeBrand } = useWorkspace();

  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState("");
  const [isImproving, setIsImproving] = useState(false);
  const [copied, setCopied] = useState(false);

  // الخيارات الإضافية المتطورة المدعومة للتحكم الفني
  const [imageQuality, setImageQuality] = useState("extreme"); // standard, extreme
  const [imageModel, setImageModel] = useState("imagen-4.0"); // imagen-4.0, imagen-3.0, flux
  const [lighting, setLighting] = useState("cinematic"); // cinematic, studio, neon, natural, none
  const [cameraShot, setCameraShot] = useState("portrait"); // macro, wide, portrait, auto

  // قائمة التوليدات الأخيرة
  const [recentGens, setRecentGens] = useState<any[]>([]);
  const [loadingGens, setLoadingGens] = useState(false);

  const fetchRecentGenerations = async () => {
    if (!activeBrand) return;
    setLoadingGens(true);
    try {
      const q = query(
        collection(db, "generations"),
        where("brandId", "==", activeBrand.id),
        where("contentType", "==", "image"),
        orderBy("createdAt", "desc"),
        limit(6)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentGens(data);
    } catch (e) {
      console.error("fetchRecentGenerations Error:", e);
    } finally {
      setLoadingGens(false);
    }
  };

  useEffect(() => {
    fetchRecentGenerations();
  }, [activeBrand]);

  useEffect(() => {
    const handleCleared = () => {
      setResult(null);
      setRecentGens([]);
    };
    window.addEventListener('media-assets-cleared', handleCleared);
    return () => {
      window.removeEventListener('media-assets-cleared', handleCleared);
    };
  }, []);

  useEffect(() => {
    try {
      const savedPreset = localStorage.getItem('fluxcore_media_lab_preset');
      if (savedPreset) {
        const { tab, prompt: presetPrompt } = JSON.parse(savedPreset);
        if (tab === 'image' && presetPrompt) {
          setPrompt(presetPrompt);
          localStorage.removeItem('fluxcore_media_lab_preset');
          toast.success("تم نقل التصور البصري بنجاح وتجهيزه للتوليد! 🎨");
        }
      }
    } catch (e) {
      console.error("Error reading media lab preset in image:", e);
    }
  }, []);

  const handleImprovePrompt = async () => {
    if (!prompt) {
       toast.error("يرجى كتابة فكرة مبدئية أولاً");
       return;
    }
    setIsImproving(true);
    toast.info("جاري تحسين الفكرة والتفاصيل...");
    try {
      const config = providerManager.getConfig();
      const res = await fetch("/api/ai/quick-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `أرجو تحسين هذا الوصف ليكون 'Visual Prompt' احترافي باللغة الإنجليزية لتوليد صورة (Image Generation). أريده أن يكون مفصلاً، غنياً، ويصف الإضاءة والجودة، مع مراعاة النمط المختار وهو (${style}). أريد الوصف فقرة واحدة فقط بدون مقدمات وبدون شرح. الوصف الأساسي هو: ${prompt}`,
          action: 'expand',
          provider: config?.provider || 'gemini',
          apiKey: config?.apiKey
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPrompt(data.result);
      toast.success("تم تحسين الفكرة بنجاح!");
    } catch(err:any) {
      toast.error("فشل التحسين: " + err.message);
    } finally {
      setIsImproving(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt || !activeBrand) return;
    setIsGenerating(true);
    setProgress(10);
    setProgressStep("جاري تهيئة خوارزميات التوليد البصري والاتصال بالنموذج...");
    
    eventBus.publish({
       type: 'OPERATIONAL_LIVE_EVENT',
       source: 'MediaLab',
       timestamp: Date.now(),
       payload: {
          id: generateId(),
          type: 'CONTENT_GEN',
          message: `بدء توليد صورة جديدة بنموذج ${imageModel}...`,
          status: 'pending',
          timestamp: Date.now()
       }
    });

    const interval = setInterval(() => {
       setProgress((prev) => {
         if (prev >= 90) return prev;
         const next = prev + 10;
         if (next < 30) setProgressStep("جاري صياغة الـ Golden Prompt وحساب أبعاد الصورة...");
         else if (next < 60) setProgressStep("جاري رصف البكسلات وتطبيق حسابات الإضاءة المحددة...");
         else if (next < 80) setProgressStep("جاري تحسين التفاصيل وتطبيق فيلتر العلوية والنمط البصري...");
         else setProgressStep("جاري تسليم وتوليد الصورة بدقة فائقة...");
         return next;
       });
    }, 1200);

    try {
      // بناء تفاصيل فنية إضافية من الإعدادات الجديدة لدمجها في طلب التوليد
      let additionalPrompts = "";
      if (lighting === "cinematic") additionalPrompts += ", cinematic dramatic lighting, highly contrasted dark backgrounds";
      if (lighting === "studio") additionalPrompts += ", professional studio lighting, soft key light, clear reflections";
      if (lighting === "neon") additionalPrompts += ", glowing neon cyberpunk aesthetic, heavy backlights, synthwave atmosphere";
      if (lighting === "natural") additionalPrompts += ", natural golden hour light, soft ambient sunbeams";

      if (cameraShot === "macro") additionalPrompts += ", extreme macro lens close-up portrait, shallow depth of field, 85mm";
      if (cameraShot === "wide") additionalPrompts += ", ultra-wide-angle cinematic landscape shot, immersive composition";
      if (cameraShot === "portrait") additionalPrompts += ", clean portrait camera angle, detailed capture";

      if (imageQuality === "extreme") additionalPrompts += ", masterpiece quality, ultra-sharp details, high-fidelity 4k render";

      // 1. استدعاء AICore للمساعدة في صقل التفاصيل الفنية وتطبيق الـ Prompt الذهبي
      const gResult = await AICore.generateContent({
        workspaceId: activeBrand.id,
        goal: `Generate a high resolution ${aspectRatio} image in ${style} style: ${prompt}. Config specs: Model: ${imageModel}, Shot: ${cameraShot}, Specs: ${imageQuality}`,
        templateId: 'image_generator',
        params: { 
          prompt: prompt, 
          style, 
          aspectRatio, 
          lighting: lighting === "none" ? "automatic" : lighting, 
          cameraShot: cameraShot === "auto" ? "cinematic rules of composition" : cameraShot 
        },
        type: 'image'
      });

      const enhancedPrompt = `${gResult.content}${additionalPrompts}`;

      // 2. إرسال الطلب إلى الـ API الداخلي
      const config = providerManager.getConfig();
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          aspectRatio,
          provider: config?.provider || "gemini",
          apiKey: config?.apiKey,
          model: imageModel // تمرير الموديل المختار للسيرفر
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate image");
      
      const imageUrl = data.result;

      // تحميل مسبق للصورة في المتصفح لضمان جهوزيتها
      await new Promise((resolve, reject) => {
         const img = new Image();
         img.onload = resolve;
         img.onerror = reject;
         img.src = imageUrl;
      });

      clearInterval(interval);
      setProgress(100);
      setProgressStep("اكتمل معالجة وتوليد الصورة الفنية بنجاح!");

      setResult(imageUrl);
      
      // رفع الصورة المولدة إلى Firebase Storage مع الاحتفاظ بضغط الصور محلياً كبديل احتياطي (Fallback)
      let firestoreImageUrl = imageUrl;
      const genId = generateId();
      const storagePath = `brands/${activeBrand.id}/images/${genId}.jpg`;
      
      try {
        setProgressStep("جاري رفع الصورة إلى التخزين السحابي الآمن...");
        firestoreImageUrl = await uploadBase64ToStorage(imageUrl, storagePath);
      } catch (uploadErr: any) {
        console.error("[IMAGE SYSTEM] Firebase Storage upload failed, falling back to compressed local base64:", uploadErr);
        try {
          firestoreImageUrl = await compressImageForFirestore(imageUrl);
        } catch (compressErr) {
          console.warn("[IMAGE SYSTEM] Failed to compress image for Firestore fallback:", compressErr);
        }
      }
      
      await addDoc(collection(db, 'generations'), {
        brandId: activeBrand.id,
        userId: auth.currentUser?.uid,
        goal: 'Image Generation',
        contentType: 'image',
        params: { prompt, style, aspectRatio, imageModel, imageQuality, lighting, cameraShot },
        result: firestoreImageUrl,
        createdAt: serverTimestamp(),
      });
      
      toast.success("تم التوليد بنجاح!");
      fetchRecentGenerations(); // تحديث القائمة
      
      eventBus.publish({
        type: 'OPERATIONAL_LIVE_EVENT',
        source: 'MediaLab',
        timestamp: Date.now(),
        payload: {
           id: generateId(),
           type: 'CONTENT_GEN',
           message: `اكتمل توليد الصورة وحفظها بنجاح بقاعدة البيانات.`,
           status: 'success',
           timestamp: Date.now()
        }
      });
    } catch(err:any) {
      clearInterval(interval);
      console.error(err);
      toast.error("فشل التوليد: " + err.message);
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
      setTimeout(() => {
        setProgress(0);
        setProgressStep("");
      }, 1000);
    }
  };

  const handleSelectRecent = (gen: any) => {
    if (gen.result) {
      setResult(gen.result);
      if (gen.params) {
        setPrompt(gen.params.prompt || "");
        setStyle(gen.params.style || "realistic");
        setAspectRatio(gen.params.aspectRatio || "1:1");
        setImageModel(gen.params.imageModel || "imagen-4.0");
        setImageQuality(gen.params.imageQuality || "extreme");
        setLighting(gen.params.lighting || "cinematic");
        setCameraShot(gen.params.cameraShot || "portrait");
        toast.info("تمت استعادة معطيات التوليد المحدد للبدء فوراً! 🎨");
      }
    }
  };

  const handleDeleteGen = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا الجيل البصري نهائياً؟")) return;
    toast.info("جاري حذف التوليد البصري...");
    try {
      await deleteDoc(doc(db, "generations", id));
      setRecentGens(prev => prev.filter(item => item.id !== id));
      toast.success("تم حذف التوليد بنجاح.");
    } catch (err: any) {
      toast.error("فشل الحذف: " + err.message);
    }
  };

  const handleCopyPrompt = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success("تم نسخ الفكرة الحالية إلى الحافظة!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 overflow-hidden select-none" dir="rtl">
       
       {/* عمود التحكم الجانبي الأيمن (Sidebar controls) */}
       <div className="w-full lg:w-[380px] bg-slate-900/60 border border-slate-800/80 rounded-[32px] p-5 flex flex-col gap-5 overflow-y-auto max-h-full custom-scrollbar shrink-0 backdrop-blur-md">
          
          <div className="flex flex-col gap-1.5 border-b border-slate-800/60 pb-3">
             <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Settings2 size={16} className="text-indigo-400" /> إعدادات الإخراج الفني
             </h3>
             <p className="text-[10px] text-slate-500 font-bold">تحكم في خيارات المحرك والزاوية والإضاءة المحددة.</p>
          </div>

          {/* حقل الفكرة */}
          <div className="flex flex-col gap-2">
             <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                   <Sparkles size={14} className="text-indigo-400" /> فكرة التصميم (Prompt)
                </span>
             </label>
             <div className="relative">
               <textarea 
                 value={prompt}
                 disabled={isGenerating}
                 onChange={(e) => setPrompt(e.target.value)}
                 placeholder="مثال: رائد فضاء يجلس على سطح المريخ ويشرب القهوة مع إضاءة نيون غنية..."
                 className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none h-28 text-xs leading-relaxed disabled:opacity-50"
                 dir="auto"
               />
               
               <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                 {prompt && (
                   <button 
                     onClick={handleCopyPrompt}
                     className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white p-2 rounded-xl text-xs font-bold transition-all"
                     title="نسخ النص"
                   >
                     {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                   </button>
                 )}
                 <button 
                   onClick={handleImprovePrompt}
                   disabled={isImproving || !prompt || isGenerating}
                   className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white px-3 py-2 rounded-xl text-[10px] font-black transition-all disabled:opacity-50 flex items-center gap-1">
                   {isImproving ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                   <span>تحسين الفكرة بالذكاء</span>
                 </button>
               </div>
             </div>
          </div>

          {/* خيارات التوليد المتطورة */}
          <div className="flex flex-col gap-4 p-4 bg-slate-950/40 rounded-2xl border border-slate-800/80">
             
             {/* خيار 1: محرك التوليد */}
             <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><Cpu size={12} /> محرك التوليد البصري</label>
                <select 
                  value={imageModel} 
                  onChange={(e) => setImageModel(e.target.value)} 
                  disabled={isGenerating}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="imagen-4.0">Imagen 4.0 Pro (فائق الدقة)</option>
                  <option value="imagen-3.0">Imagen 3.0 HD (توليد سريع)</option>
                  <option value="flux">Flux Extreme (واقعية الشخصيات)</option>
                </select>
             </div>

             {/* خيار 2: نوع الإضاءة */}
             <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><Sun size={12} /> التوزيع الضوئي</label>
                <select 
                  value={lighting} 
                  onChange={(e) => setLighting(e.target.value)} 
                  disabled={isGenerating}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="cinematic">سينمائية درامية (Cinematic)</option>
                  <option value="studio">إضاءة استوديو ناعمة (Studio)</option>
                  <option value="neon">نيون وسايبربانك (Neon Cyber)</option>
                  <option value="natural">ضوء طبيعي (Golden Hour)</option>
                  <option value="none">تلقائي (Automatic)</option>
                </select>
             </div>

             {/* خيار 3: لقطة الكاميرا */}
             <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><Video size={12} /> زاوية الكاميرا والعدسة</label>
                <select 
                  value={cameraShot} 
                  onChange={(e) => setCameraShot(e.target.value)} 
                  disabled={isGenerating}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="portrait">بورتريه مركّز (Portrait 85mm)</option>
                  <option value="macro">ماكرو شديد القرب (Macro Close-up)</option>
                  <option value="wide">زاوية واسعة ومحيطية (Wide Landscape)</option>
                  <option value="auto">تأطير تلقائي (Auto Frame)</option>
                </select>
             </div>

             {/* خيار 4: مستوى الجودة */}
             <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1"><Sliders size={12} /> مستوى التفاصيل والوضوح</label>
                <div className="flex bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
                  <button 
                     disabled={isGenerating}
                     onClick={() => setImageQuality("standard")} 
                     className={cn("flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all", imageQuality === "standard" ? "bg-slate-800 text-slate-200" : "text-slate-500")}
                  >إصدار عادٍ</button>
                  <button 
                     disabled={isGenerating}
                     onClick={() => setImageQuality("extreme")} 
                     className={cn("flex-1 text-[10px] font-black py-1.5 rounded-lg transition-all", imageQuality === "extreme" ? "bg-indigo-500 text-white shadow-md shadow-indigo-600/10" : "text-slate-500")}
                  >فائق 4K</button>
                </div>
             </div>

          </div>

          {/* النمط الإبداعي */}
          <div className="flex flex-col gap-2 shrink-0">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">المظهر الإبداعي والنمط البصري (Style)</label>
             <AIStylesSelect selected={style} onChange={setStyle} />
          </div>

          {/* أبعاد الصورة */}
          <div className="flex flex-col gap-2 shrink-0">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">أبعاد الصورة المحسوبة (Ratio)</label>
             <div className="flex gap-2">
                {[
                  { id: "1:1", label: "مربع", icon: "aspect-square" },
                  { id: "16:9", label: "للعرض", icon: "aspect-video" },
                  { id: "9:16", label: "قصة/ريلز", icon: "aspect-[9/16]" },
                ].map(ratio => (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio.id)}
                    disabled={isGenerating}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-2xl border transition-all h-16 disabled:opacity-50",
                      aspectRatio === ratio.id ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900"
                    )}
                  >
                    <div className={cn("border-2 rounded border-current w-5", ratio.icon)}></div>
                    <span className="text-[9px] font-bold">{ratio.id}</span>
                  </button>
                ))}
             </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={!prompt || isGenerating}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 text-white py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-98 mt-auto shrink-0"
          >
            {isGenerating ? (
              <><Loader2 size={14} className="animate-spin" /> جاري هندسة البكسلات...</>
            ) : (
              <><Sparkles size={14} /> توليد صورة إبداعية (10 رصيد)</>
            )}
          </button>

       </div>

       {/* مساحة العمل والعرض اليسرى (Main view space) */}
       <div className="flex-1 flex flex-col gap-6 overflow-y-auto h-full">
          
          {/* مساحة العرض التفاعلية المجهزة للصورة المولدة */}
          <div className="flex-1 bg-slate-900/20 border border-slate-800/80 rounded-[32px] overflow-hidden relative flex flex-col items-center justify-center min-h-[360px] backdrop-blur-sm">
             {isGenerating ? (
                <div className="text-center p-8 flex flex-col items-center gap-4 max-w-md mx-auto">
                   <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 flex items-center justify-center border border-indigo-500/30 mb-2">
                     <Loader2 size={28} className="animate-spin text-indigo-400" />
                   </div>
                   <p className="text-sm font-black text-slate-200">جاري توليد التحفة الفنية بـ {imageModel === "imagen-4.0" ? "Imagen 4.0 Pro" : "Imagen 3.0 HD"}</p>
                   
                   <div className="w-full bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-2 my-2 shadow-inner">
                      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-400">
                         <span className="truncate max-w-[200px] text-right" dir="rtl">{progressStep}</span>
                         <span className="font-mono text-indigo-300">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                         <div 
                           className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-350" 
                           style={{ width: `${progress}%` }}
                         ></div>
                      </div>
                   </div>
                   <p className="text-[10px] text-slate-500 font-medium">نقوم بتصميم الصورة بأبعاد {aspectRatio} وبنمط {style}. يرجى عدم إغلاق النافذة.</p>
                </div>
             ) : result ? (
               <div className="w-full h-full relative group flex items-center justify-center bg-slate-950/80">
                 <img src={result} alt="Generated visual asset" className={cn("w-full h-full object-contain p-4 max-h-[480px]", aspectRatio === '9:16' ? 'max-h-[580px]' : '')} />
                 
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-3 group-hover:translate-y-0">
                    <a 
                      href={result} 
                      download={`fluxcore_generation_${Date.now()}.jpg`}
                      className="bg-slate-950 border border-slate-800 text-slate-200 hover:text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black backdrop-blur-md shadow-2xl transition-all"
                    >
                       <Download size={14} /> تحميل الصورة
                    </a>
                    <button onClick={handleGenerate} className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-white p-2.5 rounded-xl transition-all shadow-2xl" title="إعادة التوليد بقيم جديدة">
                       <RefreshCcw size={14} />
                    </button>
                 </div>
               </div>
             ) : (
               <div className="text-slate-500 flex flex-col items-center gap-3 p-8 text-center">
                 <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-center mb-1">
                    <ImageIcon size={28} className="opacity-30 text-indigo-400" />
                 </div>
                 <p className="font-black text-xs text-slate-400">سيظهر التصميم الفني المولد هنا فور اكتمال صياغته</p>
                 <div className="flex gap-1.5 opacity-40">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce duration-300"></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce duration-500"></div>
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-bounce duration-700"></div>
                 </div>
               </div>
             )}
          </div>

          {/* معرض التوليدات الأخيرة الذكي (Recent Generations Gallery) */}
          <div className="bg-slate-900/10 border border-slate-800/80 rounded-[32px] p-5 shrink-0 flex flex-col gap-3 backdrop-blur-sm">
             <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                   <ImageIcon size={14} className="text-indigo-400" /> أحدث التوليدات البصرية للعلامة التجارية
                </span>
                <span className="text-[9px] text-slate-500 font-mono font-bold">المخزنة سحابياً</span>
             </div>

             {loadingGens ? (
                <div className="h-20 flex items-center justify-center text-[10px] text-slate-500 font-bold gap-2">
                   <Loader2 size={12} className="animate-spin text-indigo-400" /> جاري سحب التوليدات السابقة...
                </div>
             ) : recentGens.length === 0 ? (
                <div className="h-20 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                   لا توجد توليدات سابقة لهذه الهوية حالياً. ابدأ بالتوليد الآن!
                </div>
             ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                   {recentGens.map(gen => (
                      <div 
                        key={gen.id}
                        onClick={() => handleSelectRecent(gen)}
                        className={cn(
                          "aspect-square bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl overflow-hidden cursor-pointer relative group transition-all",
                          result === gen.result ? "border-indigo-500 ring-2 ring-indigo-500/20" : ""
                        )}
                      >
                         <img src={gen.result} alt="Recent gen thumbnail" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200" />
                         
                         {/* تفاصيل وحذف عند التحويم */}
                         <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                            <button
                              onClick={(e) => handleDeleteGen(gen.id, e)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-all border border-rose-500/20"
                              title="حذف هذا التوليد"
                            >
                               <Trash2 size={10} />
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>

       </div>

    </div>
  );
}
