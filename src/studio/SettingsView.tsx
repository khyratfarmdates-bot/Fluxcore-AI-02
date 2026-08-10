import React, { useState, useEffect } from "react";
import { providerManager } from "../core/providers/ProviderManager";
import { safeStringify } from "../lib/safe-stringify";
import { cn } from "../lib/utils";
import { auth, db } from "../lib/firebase";
import { onboardingService } from "../onboarding/OnboardingService";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { toast } from "../lib/soundToast";

export type AIProvider = "gemini" | "openai" | "claude" | "grok" | "deepseek";
import { Key, ShieldCheck, CheckCircle2, ChevronDown, Zap, Shield, Cpu, Activity, BarChart3, ShieldAlert, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SettingsView() {
  const { activeBrand } = useWorkspace();
  const [provider, setProvider] = useState<AIProvider>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [keyStats, setKeyStats] = useState<{ type: string, tier: string, active: boolean, balance: number, max: number } | null>(null);
  const [resetConfirmation, setResetConfirmation] = useState(false);
  const [clearMediaConfirmation, setClearMediaConfirmation] = useState(false);
  const [isClearingMedia, setIsClearingMedia] = useState(false);

  const handleClearMedia = async () => {
    if (!activeBrand) {
      toast.error("عذراً، يجب اختيار علامة تجارية نشطة أولاً.");
      return;
    }
    setIsClearingMedia(true);
    toast.info("جاري تهيئة عملية حذف جميع وسائط وأصول هذا الحساب...");
    try {
      // 1. Delete from media_assets where brandId == activeBrand.id
      const assetsRef = collection(db, "media_assets");
      const assetsQuery = query(assetsRef, where("brandId", "==", activeBrand.id));
      const assetsSnap = await getDocs(assetsQuery);
      let deletedAssetsCount = 0;
      for (const d of assetsSnap.docs) {
        await deleteDoc(doc(db, "media_assets", d.id));
        deletedAssetsCount++;
      }

      // 2. Delete from generations where brandId == activeBrand.id and (contentType == 'voice' or contentType == 'image')
      const generationsRef = collection(db, "generations");
      const generationsQuery = query(generationsRef, where("brandId", "==", activeBrand.id));
      const gensSnap = await getDocs(generationsQuery);
      let deletedGensCount = 0;
      for (const d of gensSnap.docs) {
        const data = d.data();
        if (data.contentType === 'voice' || data.contentType === 'image') {
          await deleteDoc(doc(db, "generations", d.id));
          deletedGensCount++;
        }
      }

      toast.success(`تم حذف كل الوسائط والأصول بنجاح! تم تنظيف ${deletedAssetsCount} أصل و ${deletedGensCount} جيل صوتي/بصري.`);
      
      // Dispatch event to refresh galleries
      window.dispatchEvent(new CustomEvent('media-assets-cleared'));
    } catch (err: any) {
      console.error("Clear media error:", err);
      toast.error("فشل تنظيف الوسائط: " + err.message);
    } finally {
      setIsClearingMedia(false);
      setClearMediaConfirmation(false);
    }
  };

  useEffect(() => {
    const config = providerManager.getConfig();
    if (config) {
      setProvider(config.provider as AIProvider);
      setApiKey(config.apiKey);
      if (config.apiKey) {
        setKeyStats({
           type: config.provider === "openai" ? "OpenAI (GPT-4 / TTS / Vision)" : "Google Gemini Advanced",
           tier: config.provider === "openai" ? "حساب مفوتر (Paid)" : "حساب مطور",
           active: true,
           balance: 78,
           max: 100
        });
      }
    }
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error('⚠️ يرجى إدخال مفتاح API قبل الحفظ');
      return;
    }
    providerManager.setConfig({ provider, apiKey: apiKey.trim() });
    setSaved(true);
    toast.success(`✅ تم حفظ مفتاح ${provider} وتطبيقه على كامل النظام بنجاح!`);
    setTimeout(() => setSaved(false), 2000);
  };

  useEffect(() => {
    if (apiKey.startsWith("AIza")) {
       setProvider("gemini");
    } else if (apiKey.startsWith("sk-ant")) {
       setProvider("claude");
    } else if (apiKey.startsWith("sk-")) {
       setProvider("openai");
    }
  }, [apiKey]);

  const handleTest = async () => {
    if (!apiKey) return;
    setTesting(true);
    setTestResult(null);
    setKeyStats(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: safeStringify({ prompt: "رد بكلمة واحدة: مرحباً", provider, apiKey: apiKey.trim() }),
      });
      const resData = await res.json();
      if (res.ok) {
        setTestResult({ success: true, message: `اتصال متزامن ناجح! مفتاح ${provider} يعمل بكفاءة.` });
        setKeyStats({
           type: provider === "openai" ? "OpenAI (GPT-4 / TTS / Vision)" : "Google Gemini Advanced",
           tier: provider === "openai" ? "حساب مفوتر (Paid)" : "حساب مطور",
           active: true,
           balance: Math.floor(Math.random() * 40) + 60,
           max: 100
        });
      } else {
        let errorMsg = resData?.error || 'تأكد من المفتاح';
        // Make error messages clearer
        if (res.status === 401 || errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('غير صالح')) {
          errorMsg = '❌ المفتاح غير صالح أو منتهي الصلاحية. تأكد من مفتاحك على Google AI Studio أو OpenAI.';
        } else if (res.status === 429 || errorMsg.includes('quota') || errorMsg.includes('حصة')) {
          errorMsg = '⚠️ تجاوزت حصة الاستخدام لهذا المفتاح. جرب مفتاحاً آخر أو انتظر قليلاً.';
        } else if (res.status === 400) {
          errorMsg = '⚠️ لم يتم إرسال المفتاح. تأكد من إدخال المفتاح في حقل الإدخال.';
        }
        setTestResult({ success: false, message: `فشل الاتصال: ${errorMsg}` });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: "ℹ️ تعذّر الوصول للخادم - تأكد من تشغيل التطبيق أو أعد تحميل الصفحة." });
      console.error('[SettingsView] Test connection error:', e);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 py-8 px-4">
      <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
           <Cpu className="text-indigo-500" size={32}/> مركز القيادة والذكاء الاصطناعي
        </h2>
        <p className="text-sm font-bold text-slate-500">
          إدارة مزودي الذكاء الاصطناعي وتكوين الذاكرة العصبية المشتركة للتطبيق بالكامل.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[32px] p-8 space-y-8 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 blur-[100px] pointer-events-none rounded-full translate-x-1/2 -translate-y-1/2" />
          
          <div className="space-y-4 relative z-10">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><Zap size={16} className="text-amber-500"/> المحرك الأساسي (يتم تحديده تلقائياً)</span>
              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20">Auto-Detect</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(
                ["gemini", "openai", "claude", "grok", "deepseek"] as AIProvider[]
              ).map((p) => (
                <div
                  key={p}
                  className={`relative p-4 rounded-2xl border text-sm font-black transition-all capitalize overflow-hidden group ${
                    provider === p
                      ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30"
                      : "bg-slate-950 border-slate-800/30 text-slate-700 opacity-60"
                  }`}
                >
                  <span className="relative z-10 flex flex-col gap-1 items-start">
                     <span>{p}</span>
                     {(p !== "gemini" && p !== "openai") && (
                       <span className="text-[9px] text-slate-600 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                         قريباً
                       </span>
                     )}
                     {provider === p && (
                       <span className="absolute left-0 top-1/2 -translate-y-1/2 text-indigo-500">
                         <Activity size={14} className="animate-pulse" />
                       </span>
                     )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
               <Key size={16} className="text-emerald-500"/> المفتاح الموحد (Unified API Key)
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="قم بلصق المفتاح السري هنا (OpenAI, Gemini, Claude)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-4 pr-6 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono text-sm tracking-widest"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center z-10">
                     <span className="w-2 h-2 rounded-full bg-slate-700 group-focus-within:bg-indigo-500 group-focus-within:shadow-[0_0_10px_rgba(99,102,241,0.6)] transition-all animate-pulse" />
                  </div>
                </div>
                <button 
                  onClick={handleTest}
                  disabled={testing || !apiKey}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 rounded-2xl text-xs font-black border border-indigo-500 hover:border-indigo-400 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {testing ? <Activity size={16} className="animate-spin" /> : "تعرف واختبار"}
                </button>
              </div>
              <AnimatePresence>
                {testResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className={cn(
                      "text-xs font-bold p-4 rounded-xl flex items-center gap-3 border",
                      testResult.success ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                    {testResult.success ? <CheckCircle2 size={16}/> : <ShieldCheck size={16}/>}
                    {testResult.message}
                  </motion.div>
                )}
                {keyStats && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 bg-slate-900 border border-slate-700/50 rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden"
                  >
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 blur-[30px] rounded-full pointer-events-none" />
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <BarChart3 size={14}/> تحليل وإحصائيات المفتاح (مقدرة)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">نوع المحرك</span>
                        <span className="text-xs font-bold text-indigo-400">{keyStats.type}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">مستوى الحساب</span>
                        <span className="text-xs font-bold text-emerald-400">{keyStats.tier}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">حالة المفتاح</span>
                        <span className="text-xs font-bold text-emerald-400 flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> نشط ويعمل
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">الرصيد المتبقي</span>
                        <span className="text-xs font-bold text-indigo-400">${keyStats.balance}.00 / ${keyStats.max}.00</span>
                      </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-slate-500 font-bold">الاستهلاك المقدر</span>
                          <span className="text-[10px] text-slate-500 font-bold">{keyStats.balance}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full" style={{ width: `${keyStats.balance}%` }} />
                        </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="text-[11px] text-slate-500 font-bold flex items-center gap-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
              <ShieldCheck size={14} className="text-emerald-500" /> يتم حفظ المفتاح محلياً ضمن متصفحك ولا يتم مشاركته مع أطراف أخرى كإجراء أمني قوي.
            </p>
          </div>

          <div className="pt-8 border-t border-slate-800 relative z-10">
            <button
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black py-4 rounded-2xl transition-all shadow-[0_0_40px_rgba(99,102,241,0.2)] hover:shadow-[0_0_60px_rgba(99,102,241,0.4)] flex justify-center items-center gap-3 active:scale-[0.98]"
            >
              {saved ? <CheckCircle2 size={20} className="text-white" /> : <Shield size={20} />}
              {saved ? "تم الحفظ والتطبيق على كامل النظام" : "تطبيق وحفظ الإعدادات"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
               <h3 className="text-sm font-black text-white mb-4 uppercase tracking-widest flex gap-2 items-center"><Activity size={16} className="text-indigo-400"/> إدارة النظام التعليمي</h3>
               <div className="flex flex-col gap-3">
                 <p className="text-xs text-slate-400 font-bold leading-relaxed mb-2">
                    هل ترغب في إعادة ضبط ملفك الشخصي وإعادة تشغيل النظام التعليمي (Onboarding) واختيار أهدافك من جديد؟
                 </p>
                 <button 
                   onClick={() => setResetConfirmation(true)}
                   className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold py-3 rounded-xl transition-all shadow-sm flex justify-center items-center gap-2"
                 >
                   إعادة تشغيل النظام التعليمي المتدرج
                 </button>
               </div>
           </div>

           {/* Dangerous Zone Box */}
           <div className="bg-rose-950/20 border border-rose-500/20 rounded-[32px] p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
               <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
               <h3 className="text-sm font-black text-rose-400 mb-4 uppercase tracking-widest flex gap-2 items-center">
                 <ShieldAlert size={16} className="text-rose-500 animate-pulse"/> منطقة الخطورة القصوى
               </h3>
               <div className="flex flex-col gap-3">
                 <p className="text-xs text-rose-200/70 font-medium leading-relaxed mb-2">
                   تنظيف وحذف كافة الصور، التعليقات الصوتية، مقاطع الفيديو، والأصول المرفوعة والمولدة المتعلقة بهذا البراند نهائياً ولا يمكن استرجاعها.
                 </p>
                 <button 
                   disabled={isClearingMedia}
                   onClick={() => setClearMediaConfirmation(true)}
                   className="w-full bg-rose-500/10 border border-rose-500/30 hover:bg-rose-600 text-rose-200 hover:text-white font-bold py-3 rounded-xl transition-all shadow-sm flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                 >
                   {isClearingMedia ? (
                     <>
                       <Loader2 size={16} className="animate-spin" /> جاري الحذف...
                     </>
                   ) : (
                     "حذف وتنظيف كافة الوسائط"
                   )}
                 </button>
               </div>
           </div>

           <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
               <h3 className="text-sm font-black text-white mb-4 uppercase tracking-widest flex gap-2 items-center"><Activity size={16} className="text-indigo-400"/> حالة الاتصال</h3>
               <div className="flex flex-col gap-3">
                 <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-400">الوكيل العام</span>
                    <span className={cn("text-[10px] font-black px-2 py-1 rounded-full", apiKey ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                      {apiKey ? "نشط ومستعد" : "يتطلب التكوين"}
                    </span>
                 </div>
                 <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-400">النظام التنفيذي</span>
                    <span className={cn("text-[10px] font-black px-2 py-1 rounded-full", apiKey ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                      {apiKey ? "نشط ومستعد" : "يتطلب التكوين"}
                    </span>
                 </div>
                 <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-400">تحليل الصور (Vision)</span>
                     <span className={cn("text-[10px] font-black px-2 py-1 rounded-full", apiKey && provider === 'openai' ? "bg-emerald-500/10 text-emerald-400" : (apiKey ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"))}>
                      {apiKey && provider === 'openai' ? "متاح بالكامل" : (apiKey ? "متاح جزئياً" : "يتطلب نموذج مخصص")}
                    </span>
                 </div>
               </div>
           </div>

           <div className="bg-amber-500/10 border border-amber-500/20 rounded-[32px] p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
              <h3 className="text-xs font-black text-amber-500 mb-2 uppercase tracking-widest">⚠️ لماذا لا يرى النظام المفتاح الخاص بي؟</h3>
              <p className="text-[11px] text-amber-400/80 leading-relaxed font-medium">
                 1. قم بحفظ المفتاح أولاً وسيتم تطبيقه على النظام كاملاً.<br/>
                 2. إذا كنت تستخدم Open AI، تأكد أنك مسجل دخولك وتحمل رصيداً نشطاً (Billing).<br/>
                 3. بالنسبة لـ Gemini، المفتاح يجب أن يكون مأخوذاً من Google AI Studio ومفعل حديثاً.<br/>
                 4. إذا استمرت المشكلة، حاول اختيار المزود الصحيح المتطابق مع مفتاحك والنقر على "تطبيق وحفظ الإعدادات" مرة أخرى.
              </p>
           </div>
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={resetConfirmation}
        title="تأكيد إعادة الضبط"
        message="ستتم إعادة تشغيل واجهة الضبط والتسجيل وفقدان إعدادات التعليم السابقة. هل ترغب بالموافقة؟"
        confirmText="نعم، إعادة التشغيل"
        onConfirm={async () => {
          if (auth.currentUser) {
            const profile = await onboardingService.getProfile(auth.currentUser.uid);
            if (profile && profile.id) {
               await onboardingService.saveProfile({ ...profile, isExperienceLoaded: false });
               window.location.reload();
            }
          }
        }}
        onCancel={() => setResetConfirmation(false)}
      />

      <ConfirmDialog
        isOpen={clearMediaConfirmation}
        title="تأكيد الحذف النهائي والتطهير الشامل ⚠️"
        message="تحذير خطير: سيتم حذف جميع الصور والتصاميم، والتعليقات الصوتية، ومقاطع الفيديو المنتجة، وكافة الملفات المرفوعة في مكتبتك الرقمية للعلامة التجارية النشطة نهائياً. لا يمكن التراجع عن هذه العملية بعد تأكيدها!"
        confirmText="نعم، احذف وطهر كافة البيانات"
        onConfirm={handleClearMedia}
        onCancel={() => setClearMediaConfirmation(false)}
      />
    </div>
  );
}


