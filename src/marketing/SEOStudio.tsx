import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Globe, 
  Target, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Sparkles, 
  History, 
  Activity, 
  Users, 
  Eye, 
  ShieldCheck, 
  Compass, 
  AlertTriangle, 
  ChevronLeft,
  X,
  Info,
  ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MarketingIntelligence } from '../services/MarketingIntelligence';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '../lib/soundToast';

// Helper functions for smart URL stripping
const hasUrlPath = (inputUrl: string): boolean => {
  try {
    let formatted = inputUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = 'https://' + formatted;
    }
    const parsed = new URL(formatted);
    return parsed.pathname.length > 1 || parsed.search.length > 0;
  } catch (e) {
    return false;
  }
};

const getMainDomainOnly = (inputUrl: string): string => {
  try {
    let formatted = inputUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = 'https://' + formatted;
    }
    const parsed = new URL(formatted);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch (e) {
    return inputUrl;
  }
};

export function SEOStudio() {
  const { activeBrand, updateBrand } = useWorkspace();
  const [url, setUrl] = useState(activeBrand?.seoUrl || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAutomating, setIsAutomating] = useState(false);
  const [report, setReport] = useState<any>(null);
  
  // States for Smart Path Handling and multiple audit options
  const [urlMode, setUrlMode] = useState<'strip' | 'exact'>('strip');
  const [strategyMode, setStrategyMode] = useState<'full_site' | 'competitors_search' | 'keywords_density' | 'trust_ux'>('full_site');
  const [showPathChoicePopup, setShowPathChoicePopup] = useState(false);

  // Update default states when activeBrand changes
  useEffect(() => {
    if (activeBrand?.seoUrl) {
      setUrl(activeBrand.seoUrl);
    }
  }, [activeBrand]);

  const testIfPathExists = hasUrlPath(url);

  // Triggered when analyze button is clicked
  const handleAnalyzeClick = () => {
    if (!url || !activeBrand) return;
    
    // Check if URL has subpaths and user has not explicitly chosen "exact"
    const hasPath = hasUrlPath(url);
    if (hasPath && urlMode === 'strip' && !showPathChoicePopup) {
      setShowPathChoicePopup(true);
      return;
    }

    triggerWebsiteAnalysis();
  };

  const triggerWebsiteAnalysis = async (customUrl?: string) => {
    const finalUrlToAnalyze = customUrl || (urlMode === 'strip' ? getMainDomainOnly(url) : url);
    setIsAnalyzing(true);
    setReport(null);
    setShowPathChoicePopup(false);

    try {
      if (finalUrlToAnalyze !== activeBrand?.seoUrl) {
        await updateBrand(activeBrand!.id, { seoUrl: finalUrlToAnalyze });
      }

      const result = await MarketingIntelligence.analyzeWebsite(finalUrlToAnalyze, activeBrand!.id, strategyMode);
      setReport(result);
      toast.success("اكتمل فحص السيو الذكي المخصص بنجاح!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "فشل التحليل.. يرجى التحقق من الرابط والمحاولة مرة أخرى.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartAutomation = async () => {
    if (!activeBrand) return;
    setIsAutomating(true);
    try {
      const newState = !activeBrand.seoAutomationEnabled;
      await updateBrand(activeBrand.id, { 
        seoAutomationEnabled: newState,
        seoUrl: url 
      });
      toast.success(newState ? "تم تفعيل نظام الأتمتة الذكي ومسح الأكواد!" : "تم إيقاف أتمتة السيو.");
    } catch (err) {
      toast.error("فشل تحديث حالة الأتمتة.");
    } finally {
      setIsAutomating(false);
    }
  };

  const strategyOptions = [
    { 
      id: 'full_site', 
      title: 'فحص بنيوي وسيو شامل بالكامل', 
      desc: 'تدقيق فني متكامل للميتا، ووسوم العناوين (H1-H3)، ومشاكل الأرشفة والأكواد للرابط بالكامل.',
      icon: <Globe className="text-indigo-400 group-hover:scale-110 transition-transform" size={20} />,
      badge: 'الوضع الفني'
    },
    { 
      id: 'competitors_search', 
      title: 'تحليل المنافسين الفوري ببحث الويب', 
      desc: 'معاينة حية وتجسس في محركات البحث (Spy SEO) لمقارنة موقعك مع 3 منافسين محليين واستنباط الثغرات.',
      icon: <Users className="text-emerald-400 group-hover:scale-110 transition-transform" size={20} />,
      badge: 'واقعي / ويب فوري'
    },
    { 
      id: 'keywords_density', 
      title: 'تحسين الكثافة وبوصلة نية البحث', 
      desc: 'تحليل الكلمات ذات نية الشراء الأعلى (Commercial Intent) ومدى ملاءمتها مع محركات بحث جوجل.',
      icon: <Target className="text-amber-400 group-hover:scale-110 transition-transform" size={20} />,
      badge: 'رائج ومربح'
    },
    { 
      id: 'trust_ux', 
      title: 'تحليل الموثوقية وتجربة العميل E-E-A-T', 
      desc: 'فحص جودة نصوص الإقناع (CRO) وعناصر الأمان لتقليص سلال المشتريات المتروكة في متجرك.',
      icon: <Compass className="text-rose-400 group-hover:scale-110 transition-transform" size={20} />,
      badge: 'مستوى زيادة المبيعات'
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 rtl text-right">
      
      {/* Dynamic Path Choice Alert Modal */}
      <AnimatePresence>
        {showPathChoicePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPathChoicePopup(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-indigo-500/10 space-y-6 text-right z-10"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <AlertTriangle size={24} className="animate-bounce" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">توجيه ذكي: تم رصد مسار مخصص</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">سيو استخباراتي ذكي • تبسيط الروبوتات</p>
                </div>
              </div>

              <div className="space-y-4 text-slate-300 text-sm leading-relaxed mb-8">
                <p>لقد قمت بإدخال رابط يشتمل على مسارات فرعية:</p>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs break-all text-indigo-300">
                  {url}
                </div>
                <p>
                  الخوارزمية توصي بـ <span className="text-white font-extrabold underline decoration-indigo-400">تجريد المسارات وفحص النطاق الرئيسي بالكامل</span> لتحصيل نتائج وهيكل السيو العام لمتجرك بالكامل، ولكن يمكنك حصر التحليل في هذه الصفحة إذا كنت تجري مراجعة لصفحة هبوط معينة.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setUrlMode('strip');
                    const stripped = getMainDomainOnly(url);
                    setUrl(stripped);
                    triggerWebsiteAnalysis(stripped);
                  }}
                  className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/15"
                >
                  <span className="text-sm">🌐 فحص النطاق بالكامل</span>
                  <span className="text-[9px] opacity-85 font-medium">(موصى به لتدقيق السيو الشامل)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUrlMode('exact');
                    triggerWebsiteAnalysis(url);
                  }}
                  className="p-4 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-2 transition-all"
                >
                  <span className="text-sm text-white">📄 فحص الرابط المحدد</span>
                  <span className="text-[9px] opacity-85 font-medium">(تحليل هذه الصفحة الفرعية فقط)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header section with theme alignment */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-white flex items-center gap-3 justify-start">
          <Sparkles className="text-indigo-400" />
          SEO Studio الذكي
        </h1>
        <p className="text-slate-400 font-semibold text-sm">حلل متجرك الإلكتروني بأقوى خوارزميات الاستخبارات والمطابقة مع نية الشراء الفورية في محركات البحث.</p>
      </div>

      {/* Master Control Board */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-[35px] p-8 space-y-8 relative overflow-hidden backdrop-blur-sm">
        <div className="absolute -left-20 -top-20 w-44 h-44 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* URL Entry column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">رابط المتجر أو الموقع</label>
              
              {testIfPathExists && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold">{urlMode === 'strip' ? "تم التبسيط والتدقيق الشامل" : "فحص الصفحة المحددة"}</span>
                  <button 
                    onClick={() => {
                      if (urlMode === 'strip') {
                        setUrlMode('exact');
                      } else {
                        setUrlMode('strip');
                        setUrl(getMainDomainOnly(url));
                      }
                    }}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-black border transition-colors ${
                      urlMode === 'strip' 
                        ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-400" 
                        : "bg-amber-600/10 border-amber-500/20 text-amber-400"
                    }`}
                  >
                    {urlMode === 'strip' ? "🌐 كامل النطاق" : "📄 المسار المخصص"}
                  </button>
                </div>
              )}
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500/5 blur-xl rounded-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative flex items-center bg-slate-950 border border-slate-800 group-focus-within:border-indigo-500/40 rounded-2xl p-2.5">
                <Globe className="text-slate-500 mx-3 shrink-0" size={20} />
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUrl(val);
                    if (!val) setUrlMode('strip');
                  }}
                  placeholder="https://example.com/store"
                  className="flex-1 bg-transparent border-none outline-none text-white font-medium py-3 text-sm ltr"
                />
                
                <button 
                  onClick={handleAnalyzeClick}
                  disabled={isAnalyzing || !url}
                  className="px-6 py-3 bg-indigo-600 hover:bg-slate-100 text-white hover:text-slate-950 rounded-xl font-black text-xs flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/10 ml-1 select-none"
                >
                  {isAnalyzing ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search size={15} />
                  )}
                  {isAnalyzing ? "جاري الفحص..." : "بدء التحليل"}
                </button>
              </div>
            </div>

            {testIfPathExists && urlMode === 'strip' && (
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 p-2 rounded-lg bg-slate-950/20 border border-slate-800/40 font-medium">
                <Info size={12} className="text-indigo-400 shrink-0" />
                <span>قمنا بتجريد المسار الفرعي لنفحص لك النطاق الرئيسي كاملاً لتقديم فحص سيو شامل. إذا أردت تحجيمه لصفحة فرعية محددة اضغط على الزر بالأعلى.</span>
              </p>
            )}
          </div>

          {/* Multiple Audit Options column */}
          <div className="lg:col-span-6 space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">خيارات وعمق الفحص الاستراتيجي</label>
            <div className="grid grid-cols-2 gap-3">
              {strategyOptions.map(opt => {
                const isSelected = strategyMode === opt.id;
                return (
                  <button 
                    key={opt.id}
                    onClick={() => setStrategyMode(opt.id as any)}
                    className={cn(
                      "flex flex-col items-start gap-2 p-3.5 rounded-2xl border transition-all text-right group",
                      isSelected 
                        ? "bg-indigo-500/10 border-indigo-500/40 text-white shadow-xl shadow-indigo-500/5" 
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        {opt.icon}
                      </div>
                      <span className={cn(
                        "text-[9px] px-2 py-0.5 rounded-full font-black",
                        isSelected ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-900 text-slate-600"
                      )}>
                        {opt.badge}
                      </span>
                    </div>
                    <span className="font-extrabold text-xs block text-white mt-1">
                      {opt.title}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Analysis Report Section */}
      <AnimatePresence mode="wait">
        {report ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Column 1: Main Diagnostic Insights (2 Cols Wide) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-8">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <BarChart3 className="text-indigo-400" />
                    تحليل الأداء ومقارنة السوق محلياً
                  </h3>
                  
                  <span className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-400 text-[10px] font-black uppercase rounded-lg">
                    {strategyMode === 'competitors_search' ? "وضع استخبارات الويب جاسوس" :
                     strategyMode === 'keywords_density' ? "تحليل نية الشراء الكثيفة" :
                     strategyMode === 'trust_ux' ? "فحص عوامل الثقة والـ CRO" :
                     "الفحص البنيوي الشامل"}
                  </span>
                </div>

                {report.isFallback && (
                  <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-start gap-3">
                    <span className="text-lg shrink-0 mt-0.5">⚠️</span>
                    <div className="space-y-1">
                      <p className="font-extrabold text-[13px]">
                        {report.fallbackReason ? `تنبيه: محمي بواسطة جدار حماية البرمجة (${report.fallbackReason})` : "تنبيه: تعذر الوصول الرقمي المباشر"}
                      </p>
                      <p className="text-slate-400 font-medium text-[11px] leading-relaxed">
                        لقد قام نظام فلوكس كور بتوليد استخبارات تقديرية واقعية وحسابات ذكية للسيو والكلمات البحثية الأكثر بحثاً لموقعك لاستكمال التخطيط والمنافسة بنجاح كامل.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Scores Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* SEO Score */}
                    <div className="flex flex-col items-center gap-3 p-6 bg-slate-950 border border-slate-800/80 rounded-3xl relative overflow-hidden group">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-indigo-500" strokeDasharray="175.8" strokeDashoffset={175.8 * (1 - (report.seoScore || 0) / 100)} />
                        </svg>
                        <span className="absolute text-sm font-black text-white">{report.seoScore || 0}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-300">النتيجة العامة للسيو</p>
                    </div>

                    {/* Technical Score */}
                    <div className="flex flex-col items-center gap-3 p-6 bg-slate-950 border border-slate-800/80 rounded-3xl relative overflow-hidden group">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-emerald-500" strokeDasharray="175.8" strokeDashoffset={175.8 * (1 - (report.technicalScore || 0) / 100)} />
                        </svg>
                        <span className="absolute text-sm font-black text-white">{report.technicalScore || 0}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-300">تحسينات الأكواد البرمجية</p>
                    </div>

                    {/* Content Score */}
                    <div className="flex flex-col items-center gap-3 p-6 bg-slate-950 border border-slate-800/80 rounded-3xl relative overflow-hidden group">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-amber-500" strokeDasharray="175.8" strokeDashoffset={175.8 * (1 - (report.contentScore || 0) / 100)} />
                        </svg>
                        <span className="absolute text-sm font-black text-white">{report.contentScore || 0}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-300">{strategyMode === 'trust_ux' ? 'هندسة الإقناع والبيع' : 'جودة وكثافة المحتوى'}</p>
                    </div>

                  </div>

                  {report.summary && (
                    <div className="p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl">
                       <p className="text-sm text-slate-200 leading-relaxed"><span className="font-extrabold text-indigo-400 block mb-2 text-xs uppercase tracking-widest">موجز استراتيجي للمتجر:</span> {report.summary}</p>
                    </div>
                  )}

                  {/* ──────────────────────────────────────────────────────────── */}
                  {/* VIEW 1: Competitors Search (Spy SEO) */}
                  {/* ──────────────────────────────────────────────────────────── */}
                  {strategyMode === 'competitors_search' && report.competitorsTable && (
                    <div className="space-y-4 p-6 bg-slate-950 border border-slate-800/80 rounded-3xl">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                          <Users size={16} /> مصفوفة مقارنة المنافسين المحترفة (Spy SEO Matrix)
                        </h4>
                        <span className="text-[10px] text-slate-500 font-bold">3 منافسين محليين مباشرين</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs text-slate-300">
                          <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                            <tr>
                              <th className="p-3">المنافس والنطاق</th>
                              <th className="p-3 text-center">قوة النطاق</th>
                              <th className="p-3">الكلمات الفائزة لديه</th>
                              <th className="p-3 text-indigo-400">الثغرة والميزة للتفوق</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {report.competitorsTable.map((comp: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-900/40">
                                <td className="p-3 font-bold text-white">
                                  <div>{comp.name}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{comp.domain}</div>
                                </td>
                                <td className="p-3 text-center">
                                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-bold text-[10px] border border-indigo-500/20">
                                    {comp.authorityScore}/100
                                  </span>
                                </td>
                                <td className="p-3 text-slate-300 font-medium">{comp.winningKeywords}</td>
                                <td className="p-3 text-emerald-400 font-semibold">{comp.gapAdvantage}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ──────────────────────────────────────────────────────────── */}
                  {/* VIEW 2: Keywords Density & Intent */}
                  {/* ──────────────────────────────────────────────────────────── */}
                  {strategyMode === 'keywords_density' && report.keywordsIntentTable && (
                    <div className="space-y-4 p-6 bg-slate-950 border border-slate-800/80 rounded-3xl">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-amber-400 tracking-widest flex items-center gap-2">
                          <Target size={16} /> مصفوفة الكثافة ونية الشراء (Commercial Intent Matrix)
                        </h4>
                        <span className="text-[10px] text-slate-500 font-bold">تحليل الكلمات عالية التردد والتحويل</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs text-slate-300">
                          <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                            <tr>
                              <th className="p-3">الكلمة المفتاحية</th>
                              <th className="p-3">تصنيف نية البحث</th>
                              <th className="p-3 text-center">التكرار الفعلي</th>
                              <th className="p-3 text-center">معدل الكثافة</th>
                              <th className="p-3 text-emerald-400 text-center">فرصة التحويل والمبيعات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {report.keywordsIntentTable.map((kw: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-900/40">
                                <td className="p-3 font-bold text-white">{kw.keyword}</td>
                                <td className="p-3">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                    kw.intent.includes("Commercial") || kw.intent.includes("تجاري")
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                  )}>
                                    {kw.intent}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-mono font-bold text-slate-200">{kw.occurrences} مرة</td>
                                <td className="p-3 text-center font-mono text-amber-400 font-bold">{kw.density}</td>
                                <td className="p-3 text-center font-bold text-emerald-400">{kw.conversionPotential}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ──────────────────────────────────────────────────────────── */}
                  {/* VIEW 3: Trust & UX E-E-A-T */}
                  {/* ──────────────────────────────────────────────────────────── */}
                  {strategyMode === 'trust_ux' && report.trustMetrics && (
                    <div className="space-y-6 p-6 bg-slate-950 border border-slate-800/80 rounded-3xl">
                      <h4 className="text-xs font-black uppercase text-cyan-400 tracking-widest flex items-center gap-2">
                        <ShieldCheck size={16} /> مظلة الموثوقية وتجربة العميل (E-E-A-T & CRO Trust Matrix)
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-1 text-center">
                          <span className="text-xs text-slate-400 font-bold">تشفير الأمان (SSL)</span>
                          <span className={cn("text-xs font-black", report.trustMetrics.sslVerified ? "text-emerald-400" : "text-rose-400")}>
                            {report.trustMetrics.sslVerified ? "✅ محمي وموثق HTTPS" : "❌ غير آمن"}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-1 text-center">
                          <span className="text-xs text-slate-400 font-bold">وسائل التواصل المباشر</span>
                          <span className={cn("text-xs font-black", report.trustMetrics.contactPointFound ? "text-emerald-400" : "text-amber-400")}>
                            {report.trustMetrics.contactPointFound ? "✅ هاتف / واتساب موثق" : "⚠️ يحتاج توضيح"}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-1 text-center">
                          <span className="text-xs text-slate-400 font-bold">السجل والتراخيص</span>
                          <span className={cn("text-xs font-black", report.trustMetrics.taxOrCRFound ? "text-emerald-400" : "text-amber-400")}>
                            {report.trustMetrics.taxOrCRFound ? "✅ بيانات موثوقة" : "⚠️ ناقص"}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-1 text-center">
                          <span className="text-xs text-slate-400 font-bold">درجة الموثوقية الكلية</span>
                          <span className="text-xs font-black text-indigo-400">
                            {report.trustMetrics.trustScore}/100
                          </span>
                        </div>
                      </div>

                      {report.trustMetrics.croFixes && (
                        <div className="space-y-3">
                          <span className="text-xs font-bold text-slate-300 block">إصلاحات الإقناع وتقليل السلات المتروكة (CRO Actions):</span>
                          <div className="grid gap-2">
                            {report.trustMetrics.croFixes.map((fix: string, idx: number) => (
                              <div key={idx} className="flex gap-3 text-xs p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 items-center">
                                <CheckCircle2 size={14} className="text-cyan-400 shrink-0" />
                                <span>{fix}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ──────────────────────────────────────────────────────────── */}
                  {/* VIEW 4: Technical Details Matrix for Full Site */}
                  {/* ──────────────────────────────────────────────────────────── */}
                  {report.technicalDetails && (
                    <div className="p-6 bg-slate-950 border border-slate-800/80 rounded-3xl space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                        <Globe size={16} /> التدقيق البنيوي الفعلي لمستند DOM المجلوب
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-300">
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">حجم الصفحة الأصلي</span>
                          <span className="font-bold font-mono text-white text-sm">{report.technicalDetails.pageSizeKB} KB</span>
                        </div>
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">عناوين H1 الرئيسية</span>
                          <span className="font-bold text-white text-sm">{report.technicalDetails.h1s.length} عنوان</span>
                        </div>
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">صور بدون ALT</span>
                          <span className={cn("font-bold text-sm", report.technicalDetails.imagesWithoutAlt > 0 ? "text-rose-400" : "text-emerald-400")}>
                            {report.technicalDetails.imagesWithoutAlt} من أصل {report.technicalDetails.imagesCount}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">مخطط Schema Markup</span>
                          <span className={cn("font-bold text-sm", report.technicalDetails.hasSchema ? "text-emerald-400" : "text-amber-400")}>
                            {report.technicalDetails.hasSchema ? "✅ متوفر (JSON-LD)" : "⚠️ مفقود"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {report.prediction && (
                    <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-3xl">
                       <p className="text-sm text-slate-200 leading-relaxed"><span className="font-extrabold text-amber-400 block mb-2 text-xs uppercase tracking-widest">تقديرات الظهور المتوقع بمحركات البحث:</span> {report.prediction}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-emerald-500 tracking-widest">نقاط القوة الحالية</h4>
                      <div className="grid gap-2">
                        {report.strengths?.map((s: string, i: number) => (
                          <div key={i} className="flex gap-3 text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300">
                             <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                             <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-rose-500 tracking-widest">الثغرات والتحذيرات</h4>
                      <div className="grid gap-2">
                        {report.weaknesses?.map((w: string, i: number) => (
                          <div key={i} className="flex gap-3 text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300">
                             <Zap size={13} className="text-rose-500 shrink-0 mt-0.5" />
                             <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {report.technicalInsights && (
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-850 space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-500 block tracking-widest">تفاصيل تقنية وتحليلية مكثفة:</span>
                      <p className="text-slate-300 text-xs leading-relaxed">{report.technicalInsights}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">توصيات التنفيذ الفوري (توجيه عالي النفع)</h4>
                    <div className="grid grid-cols-1 gap-3">
                       {report.recommendations?.map((rec: string, i: number) => (
                          <div key={i} className="flex gap-4 p-4 bg-slate-950 border border-slate-800/80 rounded-2xl group hover:border-indigo-500/30 transition-colors items-start">
                             <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-[10px] font-black shrink-0 mt-0.5">
                                {i + 1}
                             </div>
                             <p className="text-slate-300 text-sm font-semibold">{rec}</p>
                          </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Automation & Sidebar Widgets */}
            <div className="space-y-6">
                <div className={cn(
                  "rounded-[32px] p-8 text-white flex flex-col gap-6 shadow-2xl transition-all duration-500 relative overflow-hidden",
                  activeBrand?.seoAutomationEnabled 
                    ? "bg-emerald-600 shadow-emerald-500/20" 
                    : "bg-indigo-600 shadow-indigo-500/20"
                )}>
                  <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 blur-xl pointer-events-none rounded-full" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-black mb-2 flex items-center gap-2">
                        {activeBrand?.seoAutomationEnabled ? <Activity className="animate-pulse" /> : <Zap />}
                        أتمتة السيو والزحف
                      </h4>
                      <p className="text-white/80 text-xs font-medium leading-relaxed">
                        {activeBrand?.seoAutomationEnabled 
                          ? "نظام الأتمتة يعمل حالياً على مراقبة وتحديث الكلمات المفتاحية." 
                          : "دع Fluxcore AI يقوم بتحديث الأوصاف والكلمات المفتاحية تلقائياً وبناء خرائط أرشفة متقدمة لموقعك."}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleStartAutomation}
                    disabled={isAutomating}
                    className="w-full py-3.5 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isAutomating ? (
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {activeBrand?.seoAutomationEnabled ? <Zap size={15} /> : <ArrowRight size={15} className="rotate-180" />}
                        {activeBrand?.seoAutomationEnabled ? "إيقاف الأتمتة الذكية" : "ابدأ الأتمتة الآن"}
                      </>
                    )}
                  </button>
               </div>

               <div className="bg-slate-950 border border-slate-800 rounded-[32px] p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                       <History size={14} /> سجل التحديثات والزحف
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-[10px] flex justify-between items-center font-semibold">
                       <span className="text-slate-400">آخر فحص استباقي:</span>
                       <span className="text-indigo-400 font-extrabold font-mono">الآن</span>
                    </div>
                    <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-[10px] flex justify-between items-center opacity-50">
                       <span className="text-slate-400">تحديث المخطط والميتا:</span>
                       <span className="text-slate-500">تلقائي أسبوعي</span>
                    </div>
                  </div>
               </div>

               <div className="bg-slate-950 border border-slate-800 rounded-[32px] p-8 space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest">الكلمات المفتاحية المقترحة (ذات طابع تجاري)</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.suggestedKeywords?.map((kw: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-900 border border-slate-805 rounded-xl text-[11px] font-extrabold text-slate-300 hover:text-white hover:border-slate-500 transition-all cursor-default flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-indigo-500" />
                        {kw}
                      </span>
                    ))}
                  </div>
               </div>
            </div>
          </motion.div>
        ) : isAnalyzing ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-400 font-extrabold animate-pulse text-sm">جاري تنظيف الرقائق واستجلاب بيانات السوق ومحاكاة البحث...</p>
          </div>
        ) : (
          <div className="h-64 border-2 border-dashed border-slate-805 rounded-[32px] flex flex-col items-center justify-center gap-4 text-slate-500 bg-slate-900/10">
             <Globe size={44} className="opacity-15 animate-pulse" />
             <p className="font-extrabold text-xs">أدخل رابط متجرك واختر استراتيجيتك لبدء التحسين واستخراج الثغرات</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
