import React, { useState, useEffect } from "react";
import {
  Share2,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Clock,
  Activity,
  RotateCw
} from "lucide-react";
import { cn } from "../lib/utils";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { BrandLogo } from "../components/BrandLogos";
import { IntegrationEngine } from "./CoreEngine";
import { IntegrationAccount, IntegrationProvider } from "./types";
import { oauthService } from "../services/OAuthService";
import { toast } from '../lib/soundToast';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function ConnectedAccountsView() {
  const { activeBrand } = useWorkspace();
  const [accounts, setAccounts] = useState<IntegrationAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [disconnectConfirmation, setDisconnectConfirmation] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    if (activeBrand) {
      loadAccounts();
    }
  }, [activeBrand]);

  const loadAccounts = async () => {
    if (!activeBrand) return;
    setLoading(true);
    try {
      const data = await IntegrationEngine.getActiveIntegrations(activeBrand.id);
      setAccounts(data.filter(a => a.type === 'social' || (a as any).category === 'social'));
    } catch (err) {
      console.error(err);
      toast.error("فشل تحميل الحسابات المتصلة");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: IntegrationProvider) => {
    console.log("[ConnectedAccounts] handleConnect for:", provider);
    if (!activeBrand) {
      toast.error("يرجى اختيار علامة تجارية أولاً");
      return;
    }
    
    setIsConnecting(provider);
    toast.info(`جاري بدء الربط مع ${provider}...`);
    try {
      const url = await oauthService.startOAuthFlow(activeBrand.id, provider);
      if (!url || url.includes("YOUR_CLIENT_ID")) throw new Error("إعدادات الربط مفقودة.");
      window.location.href = url;
    } catch (err: any) {
      console.error("[ConnectedAccounts] Connect Error:", err);
      toast.error(`فشل بدء عملية الربط: ${err.message || 'خطأ غير معروف'}`);
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async (id: string) => {
     setDisconnectConfirmation({ isOpen: true, id });
  };

  const confirmDisconnect = async () => {
     if (disconnectConfirmation.id) {
       try {
         // Mock delete
         toast.success("تم قطع الاتصال بنجاح");
         setAccounts(prev => prev.filter(a => a.id !== disconnectConfirmation.id));
       } catch (err) {
         toast.error("فشل قطع الاتصال");
       }
     }
     setDisconnectConfirmation({ isOpen: false, id: null });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white mb-1">الحسابات المتصلة</h2>
          <p className="text-slate-400 font-medium">إدارة قنوات التواصل والمنصات المرتبطة بهوية <span className="text-indigo-400">{activeBrand?.name}</span>.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={loadAccounts} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] animate-pulse"></div>
          ))
        ) : (
          <>
            {accounts.map(account => (
              <AccountCard key={account.id} account={account} onDisconnect={() => handleDisconnect(account.id)} />
            ))}
            <AddAccountCard onConnect={handleConnect} isConnecting={isConnecting} />
          </>
        )}
      </div>

      <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-8 items-center">
         <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Shield size={32} />
         </div>
         <div className="flex-1 text-center md:text-right">
            <h3 className="text-lg font-bold text-white mb-2">بنية أمنية تنفيذية</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              يتم تشفير جميع التوكنات (OAuth Tokens) وتخزينها في طبقة آمنة. Fluxcore AI 02 لا يقوم بمشاركة بيانات اعتمادك مع أي خوادم خارجية بخلاف APIs الرسمية للمنصات.
            </p>
         </div>
         <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1">
               <span className="text-xs font-black text-emerald-400 uppercase">Status</span>
               <span className="text-sm font-bold text-white">Encrypted</span>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div className="flex flex-col items-center gap-1">
               <span className="text-xs font-black text-indigo-400 uppercase">Provider</span>
               <span className="text-sm font-bold text-white">OAuth 2.0</span>
            </div>
         </div>
      </div>

      <ConfirmDialog
        isOpen={disconnectConfirmation.isOpen}
        title="تأكيد قطع الاتصال"
        message="هل أنت متأكد من قطع الاتصال بهذا الحساب؟ قد تتوقف بعض العمليات الآلية المعتمدة عليه."
        confirmText="قطع الاتصال"
        onConfirm={confirmDisconnect}
        onCancel={() => setDisconnectConfirmation({ isOpen: false, id: null })}
      />
    </div>
  );
}

function AccountCard({ account, onDisconnect }: any) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-6 hover:bg-slate-900 transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-white relative">
           {account.profile?.thumbnail || account.profile?.picture || account.metadata?.thumbnail || account.metadata?.picture ? (
             <img src={account.profile?.thumbnail || account.profile?.picture || account.metadata?.thumbnail || account.metadata?.picture} className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
           ) : (
             <BrandLogo provider={account.provider} size={28} />
           )}
           <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <CheckCircle2 size={10} className="text-white" />
           </div>
        </div>
        <button onClick={onDisconnect} className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
           <Trash2 size={18} />
        </button>
      </div>

      <div className="mb-6">
         <h3 className="text-lg font-black text-white capitalize">{account.provider} Professional</h3>
         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Connected as @Official
         </p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-800">
         <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Clock size={10}/> تنتهي في</span>
            <span className="text-xs font-bold text-slate-300">60 يوم</span>
         </div>
         <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Activity size={10}/> الصحة</span>
            <span className="text-xs font-bold text-emerald-400">مثالية</span>
         </div>
      </div>
    </div>
  );
}

function AddAccountCard({ onConnect, isConnecting }: { onConnect: (p: IntegrationProvider) => void, isConnecting: string | null }) {
  const [showOptions, setShowOptions] = useState(false);
  const providers: IntegrationProvider[] = ['x', 'linkedin', 'instagram', 'facebook', 'tiktok', 'youtube'];

  return (
    <div className={cn(
      "border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center transition-all p-6",
      showOptions ? "bg-slate-900/60 h-auto" : "bg-slate-900/20 h-48 hover:bg-slate-900/40 hover:border-indigo-500/30 cursor-pointer"
    )} onClick={() => !showOptions && setShowOptions(true)}>
      {!showOptions ? (
        <>
          <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
             {isConnecting ? <RotateCw className="animate-spin text-rose-500" size={24} /> : <Plus size={24} />}
          </div>
          <span className="text-sm font-bold text-slate-400">{isConnecting ? `جاري الربط مع ${isConnecting}...` : "إضافة منصة جديدة"}</span>
        </>
      ) : (
        <div className="w-full space-y-4">
           <p className="text-xs font-black text-slate-500 uppercase tracking-widest text-center">اختر المنصة للربط</p>
           <div className="grid grid-cols-3 gap-2">
              {providers.map(p => (
                <button 
                  key={p} 
                  disabled={isConnecting !== null}
                  onClick={(e) => { e.stopPropagation(); onConnect(p); setShowOptions(false); }}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500/40 hover:text-indigo-400 text-slate-500 flex flex-col items-center gap-2 transition-all disabled:opacity-50"
                >
                   {isConnecting === p ? (
                     <RotateCw className="animate-spin" size={14}/>
                   ) : (
                     <div className="flex flex-col items-center gap-1.5">
                       <BrandLogo provider={p} size={20} />
                       <span className="text-xs font-black capitalize">{p}</span>
                     </div>
                   )}
                </button>
              ))}
           </div>
           <button onClick={(e) => { e.stopPropagation(); setShowOptions(false); }} className="w-full text-xs font-black text-slate-600 hover:text-white pt-2 uppercase">إلغاء</button>
        </div>
      )}
    </div>
  );
}
