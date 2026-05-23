import React, { useState, useEffect } from "react";
import { Flag, Target, TrendingUp, Calendar, Layout, ListTodo, Plus, Info, CheckCircle2, AlertTriangle, Crosshair, BarChart3, Zap, Layers, Share2, Loader2, Search, Send } from "lucide-react";
import { cn } from "../lib/utils";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { campaignService, Campaign } from "../services/CampaignService";
import { intelligenceService, StrategicInsight } from "../services/IntelligenceService";
import { strategicEngine } from "../services/StrategicContentEngine";
import { publishingService, PublishingTask } from "../services/publishing";
import { toast } from '../lib/soundToast';
import { motion, AnimatePresence } from "motion/react";
import { Timestamp } from "firebase/firestore";
import { trackingEngine } from "../services/behaviorTracking";
import { ShareModal } from "../components/ShareModal";

export function CampaignOS() {
  const { activeBrand } = useWorkspace();
  const [activeTab, setActiveTab] = useState<"overview" | "planner" | "insights" | "calendar">("overview");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [insights, setInsights] = useState<StrategicInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [shareCampaign, setShareCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    trackingEngine.trackEvent('navigation', 'campaign_os', window.location.pathname, { tab: activeTab });
  }, [activeTab]);

  useEffect(() => {
    if (activeBrand) {
      loadData();
    }
  }, [activeBrand]);

  const loadData = async () => {
    if (!activeBrand) return;
    setLoading(true);
    try {
      const [campData, insData] = await Promise.all([
        campaignService.getActiveCampaigns(activeBrand.id),
        intelligenceService.getLatestInsights(activeBrand.id)
      ]);
      setCampaigns(campData);
      setInsights(insData);
    } catch (err) {
      console.error(err);
      toast.error("فشل تحميل بيانات الحملات");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (objective: string = 'awareness', budget: number = 5000) => {
    if (!activeBrand) return;
    setCreating(true);
    trackingEngine.trackEvent('tool_usage', 'create_campaign', window.location.pathname, { objective });
    try {
       await strategicEngine.generateCampaignPlan(activeBrand.id, objective, budget);
       toast.success("تم إنشاء الحملة الاستراتيجية بنجاح!");
       loadData();
    } catch (err) {
       toast.error("فشل إنشاء الحملة");
    } finally {
       setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-hidden">
      <header className="flex justify-between items-center shrink-0 mb-6 relative z-10 gap-4 border-b border-slate-800/80 pb-6">
         <div>
            <h2 className="text-xl font-black text-indigo-400 flex items-center gap-2 mb-1">
              <Flag size={20} /> نظام تشغيل الحملات الذكي (Campaign OS)
            </h2>
            <p className="text-sm font-medium text-slate-400">إدارة الاستراتيجيات، تتبع الأهداف، وتحليل الأداء التنفيذي لكل حملة.</p>
         </div>
         <div className="flex items-center gap-3">
            {creating && <Loader2 className="animate-spin text-indigo-500" size={20} />}
            <button 
              disabled={creating}
              onClick={() => handleCreateCampaign()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all">
               <Plus size={18} /> إنشاء حملة جديدة
            </button>
         </div>
      </header>

      <div className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 shadow-sm w-fit mb-6 shrink-0 overflow-x-auto">
          <button onClick={() => setActiveTab("overview")} className={cn("flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap", activeTab === "overview" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
            <Layout size={16}/> نظرة عامة
          </button>
          <button onClick={() => setActiveTab("planner")} className={cn("flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap", activeTab === "planner" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
            <Target size={16}/> المخطط الذكي
          </button>
          <button onClick={() => setActiveTab("calendar")} className={cn("flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap", activeTab === "calendar" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
            <Calendar size={16}/> التقويم الاستراتيجي
          </button>
          <button onClick={() => setActiveTab("insights")} className={cn("flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap", activeTab === "insights" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200")}>
            <TrendingUp size={16}/> استخبارات المحتوى
          </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
         {activeTab === "overview" && <CampaignOverview campaigns={campaigns} insights={insights} loading={loading} onRefresh={loadData} onShareCampaign={(camp: any) => setShareCampaign(camp)} />}
         {activeTab === "planner" && <StrategicPlanner brandId={activeBrand?.id} onCreate={handleCreateCampaign} loading={creating} />}
         {activeTab === "calendar" && <StrategicCalendar brandId={activeBrand?.id} campaigns={campaigns} />}
         {activeTab === "insights" && <ContentIntelligenceView insights={insights} brandId={activeBrand?.id} />}
      </div>

      {shareCampaign && (
        <ShareModal
          isOpen={!!shareCampaign}
          onClose={() => setShareCampaign(null)}
          title={`مشاركة خطة الحملة: ${shareCampaign.name}`}
          shareUrl={`${window.location.origin}/shared/campaign/${shareCampaign.id}`}
          previewType="campaign"
          previewDetails={{
            name: shareCampaign.name,
            subtitle: `مستهدف: ${shareCampaign.objective}`,
            extraLabel: "الميزانية الكلية",
            extraValue: `$${shareCampaign.budget?.toLocaleString()}`
          }}
        />
      )}
    </div>
  );
}

function CampaignOverview({ campaigns, insights, loading, onRefresh, onShareCampaign }: any) {
  if (loading) return <div className="p-20 text-center animate-pulse text-slate-500 font-black">جاري تحليل بيانات الحملات...</div>;

  const totalBudget = campaigns.reduce((acc: number, c: any) => acc + (c.budget || 0), 0);
  const activeCount = campaigns.filter((c: any) => c.status === 'active').length;

  return (
    <div className="flex flex-col gap-8">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard title="الحملات النشطة" value={activeCount} trend="+12%" icon={<Flag className="text-indigo-400" />} />
          <MetricCard title="إجمالي الميزانية" value={`$${totalBudget.toLocaleString()}`} trend="+4.5%" icon={<Share2 className="text-emerald-400" />} />
          <MetricCard title="معدل التفاعل" value="4.8%" trend="+0.2%" icon={<TrendingUp className="text-rose-400" />} />
          <MetricCard title="توقعات النمو" value="+15%" status="High" icon={<Zap className="text-amber-400" />} />
       </div>
...

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Campaigns List */}
          <div className="lg:col-span-2 space-y-4">
             <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">الحملات النشطة حالياً</h3>
             {campaigns.length === 0 ? (
               <div className="p-12 text-center bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 font-bold">
                 لا توجد حملات نشطة. ابدأ بالتخطيط لواحدة الآن.
               </div>
             ) : (
               campaigns.map((camp: Campaign) => (
                 <div key={camp.id} className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl hover:bg-slate-900 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <h4 className="text-lg font-black text-white">{camp.name}</h4>
                             <span className="text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">{camp.objective}</span>
                          </div>
                          <p className="text-sm text-slate-400 font-medium whitespace-pre-wrap">بداية: {camp.startDate?.toDate().toLocaleDateString('ar-EG')} - نهاية: {camp.endDate?.toDate().toLocaleDateString('ar-EG')}</p>
                       </div>
                       <div className="text-right">
                          <span className="text-xl font-black text-white">$ {camp.budget?.toLocaleString()}</span>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">الميزانية المرصودة</p>
                       </div>
                    </div>

                    <div className="h-2 w-full bg-slate-800 rounded-full mb-6 overflow-hidden">
                       <div className="h-full bg-indigo-600 rounded-full" style={{ width: '45%' }}></div>
                    </div>

                    <div className="flex items-center justify-between">
                       <div className="flex -space-x-2">
                          {['X', 'In', 'Fb'].map(p => (
                            <div key={p} className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">{p}</div>
                          ))}
                       </div>
                       <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onShareCampaign?.(camp);
                            }}
                            className="text-xs font-black text-rose-400 hover:text-white bg-rose-500/5 hover:bg-rose-600 border border-rose-500/10 px-3 py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <Share2 size={13} />
                            <span>مشاركة الخطة</span>
                          </button>
                          
                          <button className="text-xs font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer">عرض لوحة القيادة <TrendingUp size={14} /></button>
                       </div>
                    </div>
                 </div>
               ))
             )}
          </div>

          {/* Side Intelligence Widgets */}
          <div className="space-y-6">
             <div className="bg-gradient-to-br from-rose-500/10 to-slate-900 border border-rose-500/20 rounded-3xl p-6">
                <h3 className="font-black text-rose-400 flex items-center gap-2 mb-4"><AlertTriangle size={18}/> فجوات المحتوى (Gaps)</h3>
                <div className="space-y-4">
                   <div className="p-3 bg-slate-950/60 rounded-xl border border-rose-500/5">
                      <p className="text-sm font-bold text-slate-200">نقص في الفيديوهات التعليمية (Tutorials) هذا الشهر.</p>
                      <p className="text-[10px] font-medium text-slate-500 mt-1">مقترح: إنشاء 3 مقاطع ريلز تشرح المنتج.</p>
                   </div>
                   <div className="p-3 bg-slate-950/60 rounded-xl border border-rose-500/5">
                      <p className="text-sm font-bold text-slate-200">قلة التفاعل يوم الثلاثاء بعد الساعة 5م.</p>
                   </div>
                </div>
             </div>

             <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                <h3 className="font-black text-white flex items-center gap-2 mb-4"><TrendingUp size={18} className="text-emerald-400"/> التحليل التنبؤي</h3>
                <div className="space-y-4">
                   {insights.filter((i: any) => i.type === 'performance').map((insight: StrategicInsight) => (
                      <div key={insight.id} className="flex flex-col gap-1 border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                         <h4 className="text-sm font-bold text-slate-200">{insight.title}</h4>
                         <p className="text-xs text-slate-400">{insight.description}</p>
                         <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-slate-800 rounded-full">
                               <div className="h-full bg-emerald-500" style={{ width: `${insight.confidence * 100}%` }}></div>
                            </div>
                            <span className="text-[10px] font-black text-emerald-400">{Math.round(insight.confidence * 100)}%</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function MetricCard({ title, value, trend, status, icon }: any) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-[2rem] flex flex-col gap-1 hover:border-slate-700 transition-colors">
       <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl">{icon}</div>
          {trend && <span className="text-[10px] font-black text-emerald-400">{trend}</span>}
          {status && <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded uppercase">{status}</span>}
       </div>
       <div className="text-2xl font-black text-white">{value}</div>
       <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</div>
    </div>
  )
}

function StrategicPlanner({ brandId, onCreate, loading }: { brandId?: string, onCreate: (objective: string, budget: number) => void, loading: boolean }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[3rem] p-10 text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-2xl">
             {loading ? <Loader2 size={40} className="animate-spin" /> : <Crosshair size={40} />}
          </div>
          <div>
             <h3 className="text-3xl font-black text-white mb-2">AI Campaign Planner</h3>
             <p className="text-slate-400 font-medium max-w-xl">دع الذكاء الاصطناعي يبني لك استراتيجية حملة كاملة بناءً على أهدافك الحقيقية، سياق السوق، وذاكرة البراند.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
             <button 
               disabled={loading}
               onClick={() => onCreate('awareness', 10000)}
               className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-4 rounded-3xl text-sm font-black shadow-xl shadow-indigo-600/30 flex items-center gap-3 active:scale-95 transition-all">
                إنشاء حملة وعي (Awareness) <Zap size={18} />
             </button>
             <button 
               disabled={loading}
               onClick={() => onCreate('conversion', 15000)}
               className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-8 py-4 rounded-3xl text-sm font-black border border-slate-800 shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                إنشاء حملة مبيعات (Sales) <Target size={18} />
             </button>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
             <div className="flex items-center gap-3 text-white font-bold"><Layers size={20} className="text-indigo-400" /> نماذج الاستراتيجيات</div>
             <div className="grid gap-2">
                <TemplateItem onClick={() => onCreate('awareness', 5000)} icon={<TrendingUp size={14}/>} title="زيادة الوعي (Awareness Burst)" desc="حملة مكثفة لزيادة الوصول في وقت قصير." />
                <TemplateItem onClick={() => onCreate('conversion', 7000)} icon={<Target size={14}/>} title="تحويل مبيعات (Conversion Focus)" desc="استراتيجية مبنية على عرض فوائد المنتج والـ CTA." />
                <TemplateItem onClick={() => onCreate('community', 3000)} icon={<CheckCircle2 size={14}/>} title="بناء مجتمع (Community Building)" desc="تفاعل عالي، أسئلة، ومحتوى لرفع الولاء." />
             </div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
             <div className="flex items-center gap-3 text-white font-bold mb-4"><BarChart3 size={20} className="text-emerald-400" /> الرؤى التشغيلية</div>
             <div className="space-y-4">
                <InsightItem indicator="Optimal Platforms" value="LinkedIn, X" />
                <InsightItem indicator="Suggested Duration" value="14 Days" />
                <InsightItem indicator="Est. Reach" value="250K - 400K" />
             </div>
          </div>
       </div>
    </div>
  )
}

function TemplateItem({ icon, title, desc, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 p-3 bg-slate-950/40 border border-slate-800 rounded-xl hover:border-indigo-500/40 text-right transition-all group">
       <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 shrink-0">{icon}</div>
       <div>
          <div className="text-sm font-bold text-slate-200">{title}</div>
          <div className="text-[10px] font-medium text-slate-500">{desc}</div>
       </div>
    </button>
  )
}

function InsightItem({ indicator, value }: any) {
  return (
    <div className="flex justify-between items-center bg-slate-950/20 p-3 rounded-xl">
       <span className="text-xs font-bold text-slate-500">{indicator}</span>
       <span className="text-sm font-black text-indigo-400">{value}</span>
    </div>
  )
}

function StrategicCalendar({ brandId, campaigns }: { brandId?: string, campaigns: Campaign[] }) {
  const [tasks, setTasks] = useState<PublishingTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (brandId) {
      loadTasks();
    }
  }, [brandId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
       // In a real app we'd fetch from publishingService
       const querySnapshot = await publishingService.getByField('brandId', brandId);
       setTasks(querySnapshot);
    } catch (err) {
       console.error(err);
    } finally {
       setLoading(false);
    }
  };

  const days = Array.from({ length: 35 }, (_, i) => i - 4); 
  
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-4">
             <h3 className="text-lg font-bold text-white">مايو 2026</h3>
             <div className="flex gap-1">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400">
                   <Flag size={10} /> {campaigns.length} حملات
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400">
                   <Send size={10} /> {tasks.length} مهام نشر
                </div>
             </div>
          </div>
          <div className="flex gap-2">
             <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">السابق</button>
             <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">التالي</button>
          </div>
       </div>

       <div className="grid grid-cols-7 border-t border-l border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-950">
          {['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(day => (
            <div key={day} className="bg-slate-900/60 p-4 border-r border-b border-slate-800 text-center font-black text-[10px] text-slate-500 uppercase tracking-widest">{day}</div>
          ))}
          {days.map((d, i) => {
             const isToday = d === new Date().getDate();
             return (
              <div key={i} className={cn("min-h-[160px] p-3 bg-slate-950/20 border-r border-b border-slate-800 hover:bg-slate-900/40 transition-colors group", d <= 0 || d > 31 ? 'opacity-20 pointer-events-none' : '', isToday && 'bg-indigo-500/5')}>
                 <div className={cn("text-right text-[10px] font-black mb-3", d > 0 && d <= 31 ? (isToday ? 'text-indigo-400' : 'text-slate-500') : 'text-transparent')}>
                    {d > 0 && d <= 31 ? d : ''}
                    {isToday && <span className="mr-1 inline-block w-1 h-1 rounded-full bg-indigo-500"></span>}
                 </div>
                 
                 <div className="space-y-1.5">
                    {campaigns.filter(c => {
                       const startDay = c.startDate?.toDate().getDate();
                       return startDay === d;
                    }).map(c => (
                       <div key={c.id} className="bg-indigo-500/20 border border-indigo-500/30 p-2 rounded-xl animate-in fade-in zoom-in-95">
                          <div className="text-[7px] font-black text-indigo-400 uppercase leading-none mb-1">Campaign Start</div>
                          <div className="text-[10px] font-bold text-white leading-tight truncate">{c.name}</div>
                       </div>
                    ))}

                    {tasks.filter(t => {
                       if (!t.scheduledTime) return false;
                       const taskDay = t.scheduledTime.toDate().getDate();
                       return taskDay === d;
                    }).map(t => (
                       <div key={t.id} className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                          <div className="text-[7px] font-black text-emerald-400 uppercase leading-none mb-1">{t.platform}</div>
                          <div className="text-[10px] font-bold text-slate-200 leading-tight truncate">{t.content}</div>
                       </div>
                    ))}
                 </div>
              </div>
             )
          })}
       </div>
    </div>
  )
}

function ContentIntelligenceView({ insights, brandId }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
       <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
          <h3 className="text-xl font-black text-white flex items-center gap-2 mb-6"><TrendingUp className="text-indigo-400" /> تحليل الاتجاهات (Trends)</h3>
          <div className="space-y-4">
             {insights.filter((i: any) => i.type === 'trend').map((trend: StrategicInsight) => (
                <div key={trend.id} className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl flex flex-col gap-2 hover:border-indigo-500/30 transition-all">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-indigo-400 font-black uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">Trending Concept</span>
                      <span className="text-slate-500 font-bold">Confidence: {Math.round(trend.confidence * 100)}%</span>
                   </div>
                   <h4 className="text-lg font-bold text-white">{trend.title}</h4>
                   <p className="text-sm text-slate-400 leading-relaxed font-medium">{trend.description}</p>
                   <div className="mt-2 text-xs font-bold text-indigo-400 flex items-center gap-1 cursor-pointer hover:underline">عرض البيانات المساندة <Info size={14}/></div>
                </div>
             ))}
          </div>
       </div>

       <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
          <h3 className="text-xl font-black text-white flex items-center gap-2 mb-6"><BarChart3 className="text-emerald-400" /> استخبارات الجمهور</h3>
          <div className="space-y-6">
             <div className="p-6 bg-slate-950/60 rounded-3xl border border-slate-800">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">نشاط الجمهور الأسبوعي</h4>
                <div className="flex items-end justify-between h-32 gap-2">
                   {[30, 45, 90, 70, 85, 40, 20].map((h, i) => (
                      <div key={i} className="flex-1 bg-emerald-500/20 rounded-t-lg relative group transition-all" style={{ height: `${h}%` }}>
                         <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500 rounded-t-lg shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                         <div className="absolute -bottom-6 inset-x-0 text-[10px] font-black text-slate-600 text-center uppercase">{['S','M','T','W','T','F','S'][i]}</div>
                      </div>
                   ))}
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">الاهتمام الرئيسي</span>
                   <span className="text-lg font-black text-white">التمور الفاخرة</span>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">أفضل نمط</span>
                   <span className="text-lg font-black text-white">Visual Stories</span>
                </div>
             </div>

             <div className="bg-indigo-500/5 p-5 rounded-3xl border border-indigo-500/10">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                   <Zap size={14} /> اقتراح استراتيجي لحظي
                </h4>
                <p className="text-sm font-bold text-slate-200 leading-relaxed">
                   يُظهر الجمهور اهتماماً متزايداً بـ "طرق التقديم المبتكرة". ننصح بتنفيذ فيديو قصير يعرض 3 طرق لتقديم التمور في المناسبات.
                </p>
             </div>
          </div>
       </div>
    </div>
  )
}
