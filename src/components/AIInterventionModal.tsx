import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Key, 
  RefreshCcw, 
  CheckCircle,
  X,
  Zap,
  ShieldAlert,
  ExternalLink,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { providerManager } from '../core/providers/ProviderManager';
import { toast } from 'sonner';

export function AIInterventionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [errorType, setErrorType] = useState<'expired' | 'limit' | 'unknown'>('unknown');
  const [customMessage, setCustomMessage] = useState('');
  const [newKey, setNewKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const handleAIError = (event: any) => {
      const { type, message } = event.detail;
      setErrorType(type || 'unknown');
      setCustomMessage(message || '');
      setIsOpen(true);
      // Try to load any existing key to helper input
      const config = providerManager.getConfig();
      if (config?.apiKey) {
        setNewKey(config.apiKey);
      }
    };

    window.addEventListener('ai-provider-error', handleAIError);
    return () => window.removeEventListener('ai-provider-error', handleAIError);
  }, []);

  const handleTestKey = async () => {
    if (!newKey.trim()) {
      toast.error("يرجى إدخال مفتاح الـ API أولاً لتجربته.");
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Verify API Key connection. Respond with 'ok'.",
          provider: "gemini",
          apiKey: newKey.trim()
        })
      });

      if (res.ok) {
        setTestResult({
          success: true,
          message: "ممتاز! تم التحقق بنجاح والمفتاح الجديد يعمل بكفاءة 100%."
        });
        toast.success("تم التحقق بنجاح من صلاحية المفتاح!");
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult({
          success: false,
          message: data.error || "رمز التحقق المرجع يشير إلى أن المفتاح غير صالح أو انتهت حصته."
        });
        toast.error("فشل التحقق من المفتاح.");
      }
    } catch (e) {
      setTestResult({
        success: false,
        message: "تعذر الاتصال بالخادم للتحقق من المفتاح، تأكد من اتصال الإنترنت."
      });
      toast.error("حدث خطأ أثناء الاتصال.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleUpdateKey = async () => {
    if (!newKey.trim()) {
      toast.error("يرجى إدخال مفتاح الـ API للمتابعة.");
      return;
    }
    setIsUpdating(true);
    try {
      // Save directly via providerManager to ensure unified local state
      providerManager.updateConfig({ apiKey: newKey.trim() });
      toast.success("تم تحديث مفتاح الـ API بنجاح وتنشيط الأنظمة!");
      setIsOpen(false);
      setNewKey('');
      setTestResult(null);
      // Trigger a light reload or event to refresh UI components if needed
      window.dispatchEvent(new CustomEvent('ai-config-updated'));
    } catch (e: any) {
      toast.error("فشل حفظ المفتاح: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-slate-900/90 border border-slate-800 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl backdrop-blur-xl relative"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/4 w-1/2 h-20 bg-rose-500/10 rounded-full blur-[60px] pointer-events-none" />

            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-start relative z-10">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <ShieldAlert size={24} className="animate-pulse" />
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    تدخل ذكي مطلوب <Sparkles size={16} className="text-amber-400" />
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">توقف مؤقت لمحرك الذكاء الاصطناعي لوجود مشكلة في الوصول</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white transition-colors"
                id="close-intervention-modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar relative z-10 text-right">
              
              {/* Error Explanation Card */}
              {errorType === 'expired' ? (
                <div className="bg-rose-500/5 border border-rose-500/15 rounded-2xl p-4 flex gap-3 items-start">
                  <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={18} />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-rose-300">مفتاح API غير صالح أو منتهي الصلاحية</h4>
                    <p className="text-xs text-rose-200/70 mt-1 leading-relaxed">
                      فشل محرك التوليد في مصادقة المفتاح الحالي. قد يكون الرمز المدخل خاطئاً أو تم حذفه من لوحة تحكم مطوري جوجل.
                    </p>
                    {customMessage && (
                      <p className="text-[11px] font-mono text-rose-400/80 bg-rose-950/20 rounded-lg p-2 mt-2 break-all border border-rose-950/40 text-left">
                        {customMessage}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 flex gap-3 items-start">
                  <Zap className="text-amber-400 shrink-0 mt-0.5" size={18} />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-amber-300">نفاد الحصة المجانية للمفتاح (Rate Limit)</h4>
                    <p className="text-xs text-amber-200/70 mt-1 leading-relaxed">
                      لقد تم تجاوز الحد المسموح به من الطلبات في الدقيقة لمفتاحك الحالي. لضمان أداء لا نهائي وسرعة فائقة، ننصح بوضع مفتاح جديد.
                    </p>
                    {customMessage && (
                      <p className="text-[11px] font-mono text-amber-400/80 bg-amber-950/20 rounded-lg p-2 mt-2 break-all border border-amber-950/40 text-left">
                        {customMessage}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Steps To Get Key */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 space-y-3.5">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 justify-end">
                  خطوات استخراج مفتاح مجاني جديد
                </h4>
                
                <ol className="space-y-3 text-xs text-slate-300 leading-relaxed font-medium">
                  <li className="flex gap-2 justify-start items-start">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center text-[10px] font-mono shrink-0 font-bold mt-0.5">1</span>
                    <span className="text-right">
                      اذهب إلى منصة التطوير عبر النقر هنا:{" "}
                      <a 
                        href="https://aistudio.google.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-400 font-bold hover:underline inline-flex items-center gap-1 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/20 transition-all"
                      >
                        Google AI Studio <ExternalLink size={10} />
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-2 justify-start items-start">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center text-[10px] font-mono shrink-0 font-bold mt-0.5">2</span>
                    <span className="text-right">قم بتسجيل الدخول بحساب Google الخاص بك واقبل شروط الاستخدام.</span>
                  </li>
                  <li className="flex gap-2 justify-start items-start">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center text-[10px] font-mono shrink-0 font-bold mt-0.5">3</span>
                    <span className="text-right">انقر على الزر الأزرق الكبير في الزاوية العلوية اليسرى **"Get API key"** ثم انقر **"Create API key"**.</span>
                  </li>
                  <li className="flex gap-2 justify-start items-start">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center text-[10px] font-mono shrink-0 font-bold mt-0.5">4</span>
                    <span className="text-right">اختر إنشاء مفتاح جديد، ثم انسخ الرمز المتولد الذي يبدأ بالحروف `AIza`.</span>
                  </li>
                </ol>
              </div>

              {/* Key Input Field */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 tracking-wider block">
                  مفتاح الـ API الجديد
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={newKey}
                    onChange={(e) => {
                      setNewKey(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="ضع مفتاحك هنا (AIza...)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-4 pr-10 text-white focus:outline-none focus:border-indigo-500/60 transition-all font-mono text-sm text-right"
                  />
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                </div>
              </div>

              {/* Test Result Display */}
              {testResult && (
                <div className={motion.div} {...({
                  initial: { opacity: 0, y: -5 },
                  animate: { opacity: 1, y: 0 },
                  className: `p-3.5 rounded-xl border text-xs leading-relaxed flex gap-2.5 items-start ${
                    testResult.success 
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" 
                      : "bg-rose-500/5 border-rose-500/20 text-rose-300"
                  }`
                } as any)}>
                  {testResult.success ? (
                    <CheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                  ) : (
                    <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={16} />
                  )}
                  <p className="flex-1 text-right">{testResult.message}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 rounded-xl bg-slate-800/80 text-slate-300 font-bold hover:bg-slate-800 transition-all text-xs border border-slate-700/50 order-3 sm:order-1"
                >
                  تخطي وتجاهل
                </button>
                
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={!newKey || isTesting || isUpdating}
                  className="px-4 py-3 rounded-xl bg-slate-950 text-indigo-400 border border-indigo-500/20 font-bold hover:bg-indigo-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-1.5 order-2"
                >
                  {isTesting ? (
                    <RefreshCcw className="animate-spin" size={14} />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  اختبار المفتاح
                </button>

                <button
                  type="button"
                  onClick={handleUpdateKey}
                  disabled={!newKey || isUpdating || isTesting || (testResult && !testResult.success)}
                  className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 order-1 sm:order-3"
                >
                  {isUpdating ? (
                    <RefreshCcw className="animate-spin" size={14} />
                  ) : (
                    <ChevronLeft size={14} />
                  )}
                  تحديث وحفظ المفتاح
                </button>
              </div>
            </div>

            {/* Footer Tip */}
            <div className="px-6 py-4 bg-indigo-500/5 border-t border-slate-800 flex items-center gap-2 justify-end relative z-10">
              <p className="text-[10px] text-slate-400 font-medium">
                نصيحة: يمكنك الحصول على مفاتيح Gemini مجانية تماماً من لوحة المطورين للاستخدام الشخصي والتطويري.
              </p>
              <Zap size={12} className="text-indigo-400 shrink-0" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
