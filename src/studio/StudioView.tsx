import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AICore } from "../core/AICore";
import { toast } from '../lib/soundToast';
import {
  PromptEngine,
  Platform,
  Goal,
  ContentType,
  Persona,
  Audience,
  Tone,
} from "../core/prompts/PromptEngine";
import {
  Wand2,
  Loader2,
  Copy,
  Save,
  LayoutTemplate,
  Target,
  Megaphone,
  Users,
  Sparkles,
  MessageSquareText,
  Type,
  Zap,
  CheckCircle2,
  RefreshCw,
  Eye,
  Settings2,
  Share2,
  Mic
} from "lucide-react";
import { cn } from "../lib/utils";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { validatePostContent } from "../lib/validation";
import { ShareModal } from "../components/ShareModal";

export function StudioView({ onNavigate }: { onNavigate?: (module: any) => void }) {
  const { activeBrand } = useWorkspace();
  const [idea, setIdea] = useState("");
  const [mode, setMode] = useState<"quick" | "advanced">("quick");
  
  // Advanced Settings
  const [platform, setPlatform] = useState<Platform>("Snapchat");
  const [goal, setGoal] = useState<Goal>("Viral");
  const [contentType, setContentType] = useState<ContentType>("Social Post");
  const [persona, setPersona] = useState<Persona>("Gulf Influencer");
  const [audience, setAudience] = useState<Audience>("General Audience");
  const [tone, setTone] = useState<Tone>("Enthusiastic");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [shareData, setShareData] = useState<{ name: string; content: string; type: string } | null>(null);

  const handleGenerate = async () => {
    const errors = validatePostContent(idea, platform);
    if (errors.length > 0) {
      errors.forEach(e => toast.error(e));
      return;
    }
    
    setLoading(true);
    setResult(null);

    try {
      const prompt = PromptEngine.buildPrompt({
        idea,
        platform,
        goal,
        contentType,
        persona: mode === "quick" ? "Viral Creator" : persona,
        audience: mode === "quick" ? "General Audience" : audience,
        tone: mode === "quick" ? "Friendly" : tone,
        brandIdentity: activeBrand
      });
      const response = await AICore.generateContent({
        workspaceId: activeBrand?.id || "default",
        goal: idea,
        templateId: "custom",
        params: { rawPrompt: prompt },
        preferredProvider: "Gemini",
        type: "text"
      });
      const rawText = response.content;
      try {
        const parsed = JSON.parse(rawText);
        setResult(parsed);
        toast.success("تم التوليد بنجاح شارك المحتوى!");
      } catch (parseError) {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
           setResult(JSON.parse(match[0]));
           toast.success("تم التوليد بنجاح!");
        } else {
           throw new Error("فشل في تحليل الاستجابة");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء التوليد");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResult = async () => {
    if (!result || !activeBrand) return;
    try {
      await addDoc(collection(db, "generations"), {
        idea, platform, goal, contentType, persona, audience, tone,
        brandId: activeBrand.id,
        userId: auth.currentUser?.uid,
        result,
        createdAt: serverTimestamp(),
      });
      toast.success("تم حفظ النتيجة في الأرشيف!");
    } catch (err: any) {
      toast.error("خطأ أثناء الحفظ");
    }
  };

  return (
    <div className="flex h-full bg-slate-950 p-6 gap-6">
      
      {/* Main Column */}
      <div className="flex-1 flex flex-col gap-6 max-w-4xl mx-auto h-full overflow-hidden">
        
        {/* Header Options */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setMode("quick")}
              className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", mode === "quick" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}
            >
              الوضع السريع
            </button>
            <button
              onClick={() => setMode("advanced")}
              className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2", mode === "advanced" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}
            >
              <Settings2 size={14} /> الوضع المتقدم
            </button>
          </div>
          
          {result && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShareData({
                  name: `كامل المنشور المنشأ: ${idea.slice(0, 25)}...`,
                  content: `${result.hook || ''}\n\n${result.content || ''}\n\n${result.cta || ''}`,
                  type: 'studio'
                })}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 border border-rose-500/20 rounded-xl text-sm font-bold transition-all"
              >
                <Share2 size={16} /> مشاركة المنشور كاملاً
              </button>

              <button onClick={handleSaveResult} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-sm font-bold transition-all">
                <Save size={16} /> حفظ في الأرشيف
              </button>
            </div>
          )}
        </div>

        {/* Editor Area */}
        <div className="flex flex-col gap-4 shrink-0">
          <div className="relative group">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="عن ماذا تريد أن تتحدث اليوم؟..."
              className="w-full h-32 bg-slate-900/50 border border-slate-800/80 rounded-[24px] p-6 text-lg text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none shadow-sm placeholder:text-slate-600"
            />
            <div className="absolute left-4 bottom-4 flex gap-2">
               <button onClick={handleGenerate} disabled={loading || !idea} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]">
                 {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                 {loading ? "جاري التوليد..." : "توليد بذكاء"}
               </button>
            </div>
            
            {/* Context AI hint */}
            {mode === "quick" && !idea && (
                <div className="absolute top-6 left-6 flex items-center gap-2 text-indigo-400/60 pointer-events-none">
                  <span className="text-xs font-bold bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20 flex items-center gap-1">
                    <Sparkles size={10} /> المساعد الذكي يتأهب
                  </span>
                </div>
            )}
          </div>

          <AnimatePresence>
            {mode === "advanced" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-[24px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  <SelectBox label="المنصة" value={platform} onChange={(v:any) => setPlatform(v)} options={[
                    {val: "TikTok", label: "تيك توك 📱 (ترندات)"}, 
                    {val: "Instagram", label: "إنستغرام 📸 (جماليات)"}, 
                    {val: "Snapchat", label: "سناب شات 👻 (رائد الخليج)"}, 
                    {val: "X", label: "إكس / تويتر 🐦 (النخبة)"}, 
                    {val: "LinkedIn", label: "لينكد إن 💼 (ريادي واحترافي)"}, 
                    {val: "YouTube", label: "يوتيوب 🎥 (سرد طويل)"},
                    {val: "WhatsApp", label: "واتساب بيزنس 💬 (مباشر)"},
                    {val: "Telegram", label: "تليجرام 📢 (مجتمعات وعروض)"}
                  ]} icon={<LayoutTemplate size={14}/>} />
                  
                  <SelectBox label="نوع المحتوى" value={contentType} onChange={(v:any) => setContentType(v)} options={[
                    {val: "Social Post", label: "منشور تفاعلي قصير"}, 
                    {val: "Video Script", label: "سيناريو فيديو إعلاني"}, 
                    {val: "TikTok/Snapchat Story", label: "ستوري عفوي سناب/تيك"},
                    {val: "Thread", label: "سلسلة تغريدات (ثرد)"},
                    {val: "Article", label: "مقال تسويقي متكامل"},
                    {val: "Ramadan Campaign", label: "حملة رمضانية مبتكرة 🌙"},
                    {val: "National Day Campaign", label: "حملة اليوم الوطني 🇸🇦🇦🇪"},
                    {val: "Product Review", label: "تقييم ومراجعة منتج ⚡"},
                    {val: "Podcast Script", label: "سيناريو حلقة بودكاست 🎙️"},
                    {val: "WhatsApp Broadcast", label: "رسالة جماعية للواتساب 📱"}
                  ]} icon={<Type size={14}/>} />
                  
                  <SelectBox label="الشخصية" value={persona} onChange={(v:any) => setPersona(v)} options={[
                    {val: "Gulf Influencer", label: "مؤثر شبابي خليجي ✨"}, 
                    {val: "Marketing Consultant", label: "مستشار نمو تسويقي 📊"}, 
                    {val: "Storyteller", label: "راوي قصص وجزل 📖"},
                    {val: "Saudi Traditionalist", label: "أصالة وروح الهوية 🇸🇦"},
                    {val: "Luxury Ambassador", label: "سفير لايف ستايل راقي 💎"},
                    {val: "Tech Expert", label: "خبير ومراجع تقني ⚡"},
                    {val: "Self-made Entrepreneur", label: "رائد أعمال عصامي ملهم 💡"},
                    {val: "Empathetic Guide", label: "أخصائي مرشد وجداني ❤️"},
                    {val: "Analytical Academic", label: "محلل مفكر وأكاديمي 🎓"},
                    {val: "Viral Creator", label: "صانع ترند فيرال عام 🚀"}
                  ]} icon={<Megaphone size={14}/>} />
                  
                  <SelectBox label="النبرة / اللهجة" value={tone} onChange={(v:any) => setTone(v)} options={[
                    {val: "Enthusiastic", label: "حماسي وتفعيلي ملهم 🔥"}, 
                    {val: "Professional", label: "جاد وفصيح مقنع 🤝"}, 
                    {val: "Friendly", label: "ودّي وقريب وعفوي ❤️"}, 
                    {val: "Luxury", label: "فاخر، نخبوي، ملكي 💎"},
                    {val: "Poetic", label: "شاعري ذو سجع بلاغي 🖋️"},
                    {val: "Saudi/Najdi Accent", label: "لهجة نجدية أصيلة 🇸🇦"},
                    {val: "Hijazi Accent", label: "لهجة حجازية لطيفة 🌴"},
                    {val: "Emirati/Gulf White", label: "لهجة خليجية بيضاء 🇦🇪"},
                    {val: "Motivating", label: "تحفيزي وتغيير حياة 🌟"},
                    {val: "Humorous", label: "فكاهي ومرح ضاحك 😂"}
                  ]} icon={<MessageSquareText size={14}/>} />

                  <SelectBox label="الهدف التسويقي" value={goal} onChange={(v:any) => setGoal(v)} options={[
                    {val: "Viral", label: "انتشار فيرال واسع 🚀"}, 
                    {val: "Educational", label: "تعليمي وبناء معرفة 📚"}, 
                    {val: "Sales", label: "مبيعات وتحويل فوري 💰"}, 
                    {val: "Engagement", label: "بناء مجتمع وتفاعل 💬"},
                    {val: "Brand Loyalty", label: "تعزيز ولاء للعلامة 💎"},
                    {val: "Lead Generation", label: "جذب عملاء محتملين 🎯"},
                    {val: "Event Promotion", label: "إعلان فعالية وإطلاق 🎉"},
                    {val: "Social Awareness", label: "توعية وقضايا مجتمعية 🤝"}
                  ]} icon={<Target size={14}/>} />

                  <SelectBox label="الجمهور المستهدف" value={audience} onChange={(v:any) => setAudience(v)} options={[
                    {val: "General Audience", label: "جمهور عام وشامل 👥"}, 
                    {val: "Youth", label: "الشباب العربي (Gen Z) ⚡"}, 
                    {val: "Business Owners", label: "رواد أعمال ومستثمرون 👔"}, 
                    {val: "Luxury Seekers", label: "طلاب الفخامة والتميز 💎"},
                    {val: "Local Saudi Community", label: "المجتمع السعودي المحلي 🇸🇦"},
                    {val: "GCC Professional Class", label: "المهنيون والموظفون بالخليج 🇦🇪"},
                    {val: "Tech Savvy", label: "عشاق التقنية والألعاب 💻"},
                    {val: "Gamers", label: "مجتمع الجيمرز الخليجي 🎮"},
                    {val: "Mothers & Families", label: "الأمهات والعائلات العربية 🏡"}
                  ]} icon={<Users size={14}/>} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-12 rounded-[24px]">
          {!result && !loading && (
             <div className="h-full flex flex-col items-center justify-center text-slate-500/50 space-y-6">
               <div className="w-24 h-24 border border-dashed border-slate-800 flex items-center justify-center rounded-[32px] bg-slate-900/30 text-slate-700">
                 <Wand2 size={32} />
               </div>
               <p className="text-sm font-bold tracking-widest uppercase">مساحة الإبداع فارغة</p>
             </div>
          )}

          {loading && <SkeletonLoader />}

          {result && !loading && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <ContentBlock name="الافتتاحية (Hook)" content={result.hook} type="hook" onShare={() => setShareData({ name: "الافتتاحية (Hook)", content: result.hook, type: "studio" })} />
              <ContentBlock name="المحتوى (Caption/Script)" content={result.content} type="content" onNavigate={onNavigate} onShare={() => setShareData({ name: "قوام المحتوى الأساسي", content: result.content, type: "studio" })} />
              <div className="grid grid-cols-2 gap-6">
                <ContentBlock name="الدعوة للإجراء (CTA)" content={result.cta} type="cta" onShare={() => setShareData({ name: "الدعوة للإجراء (CTA)", content: result.cta, type: "studio" })} />
                <ContentBlock name="التصور البصري" content={result.visualConcept} type="tips" onNavigate={onNavigate} onShare={() => setShareData({ name: "التصور البصري الإبداعي", content: result.visualConcept, type: "studio" })} />
              </div>
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-[24px] p-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">الهاشتاغات المستهدفة</h4>
                <div className="flex gap-2 flex-wrap">
                  {result.hashtags?.map((tag: string, i: number) => (
                    <span key={i} className="text-sm text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Smart Assistant Right Panel */}
      <div className="w-80 shrink-0 bg-slate-900/30 border border-slate-800/80 rounded-[32px] flex flex-col p-6 h-full overflow-y-auto">
        <h3 className="font-black text-white flex items-center gap-2 mb-6">
          <Sparkles className="text-amber-400" size={18} /> FluxCopilot
        </h3>
        
        <div className="flex-1 space-y-6">
          <AssistantCard 
            title="اقتراحات المنصة" 
            desc="بناءً على الفكرة، منصة TikTok ستحقق تفاعلاً أعلى بنسبة 40%." 
            icon={<Target size={16} className="text-emerald-400"/>} 
          />
          <AssistantCard 
            title="تحليل الترند" 
            desc="الصوت المنتشر حالياً (Make it aesthetic) مناسب جداً لهذا المحتوى." 
            icon={<Zap size={16} className="text-amber-400"/>} 
          />
          <AssistantCard 
            title="توجيه الأسلوب" 
            desc="استخدمنا نبرة Friendly متماشية مع ملف Brand Identity الخاص بك." 
            icon={<CheckCircle2 size={16} className="text-indigo-400"/>} 
          />
        </div>

        <button className="mt-auto w-full py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-bold border border-slate-700/50 transition-colors flex items-center justify-center gap-2">
          <Eye size={16} /> معاينة حية (Live Preview)
        </button>
      </div>

      {shareData && (
        <ShareModal
          isOpen={!!shareData}
          onClose={() => setShareData(null)}
          title={`مشاركة المحتوى: ${shareData.name}`}
          shareUrl={`${window.location.origin}/shared/studio/${Math.random().toString(36).substr(2, 9)}`}
          previewType="studio"
          previewDetails={{
            name: shareData.name,
            subtitle: "توليد تلقائي ذكي عبر Fluxcore",
            extraLabel: "طول النص",
            extraValue: `${shareData.content.length} حرف`
          }}
        />
      )}

    </div>
  );
}

function SelectBox({ label, value, onChange, options, icon }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">{icon} {label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 appearance-none"
      >
        {options.map((opt: any) => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function ContentBlock({ name, content, type, onShare, onNavigate }: { name: string, content: string, type: string, onShare?: () => void, onNavigate?: (module: any) => void }) {
  if (!content) return null;
  const colors: Record<string, string> = {
    hook: "border-pink-500/30 text-pink-400 bg-pink-500/5",
    content: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
    cta: "border-blue-500/30 text-blue-400 bg-blue-500/5",
    tips: "border-amber-500/30 text-amber-400 bg-amber-500/5",
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    toast.success("تم النسخ إلى الحافظة!");
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800/80 rounded-[24px] p-6 relative group hover:border-slate-700/80 transition-colors flex flex-col justify-between">
       <div>
         <div className="flex justify-between items-center mb-4">
           <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border", colors[type])}>
             {name}
           </span>
           
           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             {onShare && (
               <button onClick={onShare} className="p-1.5 text-slate-400 hover:text-pink-400 hover:bg-slate-800 rounded-lg transition-colors" title="مشاركة قنوات">
                 <Share2 size={13}/>
               </button>
             )}
             <button className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"><RefreshCw size={14}/></button>
             <button onClick={copyToClipboard} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"><Copy size={14}/></button>
           </div>
         </div>
         <p className="text-base text-slate-200 leading-loose whitespace-pre-wrap font-medium">
           {content}
         </p>
       </div>

       {type === "content" && onNavigate && (
         <button 
           onClick={() => {
             localStorage.setItem('fluxcore_media_lab_preset', JSON.stringify({ tab: 'voice', prompt: content }));
             onNavigate('media');
             toast.success("جاري انتقالك للأستوديو الصوتي وإعداد التشكيل تلقائياً... 🎙️");
           }}
           className="mt-5 w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer group/btn shadow-md"
         >
           <Mic size={14} className="group-hover/btn:scale-115 transition-transform text-emerald-400" /> 
           الجسر الذكي: توليد ونطق المحتوى صوتياً في مختبر الوسائط
         </button>
       )}

       {type === "tips" && onNavigate && (
         <button 
           onClick={() => {
             localStorage.setItem('fluxcore_media_lab_preset', JSON.stringify({ tab: 'image', prompt: content }));
             onNavigate('media');
             toast.success("جاري انتقالك لتوليد الصورة وإعداد التصور البصري... 🎨");
           }}
           className="mt-5 w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-400 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer group/btn shadow-md"
         >
           <Wand2 size={14} className="group-hover/btn:scale-115 transition-transform text-indigo-400" />
           الجسر الذكي: ابتكار وتوليد الصورة فورياً في مختبر الوسائط
         </button>
       )}
    </div>
  );
}

function AssistantCard({ title, desc, icon }: any) {
  return (
    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
      <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">{icon} {title}</h4>
      <p className="text-xs text-slate-400 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      <div className="h-48 bg-slate-900/30 border border-slate-800/50 rounded-[24px]" />
      <div className="h-32 bg-slate-900/30 border border-slate-800/50 rounded-[24px]" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-24 bg-slate-900/30 border border-slate-800/50 rounded-[24px]" />
        <div className="h-24 bg-slate-900/30 border border-slate-800/50 rounded-[24px]" />
      </div>
    </div>
  );
}
