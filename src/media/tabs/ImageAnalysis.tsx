import React, { useState, useRef } from "react";
import { Eye, Upload, Sparkles, Copy, Check, Wand2, Search, RefreshCcw, Tag, ListFilter } from "lucide-react";
import { cn } from "../../lib/utils";
import { providerManager } from "../../core/providers/ProviderManager";
import { AICore } from "../../core/AICore";
import { toast } from '../../lib/soundToast';
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";

export function ImageAnalysis() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الملف كبير جداً (الأقصى 5 ميجابايت)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await AICore.analyzeImage(image);
      setAnalysis(result);
      toast.success("تم تحليل الصورة بنجاح باستخدام GPT-4 Vision");
    } catch (err: any) {
      console.error(err);
      toast.error("فشل التحليل: " + (err.message || "حدث خطأ غير متوقع"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("تم نسخ الوصف");
  };

  return (
    <div className="flex flex-col h-full gap-6 overflow-y-auto custom-scrollbar pr-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
        
        {/* Upload & Preview Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 flex flex-col gap-6 h-fit sticky top-0">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Eye className="text-indigo-400" /> مختبر الرؤية الذكي
            </h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">تحويل العناصر البصرية إلى بيانات تسويقية مهيكلة</p>
          </div>

          <div 
            onClick={() => !image && fileInputRef.current?.click()}
            className={cn(
               "relative rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer overflow-hidden",
               image ? "border-transparent bg-slate-950 aspect-video lg:aspect-square" : "border-slate-800 bg-slate-950/50 hover:bg-slate-900 hover:border-indigo-500/50 h-[300px]"
            )}
          >
            {image ? (
              <>
                <img src={image} alt="Preview" className="w-full h-full object-contain p-4" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setImage(null); setAnalysis(null); }}
                    className="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black border border-red-500/50 transition-all backdrop-blur-md"
                  >
                    حذف وإعادة تحميل
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="text-slate-600 group-hover:text-indigo-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-300">اسحب أو اضغط لرفع صورة</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">JPG, WEBP, PNG (MAX 5MB)</p>
                </div>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!image || isAnalyzing}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] group"
          >
            {isAnalyzing ? (
              <><RefreshCcw className="animate-spin" size={20} /> جاري تحليل بكسلات الصورة...</>
            ) : (
              <><Sparkles size={20} className="group-hover:animate-pulse" /> بدء الاستخراج الذكي (Vision Pro)</>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Tag size={14} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[8px] text-slate-500 uppercase font-bold">نموذج الذكاء</p>
                <p className="text-[10px] text-slate-300 font-bold">GPT-4 Vision</p>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <ListFilter size={14} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-[8px] text-slate-500 uppercase font-bold">نوع الاستخراج</p>
                <p className="text-[10px] text-slate-300 font-bold">مهيكل (Structured)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 flex flex-col gap-4 relative overflow-hidden h-fit min-h-[600px]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Search size={14} className="text-indigo-400" /> التقارير البصرية المستخرجة
            </h3>
            {analysis && (
              <button 
                onClick={handleCopy}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                title="نسخ التقرير"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            )}
          </div>

          <div className="flex-1 rounded-3xl bg-slate-950/80 border border-slate-800/50 p-6 lg:p-8 relative group overflow-hidden">
             {!analysis && !isAnalyzing ? (
               <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center gap-4">
                 <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center animate-pulse">
                   <Wand2 size={32} className="text-slate-700" />
                 </div>
                 <div className="max-w-[240px] space-y-2">
                    <p className="text-sm font-black text-slate-500">في انتظار مدخلات بصرية</p>
                    <p className="text-[10px] text-slate-600 font-bold">النتائج ستظهر هنا بعد التحليل بنمط مهيكل وسهل القراءة.</p>
                 </div>
               </div>
             ) : isAnalyzing ? (
               <div className="space-y-8 h-full flex flex-col justify-center">
                 <div className="space-y-4">
                   <div className="h-2 bg-slate-900 rounded-full w-1/4 animate-pulse"></div>
                   <div className="h-4 bg-slate-800/50 rounded-lg w-full animate-pulse"></div>
                   <div className="h-4 bg-slate-800/50 rounded-lg w-full animate-pulse"></div>
                 </div>
                 <div className="space-y-4">
                   <div className="h-2 bg-slate-900 rounded-full w-1/3 animate-pulse"></div>
                   <div className="h-20 bg-slate-800/50 rounded-2xl w-full animate-pulse"></div>
                 </div>
                 <div className="space-y-4">
                   <div className="h-2 bg-slate-900 rounded-full w-1/5 animate-pulse"></div>
                   <div className="flex gap-2">
                     <div className="h-8 bg-slate-800/50 rounded-lg w-16 animate-pulse"></div>
                     <div className="h-8 bg-slate-800/50 rounded-lg w-16 animate-pulse"></div>
                     <div className="h-8 bg-slate-800/50 rounded-lg w-16 animate-pulse"></div>
                   </div>
                 </div>
               </div>
             ) : (
               <AnimatePresence>
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="prose prose-invert prose-slate max-w-none prose-h2:text-indigo-400 prose-h2:text-lg prose-h2:font-black prose-h2:mb-4 prose-h2:mt-8 first:prose-h2:mt-0 prose-p:text-slate-300 prose-p:text-sm prose-p:leading-relaxed prose-li:text-slate-400 prose-li:text-xs prose-strong:text-white"
                   dir="rtl"
                 >
                   <Markdown>
                     {analysis}
                   </Markdown>
                 </motion.div>
               </AnimatePresence>
             )}
          </div>

          {analysis && (
             <div className="pt-4 border-t border-slate-800 mt-2 flex items-center justify-between">
               <div className="flex flex-col gap-1">
                 <span className="text-[8px] font-black uppercase text-slate-500">تم التحليل بواسطة</span>
                 <span className="text-[10px] font-bold text-slate-300">OpenAI Vision Engine v4</span>
               </div>
               <div className="flex gap-2">
                 {["توليد منشور", "تحسين الإعلان"].map(tag => (
                   <button key={tag} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-bold hover:bg-indigo-500 hover:text-white transition-all">
                     {tag}
                   </button>
                 ))}
               </div>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}

