import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, CheckCircle2, XCircle, RefreshCw,
  Server, Key, Database, Wifi, Cpu, ChevronDown, ChevronUp,
  Clock, Zap, ShieldAlert, Info, X, Bug, Eye, EyeOff
} from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, limit, getDocs, query } from 'firebase/firestore';

// Cast Lucide icons to any to bypass type conflicts in React 19 / TS compilation
const ActivityIcon = Activity as any;
const AlertTriangleIcon = AlertTriangle as any;
const CheckCircle2Icon = CheckCircle2 as any;
const XCircleIcon = XCircle as any;
const RefreshCwIcon = RefreshCw as any;
const ServerIcon = Server as any;
const KeyIcon = Key as any;
const DatabaseIcon = Database as any;
const WifiIcon = Wifi as any;
const CpuIcon = Cpu as any;
const ChevronDownIcon = ChevronDown as any;
const ChevronUpIcon = ChevronUp as any;
const ClockIcon = Clock as any;
const ZapIcon = Zap as any;
const ShieldAlertIcon = ShieldAlert as any;
const InfoIcon = Info as any;
const XIcon = X as any;
const BugIcon = Bug as any;
const EyeIcon = Eye as any;
const EyeOffIcon = EyeOff as any;

// ─── Types ───────────────────────────────────────────────────────────────────

interface DiagCheck {
  id: string;
  label: string;
  category: 'server' | 'ai' | 'database' | 'config';
  status: 'ok' | 'warn' | 'error' | 'loading' | 'unknown';
  message: string;
  detail?: string;
  lastChecked?: number;
}

interface ErrorLogEntry {
  id: string;
  time: string;
  source: string;
  message: string;
  level: 'error' | 'warn' | 'info';
}

// ─── Global Error Interceptor ─────────────────────────────────────────────────

const errorLog: ErrorLogEntry[] = [];
const errorListeners: Set<() => void> = new Set();

function notifyListeners() {
  errorListeners.forEach(fn => fn());
}

// Intercept fetch globally to capture API errors
const originalFetch = window.fetch.bind(window);
(window as any)._diagnosticsFetch = originalFetch;

window.fetch = async function(...args: Parameters<typeof fetch>) {
  const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
  const startTime = Date.now();
  try {
    const response = await originalFetch(...args);
    if (!response.ok && url.startsWith('/api/')) {
      const cloned = response.clone();
      try {
        const body = await cloned.json();
        addErrorLog({
          source: url.replace('/api/', 'API:'),
          message: body?.error || `HTTP ${response.status}`,
          level: response.status >= 500 ? 'error' : 'warn'
        });
      } catch {
        addErrorLog({
          source: url.replace('/api/', 'API:'),
          message: `HTTP ${response.status} - فشل الطلب`,
          level: 'error'
        });
      }
    }
    return response;
  } catch (err: any) {
    if (url.startsWith('/api/') || url.startsWith('http://localhost')) {
      addErrorLog({
        source: url.replace('/api/', 'API:').replace('http://localhost:3000', 'Server'),
        message: err.message || 'خطأ في الشبكة',
        level: 'error'
      });
    }
    throw err;
  }
};

// Intercept unhandled errors
window.addEventListener('unhandledrejection', (e) => {
  addErrorLog({
    source: 'JavaScript',
    message: e.reason?.message || String(e.reason) || 'Unhandled Promise Rejection',
    level: 'error'
  });
});

window.addEventListener('error', (e) => {
  if (e.message && !e.message.includes('ResizeObserver')) {
    addErrorLog({
      source: e.filename?.split('/').pop()?.replace('.tsx', '') || 'Script',
      message: e.message,
      level: 'error'
    });
  }
});

export function addErrorLog(entry: Omit<ErrorLogEntry, 'id' | 'time'>) {
  const newEntry: ErrorLogEntry = {
    id: Math.random().toString(36).substring(2, 11),
    time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    ...entry
  };
  errorLog.unshift(newEntry);
  if (errorLog.length > 50) errorLog.pop(); // keep last 50
  notifyListeners();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SystemDiagnosticsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [checks, setChecks] = useState<DiagCheck[]>([]);
  const [logs, setLogs] = useState<ErrorLogEntry[]>([...errorLog]);
  const [isRunning, setIsRunning] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [errorCount, setErrorCount] = useState(0);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);
  const runningRef = useRef(false);

  // Subscribe to error log changes
  useEffect(() => {
    const listener = () => {
      setLogs([...errorLog]);
      setErrorCount(prev => prev + 1);
    };
    errorListeners.add(listener);
    return () => { errorListeners.delete(listener); };
  }, []);

  const runDiagnostics = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);

    const results: DiagCheck[] = [
      { id: 'server', label: 'الخادم المحلي (Port 3000)', category: 'server', status: 'loading', message: 'جاري الفحص...' },
      { id: 'ai-key', label: 'مفتاح الذكاء الاصطناعي', category: 'ai', status: 'loading', message: 'جاري الفحص...' },
      { id: 'ai-generate', label: 'نقطة توليد النص (AI)', category: 'ai', status: 'loading', message: 'جاري الفحص...' },
      { id: 'firebase', label: 'قاعدة بيانات Firebase', category: 'database', status: 'loading', message: 'جاري الفحص...' },
      { id: 'scrape', label: 'خدمة تحليل المواقع', category: 'server', status: 'loading', message: 'جاري الفحص...' },
      { id: 'config', label: 'إعدادات المستخدم (localStorage)', category: 'config', status: 'loading', message: 'جاري الفحص...' },
    ];
    setChecks([...results]);

    const update = (id: string, patch: Partial<DiagCheck>) => {
      const idx = results.findIndex(c => c.id === id);
      if (idx !== -1) {
        results[idx] = { ...results[idx], ...patch, lastChecked: Date.now() };
        setChecks([...results]);
      }
    };

    // 1. Server Health
    try {
      const res = await (window as any)._diagnosticsFetch('/api/health', { signal: (AbortSignal as any).timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        const hasGemini = data.hasGeminiKey;
        const hasOpenai = data.hasOpenaiKey;
        update('server', {
          status: 'ok',
          message: 'الخادم يعمل بكفاءة',
          detail: `Firebase: ${data.firebaseProjectId} | Gemini Key: ${hasGemini ? '✅' : '❌'} | OpenAI Key: ${hasOpenai ? '✅' : '❌'}`
        });
        // Check server-side keys
        if (!hasGemini && !hasOpenai) {
          update('ai-key', {
            status: 'warn',
            message: 'لا توجد مفاتيح AI في بيئة الخادم (.env)',
            detail: 'الخادم يعتمد فقط على مفاتيح المستخدم من localStorage'
          });
        }
      } else {
        update('server', { status: 'error', message: `الخادم يرد بخطأ HTTP ${res.status}` });
      }
    } catch (err: any) {
      update('server', {
        status: 'error',
        message: 'الخادم لا يستجيب على المنفذ 3000',
        detail: 'تأكد من تشغيل: npm run dev - أو أعد تشغيل التطبيق'
      });
    }

    // 2. localStorage Config
    try {
      const saved = localStorage.getItem('fluxcore_ai_config');
      if (!saved) {
        update('config', {
          status: 'warn',
          message: 'لا توجد إعدادات محفوظة',
          detail: 'اذهب إلى الإعدادات وأدخل مفتاح API ثم احفظه'
        });
      } else {
        const config = JSON.parse(saved);
        if (!config.apiKey) {
          update('config', {
            status: 'warn',
            message: 'الإعدادات موجودة لكن المفتاح فارغ',
            detail: 'اذهب إلى الإعدادات وأدخل مفتاح API'
          });
        } else {
          const keyPreview = config.apiKey.substring(0, 8) + '...' + config.apiKey.slice(-4);
          update('config', {
            status: 'ok',
            message: `مفتاح ${config.provider} محفوظ`,
            detail: `المفتاح: ${keyPreview} | المزود: ${config.provider}`
          });
        }
      }
    } catch {
      update('config', { status: 'error', message: 'خطأ في قراءة localStorage' });
    }

    // 3. AI Generate Endpoint
    try {
      const saved = localStorage.getItem('fluxcore_ai_config');
      const config = saved ? JSON.parse(saved) : null;
      const apiKey = config?.apiKey || '';
      const provider = config?.provider || 'gemini';

      if (!apiKey) {
        update('ai-generate', {
          status: 'warn',
          message: 'لا يمكن اختبار AI بدون مفتاح',
          detail: 'أدخل مفتاح API في الإعدادات أولاً'
        });
        if (checks.find(c => c.id === 'ai-key')?.status !== 'warn') {
          update('ai-key', { status: 'warn', message: 'مفتاح API غير مُدخل', detail: 'اذهب إلى الإعدادات لإدخال المفتاح' });
        }
      } else {
        const res = await (window as any)._diagnosticsFetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: 'قل: OK', provider, apiKey }),
          signal: (AbortSignal as any).timeout(20000)
        });
        const data = await res.json();
        if (res.ok && data.result) {
          update('ai-generate', { status: 'ok', message: `AI يعمل بنجاح (${provider})`, detail: `الرد: ${String(data.result).substring(0, 50)}` });
          update('ai-key', { status: 'ok', message: `مفتاح ${provider} صالح ويعمل`, detail: 'تم التحقق من صحة المفتاح' });
        } else if (res.status === 401) {
          update('ai-generate', { status: 'error', message: 'مفتاح API غير صالح أو منتهي', detail: data.error });
          update('ai-key', { status: 'error', message: 'المفتاح مرفوض من الخادم', detail: 'تحقق من مفتاحك في Google AI Studio أو OpenAI' });
        } else if (res.status === 429) {
          update('ai-generate', { status: 'warn', message: 'تجاوزت حصة الاستخدام', detail: data.error });
          update('ai-key', { status: 'warn', message: 'المفتاح صالح لكن الحصة نفدت', detail: 'انتظر قليلاً أو استخدم مفتاحاً آخر' });
        } else {
          update('ai-generate', { status: 'error', message: data.error || 'خطأ غير معروف', detail: `HTTP ${res.status}` });
          update('ai-key', { status: 'unknown', message: 'غير محدد - فشل الاختبار', detail: data.error });
        }
      }
    } catch (err: any) {
      update('ai-generate', { status: 'error', message: 'فشل الوصول لنقطة AI', detail: err.message });
      update('ai-key', { status: 'unknown', message: 'لم يتم التحقق بسبب فشل الاتصال' });
    }

    // 4. Scrape
    try {
      const res = await (window as any)._diagnosticsFetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
        signal: (AbortSignal as any).timeout(10000)
      });
      const data = await res.json();
      if (res.ok) {
        update('scrape', {
          status: data.isFallback ? 'warn' : 'ok',
          message: data.isFallback ? 'يعمل في وضع Fallback (بعض المواقع محمية)' : 'خدمة التحليل تعمل بشكل كامل',
          detail: `عنوان الصفحة: ${data.title}`
        });
      } else {
        update('scrape', { status: 'error', message: data.error || 'فشل التحليل', detail: `HTTP ${res.status}` });
      }
    } catch (err: any) {
      update('scrape', { status: 'error', message: 'فشل الوصول لخدمة التحليل', detail: err.message });
    }

    // 5. Firebase (check if Firestore responds)
    try {
      const q = query(collection(db, 'brands'), limit(1));
      await getDocs(q);
      update('firebase', { status: 'ok', message: 'Firebase Firestore متصل', detail: 'تم التحقق من الاتصال بنجاح' });
    } catch (err: any) {
      const isPermission = err.code === 'permission-denied';
      update('firebase', {
        status: isPermission ? 'warn' : 'error',
        message: isPermission ? 'متصل (صلاحيات مقيدة - طبيعي)' : 'فشل الاتصال بـ Firebase',
        detail: err.message
      });
    }

    setLastRunTime(new Date().toLocaleTimeString('ar-SA'));
    setIsRunning(false);
    runningRef.current = false;
  }, []);

  // Auto-run on open
  useEffect(() => {
    if (isOpen && checks.length === 0) {
      runDiagnostics();
    }
  }, [isOpen]);

  const totalErrors = checks.filter(c => c.status === 'error').length;
  const totalWarns = checks.filter(c => c.status === 'warn').length;
  const hasIssues = totalErrors > 0 || totalWarns > 0 || errorLog.length > 0;

  const statusIcon = (status: DiagCheck['status']) => {
    switch (status) {
      case 'ok': return <CheckCircle2Icon size={14} className="text-emerald-400" />;
      case 'warn': return <AlertTriangleIcon size={14} className="text-amber-400" />;
      case 'error': return <XCircleIcon size={14} className="text-rose-400" />;
      case 'loading': return <RefreshCwIcon size={14} className="text-indigo-400 animate-spin" />;
      default: return <InfoIcon size={14} className="text-slate-500" />;
    }
  };

  const statusBg = (status: DiagCheck['status']) => {
    switch (status) {
      case 'ok': return 'border-emerald-500/20 bg-emerald-500/5';
      case 'warn': return 'border-amber-500/20 bg-amber-500/5';
      case 'error': return 'border-rose-500/20 bg-rose-500/5';
      case 'loading': return 'border-indigo-500/20 bg-indigo-500/5';
      default: return 'border-slate-800 bg-slate-900/30';
    }
  };

  const logColor = (level: ErrorLogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-rose-400 bg-rose-500/5 border-rose-500/20';
      case 'warn': return 'text-amber-400 bg-amber-500/5 border-amber-500/20';
      default: return 'text-sky-400 bg-sky-500/5 border-sky-500/20';
    }
  };

  const categories = [
    { id: 'all', label: 'الكل' },
    { id: 'server', label: '🖥️ الخادم' },
    { id: 'ai', label: '🤖 AI' },
    { id: 'database', label: '🗄️ قاعدة البيانات' },
    { id: 'config', label: '⚙️ الإعدادات' },
  ];

  const filteredChecks = activeCategory === 'all'
    ? checks
    : checks.filter(c => c.category === activeCategory);

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className={cn(
          "fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs border shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95",
          hasIssues
            ? "bg-rose-950/90 border-rose-500/40 text-rose-300 shadow-rose-500/20"
            : "bg-slate-950/90 border-slate-700 text-slate-400 shadow-black/50",
          isOpen && "ring-2 ring-indigo-500/30"
        )}
      >
        <BugIcon size={14} className={cn(hasIssues && "text-rose-400 animate-pulse")} />
        <span>تشخيص النظام</span>
        {(errorLog.length > 0 || totalErrors > 0) && (
          <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {String(totalErrors + errorLog.filter(l => l.level === 'error').length)}
          </span>
        )}
      </button>

      {/* Diagnostics Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 left-6 z-50 w-[420px] max-h-[80vh] bg-slate-950/98 border border-slate-800 rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.9)] backdrop-blur-xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-1.5 rounded-lg",
                  totalErrors > 0 ? "bg-rose-500/10" : totalWarns > 0 ? "bg-amber-500/10" : "bg-emerald-500/10"
                )}>
                  <ActivityIcon size={16} className={cn(
                    totalErrors > 0 ? "text-rose-400" : totalWarns > 0 ? "text-amber-400" : "text-emerald-400"
                  )} />
                </div>
                <div>
                  <p className="text-xs font-black text-white">مركز تشخيص النظام</p>
                  <p className="text-[9px] text-slate-500 font-bold">
                    {lastRunTime ? `آخر فحص: ${lastRunTime}` : 'لم يتم الفحص بعد'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={runDiagnostics}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-xl text-[10px] font-black text-indigo-400 transition-all disabled:opacity-40"
                >
                  <RefreshCwIcon size={10} className={isRunning ? 'animate-spin' : ''} />
                  {isRunning ? 'يفحص...' : 'إعادة الفحص'}
                </button>
                <button onClick={() => setIsOpen(false)} className="text-slate-600 hover:text-slate-400 transition-colors p-1">
                  <XIcon size={14} />
                </button>
              </div>
            </div>

            {/* Summary Bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800/50 shrink-0">
              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                <span className="text-emerald-400">{checks.filter(c => c.status === 'ok').length} ✓</span>
                <span className="text-slate-600">|</span>
                <span className="text-amber-400">{totalWarns} ⚠️</span>
                <span className="text-slate-600">|</span>
                <span className="text-rose-400">{totalErrors} ✗</span>
              </div>
              <div className="flex-1" />
              <div className="flex gap-1">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "px-2 py-0.5 rounded-lg text-[9px] font-black transition-all",
                      activeCategory === cat.id
                        ? "bg-indigo-600/30 text-indigo-400 border border-indigo-500/30"
                        : "text-slate-600 hover:text-slate-400"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-3 space-y-2 scrollbar-thin">
              {/* Diagnostic Checks */}
              <div className="space-y-1.5">
                {filteredChecks.length === 0 && (
                  <div className="text-center py-6 text-slate-600 text-xs">
                    {isRunning ? 'جاري الفحص...' : 'انقر على "إعادة الفحص" للبدء'}
                  </div>
                )}
                {filteredChecks.map(check => (
                  <div
                    key={check.id}
                    className={cn(
                      "rounded-xl p-3 border transition-all",
                      statusBg(check.status)
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{statusIcon(check.status)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-slate-200 leading-tight">{check.label}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{check.message}</p>
                        {check.detail && (
                          <p className="text-[9px] text-slate-600 mt-1 leading-relaxed font-mono break-all">{check.detail}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error Log Section */}
              <div className="pt-2 border-t border-slate-800/50">
                <button
                  onClick={() => setShowLogs(v => !v)}
                  className="flex items-center justify-between w-full text-[10px] font-black text-slate-500 hover:text-slate-400 transition-colors py-1"
                >
                  <div className="flex items-center gap-2">
                    <BugIcon size={10} />
                    سجل الأخطاء الحي ({logs.length})
                  </div>
                  {showLogs ? <ChevronUpIcon size={10} /> : <ChevronDownIcon size={10} />}
                </button>

                <AnimatePresence>
                  {showLogs && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-1 overflow-hidden"
                    >
                      {logs.length === 0 ? (
                        <div className="text-center py-3 text-slate-700 text-[10px]">
                          ✅ لا توجد أخطاء مُسجَّلة
                        </div>
                      ) : (
                        logs.slice(0, 15).map(log => (
                          <div
                            key={log.id}
                            className={cn("rounded-lg p-2 border text-[9px] font-mono", logColor(log.level))}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-black">[{log.source}]</span>
                              <span className="text-slate-600 font-sans">{log.time}</span>
                            </div>
                            <p className="break-all leading-relaxed">{log.message}</p>
                          </div>
                        ))
                      )}
                      {logs.length > 15 && (
                        <p className="text-center text-[9px] text-slate-700">... و {logs.length - 15} خطأ إضافي</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800/50 px-4 py-2 shrink-0 flex items-center justify-between">
              <p className="text-[9px] text-slate-700 font-bold">Fluxcore Diagnostics Engine v2</p>
              <button
                onClick={() => {
                  errorLog.length = 0;
                  setLogs([]);
                  setErrorCount(0);
                }}
                className="text-[9px] text-slate-700 hover:text-rose-400 transition-colors font-bold"
              >
                مسح السجل
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
