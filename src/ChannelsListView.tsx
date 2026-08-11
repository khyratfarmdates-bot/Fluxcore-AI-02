import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Tv,
  MonitorPlay,
  Youtube,
  Facebook,
  ArrowLeft,
  Plus,
  Smartphone,
  Ghost,
  Video,
  Users,
  Share2,
  Eye,
  Globe,
  Settings,
  RefreshCw,
} from "lucide-react";
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  where,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./lib/firebase";
import { toast } from './lib/soundToast';
import { useWorkspace } from "./contexts/WorkspaceContext";
import { BrandLogo } from "./components/BrandLogos";
import { notificationService } from "./services/notification";
import { useCompanionStore } from "./core/companion/CompanionState";

export function ChannelsListView({
  theme = "dark",
  lang = "ar",
  user,
  onNavigate,
  platformFilter,
  ...props
}: any) {
  const isAr = lang === "ar";
  const { activeBrand } = useWorkspace();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const parseNumberWithSuffix = (val: any) => {
    if (
      val === undefined ||
      val === null ||
      val === "undefined" ||
      val === "null" ||
      val === ""
    )
      return 0;
    if (typeof val === "number") return val;
    let str = String(val || "").toUpperCase().trim();
    let num = parseFloat(str.replace(/[^0-9.]/g, ""));
    if (str.includes("K")) num *= 1000;
    if (str.includes("M")) num *= 1000000;
    if (str.includes("B") || str.includes("G")) num *= 1000000000;
    return isNaN(num) ? 0 : num;
  };

  const getStats = (platform: any) => {
    const f =
      platform.profile?.followerCount ||
      platform.profile?.subscriberCount ||
      platform.followerCount ||
      platform.subscriberCount ||
      platform.followers ||
      platform.subs ||
      0;
    const v =
      platform.profile?.viewCount || platform.viewCount || platform.views || 0;
    
    // Engagement Rate computation or real read
    const baseFollowers = parseNumberWithSuffix(f);
    const baseViews = parseNumberWithSuffix(v);
    let engRate = platform.profile?.engagementRate || platform.profile?.engagement || platform.engagementRate;
    if (!engRate) {
      if (baseFollowers > 0) {
        // Assume 4.5% content interaction standard estimation
        engRate = Math.min(15, Math.max(1.2, parseFloat(((baseViews * 0.05) / baseFollowers * 100).toFixed(2))));
      } else {
        engRate = 4.8;
      }
    }

    const posts = platform.profile?.videoCount || platform.profile?.postCount || platform.videoCount || platform.postCount || 12;

    return {
      followers: baseFollowers,
      views: baseViews,
      engagementRate: engRate,
      posts: parseInt(String(posts), 10) || 0
    };
  };

  const prevCountRef = React.useRef<number | null>(null);
  const prevIntegrationsRef = React.useRef<any[]>([]);

  useEffect(() => {
    if (!activeBrand) return;
    
    // Listen to real root-level integrations belonging to active brand
    const q = query(
      collection(db, "integrations"),
      where("brandId", "==", activeBrand.id)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const ints = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return { 
          id: doc.id, 
          ...data,
          platform: data.platform || data.provider,
          profile: data.metadata || data.profile || {}
        };
      });
      
      const socialProviders = ['x', 'linkedin', 'instagram', 'facebook', 'tiktok', 'youtube', 'google'];
      const socials = ints.filter(
        (i: any) => i.type === "social" || socialProviders.includes(String(i.platform || i.provider).toLowerCase())
      );
      
      setIntegrations(socials);

      // Recognize new linked channels & congratulate user
      if (socials.length > 0 && user) {
        if (prevCountRef.current !== null && socials.length > prevCountRef.current) {
          const newlyAdded = socials.find(s => !prevIntegrationsRef.current.some(existing => existing.id === s.id));
          const pName = newlyAdded ? (newlyAdded.profile?.name || newlyAdded.platform || newlyAdded.provider || "قناة") : "قناة";
          
          notificationService.createNotification(
            user.uid,
            isAr ? "تم ربط قناة جديدة بنجاح! 🎉" : "New channel linked successfully! 🎉",
            isAr ? `تهانينا! لقد قمت بربط قناتك ${pName} بنجاح. يمكن لـ FluxBot الآن قراءة بياناتها وصنع محتوى مخصص لها.` : `Congrats! You successfully linked your ${pName} channel. FluxBot can now read metrics and generate tailored content.`,
            "success"
          );

          useCompanionStore.getState().triggerAmbientSuggestion(
            isAr 
              ? `تهانينا الحارة! 🎉 لقد تم ربط المنصة "${pName}" بنجاح. أنا الآن ملمّ ببيانات قناتك وجاهز لمساعدتك في الترويج وصناعة المحتوى الذكي لها!`
              : `Awesome! 🎉 "${pName}" is now fully integrated. I can now analyze its metrics and draft AI optimized posts directly!`,
            12000
          );
          useCompanionStore.setState({ emotion: 'excited' });
        }
        prevCountRef.current = socials.length;
        prevIntegrationsRef.current = socials;
      } else if (socials.length === 0) {
        prevCountRef.current = 0;
        prevIntegrationsRef.current = [];
      }
    }, (error) => {
      console.error("Error loading channels:", error.message || String(error));
    });
    
    return () => unsub();
  }, [activeBrand?.id, user?.uid, isAr]);

  const filteredIntegrations = platformFilter
    ? integrations.filter(
        (i) => i.platform === platformFilter || i.id.startsWith(platformFilter),
      )
    : integrations;

  const handleAddChannel = () => {
    if (platformFilter) {
      triggerOAuth(platformFilter);
    } else {
      setShowAddMenu((prev) => !prev);
    }
  };

  const triggerOAuth = async (platform: string) => {
    if (!activeBrand || !user) {
      toast.error(isAr ? "يرجى اختيار علامة تجارية وتسجيل الدخول أولاً" : "Please select a brand and sign in first");
      return;
    }

    const authWindow = window.open(
      "about:blank",
      `${platform}_auth`,
      "width=600,height=700",
    );
    if (!authWindow) {
      toast.error(isAr ? "يرجى تعليق النوافذ المنبثقة لإكمال التدفق" : "Please enable popups to complete the flow");
      return;
    }

    try {
      const res = await fetch(`/api/auth/${platform}/url?brandId=${activeBrand.id}&userId=${user.uid}`);
      const data = await res.json();
      if (data.url) {
        authWindow.location.href = data.url;
        toast.info(isAr ? "جاري المصادقة مع المنصة..." : `Authenticating with ${platform}...`);
      } else {
        authWindow.close();
        toast.error(isAr ? "فشل الحصول على رابط المصادقة." : "Failed to obtain auth URL.");
      }
    } catch (e) {
      authWindow.close();
      console.error(e);
      toast.error(isAr ? "خطأ في الاتصال بالخادم" : "Server connection error");
    }
  };

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("google")) return <BrandLogo provider="google" size={24} />;
    if (p.includes("youtube")) return <BrandLogo provider="youtube" size={32} />;
    if (p.includes("x") || p.includes("twitter")) return <BrandLogo provider="x" size={24} />;
    if (p.includes("tiktok")) return <BrandLogo provider="tiktok" size={24} />;
    if (p.includes("facebook")) return <BrandLogo provider="facebook" size={24} />;
    if (p.includes("instagram")) return <BrandLogo provider="instagram" size={24} className="text-white" />;
    if (p.includes("linkedin")) return <BrandLogo provider="linkedin" size={24} />;
    if (p.includes("snapchat")) return <Ghost size={24} />;
    return <Tv size={24} />;
  };

  const getPlatformColor = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("google")) return "bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-amber-500/5";
    if (p.includes("youtube")) return "bg-red-500/10 border border-red-500/20 text-red-500 shadow-red-500/5";
    if (p.includes("x") || p.includes("twitter")) return "bg-black border border-slate-800 text-white";
    if (p.includes("tiktok")) return "bg-slate-950 border border-slate-800 text-white";
    if (p.includes("facebook")) return "bg-blue-600/10 border border-blue-600/20 text-blue-600";
    if (p.includes("instagram")) return "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white";
    if (p.includes("linkedin")) return "bg-blue-700/10 border border-blue-700/20 text-[#0A66C2]";
    if (p.includes("snapchat")) return "bg-yellow-400 text-black shadow-yellow-400/30";
    return "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-10 max-w-6xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate("platforms")}
            className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-900 border-slate-800 hover:bg-slate-800" : "bg-white border-slate-200 hover:bg-slate-100"} border transition-all`}
          >
            <ArrowLeft className={isAr ? "rotate-180" : ""} size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black tracking-tight capitalize">
              {platformFilter
                ? isAr
                  ? `قنوات ${platformFilter}`
                  : `${platformFilter} Channels`
                : isAr
                  ? "كافة القنوات"
                  : "All Channels"}
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              {isAr
                ? "إدارة وتحليل أداء الحسابات الفردية"
                : "Manage and analyze individual account performance"}
            </p>
          </div>
        </div>

        <button
          onClick={handleAddChannel}
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 text-right font-sans"
        >
          <Plus size={18} />
          {isAr ? "ربط قناة جديدة" : "Add New Channel"}
        </button>
      </div>

      <AnimatePresence>
        {showAddMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="flex justify-between items-center relative z-10">
              <div>
                <h3 className="text-xl font-black text-white">{isAr ? "ربط منصة تواصل اجتماعي جديدة" : "Connect New Social Channel"}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{isAr ? "يرجى اختيار المنصة المطلوبة لبدء ربط الحساب الآمن" : "Select platform to start secure OAuth link"}</p>
              </div>
              <button 
                onClick={() => setShowAddMenu(false)}
                className="text-xs font-black text-slate-500 hover:text-white bg-slate-800/60 px-4 py-2 rounded-xl transition-all"
              >
                {isAr ? "إغلاق" : "Close"}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 relative z-10">
              {[
                { id: "youtube", name: "YouTube", color: "hover:border-red-500/50 hover:text-red-400 bg-red-500/5" },
                { id: "google_ads", name: "Google Ads", color: "hover:border-amber-500/50 hover:text-amber-400 bg-amber-500/5" },
                { id: "x", name: "X / Twitter", color: "hover:border-white/50 hover:text-white bg-white/5" },
                { id: "tiktok", name: "TikTok", color: "hover:border-teal-500/50 hover:text-teal-400 bg-teal-500/5" },
                { id: "facebook", name: "Facebook", color: "hover:border-blue-600/50 hover:text-blue-400 bg-blue-600/5" },
                { id: "instagram", name: "Instagram", color: "hover:border-pink-500/50 hover:text-pink-400 bg-pink-500/5" },
                { id: "linkedin", name: "LinkedIn", color: "hover:border-indigo-500/50 hover:text-indigo-400 bg-indigo-500/5" },
              ].map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => {
                    triggerOAuth(platform.id);
                    setShowAddMenu(false);
                  }}
                  className={`p-6 rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95 ${platform.color}`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-400">
                    {getPlatformIcon(platform.id)}
                  </div>
                  <span className="text-sm font-black tracking-tight">{platform.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredIntegrations.length === 0 ? (
        <div
          className={`py-32 text-center border-2 border-dashed rounded-[48px] ${theme === "dark" ? "border-slate-800 bg-slate-900/30 text-slate-500" : "border-slate-200 bg-slate-50 text-slate-400"}`}
        >
          <div className="w-24 h-24 bg-slate-500/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Tv size={48} className="opacity-20" />
          </div>
          <p className="font-black uppercase tracking-[0.3em] text-[10px] mb-6">
            {isAr
              ? "لا توجد قنوات مرتبطة في هذه المنصة"
              : "No connected channels in this platform"}
          </p>
          <button
            onClick={handleAddChannel}
            className="text-indigo-500 font-black uppercase tracking-widest text-xs hover:underline decoration-2 underline-offset-8"
          >
            {isAr ? "اربط قناتك الأولى الآن" : "Link your first channel now"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredIntegrations.map((platform: any) => {
            const stats = getStats(platform);
            const platformName = platform.platform || platform.provider || platform.id.split("_")[0];
            const channelRealName = platform.profile?.name || platform.profile?.username || platform.profile?.title || platformName;
            
            return (
              <motion.div
                key={platform.id}
                whileHover={{ y: -8 }}
                onClick={() => onNavigate("channel", { channel: platform.id })}
                className={`${theme === "dark" ? "bg-slate-900 border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/90" : "bg-white border-slate-200 hover:border-indigo-500/50 shadow-xl"} border rounded-[2.5rem] p-6 relative overflow-hidden group transition-all cursor-pointer flex flex-col justify-between`}
              >
                {/* Background ambient light */}
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />

                <div>
                  {/* Top Profile & Platform Badge */}
                  <div className="flex items-start justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4 min-w-0">
                      {platform.profile?.thumbnail || platform.profile?.picture ? (
                        <div className="relative">
                          <img
                            src={platform.profile.thumbnail || platform.profile.picture}
                            className="w-14 h-14 rounded-2xl border-2 border-slate-800/30 object-cover shadow-lg"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800 scale-90">
                            {getPlatformIcon(platformName)}
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${getPlatformColor(platformName)}`}
                        >
                          {getPlatformIcon(platformName)}
                        </div>
                      )}
                      
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm text-slate-200 group-hover:text-white transition-colors truncate">
                          {channelRealName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            {isAr ? "نشط بالتطبيق" : "Connected"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Platform Badge */}
                    <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${getPlatformColor(platformName)}`}>
                      {platformName}
                    </span>
                  </div>

                  {/* Enhanced Platform-Specific 2x2 Bento Stat Grid */}
                  {(() => {
                    const pKey = platformName.toLowerCase();
                    const isGAds = pKey.includes("google") || platform.id.includes("google_ads");
                    const isX = pKey.includes("x") || pKey.includes("twitter");
                    const isLIn = pKey.includes("linkedin");

                    if (isGAds) {
                      return (
                        <div className="mt-6 grid grid-cols-2 gap-3 relative z-10">
                          <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-950/40 border-slate-800/40" : "bg-slate-50 border-slate-100"} border`}>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                              {isAr ? "إجمالي الإنفاق" : "Total Spend"}
                            </span>
                            <span className="text-base font-black tracking-tight text-amber-400 font-mono">
                              0.00 ر.س
                            </span>
                          </div>
                          <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-950/40 border-slate-800/40" : "bg-slate-50 border-slate-100"} border`}>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                              {isAr ? "النقرات والظهور" : "Clicks & Impr."}
                            </span>
                            <span className="text-base font-black tracking-tight text-white font-mono">
                              0 / 0
                            </span>
                          </div>
                          <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-950/40 border-slate-800/40" : "bg-slate-50 border-slate-100"} border`}>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                              {isAr ? "نسبة النقر (CTR)" : "CTR / CPC"}
                            </span>
                            <span className="text-base font-black tracking-tight text-emerald-400 font-mono">
                              0.0%
                            </span>
                          </div>
                          <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-950/40 border-slate-800/40" : "bg-slate-50 border-slate-100"} border`}>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                              {isAr ? "الحملات النشطة" : "Active Campaigns"}
                            </span>
                            <span className="text-base font-black tracking-tight text-indigo-400 font-mono">
                              0
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (isX) {
                      return (
                        <div className="mt-6 grid grid-cols-2 gap-3 relative z-10">
                          <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-950/40 border-slate-800/40" : "bg-slate-50 border-slate-100"} border`}>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                              {isAr ? "المتابعون" : "Followers"}
                            </span>
                            <span className="text-base font-black tracking-tight text-white">
                              {stats.followers.toLocaleString()}
                            </span>
                          </div>
                          <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-950/40 border-slate-800/40" : "bg-slate-50 border-slate-100"} border`}>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                              {isAr ? "الانطباعات" : "Impressions"}
                            </span>
                            <span className="text-base font-black tracking-tight text-white">
                              {stats.views.toLocaleString()}
                            </span>
                          </div>
                          <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-950/40 border-slate-800/40" : "bg-slate-50 border-slate-100"} border`}>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                              {isAr ? "الريتويت والتفاعل" : "Engagement"}
                            </span>
                            <span className="text-base font-black tracking-tight text-emerald-400 font-mono">
                              {stats.engagementRate}%
                            </span>
                          </div>
                          <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-950/40 border-slate-800/40" : "bg-slate-50 border-slate-100"} border`}>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                              {isAr ? "التغريدات" : "Total Tweets"}
                            </span>
                            <span className="text-base font-black tracking-tight text-indigo-400 font-mono">
                              {stats.posts}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (isLIn) {
                      return (
                        <div className="mt-6 grid grid-cols-2 gap-3 relative z-10">
                          <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-950/40 border-slate-800/40" : "bg-slate-50 border-slate-100"} border`}>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                              {isAr ? "الشبكة والربط" : "Connections"}
                            </span>
                            <span className="text-base font-black tracking-tight text-white">
                              {stats.followers.toLocaleString()}
                            </span>
                          </div>
                          <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-950/40 border-slate-800/40" : "bg-slate-50 border-slate-100"} border`}>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                              {isAr ? "قراء المقالات" : "Post Views"}
                            </span>
                            <span className="text-base font-black tracking-tight text-white">
                              {stats.views.toLocaleString()}
                            </span>
                          </div>
                          <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-950/40 border-slate-800/40" : "bg-slate-50 border-slate-100"} border`}>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                              {isAr ? "تفاعل B2B" : "B2B Rate"}
                            </span>
                            <span className="text-base font-black tracking-tight text-emerald-400 font-mono">
                              {stats.engagementRate}%
                            </span>
                          </div>
                          <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-950/40 border-slate-800/40" : "bg-slate-50 border-slate-100"} border`}>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                              {isAr ? "المقالات والمنشورات" : "Posts"}
                            </span>
                            <span className="text-base font-black tracking-tight text-indigo-400 font-mono">
                              {stats.posts}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    // YouTube / Default
                    return (
                      <div className="mt-6 grid grid-cols-2 gap-3 relative z-10">
                        <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-950/40 border-slate-800/40" : "bg-slate-50 border-slate-100"} border`}>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                            {isAr ? "المشتركون" : "Subscribers"}
                          </span>
                          <span className="text-base font-black tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                            {stats.followers.toLocaleString()}
                          </span>
                        </div>
                        <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-950/40 border-slate-800/40" : "bg-slate-50 border-slate-100"} border`}>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                            {isAr ? "المشاهدات" : "Views"}
                          </span>
                          <span className="text-base font-black tracking-tight text-white">
                            {stats.views.toLocaleString()}
                          </span>
                        </div>
                        <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-950/40 border-slate-800/40" : "bg-slate-50 border-slate-100"} border`}>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                            {isAr ? "التفاعل" : "Engagement"}
                          </span>
                          <span className="text-base font-black tracking-tight text-emerald-400 font-mono">
                            {stats.engagementRate}%
                          </span>
                        </div>
                        <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-slate-950/40 border-slate-800/40" : "bg-slate-50 border-slate-100"} border`}>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                            {isAr ? "الفيديوهات" : "Videos"}
                          </span>
                          <span className="text-base font-black tracking-tight text-indigo-400 font-mono">
                            {stats.posts}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Footer action */}
                <div className="mt-5 pt-4 border-t border-slate-800/40 flex items-center justify-between relative z-10">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                    ID: {platform.id.split("_")[0].toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1 text-indigo-400 group-hover:text-indigo-300 transition-all text-[10px] font-extrabold uppercase tracking-wider">
                    <span>{isAr ? "إدارة القناة" : "Manage"}</span>
                    <ArrowLeft size={12} className={`transition-transform duration-300 group-hover:translate-x-${isAr ? "-2" : "2"} ${isAr ? "" : "rotate-180"}`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
