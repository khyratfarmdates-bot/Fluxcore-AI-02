import React, { useState } from "react";
import { Sparkles, Send, LayoutTemplate, Copy, RefreshCw, Wand2, Calendar as CalendarIcon, Clock, CheckCircle2, PenTool } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from '../lib/soundToast';
import { AICore } from "../core/AICore";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { publishingService } from "../services/publishing";
import { eventBus } from "../core/events/EventBus";
import { generateId } from "../lib/ids";

import { socialPublishing } from "../services/SocialPublishingService";

type Platform = "TikTok" | "X" | "Instagram" | "LinkedIn";

export function UnifiedPostManager({ onOpenCalendar }: { onOpenCalendar: () => void }) {
  const [baseContent, setBaseContent] = useState("");
  const { activeBrand } = useWorkspace();
  const [activePlatform, setActivePlatform] = useState<Platform>("TikTok");
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [adaptedVersions, setAdaptedVersions] = useState<Record<Platform, string>>({
    TikTok: "",
    X: "",
    Instagram: "",
    LinkedIn: ""
  });
  
  const [isAdapting, setIsAdapting] = useState(false);

  const platforms: { id: Platform; icon: string; color: string }[] = [
    { id: "TikTok", icon: "🎵", color: "text-pink-400" },
    { id: "X", icon: "🐦", color: "text-slate-200" },
    { id: "Instagram", icon: "📸", color: "text-rose-400" },
    { id: "LinkedIn", icon: "💼", color: "text-blue-400" },
  ];

  const handleSmartAdapt = async () => {
    if (!baseContent || !activeBrand) return;
    setIsAdapting(true);
    
    try {
      const prompt = `قم بإعادة صياغة المحتوى التالي ليتناسب مع منصات: TikTok, X, Instagram, LinkedIn. ارجع JSON يحتوي على هذه المفاتيح الأربعة. المحتوى الأساسي:\n\n${baseContent}`;
      const response = await AICore.generateContent({
        workspaceId: activeBrand.id,
        goal: 'Adapt content',
        templateId: 'custom',
        params: { rawPrompt: prompt },
      });
      
      const rawText = response.content;
      try {
        const parsed = JSON.parse(rawText.match(/\{[\s\S]*\}/)?.[0] || rawText);
        setAdaptedVersions({
          TikTok: parsed.TikTok || parsed.tiktok || `${baseContent} #fyp`,
          X: parsed.X || parsed.twitter || `${baseContent}`,
          Instagram: parsed.Instagram || parsed.instagram || `${baseContent}`,
          LinkedIn: parsed.LinkedIn || parsed.linkedin || `${baseContent}`
        });
        toast.success("تمت المواءمة السحرية بنجاح!");
      } catch(e) {
        toast.error("فشل في تحليل المخرجات من الذكاء الاصطناعي");
      }
    } catch(err:any) {
      toast.error(err.message || 'خطأ في التوليد');
    } finally {
      setIsAdapting(false);
    }
  };

  const saveToQueue = async (mode: 'schedule'|'publish'|'smart') => {
     if (!activeBrand) return;
     if (!baseContent) {
        toast.error("يرجى كتابة محتوى أولاً");
        return;
     }

     const currentContent = adaptedVersions[activePlatform] || baseContent;
     setIsPublishing(true);

     try {
       eventBus.publish({
          type: 'OPERATIONAL_LIVE_EVENT',
          source: 'UnifiedPostManager',
          timestamp: Date.now(),
          payload: {
             id: generateId(),
             type: mode === 'publish' ? 'PUBLISHING' : 'SYSTEM',
             message: mode === 'publish' ? `بدء عملية النشر الفوري لـ ${activePlatform}...` : `تمت إضافة منشور لـ ${activePlatform} إلى الطابور.`,
             status: 'pending',
             timestamp: Date.now()
          }
       });

       if (mode === 'publish') {
         toast.info("جاري بدء عملية النشر الحقيقي...");
         await socialPublishing.publishNow(
           activeBrand.id, 
           [activePlatform.toLowerCase()], 
           currentContent
         );
       } else {
         const scheduledTime = new Date(Date.now() + 86400000);
         
         await publishingService.create({
           brandId: activeBrand.id,
           platform: activePlatform as any,
           content: currentContent,
           status: 'queued',
           scheduledTime: scheduledTime,
         } as any);
         
         if(mode === 'schedule') {
           toast.success("تم النقل إلى طابور الجدولة.");
           onOpenCalendar();
         } else if (mode === 'smart') {
           toast.success("تم اختيار أفضل وقت للنشر تلقائياً وإضافته للطابور.");
         }
       }
     } catch(err:any) {
       toast.error(err.message);
     } finally {
       setIsPublishing(false);
     }
  }

  const handleSchedule = () => saveToQueue('schedule');

  const handlePublish = () => saveToQueue('publish');

  const handleSmartSchedule = () => saveToQueue('smart');

  return (
    <div className="flex h-full gap-6">
      {/* Left Column - Base Content Editor */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-[24px] p-6 flex flex-col relative h-[50vh]">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-white flex items-center gap-2">
               <PenTool size={18} className="text-indigo-400"/> المحتوى الموحد (Base Content)
             </h3>
          </div>
          <textarea
            value={baseContent}
            onChange={(e) => setBaseContent(e.target.value)}
            placeholder="اكتب المحتوى الأساسي هنا... وسنقوم بتكييفه لكل منصة تلقائياً."
            className="flex-1 w-full bg-transparent border-none resize-none outline-none text-lg text-slate-200 placeholder:text-slate-600"
          ></textarea>
          
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between mt-auto">
             <div className="text-xs font-medium text-slate-500">
               {baseContent.length} حرف
             </div>
             <button
               onClick={handleSmartAdapt}
               disabled={!baseContent || isAdapting}
               className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
             >
               {isAdapting ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
               مواءمة سحرية للمنصات
             </button>
          </div>
        </div>

        {/* Global Publishing Controls */}
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-[24px] p-6">
          <h3 className="font-bold text-slate-300 mb-4 text-sm tracking-widest uppercase">الجدولة والنشر</h3>
          <div className="flex gap-4">
            <button disabled={isPublishing} onClick={handleSmartSchedule} className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
              <Clock size={16} /> المجدول الذكي (أفضل وقت)
            </button>
            <button disabled={isPublishing} onClick={handleSchedule} className="flex-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 disabled:opacity-50 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
              <CalendarIcon size={16} /> جدولة يدوية
            </button>
            <button disabled={isPublishing} onClick={handlePublish} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 shadow-lg shadow-emerald-500/20 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
               {isPublishing ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
               {isPublishing ? "جاري النشر..." : "انشر الآن"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Platform Specific Editors */}
      <div className="w-[45%] flex flex-col bg-slate-900/50 border border-slate-800/80 rounded-[32px] overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-900 border-b border-slate-800">
          {platforms.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id)}
              className={cn(
                "flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all",
                activePlatform === p.id ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <span className={cn(activePlatform === p.id ? p.color : "opacity-70")}>{p.icon}</span> {p.id}
            </button>
          ))}
        </div>

        {/* Editor for specific platform */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
               نسخة {activePlatform} المخصصة
            </h4>
            <div className="flex gap-2">
               <button className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-colors tooltip" title="تحسين بالذكاء الاصطناعي">
                 <Sparkles size={14} />
               </button>
            </div>
          </div>
          
          <textarea
            value={adaptedVersions[activePlatform] || ""}
            onChange={(e) => setAdaptedVersions(prev => ({...prev, [activePlatform]: e.target.value}))}
            className="flex-1 w-full bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 text-base text-slate-200 outline-none focus:border-indigo-500/50 resize-none transition-colors"
            placeholder={isAdapting ? "جاري المعالجة..." : "لا توجد نسخة مخصصة بعد. قم بكتابة المحتوى الموحد واضغط على مواءمة سحرية."}
          ></textarea>
          
          <div className="mt-4 p-4 bg-slate-950 border border-slate-800/80 rounded-2xl">
             <div className="text-[10px] font-black uppercase text-slate-500 mb-2">إعدادات المنصة (Mock)</div>
             <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-slate-900 border border-slate-800 px-2 py-1 rounded-md text-slate-400 font-medium">Auto-hashtag</span>
                <span className="text-xs bg-slate-900 border border-slate-800 px-2 py-1 rounded-md text-slate-400 font-medium">Link in bio</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
