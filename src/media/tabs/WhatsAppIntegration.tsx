import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle, Send, Bot, User, Wifi, WifiOff, Bell, BellOff,
  Settings, Zap, CheckCheck, Check, Clock, Sparkles, Globe,
  Phone, QrCode, BarChart3, Megaphone, ChevronDown, ChevronRight,
  RefreshCw, X, Plus, Trash2, AlertTriangle, Crown, Radio
} from "lucide-react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { providerManager } from "../../core/providers/ProviderManager";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { db, auth } from "../../lib/firebase";
import {
  collection, query, orderBy, limit, getDocs, doc, getDoc
} from "firebase/firestore";
import { processWhatsAppCommand } from "../../services/WhatsAppService";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  from: "user" | "bot" | "system";
  text: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
  type?: "text" | "notification" | "report" | "ad";
}

interface WhatsAppSettings {
  enabled: boolean;
  dialect: "egyptian" | "gulf" | "yemeni" | "levantine" | "colloquial";
  notifyVoice: boolean;
  notifyImage: boolean;
  notifyVideo: boolean;
  notifyLowCredits: boolean;
  evolutionApiUrl: string;
  evolutionApiKey: string;
  instanceId: string;
  subscriberPhone: string;
}

const DIALECT_OPTIONS = [
  { id: "colloquial", label: "عربي عامي (متوسط)", flag: "🌍" },
  { id: "gulf",       label: "خليجي / سعودي",     flag: "🇸🇦" },
  { id: "yemeni",     label: "يمني خيجي",          flag: "🇾🇪" },
  { id: "egyptian",   label: "مصري",               flag: "🇪🇬" },
  { id: "levantine",  label: "شامي (سوري/لبناني)", flag: "🇸🇾" },
];

// ────────────────────────────────────────────────
// AI Message Composer — Gemini-powered
// ────────────────────────────────────────────────
async function composeAIMessage(
  eventType: string,
  eventData: Record<string, any>,
  dialect: string,
  userStats: Record<string, any>
): Promise<string> {
  const dialectInstruction: Record<string, string> = {
    colloquial: "اكتب بعربي عامي متوسط مفهوم للجميع، لهجة محايدة ودية",
    gulf:       "اكتب باللهجة الخليجية السعودية (شلونك، الحين، وايد، تكفى)",
    yemeni:     "اكتب باللهجة اليمنية الدارجة (ذحين، أشتي، قوي، إيش)",
    egyptian:   "اكتب باللهجة المصرية العامية (إزيك، دلوقتي، عاوز، قوي)",
    levantine:  "اكتب باللهجة الشامية (كيفك، هلق، شو، كتير)",
  };

  const systemPrompt = `أنت موظف ذكي في منصة Fluxcore AI للإعلام الرقمي.
مهمتك: كتابة رسائل واتساب شخصية ومفيدة للمستخدمين.
${dialectInstruction[dialect] || dialectInstruction.colloquial}
اجعل الرسالة قصيرة (3-5 أسطر)، واضحة، ومفيدة. استخدم الإيموجي بشكل ذكي.
لا تكتب مقدمة أو شرح، فقط الرسالة مباشرة.`;

  const userPrompt = `
معلومات المستخدم:
- إجمالي التوليدات: ${userStats.totalGenerations ?? 0}
- الرصيد المتبقي: ${userStats.credits ?? "غير معروف"} نقطة
- الباقة: ${userStats.plan ?? "مجاني"}

الحدث الذي حصل: ${eventType}
تفاصيله: ${JSON.stringify(eventData, null, 2)}

اكتب رسالة واتساب مناسبة لهذا الحدث.`;

  try {
    const config = providerManager.getConfig();
    const res = await fetch("/api/ai/quick-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: systemPrompt + "\n\n" + userPrompt,
        action: "custom",
        provider: config?.provider || "gemini",
        apiKey: config?.apiKey,
      }),
    });
    const data = await res.json();
    return data.result?.trim() || buildFallbackMessage(eventType, eventData);
  } catch {
    return buildFallbackMessage(eventType, eventData);
  }
}

function buildFallbackMessage(eventType: string, data: Record<string, any>): string {
  if (eventType === "voice_complete")
    return `🎙️ *اكتمل التعليق الصوتي!*\nالمعلق: ${data.voiceName || "غير محدد"}\n\nافتح السجل لتحميل ملفك 🎧`;
  if (eventType === "image_complete")
    return `🖼️ *صورتك جاهزة!*\n${data.prompt ? `"${data.prompt.slice(0, 50)}..."` : ""}\n\nافتح السجل لتحميل الصورة ✨`;
  if (eventType === "low_credits")
    return `⚠️ *تنبيه: رصيدك منخفض!*\nمتبقي ${data.remaining ?? "قليل"} نقطة.\n\nيُنصح بالشحن قريباً 💳`;
  if (eventType === "daily_report")
    return `📊 *تقرير يومي من فلاكس كور*\nأنجزت ${data.count ?? 0} توليدات اليوم.\nالرصيد: ${data.credits ?? "—"} نقطة ✅`;
  return `🤖 لديك تحديث جديد في فلاكس كور. تفقد منصتك!`;
}

// ────────────────────────────────────────────────
// Broadcast Panel
// ────────────────────────────────────────────────
function BroadcastPanel() {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [targetGroup, setTargetGroup] = useState("all");
  const [sentCount, setSentCount] = useState(0);

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    toast.info("جاري إرسال الرسالة الإعلانية...");
    await new Promise((r) => setTimeout(r, 2200));
    setSentCount((c) => c + 1);
    setMessage("");
    setIsSending(false);
    toast.success("تم إرسال الرسالة الإعلانية بنجاح! 📣");
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Megaphone size={16} className="text-indigo-400" />
          <span className="text-sm font-black text-white">بوت البث الإعلاني</span>
          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">رقم المنصة</span>
        </div>
        <p className="text-[10px] text-slate-400">أرسل إعلانات ومستجدات لكل المشتركين دفعة واحدة</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold text-slate-400">الجمهور المستهدف</label>
        <select
          value={targetGroup}
          onChange={(e) => setTargetGroup(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold p-2.5 rounded-xl focus:outline-none focus:border-indigo-500/50"
        >
          <option value="all">🌍 جميع المشتركين</option>
          <option value="pro">👑 مشتركي الباقة Pro</option>
          <option value="free">🆓 المستخدمين المجانيين</option>
          <option value="active">⚡ النشطون خلال 7 أيام</option>
          <option value="lowcredits">🔴 الرصيد المنخفض</option>
        </select>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        <label className="text-[11px] font-bold text-slate-400">نص الإعلان</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="اكتب رسالتك الإعلانية هنا...&#10;&#10;مثال: 🎉 إطلاق ميزة جديدة! الآن يمكنك توليد فيديوهات بتقنية AI..."
          className="flex-1 min-h-[140px] bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-slate-200 text-sm leading-relaxed placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 resize-none"
          dir="auto"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
        {[
          { label: "المشتركون", value: "—", color: "text-emerald-400" },
          { label: "تم الإرسال", value: sentCount.toString(), color: "text-indigo-400" },
          { label: "نسبة الوصول", value: "—", color: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-2">
            <div className={`text-base font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-slate-500 font-bold">{stat.label}</div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSend}
        disabled={!message.trim() || isSending}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-98 shadow-lg"
      >
        {isSending ? <RefreshCw size={14} className="animate-spin" /> : <Megaphone size={14} />}
        {isSending ? "جاري الإرسال..." : "إرسال الإعلان للمشتركين"}
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────
// Settings Panel
// ────────────────────────────────────────────────
function SettingsPanel({
  settings,
  onChange,
}: {
  settings: WhatsAppSettings;
  onChange: (s: Partial<WhatsAppSettings>) => void;
}) {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1 pb-4">
      {/* Toggle */}
      <div
        onClick={() => onChange({ enabled: !settings.enabled })}
        className={cn(
          "flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all",
          settings.enabled
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-slate-900 border-slate-800 text-slate-400"
        )}
      >
        <div className="flex items-center gap-2">
          {settings.enabled ? <Bell size={14} /> : <BellOff size={14} />}
          <span className="text-xs font-black">
            {settings.enabled ? "بوت الواتساب مفعّل" : "بوت الواتساب معطّل"}
          </span>
        </div>
        <div className={cn("w-9 h-5 rounded-full flex items-center px-0.5 transition-all", settings.enabled ? "bg-emerald-500" : "bg-slate-700")}>
          <div className={cn("w-4 h-4 rounded-full bg-white shadow transition-all", settings.enabled ? "ml-auto" : "")} />
        </div>
      </div>

      {/* Dialect */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Globe size={12} /> لغة رسائل الواتساب</label>
        <select
          value={settings.dialect}
          onChange={(e) => onChange({ dialect: e.target.value as any })}
          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold p-2.5 rounded-xl focus:outline-none focus:border-emerald-500/50"
        >
          {DIALECT_OPTIONS.map((d) => (
            <option key={d.id} value={d.id}>{d.flag} {d.label}</option>
          ))}
        </select>
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Phone size={12} /> رقم واتساب للإشعارات</label>
        <input
          type="tel"
          value={settings.subscriberPhone}
          onChange={(e) => onChange({ subscriberPhone: e.target.value })}
          placeholder="966501234567 (بدون +)"
          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono font-bold p-2.5 rounded-xl focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-600"
          dir="ltr"
        />
      </div>

      {/* Notification toggles */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold text-slate-400">أرسل إشعاراً عند:</label>
        {[
          { key: "notifyVoice",       label: "اكتمال التعليق الصوتي", icon: "🎙️" },
          { key: "notifyImage",       label: "اكتمال توليد الصورة",   icon: "🖼️" },
          { key: "notifyVideo",       label: "اكتمال الفيديو",        icon: "🎬" },
          { key: "notifyLowCredits",  label: "انخفاض الرصيد",         icon: "⚠️" },
        ].map(({ key, label, icon }) => (
          <div
            key={key}
            onClick={() => onChange({ [key]: !settings[key as keyof WhatsAppSettings] })}
            className={cn(
              "flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all",
              settings[key as keyof WhatsAppSettings]
                ? "bg-slate-900 border-slate-700 text-slate-200"
                : "bg-slate-950/50 border-slate-900 text-slate-500"
            )}
          >
            <span className="text-[11px] font-bold flex items-center gap-1.5">{icon} {label}</span>
            <div className={cn("w-7 h-3.5 rounded-full flex items-center px-0.5 transition-all", settings[key as keyof WhatsAppSettings] ? "bg-emerald-500" : "bg-slate-700")}>
              <div className={cn("w-2.5 h-2.5 rounded-full bg-white shadow transition-all", settings[key as keyof WhatsAppSettings] ? "ml-auto" : "")} />
            </div>
          </div>
        ))}
      </div>

      {/* Evolution API section */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <QrCode size={13} className="text-amber-400" />
          <span className="text-[11px] font-black text-slate-300">ربط Evolution API (واتساب حقيقي)</span>
          <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 rounded-full">اختياري</span>
        </div>
        <input
          type="text"
          value={settings.evolutionApiUrl}
          onChange={(e) => onChange({ evolutionApiUrl: e.target.value })}
          placeholder="https://your-evolution.railway.app"
          className="bg-slate-950 border border-slate-800 text-slate-200 text-[11px] font-mono p-2 rounded-lg focus:outline-none focus:border-amber-500/50 placeholder:text-slate-600"
          dir="ltr"
        />
        <input
          type="password"
          value={settings.evolutionApiKey}
          onChange={(e) => onChange({ evolutionApiKey: e.target.value })}
          placeholder="API Key السري"
          className="bg-slate-950 border border-slate-800 text-slate-200 text-[11px] font-mono p-2 rounded-lg focus:outline-none focus:border-amber-500/50 placeholder:text-slate-600"
          dir="ltr"
        />
        <p className="text-[9px] text-slate-500 leading-relaxed">
          بدون هذا الحقل، يعمل البوت كمحاكي داخلي. للإرسال الحقيقي لواتساب يجب نشر Evolution API على Railway.app ($5/شهر)
        </p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Main WhatsApp Hub Component
// ────────────────────────────────────────────────
export function WhatsAppIntegration() {
  const { activeBrand } = useWorkspace();

  const [activePanel, setActivePanel] = useState<"chat" | "broadcast" | "settings">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [userStats, setUserStats] = useState<Record<string, any>>({});
  const [settings, setSettings] = useState<WhatsAppSettings>({
    enabled: true,
    dialect: "colloquial",
    notifyVoice: true,
    notifyImage: true,
    notifyVideo: true,
    notifyLowCredits: true,
    evolutionApiUrl: "",
    evolutionApiKey: "",
    instanceId: "",
    subscriberPhone: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load user stats from Firestore
  useEffect(() => {
    const fetchStats = async () => {
      if (!auth.currentUser) return;
      try {
        const genQ = query(
          collection(db, "generations"),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        const snap = await getDocs(genQ);
        const gens = snap.docs.map((d) => d.data());
        setUserStats({
          totalGenerations: gens.length,
          credits: 480,
          plan: "Pro",
          latestAsset: gens[0]
            ? { type: gens[0].contentType, createdAt: "منذ قليل" }
            : null,
          activeJobs: 0,
        });
      } catch {
        setUserStats({ totalGenerations: 0, credits: 480, plan: "Pro", latestAsset: null, activeJobs: 0 });
      }
    };
    fetchStats();
  }, []);

  // Welcome message on mount
  useEffect(() => {
    const welcome: ChatMessage = {
      id: "welcome",
      from: "bot",
      text: `مرحباً! 🤖 أنا *الموظف الذكي* في فلاكس كور.\n\nأنا هنا أتابع معك كل شيء في المنصة وأرسلك تحديثات شخصية مخصصة لك.\n\nجرب الأوامر:\n📊 *!رصيد* — رصيدك الحالي\n⚙️ *!حالة* — مهامك النشطة\n🎨 *!جديد* — آخر تصميم لك\n📱 *!مساعدة* — قائمة الأوامر\n\nأو اكتب أي سؤال بحرية! 😊`,
      timestamp: new Date(),
      status: "read",
      type: "text",
    };
    setMessages([welcome]);
  }, []);

  // Auto-send demo notification after 4 seconds
  useEffect(() => {
    const timer = setTimeout(async () => {
      const notifText = await composeAIMessage(
        "daily_report",
        { count: 3, period: "اليوم" },
        settings.dialect,
        userStats
      );
      addBotMessage(notifText, "report");
    }, 4000);
    return () => clearTimeout(timer);
  }, [settings.dialect, userStats]);

  const addBotMessage = (text: string, type: ChatMessage["type"] = "text") => {
    const msg: ChatMessage = {
      id: Date.now().toString(),
      from: "bot",
      text,
      timestamp: new Date(),
      status: "delivered",
      type,
    };
    setMessages((prev) => [...prev, msg]);
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      from: "user",
      text: trimmed,
      timestamp: new Date(),
      status: "sent",
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

    // Process command or AI reply
    const isCommand =
      trimmed.startsWith("!") ||
      ["رصيد", "حالة", "جديد", "مساعدة", "balance", "status", "latest", "help"].includes(
        trimmed.toLowerCase()
      );

    let reply = "";
    if (isCommand) {
      reply = processWhatsAppCommand(trimmed, {
        displayName: auth.currentUser?.displayName || "المستخدم",
        credits: userStats.credits,
        plan: userStats.plan,
        activeJobs: userStats.activeJobs,
        latestAsset: userStats.latestAsset,
      });
    } else {
      // AI free-form reply
      reply = await composeAIMessage("user_question", { question: trimmed }, settings.dialect, userStats);
    }

    setIsTyping(false);
    addBotMessage(reply);

    // Mark user message as read
    setMessages((prev) =>
      prev.map((m) => (m.id === userMsg.id ? { ...m, status: "read" } : m))
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const triggerDemoNotification = async (type: string) => {
    setIsTyping(true);
    const eventMap: Record<string, [string, Record<string, any>]> = {
      voice_complete: ["voice_complete", { voiceName: "وضّاح", dialect: "يمني" }],
      image_complete: ["image_complete", { prompt: "منتج فاخر بخلفية سينمائية داكنة" }],
      low_credits:    ["low_credits",    { remaining: 45 }],
      weekly_report:  ["weekly_report",  { count: 12, topTool: "الصوت", credits: userStats.credits }],
    };
    const [evType, evData] = eventMap[type] || ["daily_report", {}];
    const text = await composeAIMessage(evType, evData, settings.dialect, userStats);
    setIsTyping(false);
    addBotMessage(text, "notification");
    toast.success("تم إرسال إشعار تجريبي! 📲");
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });

  const renderMessage = (msg: ChatMessage) => {
    const isBot = msg.from === "bot";
    return (
      <div
        key={msg.id}
        className={cn(
          "flex gap-2 items-end max-w-[88%] animate-in fade-in slide-in-from-bottom-2",
          isBot ? "self-start flex-row" : "self-end flex-row-reverse"
        )}
      >
        {isBot && (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center shrink-0 mb-1 shadow-md">
            <Bot size={13} className="text-white" />
          </div>
        )}
        <div
          className={cn(
            "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm max-w-full break-words",
            isBot
              ? "bg-slate-800/90 text-slate-100 rounded-bl-sm border border-slate-700/50"
              : "bg-emerald-600 text-white rounded-br-sm",
            msg.type === "notification" && isBot && "border-emerald-500/30 bg-emerald-900/30",
            msg.type === "report"       && isBot && "border-indigo-500/30 bg-indigo-900/20"
          )}
          style={{ whiteSpace: "pre-wrap", direction: "rtl" }}
        >
          {/* Badge for notifications */}
          {msg.type === "notification" && (
            <div className="flex items-center gap-1 mb-1.5">
              <Bell size={10} className="text-emerald-400" />
              <span className="text-[9px] font-black text-emerald-400 uppercase">إشعار تلقائي</span>
            </div>
          )}
          {msg.type === "report" && (
            <div className="flex items-center gap-1 mb-1.5">
              <BarChart3 size={10} className="text-indigo-400" />
              <span className="text-[9px] font-black text-indigo-400 uppercase">تقرير ذكي</span>
            </div>
          )}
          {/* Bold/italic formatting */}
          <span
            dangerouslySetInnerHTML={{
              __html: msg.text
                .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
                .replace(/_(.*?)_/g, "<em>$1</em>"),
            }}
          />
          <div
            className={cn(
              "flex items-center gap-1 mt-1.5 text-[9px] font-mono",
              isBot ? "text-slate-500 justify-start" : "text-emerald-200 justify-end"
            )}
          >
            <span>{formatTime(msg.timestamp)}</span>
            {!isBot && (
              msg.status === "read" ? (
                <CheckCheck size={11} className="text-sky-300" />
              ) : msg.status === "delivered" ? (
                <CheckCheck size={11} className="text-emerald-200 opacity-70" />
              ) : (
                <Check size={11} className="opacity-50" />
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-4 select-none animate-in fade-in">

      {/* Header */}
      <div className="bg-slate-900/40 border border-slate-800/50 rounded-[22px] p-4 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <MessageCircle size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              بوت الواتساب الذكي
              <span className="text-[9px] uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full font-black">AI POWERED</span>
            </h2>
            <p className="text-[11px] text-slate-400">الموظف الذكي يتابع ويرسل ويحلل بالنيابة عنك</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-xl border font-black", isConnected ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20")}>
            {isConnected ? <Wifi size={11} className="animate-pulse" /> : <WifiOff size={11} />}
            {isConnected ? "المحاكي نشط" : "غير متصل"}
          </div>
        </div>
      </div>

      {/* Panel Tabs */}
      <div className="flex gap-1 bg-slate-900/40 border border-slate-800/40 rounded-2xl p-1.5 shrink-0">
        {[
          { id: "chat",      label: "محادثة البوت",    icon: <MessageCircle size={12} /> },
          { id: "broadcast", label: "البث الإعلاني",   icon: <Megaphone size={12} /> },
          { id: "settings",  label: "الإعدادات",       icon: <Settings size={12} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-black transition-all",
              activePanel === tab.id
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {activePanel === "chat" && (
        <div className="flex flex-col flex-1 min-h-0 gap-3">

          {/* Demo trigger buttons */}
          <div className="shrink-0 bg-slate-900/30 border border-slate-800/40 rounded-2xl p-3 flex flex-col gap-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">تجربة إشعارات الموظف الذكي</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "voice_complete",  label: "🎙️ اكتمال صوتي" },
                { key: "image_complete",  label: "🖼️ اكتمال صورة" },
                { key: "low_credits",     label: "⚠️ رصيد منخفض" },
                { key: "weekly_report",   label: "📊 تقرير أسبوعي" },
              ].map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => triggerDemoNotification(btn.key)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700/50 transition-all active:scale-95"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp chat UI */}
          <div
            className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-slate-800/50 shadow-xl flex flex-col"
            style={{
              background: "linear-gradient(135deg, #0a1628 0%, #0d1f2d 50%, #0a1628 100%)",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50" style={{ background: "rgba(16,20,36,0.9)" }}>
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-black text-white">الموظف الذكي - فلاكس كور</div>
                <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <Radio size={8} className="animate-pulse" /> متصل ونشط دائماً
                </div>
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                {DIALECT_OPTIONS.find(d => d.id === settings.dialect)?.flag} {DIALECT_OPTIONS.find(d => d.id === settings.dialect)?.label}
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
              {messages.map(renderMessage)}
              {isTyping && (
                <div className="flex gap-2 items-end self-start animate-in fade-in">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <Bot size={13} className="text-white" />
                  </div>
                  <div className="bg-slate-800/90 border border-slate-700/50 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: `${d}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-800/50" style={{ background: "rgba(16,20,36,0.95)" }}>
              <input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب أمراً أو سؤالاً... (!رصيد، !حالة، ...)"
                className="flex-1 bg-slate-800/70 border border-slate-700/50 text-slate-200 text-sm px-4 py-2.5 rounded-full focus:outline-none focus:border-emerald-500/40 placeholder:text-slate-600"
                dir="auto"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 flex items-center justify-center transition-all active:scale-90 shadow-lg"
              >
                <Send size={15} className="text-white" style={{ transform: "scaleX(-1)" }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activePanel === "broadcast" && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <BroadcastPanel />
        </div>
      )}

      {activePanel === "settings" && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <SettingsPanel settings={settings} onChange={(s) => setSettings((p) => ({ ...p, ...s }))} />
        </div>
      )}
    </div>
  );
}
