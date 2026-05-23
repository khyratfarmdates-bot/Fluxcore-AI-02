import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, Gauge, Server, ArrowDown, X, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [ping, setPing] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [qualityText, setQualityText] = useState("بدء الاتصال بالسيرفر للمعاينة...");
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // دالة قياس الاستجابة (Ping) الحقيقية
  const measurePing = async (): Promise<number> => {
    const start = performance.now();
    try {
      const res = await fetch(`/api/speedtest?size=1024&_cb=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error();
      await res.arrayBuffer();
      const end = performance.now();
      return Math.round(end - start);
    } catch {
      return 999;
    }
  };

  // دالة قياس سرعة تحميل البيانات الحقيقية
  const runSpeedTest = async (silent = false) => {
    if (isTesting || !navigator.onLine) return;
    setIsTesting(true);
    setQualityText("جاري فحص الاستجابة (Ping)...");
    if (!silent) toast.info("جاري فحص سرعة وجودة الاتصال الفعلي بالخادم...");

    try {
      // 1. حساب متوسط الـ Ping
      const pings: number[] = [];
      for (let i = 0; i < 3; i++) {
        const p = await measurePing();
        if (p < 999) pings.push(p);
        await new Promise(resolve => setTimeout(resolve, 80));
      }
      const avgPing = pings.length > 0 ? Math.round(pings.reduce((a, b) => a + b, 0) / pings.length) : 999;
      setPing(avgPing);

      // 2. فحص سرعة النطاق العريض لـ 200KB بايت
      setQualityText("جاري سحب باقة اختبار وحساب النطاق الترددي...");
      
      const start = performance.now();
      const response = await fetch(`/api/speedtest?size=250000&_cb=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) throw new Error("السيرفر لا يرسل باقات الفحص");

      const blob = await response.blob();
      const end = performance.now();

      const durationSeconds = (end - start) / 1000;
      const sizeInBits = blob.size * 8;
      const bitsPerSecond = sizeInBits / durationSeconds;
      const mbps = parseFloat((bitsPerSecond / 1000000).toFixed(2));

      setSpeed(mbps);

      // تصنيف مرئي بناء على النطاق الترددي الحالي
      if (mbps > 45) {
        setQualityText("اتصال فائق السرعة وممتاز 🚀");
      } else if (mbps > 15) {
        setQualityText("اتصال متزن وثابت جداً ⚡");
      } else if (mbps > 5) {
        setQualityText("اتصال مقبول لرفع وتحميل البيانات 📶");
      } else {
        setQualityText("سرعة محدودة وغير مستقرة حالياً ⚠️");
      }

      setLastChecked(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      if (!silent) {
        toast.success(`اكتمل فحص السرعة الحقيقي! النتائج: ${mbps} Mbps`);
      }
    } catch (err) {
      console.error("[SPEED_TEST_ERROR]", err);
      if (!silent) toast.error("تعذر إكمال فحص السرعة التفاعلي");
      setQualityText("خطأ في قراءة باقة السيرفر");
    } finally {
      setIsTesting(false);
      // استئناف المؤقت بعد اكتمال الفحص إذا كانت النافذة مفتوحة
      if (showPopover) {
        startAutoClose();
      }
    }
  };

  const startAutoClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowPopover(false);
    }, 6000); // إغلاق بعد 6 ثوانٍ من الخمول
  };

  const handleButtonClick = () => {
    if (!showPopover) {
      setShowPopover(true);
      startAutoClose();
      // تشغيل فحص سريع عند الفتح لضمان حداثة البيانات
      runSpeedTest(true);
    } else {
      setShowPopover(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  const handleMouseEnter = () => {
    // إيقاف مؤقت الإغلاق عند تمرير الماوس فوق النافذة
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleMouseLeave = () => {
    // استئناف المؤقت عند مغادرة الماوس للنافذة
    if (showPopover && !isTesting) {
      startAutoClose();
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("تم استعادة اتصال الإنترنت!");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("انقطع الاتصال بالإنترنت!");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // قياس أولي عند التشغيل
    runSpeedTest(true);

    const intervalId = setInterval(async () => {
      if (navigator.onLine) {
        const activePingValue = await measurePing();
        setPing(activePingValue);
      }
    }, 12000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const getThemeColors = () => {
    if (!isOnline) {
      return {
        bg: 'bg-rose-950/40 border-rose-900/40 text-rose-400',
        dot: 'bg-rose-500',
        text: 'text-rose-400',
        gauge: 'text-rose-500/30',
        quality: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      };
    }
    if (isTesting) {
      return {
        bg: 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300',
        dot: 'bg-indigo-400 animate-ping',
        text: 'text-indigo-400',
        gauge: 'text-indigo-500/50',
        quality: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 animate-pulse'
      };
    }
    if (!speed) {
      return {
        bg: 'bg-slate-900/60 border-slate-800 text-slate-400',
        dot: 'bg-slate-500',
        text: 'text-slate-400',
        gauge: 'text-slate-650',
        quality: 'text-slate-400 bg-slate-900 border-slate-800'
      };
    }
    if (speed > 45) {
      return {
        bg: 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400',
        dot: 'bg-emerald-500',
        text: 'text-emerald-400',
        gauge: 'text-emerald-500/70',
        quality: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      };
    }
    if (speed > 15) {
      return {
        bg: 'bg-cyan-950/40 border-cyan-500/20 text-cyan-400',
        dot: 'bg-cyan-500',
        text: 'text-cyan-400',
        gauge: 'text-cyan-500/70',
        quality: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
      };
    }
    if (speed > 5) {
      return {
        bg: 'bg-amber-950/40 border-amber-500/20 text-amber-400',
        dot: 'bg-amber-500',
        text: 'text-amber-400',
        gauge: 'text-amber-500/70',
        quality: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      };
    }
    return {
      bg: 'bg-rose-950/40 border-rose-500/20 text-rose-400',
      dot: 'bg-rose-500',
      text: 'text-rose-400',
      gauge: 'text-rose-500/70',
      quality: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    };
  };

  const colors = getThemeColors();

  return (
    <div className="relative w-full mb-3 select-none">
      
      {/* Sleek Compact Trigger Button */}
      <button 
        onClick={handleButtonClick}
        className={cn(
          "w-full text-right p-3 rounded-xl flex items-center justify-between transition-all border shadow-sm active:scale-98 cursor-pointer",
          showPopover
            ? "bg-indigo-600/10 border-indigo-500/50 text-indigo-300"
            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-750 hover:bg-slate-900/90"
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "p-1.5 rounded-lg transition-all", 
            isOnline 
              ? (isTesting ? "bg-indigo-500/10 text-indigo-400 animate-pulse" : "bg-emerald-500/10 text-emerald-400") 
              : "bg-rose-500/10 text-rose-500"
          )}>
            {isOnline ? (
              <Wifi size={14} className={cn(isTesting ? "animate-spin text-indigo-400" : "animate-pulse")} />
            ) : (
              <WifiOff size={14} />
            )}
          </div>
          <div className="text-right">
            <span className="text-[11px] font-black text-slate-300 block leading-none mb-1">سرعة الشبكة الحية</span>
            <span className="text-[8px] text-slate-500 font-bold block leading-none">
              {isOnline 
                ? (isTesting ? "جاري القياس..." : (speed !== null ? `${speed} Mbps` : "انقر للفحص")) 
                : "غير متصل"}
            </span>
          </div>
        </div>
        <div className={cn(
          "w-2 h-2 rounded-full transition-all", 
          isOnline 
            ? (isTesting ? "bg-indigo-500 animate-pulse" : "bg-emerald-500 animate-ping") 
            : "bg-rose-500"
        )} />
      </button>

      {/* Floating Popover Container */}
      {showPopover && (
        <div 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="absolute bottom-14 right-0 left-0 z-50 bg-slate-950/95 border border-slate-800 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-3 text-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-900">
            <button 
              onClick={() => {
                setShowPopover(false);
                if (timerRef.current) clearTimeout(timerRef.current);
              }}
              className="text-slate-500 hover:text-slate-350 transition-colors p-1"
            >
              <X size={12} />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-white">تفاصيل الاتصال بالخادم الرئيسي</span>
              <span className={cn("w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse", !isOnline && "bg-rose-500")} />
            </div>
          </div>

          {/* Metrics Column */}
          {isOnline ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                
                {/* السرعة الحقيقية */}
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                  <span className="text-[8px] font-bold text-slate-500 flex items-center justify-end gap-1" dir="rtl">
                    <Gauge size={10} className="text-indigo-400" /> سرعة التنزيل الفعالة
                  </span>
                  <span className="text-xs font-black text-white mt-1 text-left" dir="ltr">
                    {speed !== null ? speed : '--'} <span className="text-[9px] text-indigo-400 font-bold">Mbps</span>
                  </span>
                </div>

                {/* زمن الاستجابة */}
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                  <span className="text-[8px] font-bold text-slate-500 flex items-center justify-end gap-1" dir="rtl">
                    <Zap size={10} className="text-emerald-400" /> زمن الاستجابة Ping
                  </span>
                  <span className="text-xs font-black text-white mt-1 text-left" dir="ltr">
                    {ping !== null && ping < 999 ? `${ping}` : '--'} <span className="text-[9px] text-emerald-400 font-bold">ms</span>
                  </span>
                </div>

              </div>

              {/* Live Quality Badge */}
              <div className={cn("text-[9px] py-1.5 text-center font-black rounded-xl border transition-all duration-300", colors.quality)}>
                {qualityText}
              </div>

              {/* شريط الأداء البصري */}
              <div className="w-full bg-slate-900/60 h-1.5 rounded-full overflow-hidden border border-slate-900/85">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500", 
                    isTesting ? "bg-indigo-500 animate-pulse w-full" : 
                    !speed ? "bg-slate-700 w-[10%]" : 
                    speed > 45 ? "bg-emerald-500 w-[100%]" : 
                    speed > 25 ? "bg-teal-500 w-[75%]" : 
                    speed > 10 ? "bg-amber-500 w-[45%]" : "bg-rose-500 w-[20%]"
                  )} 
                />
              </div>

              {/* Footer / Refresh */}
              <div className="flex items-center justify-between text-[8px] text-slate-500 font-bold px-1 pt-1 border-t border-slate-900/60">
                <button 
                  onClick={() => runSpeedTest(false)}
                  disabled={isTesting}
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-350 transition-colors disabled:opacity-40"
                >
                  <RefreshCw size={9} className={isTesting ? "animate-spin" : ""} /> إعادة الفحص
                </button>
                <span>تحديث حقيقي: {lastChecked || "منذ قليل"}</span>
              </div>
            </>
          ) : (
            <div className="py-4 text-center text-slate-500 text-xs flex flex-col items-center gap-1">
              <WifiOff size={24} className="text-rose-500/40 mb-1" />
              <p className="font-black text-slate-300">أنت خارج التغطية حالياً</p>
              <p className="text-[10px] text-slate-600">يرجى فحص اتصال المودم أو كابل الشبكة.</p>
            </div>
          )}
          
        </div>
      )}

    </div>
  );
}
