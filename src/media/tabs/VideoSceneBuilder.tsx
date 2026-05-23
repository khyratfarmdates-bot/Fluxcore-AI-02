import React, { useState, useRef } from "react";
import { Film, Plus, Play, Sparkles, Image as ImageIcon, Settings2, Trash2, RefreshCcw, Upload, FileVideo, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { providerManager } from "../../core/providers/ProviderManager";

export function VideoSceneBuilder() {
  const [scenes, setScenes] = useState<{id: number, prompt: string, duration: string, generated: boolean, url?: string}[]>([]);
  const [sourceVideo, setSourceVideo] = useState<{ url: string, name: string, base64: string | null } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isGeneratingScene, setIsGeneratingScene] = useState<number | null>(null);
  const [videoStyle, setVideoStyle] = useState("cinematic");
  const [videoRatio, setVideoRatio] = useState("16:9");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractFrame = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.onloadeddata = () => {
         video.currentTime = Math.min(2, video.duration / 2 || 1); 
      };
      video.onseeked = () => {
         const canvas = document.createElement('canvas');
         canvas.width = 480; 
         canvas.height = (480 / video.videoWidth) * video.videoHeight;
         const ctx = canvas.getContext('2d');
         ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
         resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      video.onerror = (e) => reject("تعذر استخراج إطار من الفيديو");
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
       toast.info("جاري تحليل ومعالجة الفيديو...");
       const url = URL.createObjectURL(file);
       try {
         const base64 = await extractFrame(file);
         setSourceVideo({ url, name: file.name, base64 });
         toast.success("تم رفع الفيديو وجاهز للتحليل");
       } catch (err) {
         setSourceVideo({ url, name: file.name, base64: null });
         toast.error("تم رفع الفيديو لكن تعذر استخراج الصورة للمعاينة.");
       }
    }
  };

  const handleGenerateScenes = async () => {
    if (!sourceVideo && scenes.length === 0) {
       toast.error("يرجى رفع فيديو مرجعي أو كتابة مقترح للبدء.");
       return;
    }
    
    setIsProcessing(true);
    try {
      const config = providerManager.getConfig();
      const res = await fetch("/api/ai/video/generate-scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           prompt: "تحليل وتوليد من الفيديو المرفوع لتوفير مشاهد مثيرة", 
           videoData: sourceVideo?.base64,
           apiKey: config?.apiKey,
           provider: config?.provider
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      const baseId = Date.now() + Math.floor(Math.random() * 1000000);
      const newScenes = data.scenes.map((s: any, i: number) => ({
         id: baseId + i + Math.floor(Math.random() * 1000),
         prompt: s.prompt,
         duration: s.duration || "5s",
         generated: false
      }));
      
      setScenes(prev => [...prev, ...newScenes]);
      toast.success("تم استخراج المشاهد بنجاح باستخدام الذكاء الاصطناعي!");
    } catch (err: any) {
      toast.error(err.message || "فشل في توليد المشاهد");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRender = async () => {
    if (scenes.length === 0) return;
    setIsRendering(true);
    toast.info("جاري بدء عملية الدمج. ستستغرق العملية بضع دقائق...");
    try {
      const res = await fetch("/api/ai/video/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenes })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message || "تم إنشاء مهمة الدمج");
    } catch (e: any) {
      toast.error("حدث خطأ أثناء الدمج");
    } finally {
      setTimeout(() => setIsRendering(false), 3000);
    }
  };

  const generateSceneMedia = async (sceneId: number, prompt: string) => {
      if (!prompt) {
          toast.error("يرجى كتابة مقترح للمشهد أولاً");
          return;
      }
      setIsGeneratingScene(sceneId);
      
      let aspectRatio = "16:9";
      if (videoRatio === "9:16") aspectRatio = "9:16";
      if (videoRatio === "1:1") aspectRatio = "1:1";

      const enhancedPrompt = `${prompt}, ${videoStyle === 'cinematic' ? 'cinematic movie scene, 35mm lens, depth of field, blockbuster lighting, 8k resolution, ultra realistic' : videoStyle === 'anime' ? 'high quality anime style, studio ghibli, detailed background, vibrant colors' : '3d model, octane render, unreal engine 5, ray tracing, high detail'}`;
      
      const config = providerManager.getConfig();
      
      try {
        const res = await fetch("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            aspectRatio,
            provider: config?.provider || "gemini",
            apiKey: config?.apiKey
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "خطأ أثناء توليد المشهد");
        
        const url = data.result;
        
        // Load image first
        const img = new Image();
        img.src = url;
        img.onload = () => {
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, generated: true, url } : s));
            setIsGeneratingScene(null);
            toast.success("تم توليد المشهد!");
        };
        img.onerror = () => {
            setIsGeneratingScene(null);
            toast.error("حدث خطأ أثناء تحميل الصورة المولدة");
        };
      } catch (err: any) {
        setIsGeneratingScene(null);
        toast.error(err.message || "حدث خطأ أثناء التوليد");
      }
  };

  const handlePromptChange = (id: number, val: string) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, prompt: val } : s));
  };
  
  const removeScene = (id: number) => {
    setScenes(prev => prev.filter(s => s.id !== id));
  };

  const addEmptyScene = () => {
    setScenes(prev => [...prev, { id: Date.now() + Math.floor(Math.random() * 1000000), prompt: "", duration: "5s", generated: false }]);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      
      <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shrink-0 flex items-center justify-between flex-wrap gap-4">
         <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-1">
              <Film className="text-purple-400" size={20} /> باني المشاهد (Scene Builder)
            </h2>
            <p className="text-sm font-medium text-slate-400">قسم الفيديو الخاص بك لعدة مشاهد، وقم بتوليد كل مشهد على حدة باختيار النمط والأبعاد.</p>
         </div>
         
         <div className="flex items-center gap-3">
             <div className="bg-slate-950 border border-slate-800 rounded-xl flex items-center p-1">
                {['cinematic', 'anime', '3d-model'].map(style => (
                    <button 
                       key={style}
                       onClick={() => setVideoStyle(style)}
                       className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", videoStyle === style ? "bg-purple-500/20 text-purple-400" : "text-slate-400 hover:text-slate-300")}
                    >
                       {style === 'cinematic' ? 'واقعي سينمائي' : style === 'anime' ? 'أنمي' : 'ثلاثي الأبعاد'}
                    </button>
                ))}
             </div>
             <div className="bg-slate-950 border border-slate-800 rounded-xl flex items-center p-1">
                {['16:9', '9:16', '1:1'].map(ratio => (
                    <button 
                       key={ratio}
                       onClick={() => setVideoRatio(ratio)}
                       className={cn("px-3 py-2 rounded-lg text-xs font-bold transition-all", videoRatio === ratio ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300")}
                    >
                       {ratio}
                    </button>
                ))}
             </div>
            <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
               <Settings2 size={16} /> إعدادات الفيديو
            </button>
            <button disabled={isRendering || scenes.length === 0} onClick={handleRender} className="disabled:opacity-50 disabled:cursor-not-allowed bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20">
               {isRendering ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="fill-white" />} 
               دمج المشاهد (Render)
            </button>
         </div>
      </div>

      <div className="flex gap-4">
          <input 
             type="file" 
             accept="video/*" 
             className="hidden" 
             ref={fileInputRef} 
             onChange={handleFileUpload} 
          />
          <button 
             onClick={() => fileInputRef.current?.click()}
             className="flex-1 bg-slate-800/50 hover:bg-slate-800 border-2 border-dashed border-slate-700 hover:border-slate-500 text-slate-300 py-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all"
          >
             {sourceVideo ? (
                <>
                  <FileVideo size={28} className="text-purple-400" />
                  <span className="font-bold text-sm truncate max-w-xs">{sourceVideo.name}</span>
                  <span className="text-xs text-slate-500">انقر لتغيير الفيديو</span>
                </>
             ) : (
                <>
                  <Upload size={28} className="text-slate-400" />
                  <span className="font-bold">رفع فيديو مرجعي (اختياري)</span>
                  <span className="text-xs text-slate-500">MP4, MOV, WEBM</span>
                </>
             )}
          </button>
          
          <button 
            disabled={isProcessing}
            onClick={handleGenerateScenes}
            className="flex-1 bg-indigo-900/20 border border-indigo-500/30 hover:bg-indigo-900/40 text-indigo-300 py-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
             {isProcessing ? (
                <Loader2 size={28} className="animate-spin text-indigo-400" />
             ) : (
                <Sparkles size={28} className="text-indigo-400" />
             )}
             <span className="font-bold">استخراج وإنشاء المشاهد بالذكاء الاصطناعي</span>
             <span className="text-xs text-indigo-400/70">سيتم تقسيم المقترح أو الفيديو إلى مشاهد</span>
          </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-2 pb-10">
         {scenes.length === 0 && !isProcessing && (
             <div className="text-center text-slate-500 py-10 mt-6 border border-slate-800/50 rounded-2xl bg-slate-900/20">
                <Film size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold text-lg mb-1">لا توجد مشاهد بعد</p>
                <p className="text-sm">قم باستخراج مشاهد من فيديو مرجعي أو أضف مشاهد يدوياً</p>
             </div>
         )}

         {scenes.map((scene, index) => (
           <div key={scene.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex gap-4 relative group hover:border-slate-700 transition-colors">
              
              <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => removeScene(scene.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1"><Trash2 size={16} /></button>
              </div>

              {/* Thumbnail / Status */}
              <div className="w-48 h-28 shrink-0 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative group/thumb">
                 {scene.generated ? (
                   <>
                     <img src={scene.url || "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070&auto=format&fit=crop"} alt="Scene" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                        <button className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center pl-1 shadow-xl"><Play size={20} className="fill-slate-900" /></button>
                     </div>
                   </>
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                     <ImageIcon size={24} />
                     <span className="text-[10px] uppercase tracking-widest font-bold">بانتظار التوليد</span>
                   </div>
                 )}
                 <div className="absolute bottom-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-md">
                    {scene.duration}
                 </div>
              </div>

              {/* Editor */}
              <div className="flex-1 flex flex-col gap-3">
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="bg-slate-800 px-2 py-0.5 rounded-md">مشهد {index + 1}</span>
                 </div>
                 
                 <div className="relative max-w-2xl">
                    <textarea 
                      value={scene.prompt}
                      onChange={(e) => handlePromptChange(scene.id, e.target.value)}
                      className="w-full bg-transparent border-b border-transparent hover:border-slate-800 focus:border-purple-500 text-sm font-medium text-slate-200 resize-none h-16 p-2 transition-colors focus:bg-slate-900/50 rounded-lg outline-none"
                      dir="auto"
                      placeholder="وصف المشهد..."
                    />
                 </div>
                 
                 <div className="mt-auto flex items-center gap-3">
                    <button 
                        disabled={isGeneratingScene === scene.id}
                        onClick={() => generateSceneMedia(scene.id, scene.prompt)} 
                        className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all w-fit disabled:opacity-50",
                      scene.generated ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white"
                    )}>
                      {isGeneratingScene === scene.id ? <><Loader2 size={14} className="animate-spin" /> جاري التوليد</> : scene.generated ? <><RefreshCcw size={14} /> إعادة توليد</> : <><Sparkles size={14} /> توليد (20 رصيد)</>}
                    </button>
                    {!scene.generated && (
                      <button className="text-xs font-bold text-slate-500 hover:text-slate-300 flex items-center gap-1">
                        <ImageIcon size={14} /> إرفاق صورة كمرجع
                      </button>
                    )}
                 </div>
              </div>
           </div>
         ))}

         {scenes.length > 0 && (
            <button onClick={addEmptyScene} className="w-full py-6 mt-2 rounded-2xl border-2 border-dashed border-slate-800 hover:border-purple-500 hover:bg-purple-500/5 text-slate-500 hover:text-purple-400 font-bold flex flex-col items-center gap-2 transition-all">
                <Plus size={24} />
                إضافة مشهد جديد
            </button>
         )}
      </div>
    </div>
  );
}
