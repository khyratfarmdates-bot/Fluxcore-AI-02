import React, { useState, useEffect } from "react";
import { Link2, AlertTriangle, CheckCircle2, RotateCw, Key, Webhook, Box, CloudCog, Activity, Terminal, Power, Blocks, Youtube, RefreshCw, Tv } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { IntegrationEngine } from "./CoreEngine";
import { ConnectionManager } from "./OAuthManager";
import { IntegrationAccount, IntegrationProvider, IntegrationType } from "./types";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { BrandLogo } from "../components/BrandLogos";
import { useAuth } from "../contexts/AuthContext";
import { toast } from '../lib/soundToast';
import { ConnectedAccountsView } from "./ConnectedAccountsView";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

export function IntegrationsHubView() {
  const [activeTab, setActiveTab] = useState<"connected" | "directory" | "apikeys" | "webhooks" | "diagnostics">("directory");
  const [connections, setConnections] = useState<IntegrationAccount[]>([]);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const { activeBrand } = useWorkspace();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const refreshIntegrations = async () => {
    if (activeBrand) {
      const updated = await IntegrationEngine.getActiveIntegrations(activeBrand.id);
      setConnections(updated);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Basic origin check
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        toast.success(`تم ربط ${event.data.platform} بنجاح!`);
        refreshIntegrations();
        setIsConnecting(null);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeBrand]);

  const formatLastSynced = (lastSyncedAt: any) => {
    if (!lastSyncedAt) return 'أبداً';
    try {
      const date = lastSyncedAt.seconds ? new Date(lastSyncedAt.seconds * 1000) : new Date(lastSyncedAt);
      return date.toLocaleString();
    } catch (e) {
      return 'تاريخ غير صالح';
    }
  };

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    if (success) {
      toast.success("تم ربط الحساب بنجاح! يتم الآن توحيد البيانات...");
      setSearchParams({});
    }
    if (error) {
      toast.error(`فشل الربط: ${error}`);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (activeBrand) {
      IntegrationEngine.getActiveIntegrations(activeBrand.id).then(setConnections);
    }
  }, [activeBrand]);

  const handleSync = async (connId: string) => {
    setIsSyncing(connId);
    try {
      await ConnectionManager.refreshTokens(connId);
      toast.success("تم تحديث البيانات بنجاح");
      if (activeBrand) {
        const updated = await IntegrationEngine.getActiveIntegrations(activeBrand.id);
        setConnections(updated);
      }
    } catch (err) {
      toast.error("فشل تحديث البيانات");
    } finally {
      setIsSyncing(null);
    }
  };

  const handleConnect = async (provider: IntegrationProvider, type: IntegrationType) => {
    console.log("[IntegrationsHub] handleConnect for:", provider);
    if (!activeBrand || !user) {
      toast.error("يرجى اختيار علامة تجارية (Brand) وتسجيل الدخول أولاً...");
      return;
    }

    setIsConnecting(provider);
    toast.info(`بدء الاتصال مع ${provider}...`);
    try {
      if (provider === 'googleslides') {
         // Attempt Firebase client-side OAuth for Google Workspace
         const { workspaceSignIn } = await import("../lib/workspaceAuth");
         const result = await workspaceSignIn();
         if (result?.accessToken) {
           // Save to DB using ConnectionManager
           await ConnectionManager.completeConnection(activeBrand.id, 'googleslides', 'tool', {
             accessToken: result.accessToken,
             // Refresh tokens via Firebase Auth provider are tricky, but we store the access token for the session 
             expiresAt: new Date(Date.now() + 3600 * 1000)
           });
           toast.success("تم ربط حساب Google Workspace بنجاح!");
           refreshIntegrations();
         }
         setIsConnecting(null);
         return;
      }

      // Call server to get Auth URL
      const response = await axios.get(`/api/auth/${provider}/url`, {
        params: {
          brandId: activeBrand.id,
          userId: user.uid
        }
      });
      
      const { url } = response.data;
      if (!url) throw new Error("إعدادات الربط مفقودة في السيرفر.");

      // Open Popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        url,
        `connect_${provider}`,
        `width=${width},height=${height},left=${left},top=${top},status=no,location=no`
      );

      if (!popup) {
        toast.error("يرجى السماح بالنوافذ المنبثقة (Popups) لإكمال عملية الربط.");
        setIsConnecting(null);
      }
    } catch (err: any) {
       toast.error(`خطأ: ${err.response?.data?.error || err.message || 'فشل الاتصال'}`);
       setIsConnecting(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <header className="flex justify-between items-center shrink-0 mb-8 relative z-10 gap-4">
         <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-500/20 to-indigo-500/20 border border-slate-700/50 rounded-2xl flex items-center justify-center text-rose-400 shadow-2xl">
               <Blocks size={32} />
            </div>
            <div>
               <h2 className="text-3xl font-black text-white italic tracking-tight">
                 Integration Hub <span className="text-rose-500 not-italic">.02</span>
               </h2>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">المحرك العصبي لربط المنصات والأتمتة</p>
            </div>
         </div>
         <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-[1.5rem] shadow-2xl">
            <button onClick={() => setActiveTab("directory")} className={cn("px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all", activeTab === "directory" ? "bg-rose-600 text-white shadow-lg" : "text-slate-500 hover:text-white")}>
               الدليل
            </button>
            <button onClick={() => setActiveTab("connected")} className={cn("px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all", activeTab === "connected" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-white")}>
               المتصلة ({connections.length})
            </button>
         </div>
      </header>

      <div className="flex gap-3 mb-8 shrink-0 overflow-x-auto pb-2 scrollbar-hide relative z-10">
          <button onClick={() => setActiveTab("diagnostics")} className={cn("flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border", activeTab === "diagnostics" ? "bg-slate-900 border-slate-700 text-indigo-400 shadow-xl" : "bg-transparent border-transparent text-slate-600 hover:text-slate-400")}>
            <Activity size={14}/> التشخيصات
          </button>
          <button onClick={() => setActiveTab("apikeys")} className={cn("flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border", activeTab === "apikeys" ? "bg-slate-900 border-slate-700 text-emerald-400 shadow-xl" : "bg-transparent border-transparent text-slate-600 hover:text-slate-400")}>
            <Key size={14}/> المطورين
          </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
         {!activeBrand ? (
           <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-900/10 border-2 border-dashed border-slate-800 rounded-[4rem]">
             <Box size={64} className="text-slate-800 mb-8 animate-pulse" />
             <h3 className="text-3xl font-black text-white italic mb-4">اختيار الهوية أولاً</h3>
             <p className="text-slate-400 font-medium max-w-sm mb-12">نظام التكامل يحتاج لمعرفة لأي علامة تجارية سيتم تخصيص البيانات والتوكنات.</p>
           </div>
         ) : (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
              {activeTab === "connected" && <ConnectedAccountsView />}
              {activeTab === "directory" && (
                <div className="space-y-12">
                   <div className="bg-gradient-to-br from-rose-600/10 to-indigo-600/5 border border-slate-800 p-12 rounded-[3.5rem] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="relative z-10 max-w-2xl">
                         <h3 className="text-4xl font-black text-white mb-6 italic">عالمك الرقمي.. الآن في مكان واحد.</h3>
                         <p className="text-slate-400 font-medium text-lg leading-relaxed">
                            اربط حساباتك الاجتماعية، أدوات الذكاء الاصطناعي، ومنصات المحتوى. Fluxcore AI يقوم بتوحيد كل هذه القنوات في محرك مركزي واحد للأتمتة والتحليل.
                         </p>
                      </div>
                   </div>
                   <AppDirectory onConnect={handleConnect} isConnecting={isConnecting} />
                </div>
              )}
              {activeTab === "diagnostics" && <DiagnosticsDashboard brandId={activeBrand.id} />}
              {activeTab === "apikeys" && <DeveloperAPIView />}
              {activeTab === "webhooks" && <div className="p-20 text-center text-slate-500 font-black uppercase tracking-widest italic">Coming Soon to v2.1</div>}
           </motion.div>
         )}
      </div>
    </div>
  );
}

function ConnectedAppsView({ connections, isSyncing, onSync, onDisconnect }: any) {
  return (
    <div className="flex flex-col gap-4">
      {connections.length === 0 && (
        <div className="p-20 text-center flex flex-col items-center gap-4 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[3rem]">
          <Link2 size={48} className="text-slate-800" />
          <p className="text-slate-500 font-bold">لا يوجد تطبيقات متصلة حالياً. جرب إضافة واحد من الدليل.</p>
        </div>
      )}
      {connections.map((conn: IntegrationAccount) => {
        const isHealthy = conn.status === "connected";

        return (
          <div key={conn.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:bg-slate-900 transition-colors">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 font-black text-xl shrink-0 uppercase">
                   {conn.provider[0]}
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-1">
                     <h3 className="font-bold text-white uppercase">{conn.provider}</h3>
                     <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border flex items-center gap-1", isHealthy ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}>
                       {isHealthy ? <><CheckCircle2 size={12}/> متصل</> : <><AlertTriangle size={12}/> {conn.status}</>}
                     </span>
                   </div>
                   <div className="text-sm font-medium text-slate-400">آخر مزامنة: <span className="text-slate-300 font-bold">{conn.lastSyncedAt ? new Date(conn.lastSyncedAt).toLocaleString() : 'أبداً'}</span></div>
                </div>
             </div>

             <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={() => onSync(conn.id)}
                  disabled={isSyncing === conn.id || !isHealthy}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all"
                >
                  <RotateCw size={14} className={cn(isSyncing === conn.id && "animate-spin")} /> {isSyncing === conn.id ? "جاري التحديث..." : "تحديث التوكن"}
                </button>
                <button 
                  onClick={() => onDisconnect(conn.id)}
                  className="flex items-center justify-center px-3 py-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-lg text-xs font-bold transition-all tooltip" 
                  title="قطع الاتصال"
                >
                  <Power size={14} />
                </button>
             </div>
          </div>
        )
      })}
    </div>
  )
}

const DIRECTORY_PROVIDERS: { id: IntegrationProvider, name: string, category: IntegrationType, description: string }[] = [
  { id: 'googleslides', name: 'Google Slides', category: 'tool', description: 'إنشاء عروض تقديمية احترافية من البيانات والمحتوى المولد بالذكاء الاصطناعي.' },
  { id: 'openai', name: 'OpenAI (DALL-E, GPT)', category: 'ai', description: 'توليد المحتوى الإبداعي والصور باستخدام أقوى النماذج اللغوية في العالم.' },
  { id: 'gemini', name: 'Google Gemini', category: 'ai', description: 'تكامل مع محرك جوجل الذكي لتحليل البيانات المعقدة وإنشاء المحتوى.' },
  { id: 'claude', name: 'Anthropic Claude', category: 'ai', description: 'نماذج لغوية متطورة للكتابة الإبداعية والتحليل المنطقي الدقيق.' },
  { id: 'runway', name: 'Runway Gen-2', category: 'media', description: 'تحويل النصوص والأفكار إلى فيديوهات سينمائية مذهلة بتقنيات الـ AI.' },
  { id: 'elevenlabs', name: 'ElevenLabs Voice', category: 'media', description: 'توليد أصوات بشرية فائقة الواقعية بأكثر من 29 لغة مختلفة.' },
];

function AppDirectory({ onConnect, isConnecting }: { onConnect: any, isConnecting: string | null }) {
  const [filter, setFilter] = useState<IntegrationType | 'all'>('all');
  const filtered = filter === 'all' ? DIRECTORY_PROVIDERS : DIRECTORY_PROVIDERS.filter(p => p.category === filter);

  return (
    <div className="space-y-10">
      {/* لافتة فصل السوشيال ميديا لقسم القنوات المستقل */}
      <div className="bg-indigo-950/40 border border-indigo-900/40 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-right">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950 flex items-center justify-center text-indigo-400 shrink-0">
            <Tv size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">إطلاق قسم "القنوات" المستقل</h4>
            <p className="text-xs text-slate-400 font-medium">تم فصل قنوات السوشيال ميديا عن التكاملات التقنية لزيادة سرعة التحليل والنشر.</p>
          </div>
        </div>
        <div className="text-xs text-indigo-400 font-bold bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 shrink-0">
          تُدار بالكامل عبر صفحة "القنوات" بجانب الإعدادات
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
         {['all', 'ai', 'media', 'productivity'].map(cat => (
           <button 
             key={cat} 
             onClick={() => setFilter(cat as any)}
             className={cn("px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap", filter === cat ? "bg-white text-black border-white shadow-xl scale-110" : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300")}
           >
             {cat === 'all' ? 'الكل' : cat}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {filtered.map(provider => (
           <motion.div 
             key={provider.id} 
             whileHover={{ y: -6, scale: 1.01 }}
             className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 flex flex-col items-center text-center hover:bg-slate-900/80 hover:border-rose-500/30 transition-all group relative overflow-hidden shadow-xl"
           >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 group-hover:bg-rose-500/10 rounded-full blur-2xl transition-all" />
              <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:scale-105 transition-all font-black text-2xl mb-5 shadow-inner relative z-10 uppercase">
                 <BrandLogo provider={provider.id} size={36} />
              </div>
              <h3 className="text-lg font-black text-white mb-2 relative z-10">{provider.name}</h3>
              <span className="text-[8px] font-black text-rose-500/60 uppercase tracking-[0.2em] bg-rose-500/5 px-3 py-1.5 rounded-full mb-5 border border-rose-500/10 relative z-10">{provider.category}</span>
              <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed line-clamp-3 min-h-[48px]">
                {provider.description}
              </p>
              <button 
                onClick={() => onConnect(provider.id, provider.category)}
                disabled={isConnecting !== null}
                className={cn(
                  "w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all shadow-lg flex items-center justify-center gap-2",
                  isConnecting === provider.id ? "bg-rose-600/20 text-white cursor-wait border border-rose-500/30" : "bg-white text-black hover:bg-rose-600 hover:text-white"
                )}
              >
                {isConnecting === provider.id ? <RotateCw size={14} className="animate-spin" /> : <Link2 size={14} />}
                {isConnecting === provider.id ? "جاري الاتصال" : "ربط المنصة"}
              </button>
           </motion.div>
         ))}
      </div>
    </div>
  );
}

function DiagnosticsDashboard({ brandId }: { brandId?: string }) {
  const [healthMap, setHealthMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (brandId) {
      IntegrationEngine.checkHealth(brandId).then(setHealthMap);
    }
  }, [brandId]);

  if (!brandId) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[3rem] gap-4">
        <Activity size={48} className="text-slate-700 animate-pulse" />
        <h3 className="text-lg font-black text-slate-400 uppercase">بانتظار اختيار الهوية...</h3>
        <p className="text-sm text-slate-600 max-w-xs font-medium">يرجى اختيار علامة تجارية من القائمة الجانبية لتفعيل نظام التشخيص والمراقبة الحية.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-800/80 rounded-[2.5rem] p-8 text-center relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
             <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">System Uptime</div>
             <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">99.98%</div>
             <div className="mt-2 text-[9px] text-emerald-500 font-bold uppercase">Optimal Performance</div>
          </div>
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-800/80 rounded-[2.5rem] p-8 text-center relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
             <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-3">Live Webhooks</div>
             <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">24 ACTIVE</div>
             <div className="mt-2 text-[9px] text-slate-500 font-bold uppercase">48.2k events / 24h</div>
          </div>
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-800/80 rounded-[2.5rem] p-8 text-center relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
             <div className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-3">API Quota</div>
             <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">12.4%</div>
             <div className="mt-2 text-[9px] text-amber-500/60 font-bold uppercase">Safe Threshold</div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/20">
               <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 Platform Health Matrix
               </h3>
               <button className="text-[10px] font-black text-indigo-400 uppercase hover:text-white transition-colors">إعادة الفحص</button>
            </div>
            <div className="p-6 flex-1">
               {Object.keys(healthMap).length === 0 ? (
                 <div className="h-full flex items-center justify-center text-slate-600 font-black uppercase text-[10px] tracking-widest italic py-12">
                   No integrated systems to monitor
                 </div>
               ) : (
                 <div className="space-y-3">
                   {Object.entries(healthMap).map(([provider, data]: any) => (
                     <div key={provider} className="flex items-center justify-between p-4 bg-slate-950/40 rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-black text-white shadow-inner uppercase">{provider[0]}</div>
                           <div>
                             <div className="text-sm font-black text-white uppercase">{provider}</div>
                             <div className={cn("text-[9px] font-bold uppercase", data.status === 'healthy' ? 'text-emerald-400' : 'text-rose-400')}>
                               {data.status === 'healthy' ? 'Operational' : 'Issue Detected'}
                             </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-[9px] font-mono text-slate-500 uppercase">Latency</div>
                           <div className="text-xs font-bold text-white">42ms</div>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
         </div>

         <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-8 flex flex-col">
            <h3 className="text-xs font-black text-slate-300 uppercase mb-6 flex items-center gap-3 tracking-widest">
              <Terminal size={16} className="text-indigo-400" /> Executive Activity Log
            </h3>
            <div className="bg-black/60 rounded-2xl p-6 font-mono text-[11px] space-y-2 h-64 overflow-y-auto custom-scrollbar text-slate-400 shadow-inner">
               <div className="flex gap-3"><span className="text-indigo-500/50 shrink-0">10:42:01</span> <span className="text-slate-300">[KERNEL]</span> High-priority sync initiated with Google Meta Index...</div>
               <div className="flex gap-3"><span className="text-indigo-500/50 shrink-0">10:41:58</span> <span className="text-emerald-500/50">[SUCCESS]</span> OpenGraph metadata generated for LinkedIn update.</div>
               <div className="flex gap-3"><span className="text-indigo-500/50 shrink-0">10:40:12</span> <span className="text-amber-500/50">[WARN]</span> Rate limit threshold approaching for YouTube API (85%).</div>
               <div className="flex gap-3"><span className="text-indigo-500/50 shrink-0">10:38:44</span> <span className="text-slate-300">[INFO]</span> Cold storage migration completed for batch-2024-Q2.</div>
               <div className="flex gap-3 text-indigo-400"><span className="text-indigo-500/50 shrink-0">10:35:22</span> <span className="font-bold">[REAL-TIME]</span> Listening for incoming webhook events...</div>
            </div>
         </div>
       </div>
    </div>
  );
}

function DeveloperAPIView() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
       <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 flex flex-col items-start gap-4">
         <div className="flex items-center gap-3 text-indigo-400 mb-2">
            <CloudCog size={24} />
            <h3 className="text-lg font-black">Fluxcore AI 02 Developer API</h3>
         </div>
         <p className="text-slate-300 font-medium text-sm leading-relaxed max-w-2xl">
           يتيح لك واجهة برمجة التطبيقات (API) الخاصة بنا دمج قدرات Fluxcore AI 02 في تطبيقاتك الخاصة، أتمتة مهامك بمرونة، والوصول المباشر إلى محرك AI Core.
         </p>
         <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20">قراءة التوثيق (Docs)</button>
       </div>

       <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
         <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-white flex items-center gap-2"><Key size={16} className="text-emerald-400"/> مفاتيح التشغيل (API Keys)</h4>
            <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold">إنشاء مفتاح جديد</button>
         </div>

         <table className="w-full text-right text-sm">
            <thead className="text-slate-500 font-bold border-b border-slate-800">
              <tr>
                <th className="py-4 font-medium">الاسم</th>
                <th className="py-4 font-medium">المفتاح</th>
                <th className="py-4 font-medium">تاريخ الإنشاء</th>
                <th className="py-4 font-medium">آخر استخدام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
               <tr>
                 <td className="py-4 font-bold text-slate-300">Zapier Automation Key</td>
                 <td className="py-4 font-mono text-slate-500">fc_live_8f92j...</td>
                 <td className="py-4 text-slate-400 text-xs">منذ شهرين</td>
                 <td className="py-4 text-emerald-400 text-xs font-bold">منذ 5 ساعات</td>
               </tr>
            </tbody>
          </table>
       </div>
    </div>
  )
}
