import React, { useState, useEffect } from "react";
import { trackingEngine } from "./services/behaviorTracking";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { AIInterventionModal } from "./components/AIInterventionModal";
import { StudioView } from "./studio/StudioView";
import { SettingsView } from "./studio/SettingsView";
import { AnalyticsView } from "./analytics/AnalyticsView";
import { BrandIdentityView } from "./brand/BrandIdentityView";
import { PublishingView } from "./publishing/PublishingView";
import { AgencyView } from "./agency/AgencyView";
import { MainDashboard } from "./dashboard/MainDashboard";
import { LandingView } from "./marketing/LandingView";
import { MediaLabView } from "./media/MediaLabView";
import { AIOSCoreView } from "./core/AIOSCoreView";
import { BillingDashboard } from "./billing/BillingDashboard";
import { AdminDashboard } from "./admin/AdminDashboard";
import { IntegrationsHubView } from "./integrations/IntegrationsHubView";
import { OnboardingView } from "./onboarding/OnboardingView";
import { CommandCenter } from "./core/CommandCenter";
import { AIAssistant } from "./agents/AIAssistant";
import { companionEngine } from "./core/companion/CompanionEngine";
import { useCompanionStore } from "./core/companion/CompanionState";
import { ExecutiveChatView } from "./executive/ExecutiveChatView";
import { DevConsoleView } from "./core/DevConsoleView";
import { DiagnosticsConsole } from "./runtime/DiagnosticsConsole";
import { SEOStudio } from "./marketing/SEOStudio";
import { LayoutDashboard, PenTool, Sparkles, Workflow, BarChart3, Settings, Send, Users, Wand2, Cpu, CreditCard, ShieldAlert, Blocks, Terminal, Flag, Shield, SearchIcon, Tv, Briefcase, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, logout } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Toaster, toast } from "sonner";
import { AuthModal } from "./auth/AuthModal";
import { Logo } from "./components/Logo";
import { ChannelsListView } from "./ChannelsListView";
import { ChannelView } from "./ChannelView";

import { ProactiveSuggestionBar } from "./components/ProactiveSuggestionBar";
import { NotificationCenter } from "./notifications/NotificationCenter";
import { onboardingService } from "./onboarding/OnboardingService";
import { initializeExecutiveAgents } from "./intelligence/agents/AgentInitialization";
import { initializeIntegrationInfrastructure } from "./integrations/Setup";
import { usageTrackingService } from "./services/UsageTrackingService";

import { CampaignOS } from "./campaigns/CampaignOS";

import { automationTriggerEngine } from "./services/AutomationTriggerEngine";

import { productionRuntime } from "./runtime/ProductionRuntime";
import { AutomationView } from "./automation/AutomationView";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NetworkStatusIndicator } from "./components/NetworkStatusIndicator";
import { SystemDiagnosticsPanel } from "./components/SystemDiagnosticsPanel";
import { AppSidebar } from "./components/AppSidebar";
import { PageTransition } from "./components/PageTransition";

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading: isAuthLoading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    initializeExecutiveAgents();
    initializeIntegrationInfrastructure();
    automationTriggerEngine.start();
    productionRuntime.initialize();
  }, []);

  const [activeModule, setActiveModule] = useState<
    "dashboard" | "core" | "studio" | "media" | "publishing" | "campaigns" | "brand" | "automation" | "integrations" | "analytics" | "agency" | "billing" | "admin" | "dev" | "settings" | "runtime" | "seo" | "channels" | "channel"
  >("dashboard");
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const handleNavigate = (module: string, params?: any) => {
    if (module === "channel" && params?.channel) {
       setSelectedChannelId(params.channel);
    }
    setActiveModule(module as any);
  };

  useEffect(() => {
    trackingEngine.trackEvent('navigation', activeModule, window.location.pathname);
    
    // Set edge position based on module
    let pos = 0.05;
    switch(activeModule) {
       case 'studio': pos = 0.25; break;
       case 'campaigns': pos = 0.45; break;
       case 'dashboard': pos = 0.65; break;
       case 'analytics': pos = 0.85; break;
       case 'settings': pos = 0.95; break;
       default: pos = 0.05; break;
    }
    useCompanionStore.getState().setEdgePosition(pos);
    useCompanionStore.getState().setCurrentPageModule(activeModule);
    
    // Add Right-click listener for guide
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Traverse up to find any actionable or identifiable element
      const elementNode = target.closest('[id], [data-companion-id], button, a, input, select, textarea, [role="button"], .card, .widget') as HTMLElement;
      
      if (elementNode) {
        e.preventDefault();
        const id = elementNode.id || elementNode.getAttribute('data-companion-id') || 'عنصر';
        
        // Generate extremely fast dynamic explanation
        let title = elementNode.innerText?.split('\n')[0]?.trim() || elementNode.getAttribute('aria-label') || elementNode.getAttribute('placeholder') || id;
        if (title.length > 40) title = title.substring(0, 40) + '...';
        if (title === 'عنصر' || !title) title = 'التفاعلي';
        
        const tagName = elementNode.tagName.toLowerCase();
        
        let explanation = `هذا هو عنصر "${title}".`;
        if (tagName === 'button' || elementNode.getAttribute('role') === 'button') {
            explanation += ' يُستخدم هذا الزر لتنفيذ إجراء مباشر ضمن النظام.';
        } else if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
            explanation += ' حقل لإدخال البيانات أو تعديل الإعدادات.';
        } else if (tagName === 'a') {
            explanation += ' رابط لفتح صفحة جديدة أو الانتقال لقسم آخر.';
        } else if (id.includes('widget') || id.includes('card') || elementNode.classList.contains('card')) {
            explanation += ' بطاقة تعرض ملخصاً وإحصائيات للبيانات المتعلقة بك.';
        } else if (id.includes('nav') || id.includes('menu')) {
            explanation += ' قائمة انتقال بين أقسام النظام الرئيسية.';
        } else {
            explanation += ' جزء من واجهة النظام التفاعلية.';
        }

        // Use a semi-unique selector if id is missing
        const selector = elementNode.id ? `#${elementNode.id}` : 
                         elementNode.getAttribute('data-companion-id') ? `[data-companion-id="${elementNode.getAttribute('data-companion-id')}"]` : 
                         elementNode.tagName.toLowerCase();

        // Assign a temporary ID if it doesn't have one and we can't reliably select it
        if (!elementNode.id && !elementNode.getAttribute('data-companion-id')) {
            const tempId = `temp-guide-${Date.now()}`;
            elementNode.setAttribute('data-companion-id', tempId);
            companionEngine.startGuide(`[data-companion-id="${tempId}"]`, explanation);
        } else {
            companionEngine.startGuide(selector, explanation);
        }
      }
    };
    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, [activeModule]);

  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (user) {
        setIsAuthModalOpen(false);
        try {
          const profile = await onboardingService.getProfile(user.uid);
          if (!profile || !profile.isExperienceLoaded) {
            setNeedsOnboarding(true);
          } else {
            setNeedsOnboarding(false);
          }
        } catch (err) {
          console.error("Failed to check onboarding status:", err);
          setNeedsOnboarding(false); // Default to false if check fails to let user in
        }
      }
    };
    checkOnboarding();
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isAuthLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return (
      <>
        <Toaster theme="dark" position="top-center" dir="rtl" />
        <LandingView onLogin={() => setIsAuthModalOpen(true)} />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </>
    );
  }
  
  if (needsOnboarding) {
    return <OnboardingView onComplete={() => setNeedsOnboarding(false)} />;
  }

  // navSections moved to AppSidebar component

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("تم تسجيل الخروج بنجاح");
    } catch (e: any) {
      toast.error("حدث خطأ أثناء تسجيل الخروج");
    }
  };

  return (
    <WorkspaceProvider user={user}>
      <AIInterventionModal />
      <Toaster theme="dark" position="top-center" dir="rtl" />
      <div
        className="min-h-screen bg-slate-950 text-slate-200 flex font-sans overflow-hidden selection:bg-indigo-500/30 relative"
        dir="rtl"
      >
        <CommandCenter isOpen={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={setActiveModule} />
        <AIAssistant />
        <SystemDiagnosticsPanel />

        {/* ── Sidebar ──────────────────────────── */}
        <AppSidebar
          activeModule={activeModule}
          onNavigate={(m) => setActiveModule(m as any)}
          onOpenCommand={() => setCmdOpen(true)}
          user={user}
          onLogout={handleLogout}
        />

        {/* Main Workspace */}
        <main className="flex-1 h-screen overflow-hidden flex flex-col bg-slate-950 relative">
          <WorkspaceStatusIndicator />
          <ProactiveSuggestionBar pagePath={activeModule} navigateTo={(m) => setActiveModule(m as any)} />
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <PageTransition moduleKey={activeModule}>
                <div className="h-full overflow-y-auto custom-scrollbar">
                  {activeModule === "dashboard"    && <MainDashboard onNavigate={(m) => setActiveModule(m as any)} />}
                  {activeModule === "core"          && <AIOSCoreView />}
                  {activeModule === "studio"        && <StudioView onNavigate={setActiveModule} />}
                  {activeModule === "media"         && <MediaLabView />}
                  {activeModule === "campaigns"     && <CampaignOS />}
                  {activeModule === "publishing"    && <PublishingView />}
                  {activeModule === "brand"         && <BrandIdentityView />}
                  {activeModule === "automation"    && <AutomationView />}
                  {activeModule === "seo"           && <SEOStudio />}
                  {activeModule === "integrations"  && <IntegrationsHubView />}
                  {activeModule === "channels"      && <div className="p-8 h-full bg-slate-950 overflow-y-auto"><ChannelsListView theme="dark" lang="ar" user={user} onNavigate={handleNavigate} /></div>}
                  {activeModule === "channel"       && <div className="p-8 h-full bg-slate-950 overflow-y-auto"><ChannelView theme="dark" lang="ar" user={user} channelId={selectedChannelId} onNavigate={handleNavigate} /></div>}
                  {activeModule === "analytics"     && <AnalyticsView />}
                  {activeModule === "agency"        && <AgencyView />}
                  {activeModule === "billing"       && <BillingDashboard />}
                  {activeModule === "admin"         && <AdminDashboard />}
                  {activeModule === "dev"           && <DevConsoleView />}
                  {activeModule === "runtime"       && <div className="p-8 h-full bg-slate-950 overflow-y-auto"><div className="max-w-4xl mx-auto h-[800px]"><DiagnosticsConsole /></div></div>}
                  {activeModule === "settings"      && <SettingsView />}
                </div>
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </WorkspaceProvider>
  );
}

import { useWorkspace } from "./contexts/WorkspaceContext";

function WorkspaceStatusIndicator() {
   const { brands, activeBrand, setActiveBrandId } = useWorkspace();
   const [isOpen, setIsOpen] = useState(false);
   
   if (!activeBrand) return null;

   const brandColors = activeBrand.colors ? activeBrand.colors.split(',').map((c: string) => c.trim()).filter((c: string) => c.startsWith('#')) : [];

   return (
     <div className="absolute top-4 left-6 flex flex-col items-start gap-1 z-50">
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="bg-slate-900/90 hover:bg-slate-800 border border-slate-800/85 rounded-full py-1.5 px-4 flex items-center gap-3 shadow-xl cursor-pointer transition-all active:scale-95 group text-right focus:outline-none"
         title="اضغط لتبديل العلامة التجارية النشطة والعمل عليها بمختلف أرجاء النظام"
       >
         <div className="flex items-center gap-2">
           <span className="relative flex h-2 w-2 shrink-0">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
           </span>
           
           {/* Logo Preview */}
           {activeBrand.logo ? (
             <div className="w-5 h-5 rounded overflow-hidden flex items-center justify-center bg-slate-950 p-0.5 border border-slate-800 shrink-0">
               <img src={activeBrand.logo} alt={activeBrand.name} className="w-full h-full object-contain" />
             </div>
           ) : (
             <div className="w-5 h-5 rounded bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shrink-0">
               <Briefcase size={10} className="text-rose-400" />
             </div>
           )}

           <div className="flex flex-col text-right">
             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">البراند النشط</span>
             <span className="text-[11.5px] font-black text-slate-100 group-hover:text-rose-400 transition-colors max-w-[120px] truncate">{activeBrand.name}</span>
           </div>
         </div>

         {/* Extracted Colors Indicator */}
         {brandColors.length > 0 && (
           <div className="hidden sm:flex items-center gap-1 border-r border-slate-800 pr-3 mr-1">
             {brandColors.slice(0, 3).map((col: string, i: number) => (
               <div 
                 key={i} 
                 className="w-2.5 h-2.5 rounded-full border border-white/10" 
                 style={{ backgroundColor: col }}
                 title={col}
               />
             ))}
           </div>
         )}

         <ChevronDown size={14} className={`text-slate-400 group-hover:text-slate-200 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
       </button>

       {/* Dropdown Menu */}
       <AnimatePresence>
         {isOpen && (
           <>
             {/* Backdrop overlay to close when clicking outside */}
             <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsOpen(false)} />
             
             <motion.div
               initial={{ opacity: 0, y: -10, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, y: -10, scale: 0.95 }}
               transition={{ duration: 0.15, ease: "easeOut" }}
               className="mt-2 w-80 bg-slate-950 border border-slate-800 rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-lg z-50 absolute left-0 top-full text-right"
             >
               <div className="p-3 bg-slate-900/40 border-b border-slate-850 flex items-center justify-between" dir="rtl">
                 <span className="text-[10px] font-black text-slate-400">مساحات العمل الحالية بالمنصة</span>
                 <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md">إجمالي: {brands.length}</span>
               </div>
               
               <div className="p-1.5 max-h-64 overflow-y-auto custom-scrollbar space-y-1">
                 {brands.map((b) => {
                   const isSelected = b.id === activeBrand.id;
                   const bColors = b.colors ? b.colors.split(',').map((c: string) => c.trim()).filter((c: string) => c.startsWith('#')) : [];
                   
                   return (
                     <button
                       key={b.id}
                       onClick={() => {
                         setActiveBrandId(b.id);
                         setIsOpen(false);
                         toast.success(`تم التبديل بنجاح للعلامة التجارية: ${b.name}`);
                       }}
                       className={`w-full text-right p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer border ${
                         isSelected 
                           ? 'bg-rose-500/10 border-rose-500/30 text-white' 
                           : 'hover:bg-slate-900/60 border-transparent text-slate-300 hover:text-white'
                       }`}
                       dir="rtl"
                     >
                       <div className="flex items-center gap-2.5 min-w-0 flex-1">
                         {/* Logo inside list */}
                         {b.logo ? (
                           <img src={b.logo} alt={b.name} className="w-8 h-8 rounded-lg object-contain bg-slate-950 p-1 border border-slate-800 shrink-0" />
                         ) : (
                           <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800 shrink-0">
                             <Briefcase size={14} className={isSelected ? 'text-rose-400' : 'text-slate-500'} />
                           </div>
                         )}

                         <div className="min-w-0 text-right flex-1">
                           <div className="text-xs font-black truncate text-slate-200">{b.name}</div>
                           <div className="text-[9.5px] text-slate-500 truncate mt-0.5">
                             {b.industry || 'عام'} • {b.personality}
                           </div>
                         </div>
                       </div>

                       {/* Mini Palette preview */}
                       {bColors.length > 0 && (
                         <div className="flex items-center gap-0.5 shrink-0 pl-1">
                           {bColors.slice(0, 3).map((col: string, idx: number) => (
                             <div 
                               key={idx} 
                               className="w-2.5 h-2.5 rounded-full border border-white/5" 
                               style={{ backgroundColor: col }} 
                             />
                           ))}
                         </div>
                       )}
                     </button>
                   );
                 })}
               </div>
             </motion.div>
           </>
         )}
       </AnimatePresence>
     </div>
   );
}

