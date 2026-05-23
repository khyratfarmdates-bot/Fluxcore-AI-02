import React, { useEffect, useState, useRef } from "react";
import { Sparkles, Calendar, Activity, Zap, CheckCircle2, AlertCircle, PenTool, ArrowUpLeft, TrendingUp, Cpu, Network, Database, RefreshCw, MessageSquare, Flag } from "lucide-react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { MissionControl } from "../onboarding/MissionControl";
import { onboardingService, UserExperienceProfile } from "../onboarding/OnboardingService";
import { cn } from "../lib/utils";
import { liveOps, OperationalEvent } from "../services/LiveOperationalService";
import { IntegrationEngine } from "../integrations/CoreEngine";
import { SystemHealthDashboard } from "../core/diagnostics/SystemHealthDashboard";
import { publishingService } from "../services/publishing";
import { campaignService } from "../services/CampaignService";
import { intelligenceService, StrategicInsight } from "../services/IntelligenceService";
import { analyticsService } from "../services/analytics";
import { serviceRegistry } from "../runtime/ServiceRegistry";
import { ServiceInfo } from "../runtime/types";

export function MainDashboard({ onNavigate }: { onNavigate: (module: string) => void }) {
  const { activeBrand, brands } = useWorkspace();
  const [recentGenerations, setRecentGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserExperienceProfile | null>(null);
  const [liveEvents, setLiveEvents] = useState<OperationalEvent[]>([]);
  const [connectedCount, setConnectedCount] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [stats, setStats] = useState({
     queueCount: 0,
     activeCampaigns: 0,
     analyticsCount: 0
  });
  const [latestInsight, setLatestInsight] = useState<StrategicInsight | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = serviceRegistry.subscribe(setServices);
    return () => { unsub(); };
  }, []);

  const totalServices = services.length || 1;
  const connectedServices = services.filter(s => s.status === 'connected').length;
  const productionScore = Math.round((connectedServices / totalServices) * 100);

  useEffect(() => {
    liveOps.start();
    const unsubscribe = liveOps.subscribe((event) => {
      setLiveEvents(prev => [event, ...prev].slice(0, 50));
      if (event.type === 'AI_THINKING') {
        setIsThinking(true);
        setTimeout(() => setIsThinking(false), 3000);
      }
    });

    if (activeBrand) {
      IntegrationEngine.getActiveIntegrations(activeBrand.id).then(conns => {
        setConnectedCount(conns.filter(c => c.status === 'connected').length);
      });
    }

    return () => {
      unsubscribe();
    };
  }, [activeBrand]);

  useEffect(() => {
    async function fetchProfile() {
      const user = auth.currentUser;
      if (user) {
        const p = await onboardingService.getProfile(user.uid);
        setProfile(p);
      }
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!activeBrand) return;
      try {
        setLoading(true);
        // Generations
        const genRef = collection(db, "generations");
        const q = query(
          genRef, 
          where("brandId", "==", activeBrand.id),
          where("userId", "==", auth.currentUser?.uid), 
          orderBy("createdAt", "desc"), 
          limit(6)
        );
        const snap = await getDocs(q);
        setRecentGenerations(snap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Real Stats
        const [queue, campaigns, analytics, insights] = await Promise.all([
           publishingService.getByField('brandId', activeBrand.id),
           campaignService.getActiveCampaigns(activeBrand.id),
           analyticsService.getRecentStats(activeBrand.id),
           intelligenceService.getLatestInsights(activeBrand.id, 1)
        ]);

        setStats({
           queueCount: (queue as any[]).filter(t => t.status === 'queued' || t.status === 'scheduled').length,
           activeCampaigns: (campaigns as any[]).filter(c => c.status === 'active').length,
           analyticsCount: (analytics as any[]).length
        });

        if (insights && (insights as any[]).length > 0) {
           setLatestInsight(insights[0] as StrategicInsight);
        }

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeBrand]);

  const hour = new Date().getHours();
   const greeting = hour < 12 ? "صباح الخير" : "مساء الخير";
   const userName = auth.currentUser?.displayName?.split(' ')[0] || "مستكشفنا";

   return (
     <div className="flex flex-col h-full bg-slate-950 p-6 overflow-hidden gap-6">
       
       {/* Smart Welcome header */}
       <div className="shrink-0 relative overflow-hidden bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-500/10 hover:border-indigo-500/40 transition-colors">
          <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: "url('https://i.imgur.com/KerOBYX.png')" }}></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none transition-all"></div>
          
          <div className="relative z-10 w-full max-w-2xl">
             <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
               {greeting}، {userName} <Sparkles className="text-amber-400" />
             </h1>
             <div className="flex flex-col gap-2">
                <p className="text-slate-300 font-medium text-lg leading-relaxed flex items-center gap-3">
                  <span className={cn("w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]", isThinking && "animate-pulse")}></span>
                  AI Core جاهز للمساعدة في إدارة محتوى <span className="text-indigo-400 font-bold">{activeBrand?.name || 'مساحتك'}</span> اليوم.
                </p>
                {isThinking && (
                  <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold animate-in fade-in slide-in-from-left-2">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Executive AI يقوم بتحليل سياق العمليات حالياً...</span>
                  </div>
                )}
             </div>
         </div>
         
         <div className="relative z-10 flex gap-4 shrink-0">
            <button onClick={() => onNavigate("studio")} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
               <PenTool size={18} /> إنشاء جديد
            </button>
            <button onClick={() => onNavigate("publishing")} className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all backdrop-blur-sm shadow-sm">
               <Calendar size={18} /> التقويم
            </button>
         </div>
      </div>

      {/* Dashboard Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:flex-row gap-6 pb-12">
        
        {/* Left Col (Main Feed) */}
        <div className="flex-1 flex flex-col gap-6">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
             <StatBox title="منشورات مولدة" value={loading ? "..." : (recentGenerations?.length || 0).toString()} icon={<Zap size={18}/>} color="indigo" onClick={() => onNavigate("studio")} />
             <StatBox title="مساحات العمل" value={(brands?.length || 0).toString()} icon={<Activity size={18}/>} color="emerald" onClick={() => onNavigate("brand")} />
             <StatBox title="في طابور النشر" value={loading ? "..." : (stats?.queueCount || 0).toString()} icon={<Calendar size={18}/>} color="amber" onClick={() => onNavigate("publishing")} />
             <StatBox title="التحليلات" value={loading ? "..." : (stats?.analyticsCount || 0).toString()} icon={<TrendingUp size={18}/>} color="rose" onClick={() => onNavigate("analytics")} />
           </div>

             {/* AI Insights Widget */}
             <div data-companion-id="ai-insights-widget" className="bg-gradient-to-br from-indigo-600/10 via-slate-900 to-slate-950 border border-indigo-500/20 rounded-[40px] p-8 relative overflow-hidden group shadow-2xl h-auto min-h-fit">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
               <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full" />
               
               <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
                   <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/10 group-hover:scale-110 transition-transform duration-500 mt-1">
                     <Cpu size={36} className={cn(isThinking && "animate-pulse")} />
                  </div>
                  <div className="flex-1 flex flex-col gap-5 text-center md:text-right">
                    <div className="space-y-3">
                       <h3 className="text-2xl font-black text-white leading-tight tracking-tight italic">
                         {latestInsight?.title || "تحليل الأداء الاستراتيجي ⚡"}
                       </h3>
                       <p className="text-slate-400 font-medium text-base leading-relaxed">
                         {isThinking ? "يقوم محرك AI Core بمزامنة بياناتك لاستخراج أنماط النمو وتحليل السلوك الرقمي الحالي..." : (latestInsight?.description || "رَصَد النظام زيادة ملحوظة بنسبة 18% في التفاعل مع منشورات الفيديو الأخيرة خلال الساعات الـ 48 الماضية. نوصي بتكثيف محتوى الـ Reels لتعزيز هذا الاتجاه الصعودي.")}
                       </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                       <button onClick={() => onNavigate("studio")} className="bg-white text-black px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl hover:bg-indigo-500 hover:text-white hover:scale-105 active:scale-95">
                         تطبيق الخطة
                       </button>
                       <button onClick={() => onNavigate("analytics")} className="bg-slate-900 hover:bg-black text-slate-300 border border-slate-800 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:text-white">
                         تقرير التفاصيل
                       </button>
                    </div>
                  </div>
               </div>
             </div>

            {profile?.level === 'beginner' && (
              <div className="mt-2 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <MissionControl />
              </div>
            )}

           <div className="bg-slate-900/50 border border-slate-800/80 rounded-[32px] p-6 flex flex-col flex-1 min-h-[400px] overflow-hidden">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> المركز التشغيلي المباشر (Operational Hub)</h2>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                  LIVE STREAM ACTIVE
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
                {liveEvents.length === 0 ? (
                   <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                      <Network size={40} />
                      <span className="text-xs font-bold uppercase tracking-widest">بانتظار بدء العمليات...</span>
                   </div>
                ) : (
                  liveEvents.map(event => (
                    <div key={event.id} className="bg-slate-950/50 border border-slate-800/60 p-4 rounded-2xl flex items-center gap-4 hover:bg-slate-900 transition-colors animate-in fade-in slide-in-from-right-2">
                       <div className={cn(
                         "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                         event.type === 'AI_THINKING' ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" :
                         event.type === 'PUBLISHING' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                         event.type === 'ANALYSIS' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                         "bg-slate-800/50 border-slate-700 text-slate-400"
                       )}>
                          {event.type === 'AI_THINKING' && <Cpu size={18} />}
                          {event.type === 'PUBLISHING' && <Calendar size={18} />}
                          {event.type === 'ANALYSIS' && <TrendingUp size={18} />}
                          {event.type === 'CONTENT_GEN' && <PenTool size={18} />}
                          {event.type === 'SYSTEM' && <Database size={18} />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-200 leading-tight mb-1">{event.message}</p>
                          <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500">
                             <span className="text-indigo-400">{event.type}</span>
                             <span>•</span>
                             <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                          </div>
                       </div>
                       <div className="shrink-0">
                          <CheckCircle2 size={16} className="text-emerald-500/40" />
                       </div>
                    </div>
                  ))
                )}
             </div>
           </div>
        </div>

        {/* Right Col (Smart Widgets) */}
        <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6">
            {/* AI Focus Insights */}
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[32px] p-6 flex flex-col gap-4 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles size={60} />
               </div>
              <h3 className="font-black text-indigo-400 flex items-center gap-2 mb-2">
                <Sparkles size={18} /> تركيز اليوم (Executive Focus)
              </h3>
              
              <div className="space-y-3">
                 <div className="bg-slate-950/60 p-4 rounded-2xl border border-indigo-500/10">
                    <p className="text-xs font-black text-indigo-300 uppercase mb-2">التوصية الرئيسية</p>
                    <p className="text-sm font-bold text-slate-200">
                      {latestInsight?.actionItems?.[0] || (connectedCount > 0 ? "قم بجدولة منشور حول أحدث الترندات في مجالك لزيادة التفاعل." : "اربط حساباتك الاجتماعية لتمكين التحليل المتطور.")}
                    </p>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                       <span className="block text-[8px] font-black text-emerald-400 uppercase">ساعة الذروة</span>
                       <span className="text-sm font-black text-white">8:30 PM</span>
                    </div>
                    <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                       <span className="block text-[8px] font-black text-amber-400 uppercase">هوية اليوم</span>
                       <span className="text-sm font-black text-white">{activeBrand?.personality || "Inspired"}</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* System Health (Real-Time Binding) */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-6 hover:border-indigo-500/30 transition-colors">
              <h3 className="font-bold text-white flex items-center justify-between mb-4">
                 <span className="flex items-center gap-2" onClick={() => onNavigate('runtime')}><Activity size={18} className="text-emerald-400 cursor-pointer"/> حالة النظام</span>
                 <span className={cn(
                   "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border transition-all",
                   productionScore > 80 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                 )}>
                   {productionScore > 80 ? 'Production Ready' : 'Maintenance'}
                 </span>
              </h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                   <div className="flex items-center gap-2 text-slate-400 font-medium">
                      <Cpu size={14} className="text-indigo-400" /> Production Readiness
                   </div>
                   <span className="text-white font-bold text-xs">{productionScore}%</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <div className="flex items-center gap-2 text-slate-400 font-medium">
                      <Network size={14} className="text-emerald-400" /> Active Services
                   </div>
                   <span className="text-white font-bold text-xs">{connectedServices}/{totalServices}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-t border-slate-800 pt-3 mt-1">
                   <button onClick={() => onNavigate('runtime')} className="w-full text-center text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">
                     عرض كونسول التشخيص
                   </button>
                 </div>
              </div>
            </div>

            {/* Campaign Focused Widget */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-slate-950 border border-slate-800 rounded-[32px] p-6 group cursor-pointer" onClick={() => onNavigate('campaigns')}>
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2 italic">Strategy Core</h3>
                  <ArrowUpLeft className="text-slate-600 group-hover:text-indigo-400 transition-colors" size={18} />
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                     <Flag size={20} />
                  </div>
                  <div>
                     <div className="text-xs font-black text-slate-500 uppercase tracking-tighter">الحملات النشطة</div>
                     <div className="text-xl font-black text-white">{connectedCount > 0 ? 2 : 0} حملات</div>
                  </div>
               </div>
            </div>

            {/* Smart Prediction / Analytics Snapshot */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-[32px] p-6 flex flex-col gap-4">
              <h3 className="font-black text-white flex items-center gap-2 mb-2">
                <TrendingUp className="text-rose-400" size={18} /> التوقعات (Predictive)
              </h3>
              
              <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50">
                 <div className="flex justify-between items-end mb-4">
                    { [40, 60, 85, 50, 90, 75, 95].map((h, i) => (
                      <div key={i} className="w-4 bg-indigo-500/20 rounded-t-sm relative transition-all duration-500" style={{ height: `${h}%` }}>
                         { i === 6 && <div className="absolute top-0 inset-x-0 h-1 bg-indigo-400 animate-pulse" /> }
                      </div>
                    ))}
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">توقع نمو المحتوى القادم</p>
              </div>

              <div className="flex items-center gap-3">
                 <div className="flex-1 bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="block text-[8px] font-black text-slate-500 uppercase">التأثير المتوقع</span>
                    <span className="text-lg font-black text-white">+12%</span>
                 </div>
                 <div className="flex-1 bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="block text-[8px] font-black text-slate-500 uppercase">نطاق الوصول</span>
                    <span className="text-lg font-black text-white">Global</span>
                 </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ title, value, color, icon, onClick }: any) {
  const colors = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  }
  return (
    <button onClick={onClick} className={cn("p-4 rounded-[24px] border border-slate-800/80 bg-slate-900/40 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 text-right w-full", colors[color as keyof typeof colors])}>
      <div className="flex justify-between items-center w-full text-slate-500">
        <span className="text-[10px] font-black uppercase tracking-widest leading-normal text-white drop-shadow-md z-10">{title}</span>
        <div className={cn("p-1.5 rounded-lg opacity-80", colors[color as keyof typeof colors])}>{icon}</div>
      </div>
      <div className="text-2xl font-black text-white z-10 relative">{value}</div>
      <div className={cn("absolute inset-0 opacity-10 bg-current transition-opacity group-hover:opacity-20")} />
    </button>
  )
}

function ActivityItem({ text, time }: any) {
  return (
    <div className="flex gap-3 items-start relative">
      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0 relative z-10 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
      <div>
        <p className="text-sm font-medium text-slate-300">{text}</p>
        <span className="text-[10px] text-slate-500 font-bold">{time}</span>
      </div>
    </div>
  )
}
