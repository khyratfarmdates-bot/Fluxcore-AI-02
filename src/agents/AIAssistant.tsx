import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useAnimationFrame } from "motion/react";
import { 
  MessageSquarePlus, 
  X, 
  Navigation, 
  Minimize2, 
  Maximize2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus,
  History,
  ShieldCheck,
  Zap,
  Layout,
  Paperclip,
  RotateCcw,
  Search,
  LayoutGrid,
  Play,
  Pause,
  SkipForward
} from "lucide-react";
import { cn } from "../lib/utils";
import { FluxyCharacter } from "./FluxyCharacter";
import { executiveEngine } from "../executive/ExecutiveEngine";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { ExecutiveMessage } from "../executive/types";
import { eventBus } from "../core/events/EventBus";
import { useCompanionStore, EmotionState } from "../core/companion/CompanionState";
import { AILogger, ChatSession } from "../persistence/AILogger";
import { scenarioEngine } from "../core/companion/ScenarioEngine";
import { proactiveEngine } from "../core/companion/ProactiveEngine";
import { audioSystem } from "../lib/audioSystem";

const GhostCursor = ({ position }: { position: { x: number, y: number } | null }) => {
  if (!position) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1, x: position.x - 12, y: position.y - 12 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed z-[100] pointer-events-none"
      style={{ left: 0, top: 0 }}
    >
      <div className="relative">
         <motion.div 
           animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
           transition={{ repeat: Infinity, duration: 1.5 }}
           className="absolute inset-0 bg-indigo-500 rounded-full blur-md"
         />
         <div className="w-6 h-6 border-2 border-white rounded-full bg-indigo-500/50 backdrop-blur-sm flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
         </div>
      </div>
    </motion.div>
  );
};

const getPageGreeting = (module: string): string => {
  switch (module) {
    case 'seo':
      return "مرحباً بك في استوديو SEO الذكي! 🌐 لدي خيارات فحص متعددة (شامل، وتحليلي، واقعي، وتجربة مستخدم EEAT) ومطابقتها مع نية الشراء الفورية في جوجل. هل ترغب في إجراء فحص استخباراتي Spy SEO مع المنافسين الآن لرفع مبيعاتك؟";
    case 'dashboard':
      return "أهلاً بك في لوحة تحكم Fluxcore! 📊 يمكنك رؤية إحصاءات تجارتك وحساباتك النشطة. اضغط بزر الماوس الأيمن على أي بطاقة لشرح تفاصيلها وتوجيهك خطوة بخطوة لكل خدمة المتاحة.";
    case 'studio':
      return "أهلاً بك في الاستوديو الإبداعي! ✍️ يمكنني تأليف منشورات وحملات كاملة متطابقة مع نبرة صوت علامتك التجارية لزيادة المبيعات والجذب.";
    case 'media':
      return "وصلت إلى مختبر الوسائط الذكي! 📸 ارفع صور منتجاتك من جهازك وسأقوم فورا بتجريدها من الخلفيات وتصميم ملصق تسويقي احترافي جاهز للعمل مع حملاتك.";
    case 'campaigns':
      return "مرحباً بك في قسم إدارة الحملات والاستراتيجيات! 🎯 يمكننا توليد خطة تسويقية متكاملة لمدة 7 أيام ونشرها تلقائياً لجذب عملاء جدد في ثوانٍ معدودة.";
    case 'publishing':
      return "هذا هو مركز النشر الشامل! 🚀 اربط حساباتك عبر القنوات ووفر وقتك بجدولة المنشورات لتُنشر تلقائياً بدقة متناهية بالكامل.";
    case 'automation':
      return "محرك أتمتة العمليات والمهام وجذب العملاء! ⚙️ هل تريد صياغة قواعد ذكية تبسط إدارة متجرك وتوفر عليك ساعات الإدخال والمراجعة الطويلة؟";
    case 'analytics':
      return "أهلاً بك في قسم التحليلات الذكية والتوقعات! 📈 دعني أراقب لك معدلات المبيعات ونسبة السلال المتروكة لنضع معاً خطة لتعظيم أرباح متجرك.";
    case 'integrations':
      return "لوحة ربط التطبيقات والتكاملات! 🔌 يمكنك هنا توصيل Google Sheets، محركات البحث، والخدمات الأخرى لتأسيس تدفق رقمي تلقائي بالكامل.";
    case 'settings':
      return "أنت الآن في منطقة إعدادات النظام وتفضيلات المنصة ⚙️ لضبط خيارات حسابك وعلامتك التجارية بالكامل.";
    case 'core':
      return "مرحباً بك في نظام التشغيل الاستكشافي (AI OS Core)! 🧠 هنا ينبض ذكاء النظام الإداري ويمكنك معاينة تدفقات عتاد المهام النشطة تلقائياً.";
    case 'billing':
      return "أهلاً بك في الباقات والفواتير 💳 لتصفح خطط الاشتراك الحالية وترقية صلاحيات حسابك لامتلاك ميزات متقدمة ومستمرة.";
    default:
      return "مرحباً بك! أنا رفيقك المساعد دائم التواجد 🤖 هل لديك أي استفسار أو ترغب بسؤالي والزحف لأتمتة أي مهمة في هذه الصفحة؟ سأكون معك خطوة بخطوة!";
  }
};

const getPageActionButtonText = (module: string): string => {
  switch (module) {
    case 'seo': return "تنفيذ فحص السيو 🔍";
    case 'studio': return "كتابة منشور ✍️";
    case 'media': return "تحسين صورة منتج 📸";
    case 'campaigns': return "بدء حملة جديدة 🎯";
    case 'publishing': return "ربط قنوات النشر 🚀";
    case 'automation': return "صياغة قاعدة جديدة ⚙️";
    case 'analytics': return "قراءة التوصيات 📈";
    default: return "اسألني الآن 💬";
  }
};

const getPageActionPrompt = (module: string): string => {
  switch (module) {
    case 'seo': return "أرغب في فحص جودة السيو (SEO) لمتجري الإلكتروني ومقارنته بالمنافسين الكبار وتوليد أفكار بحثية.";
    case 'studio': return "أرغب في صياغة منشور إبداعي ذكي لإنستغرام أو تويتر يتطابق مع هوية علامتي التجارية.";
    case 'media': return "أرغب في معرفة كيف يمكنني تحسين صور منتجاتي، وتغيير خلفياتها واقتصاص صور الأبعاد.";
    case 'campaigns': return "أرغب في تخطيط استراتيجية تسويقية وجدولة حملة إعلانية لمدة 7 أيام متواصلة.";
    case 'publishing': return "يرجى توجيهي لكيفية ربط حسابات وقنوات السوشيال ميديا الخاصة بي وتفعيل مركز النشر الذكي.";
    case 'automation': return "أود صياغة قاعدة أتمتة تلقائية جديدة لتنظيف البيانات وإرسال الإشعارات وتسهيل المبيعات.";
    case 'analytics': return "يرجى قراءة التوصيات الحية لتحليلات أداء تجارتي ومعدل الشراء والترافيك.";
    default: return "مرحباً! كيف يمكنك مساعدتي في تحسين أداء متجري اليوم بذكاء؟";
  }
};

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { isGuiding, guideTargetSelector, guideMessage, setGuide, targetEdgePosition, emotion, aiCursorPosition, isDemonstrating, isDemoPaused, demoScenario, isAmbientSuggesting, hasArrived, currentPageModule } = useCompanionStore();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const stableTarget = useRef({ x: 0, y: 0 });
  const [displayedMessage, setDisplayedMessage] = useState("");

  // Ambient Proactive Detection
  useEffect(() => {
    const handleActivity = () => {
      useCompanionStore.getState().recordInteraction();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    const idleInterval = setInterval(() => {
      const state = useCompanionStore.getState();
      const timeSinceLastAction = Date.now() - state.lastInteractionTime;
      
      // If idle for 15 seconds, and not already guiding or doing a demo
      if (timeSinceLastAction > 15000 && !state.isGuiding && !state.isDemonstrating && !isOpen) {
         // Check if we can trigger (cooldown logic inside the action)
         const ideas = [
           "هل يبدو كل شيء واضحاً؟ أستطيع تقديم جولة سريعة.",
           "إذا أردت يمكنني تولي بعض المهام عنك عبر نافذة Executive.",
           "أنا أراقب أداء النظام من هنا، كل شيء يبدو مستقراً.",
           "هل ترغب في استكشاف أدوات النشر المتقدمة؟"
         ];
         const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
         state.triggerAmbientSuggestion(randomIdea, 8000);
      }
    }, 5000);

    return () => {
       window.removeEventListener('mousemove', handleActivity);
       window.removeEventListener('keydown', handleActivity);
       window.removeEventListener('click', handleActivity);
       clearInterval(idleInterval);
    };
  }, [isOpen]);

  useEffect(() => {
    if (guideMessage) {
      setDisplayedMessage("");
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedMessage(guideMessage.slice(0, i + 1));
        i++;
        if (i > guideMessage.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    } else {
      setDisplayedMessage("");
    }
  }, [guideMessage]);

  useEffect(() => {
    let intervalId: any = null;

    const updateRect = () => {
      if (isGuiding && guideTargetSelector) {
        const element = document.querySelector(guideTargetSelector) || 
                        document.querySelector(`[data-companion-id="${guideTargetSelector.replace('#', '')}"]`);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Only update state if position values actually changed to prevent loop rerenders
          setTargetRect(prev => {
            if (!prev || prev.left !== rect.left || prev.top !== rect.top || prev.width !== rect.width || prev.height !== rect.height) {
              return rect;
            }
            return prev;
          });
        }
      } else {
        setTargetRect(null);
      }
    };

    updateRect(); // Instant measurement

    if (isGuiding && guideTargetSelector) {
      // Periodic check to capture navigation page loads or dynamic DOM movements smoothly
      intervalId = setInterval(updateRect, 150);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isGuiding, guideTargetSelector]);

  const prevModuleRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentPageModule || isOpen || isDemonstrating) return;
    
    if (prevModuleRef.current === currentPageModule) return;
    prevModuleRef.current = currentPageModule;

    const speech = getPageGreeting(currentPageModule);
    
    const emotionalIntensity: EmotionState = 
      currentPageModule === 'analytics' || currentPageModule === 'runtime' || currentPageModule === 'seo'
        ? 'serious' 
        : 'happy';
        
    useCompanionStore.getState().setEmotion(emotionalIntensity);
    useCompanionStore.getState().setHasArrived(false);
    useCompanionStore.getState().setGuide(null, null);
    
    const timer = setTimeout(() => {
      // Automatic greetings are silenced to keep the platform noise-free. Tours and prompts remain fully manual and direct.
      useCompanionStore.getState().setGuide(null, null);
      useCompanionStore.setState({ isAmbientSuggesting: false });
    }, 1200);

    return () => clearTimeout(timer);
  }, [currentPageModule, isOpen, isDemonstrating]);

  const handleTriggerPageAction = (module: string) => {
    const prompt = getPageActionPrompt(module);
    setIsOpen(true);
    setGuide(null, null);
    useCompanionStore.setState({ isAmbientSuggesting: false });
    setTimeout(() => {
      handleSend(prompt);
    }, 100);
  };

  const [showHistory, setShowHistory] = useState(false);
  const [mode, setMode] = useState<"assistant" | "executive">("assistant");
  const [message, setMessage] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string>("default");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [history, setHistory] = useState<ExecutiveMessage[]>([
    { 
      id: "initial",
      role: "assistant", 
      content: "مرحباً! أنا FluxBot، رفيقك الذكي. كيف يمكنني مساعدتك في إدارة علامتك التجارية اليوم؟",
      timestamp: Date.now()
    }
  ]);

  // True Locomotion Locomotion System State
  const locomotionRef = useRef({
    vx: 0,
    vy: 0,
    speed: 0,
    navState: 'idle' as 'idle' | 'walking' | 'arriving' | 'explaining' | 'observing',
    distanceToTarget: 0,
    angle: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [smartTip, setSmartTip] = useState<string | null>(null);
  const [isSmiling, setIsSmiling] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeBrand } = useWorkspace();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Subscribe to Sessions
  useEffect(() => {
    if (!activeBrand) return;
    const unsub = AILogger.subscribeSessions(activeBrand.id, (sessionsData) => {
      setSessions(sessionsData);
    });
    return () => unsub();
  }, [activeBrand]);

  // Subscribe to Current Session Messages
  useEffect(() => {
    if (!activeBrand) return;
    const unsub = AILogger.subscribe(activeBrand.id, currentSessionId, (logs) => {
      const mappedHistory: ExecutiveMessage[] = [];
      logs.forEach(log => {
        const logTime = log.timestamp?.toMillis?.() || Date.now();
        mappedHistory.push({
           id: `${log.id}_u_${logTime}`,
           role: 'user',
           content: log.userMessage,
           timestamp: logTime
        });
        mappedHistory.push({
           id: `${log.id}_a_${logTime}`,
           role: 'assistant',
           content: log.aiResponse,
           timestamp: logTime
        });
      });
      
      if (mappedHistory.length === 0) {
        setHistory([
          { 
            id: "initial",
            role: "assistant", 
            content: "مرحباً! أنا FluxBot، رفيقك الذكي. كيف يمكنني مساعدتك في إدارة علامتك التجارية اليوم؟",
            timestamp: Date.now()
          }
        ]);
      } else {
        setHistory(mappedHistory);
      }
    });

    return () => unsub();
  }, [activeBrand, currentSessionId]);

  useEffect(() => {
    const unsub = eventBus.subscribe("EXECUTIVE_STEP_UPDATE", (evt: any) => {
      setHistory(prev => prev.map(msg => {
        if (msg.id === evt.payload.messageId && msg.plan) {
          return {
            ...msg,
            plan: msg.plan.map(step => step.id === evt.payload.step.id ? evt.payload.step : step)
          };
        }
        return msg;
      }));
    });
    return () => unsub();
  }, []);

  const handleNewChat = async () => {
    if (!activeBrand) return;
    const sessionId = await AILogger.createNewSession(activeBrand.id);
    if (sessionId) {
      setCurrentSessionId(sessionId);
      setShowHistory(false);
    }
  };

  const handleSend = async (overrideMessage?: string) => {
    const userMsgContent = overrideMessage || message;
    if (!userMsgContent.trim() && attachments.length === 0 || isProcessing) return;

    audioSystem.playPop();

    const userImages: string[] = [];
    const imageFiles = attachments.filter(f => f.type.startsWith('image/'));
    for (const f of imageFiles) {
      userImages.push(URL.createObjectURL(f));
    }

    // Temporarily add to local UI for speed
    const tempId = `user-${Date.now()}`;
    const userMsg: ExecutiveMessage = {
      id: tempId,
      role: "user",
      content: userMsgContent,
      timestamp: Date.now(),
      images: userImages.length > 0 ? userImages : undefined
    };

    setHistory(prev => [...prev, userMsg]);
    if (!overrideMessage) setMessage("");
    setIsProcessing(true);
    
    // Play thinking sound on loop
    const thinkInterval = setInterval(() => audioSystem.playRobotThinking(), 1200);

    try {
      const imageAttachments = await Promise.all(
        attachments
          .filter(f => f.type.startsWith('image/'))
          .map(async (file) => {
            return new Promise<{ data: string; mimeType: string }>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = reader.result as string;
                resolve({ data: base64.split(',')[1], mimeType: file.type });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          })
      );

      const fileNames = attachments.map(f => f.name).join(', ');
      const msgWithAttachments = attachments.length > 0 
        ? `${userMsgContent}\n\n[المرفقات: ${fileNames}]`
        : userMsgContent;

      setAttachments([]);

      const executionContext = {
        brandId: activeBrand?.id || 'default',
        workspaceId: activeBrand?.id || 'default',
        images: imageAttachments.length > 0 ? imageAttachments : undefined
      };

      const response = await executiveEngine.processMessage(msgWithAttachments, executionContext);
      
      clearInterval(thinkInterval);
      audioSystem.playSuccess();
      
      if (activeBrand) {
        await AILogger.logInteraction({
           brandId: activeBrand.id,
           sessionId: currentSessionId,
           agentRole: 'executive',
           userMessage: userMsgContent,
           aiResponse: response.content
        });
      }
    } catch (e: any) {
      clearInterval(thinkInterval);
      audioSystem.playError();
      console.error(e);
      const errorMsg: ExecutiveMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "⚠️ عذراً، واجهت مشكلة تقنية أثناء معالجة طلبك.",
        timestamp: Date.now()
      };
      setHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const isActiveGuiding = isGuiding && targetRect !== null;
    
  const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const winHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  
  const groundTop = winHeight - 165; 

  const rawTargetLeft = isActiveGuiding && targetRect 
    ? Math.min(winWidth - 150, Math.max(20, targetRect.left - 130))
    : Math.min(winWidth - 150, Math.max(256, targetEdgePosition * (winWidth - 300))); 

  const rawTargetTop = isActiveGuiding && targetRect
    ? Math.min(winHeight - 200, Math.max(20, targetRect.top - 20))
    : groundTop;

  // True Locomotion motion values
  const motionX = useMotionValue(rawTargetLeft);
  const motionY = useMotionValue(rawTargetTop);
  const springX = useSpring(motionX, { stiffness: 140, damping: 22, restDelta: 0.1, restSpeed: 0.1 });
  const springY = useSpring(motionY, { stiffness: 140, damping: 22, restDelta: 0.1, restSpeed: 0.1 });

  useEffect(() => {
    if (!isOpen) {
      const dist = Math.sqrt(Math.pow(rawTargetLeft - stableTarget.current.x, 2) + Math.pow(rawTargetTop - stableTarget.current.y, 2));
      // Buffer the target update even more to avoid micro-jitter during layout transitions
      // and only react to significant moves when not isActiveGuiding
      const threshold = isActiveGuiding ? 5 : 40; 
      
      if (dist > threshold) {
        stableTarget.current = { x: rawTargetLeft, y: rawTargetTop };
        motionX.set(rawTargetLeft);
        motionY.set(rawTargetTop);
        // Reset arrival flag to allow for smooth recalculation of path
        if (hasArrived && dist > 50) {
           useCompanionStore.getState().setHasArrived(false);
        }
      }
    }
  }, [rawTargetLeft, rawTargetTop, isOpen, isActiveGuiding, hasArrived]);

  // Physics animation loop
  useAnimationFrame(() => {
     if (isOpen) return;
     const vx = springX.getVelocity();
     const vy = springY.getVelocity();
     const speed = Math.sqrt(vx * vx + vy * vy);
     const dist = Math.sqrt(Math.pow(springX.get() - motionX.get(), 2) + Math.pow(springY.get() - motionY.get(), 2));
     
     locomotionRef.current.vx = vx;
     locomotionRef.current.vy = vy;
     locomotionRef.current.speed = speed;
     locomotionRef.current.distanceToTarget = dist;
     
     if (speed > 10) {
       locomotionRef.current.angle = Math.atan2(vy, vx);
     }
     
     // Detect arrival
     const { hasArrived } = useCompanionStore.getState();
     if (!hasArrived && dist < 5 && speed < 5) {
       useCompanionStore.getState().setHasArrived(true);
     } else if (hasArrived && dist > 50) {
       // if we moved target suddenly
     }
  });

  if (!isOpen) {
    return (
      <>
        <GhostCursor position={aiCursorPosition} />
        <AnimatePresence>
          {isActiveGuiding && (
            <motion.div 
              className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>

        {isActiveGuiding && (
          <motion.div
            className="fixed z-[65] border-2 border-indigo-500 rounded-xl pointer-events-none shadow-[0_0_0_4px_rgba(99,102,241,0.2)]"
            initial={{ opacity: 0, x: targetRect.left, y: targetRect.top, width: targetRect.width, height: targetRect.height }}
            animate={{ opacity: 1, x: targetRect.left - 4, y: targetRect.top - 4, width: targetRect.width + 8, height: targetRect.height + 8 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
        )}

        <div 
          className="fixed bottom-6 left-6 z-[70] flex flex-col items-start gap-4 pointer-events-auto"
        >
          <motion.button 
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => isActiveGuiding ? setGuide(null, null) : setIsOpen(true)}
            className="group relative"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-2xl blur-xl group-hover:bg-cyan-500/40 transition-colors animate-pulse" />
              <div className="relative flex items-center justify-center">
                 {/* 
                   Fluxy 3D Character Walking Body (Temporarily Disabled to Lighten the Site):
                   <FluxyCharacter 
                     size={100} 
                     emotion={isPopUpActive ? "excited" : emotion} 
                     active 
                     locomotionRef={locomotionRef} 
                     isSmiling={isSmiling || emotion === 'happy' || isPopUpActive} 
                     isExplaining={(isActiveGuiding || isDemonstrating) && !isPopUpActive} 
                     isThinking={isProcessing && !isActiveGuiding && !isDemonstrating}
                     isPointing={isPopUpActive}
                     pointingDirection={pointingDirection}
                   />
                 */}
                 <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:shadow-[0_0_35px_rgba(99,102,241,0.8)] transition-all cursor-pointer">
                   <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden group">
                     <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                     <Sparkles size={24} className="text-cyan-400 group-hover:scale-110 transition-transform animate-pulse" />
                     <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
                   </div>
                 </div>
              </div>
            </div>
          </motion.button>
          
          <AnimatePresence>
            {hasArrived && (isActiveGuiding || isDemonstrating || isAmbientSuggesting) && guideMessage && (() => {
               const isRightSide = rawTargetLeft > (winWidth - 340);
               const isBottomSide = rawTargetTop > (winHeight - 250);
               const bubbleLeft = isRightSide ? -290 : 120;
               const bubbleTop = isBottomSide ? -130 : 20;

               return (
                 <motion.div 
                    initial={{ opacity: 0, x: isRightSide ? -20 : 20, scale: 0.9, height: 0 }}
                    animate={{ opacity: 1, x: 0, scale: 1, height: "auto" }}
                    exit={{ opacity: 0, x: isRightSide ? -20 : 20, scale: 0.9, height: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-[#0A0D14]/95 backdrop-blur-2xl overflow-hidden border border-white/10 rounded-3xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.05)] absolute w-[280px] pointer-events-auto"
                    style={{ left: bubbleLeft, top: bubbleTop }}
                 >
                   <div className="p-5">
                     <div className="flex items-start gap-4 mb-3" dir="auto">
                       <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0 shadow-inner">
                         <AlertCircle size={16} />
                       </div>
                       <div className="text-[13px] font-medium text-slate-200 leading-relaxed min-h-[40px] pt-1">
                          {displayedMessage}
                          <motion.span 
                            animate={{ opacity: [1, 0] }} 
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="inline-block w-1.5 h-3.5 ml-1.5 align-middle bg-indigo-400" 
                          />
                       </div>
                     </div>
                     
                     {isAmbientSuggesting && !isDemonstrating && !isActiveGuiding && (
                       <div className="flex items-center gap-2 mt-5 pt-5 border-t border-white/5">
                          <button 
                            onClick={() => {
                               handleTriggerPageAction(currentPageModule);
                             }}
                            className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] px-2 py-2.5 rounded-xl transition-all font-sans"
                          >
                            {getPageActionButtonText(currentPageModule)}
                          </button>
                          <button 
                            onClick={() => {
                               setGuide(null, null);
                               useCompanionStore.setState({ isAmbientSuggesting: false });
                            }}
                            className="flex-[0.6] flex items-center justify-center gap-1 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 px-2 py-2.5 rounded-xl transition-all"
                          >
                            تخطي ✖
                          </button>
                       </div>
                     )}

                     {isDemonstrating ? (
                       <div className="flex items-center gap-2 mt-5 pt-5 border-t border-white/5">
                          <button 
                            onClick={() => {
                              if (isDemoPaused) scenarioEngine.resumeScenario();
                              else scenarioEngine.pauseScenario();
                            }}
                            className="flex-1 flex items-center justify-center gap-2 text-[11px] uppercase font-bold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 px-3 py-2.5 rounded-xl transition-all tracking-wider"
                          >
                            {isDemoPaused ? <><Play size={12}/> متابعة</> : <><Pause size={12}/> إيقاف</>}
                          </button>
                          <button 
                            onClick={() => {
                               scenarioEngine.endScenario();
                            }}
                            className="flex-1 flex items-center justify-center gap-2 text-[11px] uppercase font-bold bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 px-3 py-2.5 rounded-xl transition-all tracking-wider"
                          >
                            إنهاء
                          </button>
                       </div>
                     ) : (
                       !isAmbientSuggesting && (
                         <button 
                           onClick={() => setGuide(null, null)}
                           className="text-[11px] mt-3 uppercase font-bold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 px-3 py-2.5 rounded-xl transition-all w-full text-center tracking-wider"
                         >
                           إخفاء الإرشاد
                         </button>
                       )
                     )}
                   </div>
                 </motion.div>
               );
            })()}
          </AnimatePresence>
        </div>
      </>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className={cn(
          "fixed bottom-8 left-8 z-[70] bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/10 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.05)] rounded-[32px] overflow-hidden flex transition-all duration-500",
          isExpanded ? "w-[850px] h-[85vh]" : "w-[420px] h-[650px]"
        )}
      >
        {/* Sessions Sidebar (History) */}
        <AnimatePresence>
          {showHistory && (
            <motion.div 
               initial={{ width: 0, opacity: 0 }}
               animate={{ width: 280, opacity: 1 }}
               exit={{ width: 0, opacity: 0 }}
               className="h-full border-r border-white/5 bg-white/5 flex flex-col overflow-hidden relative z-20 backdrop-blur-md"
            >
               <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <span className="font-black text-xs text-white uppercase tracking-widest text-[#cbd5e1]">تاريخ المحادثات</span>
                  <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white transition-colors">
                    <History size={16} />
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  <button 
                    onClick={handleNewChat}
                    className="w-full p-3 rounded-[20px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold flex items-center gap-3 hover:bg-indigo-500 hover:text-white hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all group"
                  >
                     <Plus size={16} className="group-hover:rotate-90 transition-transform" /> محادثة جديدة
                  </button>
                  
                  {sessions.map((s) => (
                    <button 
                      key={s.id}
                      onClick={() => {
                        setCurrentSessionId(s.id);
                        setShowHistory(false);
                      }}
                      className={cn(
                        "w-full p-4 rounded-[20px] border transition-all text-right group backdrop-blur-sm",
                        currentSessionId === s.id 
                          ? "bg-white/10 border-white/20 text-white shadow-inner" 
                          : "bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:border-white/10 hover:text-slate-200"
                      )}
                    >
                       <div className="text-[11px] font-bold truncate mb-1" dir="rtl">{s.title || 'بدون عنوان'}</div>
                       <div className="text-[9px] opacity-60 truncate" dir="rtl">{s.lastMessage || 'لا توجد رسائل'}</div>
                    </button>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="bg-gradient-to-b from-white/[0.08] to-transparent p-5 shrink-0 flex items-center justify-between border-b border-white/5 relative">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <div className="flex items-center gap-4 relative z-10">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={cn("p-2 rounded-xl transition-all", showHistory ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "text-slate-400 hover:bg-white/10")}
              >
                 <History size={18} />
              </button>
              <button 
                onClick={() => {
                   setIsOpen(false);
                   scenarioEngine.startScenario('fast-tour');
                }}
                className="p-2 rounded-xl text-teal-400 hover:bg-teal-500/20 hover:text-teal-300 transition-all flex items-center gap-2 border border-teal-500/20"
                title="جولة تجريبية"
              >
                 <Play size={14} />
                 <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">جولة سريعة</span>
              </button>
              <div>
                <span className="font-black text-[13px] text-white block tracking-tight">Flux Intelligence</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Spatial Runtime
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
               <button onClick={() => setMode(mode === "assistant" ? "executive" : "assistant")} className={cn(
                 "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border",
                 mode === "executive" ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
               )}>
                  <Zap size={12} className={mode === "executive" ? "fill-current" : ""} />
               </button>
               <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-slate-400 hover:text-white transition-colors">
                  {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
               </button>
               <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-rose-400 transition-colors">
                  <X size={20} />
               </button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6 bg-transparent relative">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent" />
            {history.map((msg, i) => (
              <div key={`${msg.id}-${i}`} className={cn("flex w-full relative z-10", msg.role === "assistant" ? "justify-start" : "justify-end")}>
                <div className={cn(
                  "p-4 max-w-[85%] text-[13px] leading-relaxed relative",
                  msg.role === "assistant" 
                    ? "bg-white/5 border border-white/10 text-slate-200 rounded-[24px] rounded-bl-sm shadow-xl" 
                    : "bg-indigo-500/20 border border-indigo-500/30 text-indigo-50 rounded-[24px] rounded-br-sm shadow-lg shadow-indigo-500/10 text-right"
                )} dir="auto">
                  {msg.role === "assistant" && (
                     <div className="absolute top-0 right-0 -mr-2 w-1 h-8 rounded-full bg-indigo-500/50 blur-[2px]" />
                  )}
                  {msg.content}
                  
                  {msg.plan && msg.plan.length > 0 && (
                    <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                       {msg.plan.map((step, sIdx) => (
                         <div key={sIdx} className="flex items-center gap-3">
                            <div className={cn(
                              "w-2.5 h-2.5 rounded-full flex items-center justify-center shrink-0 transition-all shadow-inner border border-white/10",
                              step.status === "completed" ? "bg-emerald-500/80" :
                              step.status === "running" ? "bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]" : "bg-white/10"
                            )} />
                            <span className="text-[10px] font-bold text-slate-300">{step.title}</span>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start relative z-10">
                 <div className="bg-white/5 p-4 rounded-[24px] rounded-bl-sm border border-white/10 flex items-center gap-3 backdrop-blur-md">
                    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="flex gap-1">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    </motion.div>
                    <span className="text-[10px] font-black text-indigo-200/70 uppercase tracking-widest">Processing Intelligence...</span>
                 </div>
              </div>
            )}
            <div ref={chatEndRef} className="h-4" />
          </div>

          {/* Input Area */}
          <div className="p-4 shrink-0 bg-transparent border-t border-white/5 relative z-10">
            <div className="flex items-center gap-3 mb-3 px-2">
               <div className="flex-1 text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">
                 {currentSessionId === 'default' ? 'الذاكرة نشطة' : `جلسة: ${currentSessionId.substring(0, 8)}`}
               </div>
            </div>
            <div className="relative flex items-center p-1 bg-white/5 rounded-[24px] border border-white/10 shadow-inner focus-within:bg-white/10 focus-within:border-indigo-500/50 transition-all">
               <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                 <Paperclip size={18} />
               </button>
               <input type="file" ref={fileInputRef} hidden multiple onChange={handleFileUpload} />
               
               <input 
                 autoFocus
                 type="text"
                 value={message}
                 onChange={(e) => setMessage(e.target.value)}
                 onKeyDown={(e) => e.key === "Enter" && handleSend()}
                 placeholder={mode === "executive" ? "أصدر أمراً تنفيذياً أو أدخل رابطاً..." : "كيف يمكنني المساعدة في إدارة علامتك؟"}
                 className="flex-1 bg-transparent py-3 px-3 text-[13px] text-white focus:outline-none placeholder:text-slate-500"
                 dir="auto"
               />
               
               <button 
                  onClick={() => handleSend()}
                  className={cn(
                    "p-3 rounded-[20px] transition-all active:scale-90 ml-1 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white",
                    message && "bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                  )}
               >
                  <Navigation size={18} className="-rotate-90" />
               </button>
            </div>
            <div className="flex justify-center mt-3">
               <button onClick={handleNewChat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                 <Plus size={12} /> محادثة جديدة
               </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
