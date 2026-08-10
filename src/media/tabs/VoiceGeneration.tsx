import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, Volume2, Sparkles, Play, Pause, Languages, Loader2, Download, 
  Crown, AlertTriangle, Check, Sliders, Globe, Info, Radio, Zap
} from "lucide-react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { providerManager } from "../../core/providers/ProviderManager";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { db, auth, uploadBlobToStorage } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { generateId } from "../../lib/ids";

// Visual Dialects definition
const DIALECT_OPTIONS = [
  { 
    id: "yemeni", 
    name: "اللهجة اليمنية", 
    icon: "🇾🇪", 
    desc: "أصالة ودفء نبرات صنعاء، عدن، وحضرموت الأصيلة", 
    label: "يمني",
    badge: "جديد وخاص" 
  },
  { 
    id: "gulf", 
    name: "اللهجة الخليجية", 
    icon: "🇸🇦", 
    desc: "وقار وفخامة اللكنة النجدية، الحجازية، ودول الخليج", 
    label: "خليجي",
    badge: "شائع جداً" 
  },
  { 
    id: "egyptian", 
    name: "اللهجة المصرية", 
    icon: "🇪🇬", 
    desc: "عذوبة وخفة ظل اللكنة القاهرية المحبوبة للجميع", 
    label: "مصري",
    badge: "محبوب" 
  },
  { 
    id: "levantine", 
    name: "اللهجة الشامية", 
    icon: "🇸🇾", 
    desc: "رقة وعذوبة اللكنة السورية واللبنانية الشامية", 
    label: "شامي",
    badge: "موسيقي" 
  },
  { 
    id: "fusha", 
    name: "اللغة الفصحى", 
    icon: "🌐", 
    desc: "فصاحة الضاد والتشكيل اللغوي الاحترافي المتكامل", 
    label: "فصحى",
    badge: "أساسي" 
  },
];

// Re-imagined Smart Voice Personas mapping to prebuilt cloud voices
const SMART_VOICES = [
  { 
    id: "onyx", 
    name: "وضّاح", 
    description: "صوت رجالي يمني فخور، دافئ وعميق النبرة", 
    gender: "male",
    badge: "لهجة أصيلة",
    recommendedDialects: ["yemeni", "fusha"],
    tags: ["وثائقي", "دافئ"],
    avatarColor: "from-amber-600 to-amber-900"
  },
  { 
    id: "shimmer", 
    name: "بلقيس", 
    description: "صوت نسائي يمني وقور، حنون ومليء بالتعبير", 
    gender: "female",
    badge: "نبرة شاعريّة",
    recommendedDialects: ["yemeni", "fusha"],
    tags: ["قصصي", "شاعري"],
    avatarColor: "from-purple-600 to-purple-900"
  },
  { 
    id: "echo", 
    name: "عبد الله", 
    description: "صوت رجالي خليجي فخم، رزين ومثالي للخطاب القيادي", 
    gender: "male",
    badge: "الخيار الأول",
    recommendedDialects: ["gulf", "fusha"],
    tags: ["وثائقي", "قيادي"],
    avatarColor: "from-emerald-600 to-emerald-950"
  },
  { 
    id: "nova", 
    name: "مريم", 
    description: "تعليق نسائي خليجي ناعم، واضح واحترافي للغاية", 
    gender: "female",
    badge: "إعلاني فاخر",
    recommendedDialects: ["gulf", "fusha"],
    tags: ["إعلاني", "واضح"],
    avatarColor: "from-rose-600 to-rose-900"
  },
  { 
    id: "fable", 
    name: "شادي", 
    description: "صوت تعبيري تفاعلي، رائع في الروايات والدراما الشامية والمصرية", 
    gender: "male",
    badge: "درامي مشوق",
    recommendedDialects: ["levantine", "egyptian"],
    tags: ["درامي", "شيق"],
    avatarColor: "from-sky-600 to-sky-900"
  },
  { 
    id: "alloy", 
    name: "ياسمين", 
    description: "صوت نسائي حيوي، سلس ومتعدد الاستخدامات والإذاعات", 
    gender: "female",
    badge: "حيوي مرن",
    recommendedDialects: ["egyptian", "levantine", "fusha"],
    tags: ["تفاعلي", "مرن"],
    avatarColor: "from-teal-600 to-teal-900"
  },
];

export function VoiceGeneration() {
  const { activeBrand } = useWorkspace();
  const [text, setText] = useState("");
  const [selectedDialect, setSelectedDialect] = useState("yemeni"); // Default to Yemeni as requested!
  const [selectedVoice, setSelectedVoice] = useState("onyx"); // Default to onyx (وضاح)
  const [isProVoice, setIsProVoice] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [voiceFilter, setVoiceFilter] = useState('pro');
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState("");
  
  // Custom Studio settings states
  const [expressionStyle, setExpressionStyle] = useState("documentary");
  const [speechRate, setSpeechRate] = useState(1.0);
  const [vocalIQ, setVocalIQ] = useState(true);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [activeCategory, setActiveCategory] = useState<"identity" | "tuning">("identity");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const savedPreset = localStorage.getItem('fluxcore_media_lab_preset');
      if (savedPreset) {
        const { tab, prompt: presetPrompt } = JSON.parse(savedPreset);
        if (tab === 'voice' && presetPrompt) {
          setText(presetPrompt);
          localStorage.removeItem('fluxcore_media_lab_preset');
          toast.success("تم نقل نص السيناريو بنجاح وجاهز للتوليد الصوتي! 🎙️");
        }
      }
    } catch (e) {
      console.error("Error reading media lab preset in voice:", e);
    }
  }, []);

  useEffect(() => {
    const loadVoices = () => {
      let availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
          availableVoices = availableVoices.sort((a, b) => {
              if (a.lang.startsWith('ar') && !b.lang.startsWith('ar')) return -1;
              if (!a.lang.startsWith('ar') && b.lang.startsWith('ar')) return 1;
              return 0;
          });
          setVoices(availableVoices);
      }
    };
    
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
       speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
       window.speechSynthesis.cancel();
       if (audioRef.current) {
          audioRef.current.pause();
       }
    };
  }, []);

  // Update audio playback rate whenever speechRate changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speechRate;
    }
  }, [speechRate]);

  // SMART AUTO-MATCH DIALECT TO BEST RECOMMENDED VOICE Persona
  const handleDialectChange = (dialectId: string) => {
    setSelectedDialect(dialectId);
    if (voiceFilter === 'pro') {
      if (dialectId === 'yemeni') {
        setSelectedVoice('onyx'); // Set to Waddah (Male)
      } else if (dialectId === 'gulf') {
        setSelectedVoice('echo'); // Set to Abdullah (Male)
      } else if (dialectId === 'egyptian') {
        setSelectedVoice('alloy'); // Set to Yasmeen (Female)
      } else if (dialectId === 'levantine') {
        setSelectedVoice('fable'); // Set to Shady (Male)
      } else {
        setSelectedVoice('echo'); // Default
      }
      toast.success(`تم اختيار وتحديث المعلق الموصى به تلقائياً لهذه اللهجة! 🤖`);
    }
  };

  const getRegionName = (lang: string) => {
      if (lang.includes('SA')) return "السعودية";
      if (lang.includes('AE')) return "الإمارات";
      if (lang.includes('EG')) return "مصر";
      if (lang.includes('LB')) return "لبنان";
      if (lang.includes('QA')) return "قطر";
      if (lang.includes('KW')) return "الكويت";
      if (lang.includes('BH')) return "البحرين";
      if (lang.includes('OM')) return "عمان";
      if (lang.includes('MA')) return "المغرب";
      if (lang.includes('DZ')) return "الجزائر";
      if (lang.includes('IQ')) return "العراق";
      if (lang.includes('JO')) return "الأردن";
      if (lang.startsWith('en')) return "إنجليزية";
      if (lang.startsWith('fr')) return "فرنسية";
      return "أخرى";
  };

  const filteredBrowserVoices = voices.filter(v => {
      if (voiceFilter === 'pro') return false; 
      if (voiceFilter === 'all') return v.lang.startsWith('ar') || v.lang.startsWith('en');
      if (voiceFilter === 'gulf') return ['ar-SA', 'ar-AE', 'ar-QA', 'ar-KW', 'ar-OM', 'ar-BH'].some(l => v.lang.includes(l));
      return true;
  });

  // Smart LLM Dialect Phonetic Adaptation Prompt
  const handleAdaptDialect = async () => {
    if (!text) {
       toast.error("يرجى كتابة نص أو سيناريو أولاً");
       return;
    }
    setIsImproving(true);

    const activeDialectObj = DIALECT_OPTIONS.find(d => d.id === selectedDialect);
    toast.info(`جاري مواءمة وتعديل السيناريو للهجة: ${activeDialectObj?.name || selectedDialect}...`);

    let dialectPrompt = "";
    if (selectedDialect === "yemeni") {
      dialectPrompt = `أنت خبير لغوي يمني أصيل. يرجى تكييف وتحويل النص التالي إلى اللهجة اليمنية الدارجة (الصنعانية أو العدنية أو الحضرمية) بشكل مميز وجذاب للغاية. 
استخدم مفردات يمنية دارجة شائعة ومحبوبة مثل: (أشتي، ذحين، قوي قوي، إيش فيك، تمام، يا ليت لو، سليح، عسب، إيش وقع، عادنا) واحرص على كتابة الكلمات بطريقة إملائية وصوتية مبسطة تسهل على محرك النطق الآلي (TTS) نطقها بلكنة يمنية طبيعية وسلسة للغاية (مثلاً وضع حركات تشكيل خفيفة عند الحاجة وتجنب الحركات التي تسبب ثقلاً في النطق).
أضف فواصل طبيعية مثل ثلاث نقاط (...) بين الجمل الهامة لإحداث وقفات تنفسية مريحة تعبر عن دفء ولحن الصوت اليمني.
أرجع النص الجديد فقط المكتوب باللهجة اليمنية دون أي مقدمات أو شروحات أو علامات اقتباس إطلاقاً:\n\n${text}`;
    } else if (selectedDialect === "gulf") {
      dialectPrompt = `أنت خبير لغوي خليجي متمرس. يرجى تكييف وتحويل النص التالي إلى اللهجة الخليجية (النجدية أو الكويتي أو الحجازي الدارج) بشكل فخم ومحترف للغاية. 
استخدم مفردات خليجية دارجة وجميلة مثل: (شلونك، وش تبي، الحين، وايد، واجد، حيل، ياخوي، بجد، زين، وش كثر، تكفى) واحرص على كتابة الكلمات بطريقة إملائية وصوتية تسهل على محرك النطق الآلي (TTS) نطقها بلكنة خليجية فخمة وممتعة للغاية.
أضف فواصل طبيعية مثل ثلاث نقاط (...) بين الجمل الهامة لإعطاء مساحة تنفس طبيعية للمحرك الصوتي كوقفات حية.
أرجع النص الجديد فقط المكتوب باللهجة الخليجية دون أي مقدمات أو شروحات أو علامات اقتباس إطلاقاً:\n\n${text}`;
    } else if (selectedDialect === "egyptian") {
      dialectPrompt = `أنت خبير لغوي مصري. يرجى تكييف وتحويل النص التالي إلى اللهجة المصرية العامية العذبة والجميلة بشكل جذاب وتلقائي للغاية.
استخدم مفردات مصرية شائعة ومحببة مثل: (إزيك، عاوز، إيه، دلوقتي، بجد، ده، دي، قوي، أوي، ماشي، عشان) واكتب النص بطريقة إملائية وصوتية تسهل على محرك النطق الآلي (TTS) نطقها بلكنة مصرية واضحة وممتازة (مثلاً كتابة الكلمات بنطقها العامي الفعلي وتجنب الحروف الفصيحة الجافة غير المستخدمة في العامية).
أضف فواصل طبيعية مثل ثلاث نقاط (...) بين الجمل الهامة لإعطاء مساحة تنفس طبيعية للمحرك الصوتي.
أرجع النص الجديد فقط المكتوب باللهجة المصرية دون أي مقدمات أو شروحات أو علامات اقتباس إطلاقاً:\n\n${text}`;
    } else if (selectedDialect === "levantine") {
      dialectPrompt = `أنت خبير لغوي شامي. يرجى تكييف وتحويل النص التالي إلى اللهجة الشامية (السورية أو اللبنانية) بشكل ناعم وعذب للغاية.
استخدم مفردات شامية شائعة مثل: (شو، كيفك، بدي، كتير، هلق، هيك، يا زلمة، شو صاير، تكرم عيونك) واكتب النص بطريقة إملائية وصوتية تسهل على محرك النطق الآلي (TTS) نطقها بلكنة شامية واضحة وطبيعية للغاية.
أضف فواصل طبيعية مثل ثلاث نقاط (...) بين الجمل الهامة لإعطاء مساحة تنفس طبيعية للمحرك الصوتي.
أرجع النص الجديد فقط المكتوب باللهجة الشامية دون أي مقدمات أو شروحات أو علامات اقتباس إطلاقاً:\n\n${text}`;
    } else {
      // Fusha with diacritics
      dialectPrompt = `أرجو تدقيق هذا النص العربي وإضافة علامات التشكيل العربية (الفتحة، الضمة، الكسرة، السكون، الشدة، التنوين) كاملة ودقيقة لتسهيل قراءته من قبل محركات النطق الآلي (TTS) بأبهى حلة للفصحى التعبيرية الفخمة. أرجع النص المشكّل فقط بدون أي إضافات أو مقدمات أو علامات اقتباس:\n\n${text}`;
    }

    try {
      const config = providerManager.getConfig();
      const res = await fetch("/api/ai/quick-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: dialectPrompt,
          action: 'custom', 
          provider: config?.provider || 'gemini',
          apiKey: config?.apiKey
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      let cleanedText = data.result || "";
      cleanedText = cleanedText.replace(/^["'`\s]+|["'`\s]+$/g, '').trim();

      setText(cleanedText);
      toast.success(`تم تحوير النص وتكييفه بنجاح وفق لهجة المعلق! 🎉`);
    } catch(err:any) {
      toast.error("فشل التكييف الذاتي: " + err.message);
    } finally {
      setIsImproving(false);
    }
  };

  const playAudioBuffer = async (bufferData: ArrayBuffer, contentType = "audio/mpeg") => {
      const blob = new Blob([bufferData], { type: contentType });
      const url = URL.createObjectURL(blob);
      setGeneratedAudioUrl(url);
      if (audioRef.current) {
          audioRef.current.pause();
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.addEventListener('loadedmetadata', () => {
        setPlaybackDuration(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
        setPlaybackTime(audio.currentTime);
      });

      setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      };
      audio.onerror = () => { 
        setIsPlaying(false); 
        setPlaybackTime(0);
        toast.error("حدث خطأ أثناء تشغيل الصوت الاحترافي"); 
      };
      
      audio.playbackRate = speechRate;
      await audio.play();
  };

  const handleGenerate = async () => {
      if (!text) return;
      if (!selectedVoice) {
        toast.error("يرجى اختيار معلق أولاً");
        return;
      }
      setIsGenerating(true);
      setProgress(10);
      setProgressStep("جاري النمذجة الصوتية...");
      setGeneratedAudioUrl(null);
      setPlaybackTime(0);
      setPlaybackDuration(0);
      
      window.speechSynthesis.cancel();
      if (audioRef.current) audioRef.current.pause();

      const activeVoiceObj = SMART_VOICES.find(v => v.id === selectedVoice);
      const activeDialectObj = DIALECT_OPTIONS.find(d => d.id === selectedDialect);

      const interval = setInterval(() => {
         setProgress((prev) => {
           if (prev >= 90) return prev;
           const next = prev + 15;
           if (next < 40) setProgressStep(`تطبيق مخارج اللهجة: ${activeDialectObj?.label || 'المختارة'}...`);
           else if (next < 70) setProgressStep(`ضبط النبرة [${activeVoiceObj?.name || 'المعلق'}] بأسلوب ${expressionStyle === 'documentary' ? 'وثائقي' : expressionStyle === 'commercial' ? 'إعلاني' : 'قصصي'}...`);
           else setProgressStep("تصدير ملف التعليق النهائي وحفظه بالاستوديو...");
           return next;
         });
      }, 500);

      try {
          if (isProVoice) {
              const config = providerManager.getConfig();
              const res = await fetch("/api/ai/tts", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ 
                    text, 
                    voice: selectedVoice, 
                    provider: config?.provider || "gemini",
                    apiKey: config?.apiKey 
                  })
              });
              
              clearInterval(interval);
              setProgress(100);
              setProgressStep("اكتمل التوليد بنجاح!");

              if (!res.ok) {
                 const errData = await res.json().catch(() => ({}));
                 throw new Error(errData.error || await res.text());
              }
              
              const contentType = res.headers.get("Content-Type") || "audio/wav";
              const arrayBuffer = await res.arrayBuffer();
              
              const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
                let binary = "";
                const bytes = new Uint8Array(buffer);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                  binary += String.fromCharCode(bytes[i]);
                }
                return window.btoa(binary);
              };

              const base64Str = arrayBufferToBase64(arrayBuffer);
              const dataUrl = `data:${contentType};base64,${base64Str}`;

              // رفع الملف الصوتي إلى Firebase Storage مع الاحتفاظ بالـ Base64 كبديل احتياطي (Fallback)
              let fileUrl = dataUrl;
              if (auth.currentUser && activeBrand) {
                try {
                  setProgressStep("جاري رفع التعليق الصوتي إلى التخزين السحابي...");
                  const genId = generateId();
                  const fileExtension = contentType.includes("mpeg") ? "mp3" : "wav";
                  const storagePath = `brands/${activeBrand.id}/audio/${genId}.${fileExtension}`;
                  const blob = new Blob([arrayBuffer], { type: contentType });
                  fileUrl = await uploadBlobToStorage(blob, storagePath);
                } catch (uploadErr) {
                  console.error("[VOICE SYSTEM] Storage upload failed, falling back to base64 URL:", uploadErr);
                }

                try {
                  await addDoc(collection(db, "generations"), {
                    brandId: activeBrand.id,
                    userId: auth.currentUser.uid,
                    contentType: 'voice',
                    result: fileUrl,
                    goal: text, 
                    params: {
                      prompt: text,
                      voice: selectedVoice,
                      dialect: selectedDialect,
                      expressionStyle,
                      speed: speechRate,
                      vocalIQ,
                      isPro: true
                    },
                    createdAt: serverTimestamp()
                  });
                } catch (fsErr) {
                  console.error("[Firestore Error] Failed to save voice:", fsErr);
                }
              }

              setTimeout(() => {
                setIsGenerating(false);
                setProgress(0);
              }, 800);

              toast.success(`تم توليد التعليق الصوتي المخصص بنجاح! 🎧`);
              await playAudioBuffer(arrayBuffer, contentType);
          } else {
              setTimeout(() => {
                  clearInterval(interval);
                  setProgress(100);
                  setProgressStep("بدأ التشغيل!");
                  
                  setTimeout(() => {
                    setIsGenerating(false);
                    setProgress(0);
                  }, 800);

                  setIsPlaying(true);
                  const utterance = new SpeechSynthesisUtterance(text);
                  let voice = voices.find(v => v.name === selectedVoice);
                  if (!voice) {
                    // Fallback to find any Arabic voice since selectedVoice (onyx, alloy, etc.) is a custom ID
                    voice = voices.find(v => v.lang.startsWith('ar'));
                  }
                  if (voice) utterance.voice = voice;
                  
                  utterance.onend = () => setIsPlaying(false);
                  utterance.onerror = () => {
                      setIsPlaying(false);
                      toast.error("حدث خطأ أثناء تشغيل الصوت.");
                  }
                  
                  window.speechSynthesis.speak(utterance);
                  toast.success("بدأ التشغيل عبر المتصفح!");
              }, 1200);
          }
      } catch (err: any) {
          clearInterval(interval);
          setIsGenerating(false);
          setProgress(0);
          toast.error("فشل التوليد: " + err.message);
       }
  };

  const previewVoice = async (voiceId: string, isPro: boolean) => {
     window.speechSynthesis.cancel();
     if (audioRef.current) audioRef.current.pause();

     const voiceObj = SMART_VOICES.find(v => v.id === voiceId);
     const voiceName = voiceObj ? voiceObj.name : voiceId;

     if (isPro) {
        toast.info(`جاري تحميل معاينة سريعة لمعلق [${voiceName}]...`);
        try {
            const config = providerManager.getConfig();
            const res = await fetch("/api/ai/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  text: `مرحباً، أنا المعلق الذكي ${voiceName}. تم تهيئتي لمساعدتك في استوديو الصوت.`, 
                  voice: voiceId, 
                  provider: config?.provider || "gemini",
                  apiKey: config?.apiKey 
                })
            });
            if (!res.ok) throw new Error("Failed to preview");
            await playAudioBuffer(await res.arrayBuffer());
        } catch (e: any) {
            toast.error("تأكد من إدخال مفتاح الـ API في الإعدادات لتفعيل معاينات الأصوات السحابية.");
        }
     } else {
         const utterance = new SpeechSynthesisUtterance(`مرحباً، أنا الصوت المحلي للمتصفح ${voiceName}.`);
          let voice = voices.find(v => v.name === voiceId);
          if (!voice) {
             // Fallback to find any Arabic voice
             voice = voices.find(v => v.lang.startsWith('ar'));
          }
          if (voice) utterance.voice = voice;
         window.speechSynthesis.speak(utterance);
     }
  };

  const stopPlayback = () => {
      window.speechSynthesis.cancel();
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setPlaybackTime(0);
      toast.info("تم إيقاف التشغيل");
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Find active voice object to display metadata
  const currentVoiceObj = SMART_VOICES.find(v => v.id === selectedVoice);

  return (
    <div className="flex flex-col h-full gap-5 select-none animate-fade-in relative pb-6">
       
       <style dangerouslySetInnerHTML={{__html: `
         @keyframes voiceWaveBar {
           0% { height: 12%; }
           100% { height: 100%; }
         }
         .voice-wave-active {
           animation: voiceWaveBar 0.7s ease-in-out infinite alternate;
         }
         .glow-premium {
           box-shadow: 0 0 15px 1px rgba(16, 185, 129, 0.1);
         }
         .dir-rtl { direction: rtl; }
         .dir-ltr { direction: ltr; }
       `}} />

       {/* Top Header Row */}
       <div className="bg-slate-900/30 border border-slate-800/40 rounded-[24px] p-5 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
         <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Mic className="text-white" size={16} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  أستوديو الصوت الذكي <span className="text-[9px] uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full font-black">PRO STUDIO</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">حوّل النصوص إلى تعليق صوتي محلي بلكنات يمنية وخليجية طبيعية للغاية وبواجهة مدمجة ذكية.</p>
              </div>
            </div>
         </div>
         <div className="flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 font-black">
           <Zap size={11} className="animate-pulse" />
           نظام المحاكاة الصوتية الذكية نشط
         </div>
       </div>

       {/* Smart Two-Column Layout */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
          
          {/* Column 1: Workspace & Editor (Takes 2/3 space) */}
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-4 min-h-0">
             
             {/* Script Container */}
             <div className="bg-slate-900/40 border border-slate-850 rounded-[28px] p-5 flex flex-col gap-4 shadow-lg flex-1 min-h-0">
                <div className="flex items-center justify-between shrink-0">
                   <label className="text-xs font-black text-slate-200 flex items-center gap-2">
                     <Languages size={14} className="text-emerald-400" /> 
                     السيناريو والنص المراد نطقة (Script)
                   </label>
                   
                   <button 
                     disabled={isGenerating || isImproving} 
                     onClick={handleAdaptDialect} 
                     className="bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-indigo-600/25 disabled:opacity-40 transition-all active:scale-95 shadow-sm"
                   >
                     {isImproving ? <Loader2 size={12} className="animate-spin text-indigo-400" /> : <Sparkles size={12} />}
                     تكييف اللهجة بالذكاء الاصطناعي ✨
                   </button>
                </div>
                
                <textarea 
                  value={text}
                  disabled={isGenerating}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="اكتب السيناريو هنا باللغة الفصحى، ثم اضغط على زر 'تكييف اللهجة بالذكاء الاصطناعي' بالأعلى لمواءمته تلقائياً مع لهجة المعلق المختارة (يمني، خليجي، مصري، شامي) وكتابته صوتياً ليعطيك نطقاً طبيعياً 100%..."
                  className="w-full bg-slate-950/70 border border-slate-850 rounded-2xl p-4 text-slate-200 text-base leading-relaxed placeholder:text-slate-650 focus:outline-none focus:border-emerald-500/40 resize-none flex-1 min-h-[220px] disabled:opacity-60 transition-all font-medium"
                  dir="auto"
                />

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono font-bold px-1 select-none shrink-0">
                  <span>[{text.length} / 4096 حرف]</span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Info size={11} className="text-slate-500" /> استخدم الفواصل (...) لإضافة وقفات طبيعية مريحة للمعلق.
                  </span>
                </div>
             </div>

             {/* Waveform Player Container (Sits cleanly below the script) */}
             <div className="bg-slate-900/40 border border-slate-850 rounded-[28px] p-4 flex flex-col gap-3 shadow-lg shrink-0">
               <div className="flex items-center justify-between px-1">
                 <span className="text-[11px] font-black text-slate-400 flex items-center gap-1.5 select-none">
                   <Radio size={12} className="text-emerald-500" />
                   موجة وسلامة التردد الصوتي (Interactive Waveform)
                 </span>
                 
                 {generatedAudioUrl && (
                   <span className="text-[10px] text-slate-400 font-mono font-black">
                     {formatTime(playbackTime)} / {formatTime(playbackDuration)}
                   </span>
                 )}
               </div>

               {/* Responsive Simulated Waveform */}
               <div className="w-full bg-slate-950/80 border border-slate-850 rounded-2xl p-3.5 flex items-center justify-center min-h-[56px] relative">
                 {isPlaying ? (
                   <div className="flex items-end justify-center gap-1 h-8 w-full px-2">
                     {[...Array(30)].map((_, i) => {
                       const delay = (i * 0.05).toFixed(2);
                       const dur = (0.4 + Math.random() * 0.6).toFixed(2);
                       return (
                         <div 
                           key={i} 
                           className="w-1 bg-gradient-to-t from-emerald-500 via-emerald-400 to-indigo-500 rounded-full voice-wave-active"
                           style={{ 
                             animationDelay: `${delay}s`,
                             animationDuration: `${dur}s`
                           }} 
                         />
                       );
                     })}
                   </div>
                 ) : isGenerating ? (
                   <div className="flex items-center justify-center gap-2 text-slate-500">
                     <Loader2 size={14} className="animate-spin text-emerald-400" />
                     <span className="text-[10px] font-bold text-slate-400">جاري هندسة النبرة وحساب التردد...</span>
                   </div>
                 ) : generatedAudioUrl ? (
                   <div className="flex items-center justify-center gap-1 h-2.5 w-full px-2 opacity-50">
                     {[...Array(30)].map((_, i) => (
                       <div 
                         key={i} 
                         className="w-1 rounded-full bg-slate-800"
                         style={{ height: `${20 + (i % 4 === 0 ? 55 : i % 2 === 0 ? 35 : 15)}%` }} 
                       />
                     ))}
                   </div>
                 ) : (
                   <span className="text-[10px] font-black text-slate-500 text-center select-none">الاستوديو خامل. اكتب السيناريو واضغط على استماع لتفعيل الموجة الصوتية الحية.</span>
                 )}
               </div>

               {/* Playback time slider if audio generated */}
               {generatedAudioUrl && playbackDuration > 0 && (
                 <div className="w-full bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 flex items-center gap-3">
                   <span className="text-[9px] font-mono font-bold text-slate-500">{formatTime(playbackTime)}</span>
                   <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden relative">
                     <div 
                       className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full transition-all duration-100" 
                       style={{ width: `${(playbackTime / playbackDuration) * 100}%` }}
                     ></div>
                   </div>
                   <span className="text-[9px] font-mono font-bold text-slate-500">{formatTime(playbackDuration)}</span>
                 </div>
               )}
             </div>

          </div>

          {/* Column 2: Sleek Smart Controls (Takes 1/3 space) */}
          <div className="col-span-1 bg-slate-900/40 border border-slate-850 rounded-[28px] p-5 flex flex-col gap-4.5 shadow-lg min-h-0">
             
             <div className="flex items-center gap-2 border-b border-slate-850 pb-2.5 shrink-0">
               <Sliders size={14} className="text-emerald-400" />
               <h3 className="font-black text-xs text-white">إعدادات الهندسة الصوتية (Console)</h3>
             </div>

             <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-0.5 flex-1">
               
               {/* Dialect Dropdown */}
               <div className="flex flex-col gap-1.5">
                 <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                   <Globe size={12} className="text-emerald-400" />
                   اللهجة المحددة (Dialect Select)
                 </label>
                 <select
                   value={selectedDialect}
                   onChange={(e) => handleDialectChange(e.target.value)}
                   disabled={isGenerating}
                   className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs font-bold p-3 rounded-xl focus:outline-none focus:border-emerald-500/50"
                 >
                   {DIALECT_OPTIONS.map((dialect) => (
                     <option key={dialect.id} value={dialect.id}>
                       {dialect.icon} {dialect.name} ({dialect.badge})
                     </option>
                   ))}
                 </select>
                 {selectedDialect && (
                   <p className="text-[10px] text-slate-400 leading-relaxed pr-1">
                     {DIALECT_OPTIONS.find(d => d.id === selectedDialect)?.desc}
                   </p>
                 )}
               </div>

               {/* Voice Persona Dropdown */}
               <div className="flex flex-col gap-1.5">
                 <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                   <Mic size={12} className="text-indigo-400" />
                   المعلق الصوتي (Voice Persona)
                 </label>
                 <select
                   value={selectedVoice}
                   onChange={(e) => setSelectedVoice(e.target.value)}
                   disabled={isGenerating}
                   className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs font-bold p-3 rounded-xl focus:outline-none focus:border-emerald-500/50"
                 >
                   {SMART_VOICES.map((voice) => {
                     const isRecommended = voice.recommendedDialects.includes(selectedDialect);
                     return (
                       <option key={voice.id} value={voice.id}>
                         {voice.name} ({voice.gender === "male" ? "رجالي" : "نسائي"}) {isRecommended ? "⭐ موصى به" : ""}
                       </option>
                     );
                   })}
                 </select>
               </div>

               {/* Active Voice Card Details */}
               {currentVoiceObj && (
                 <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-3.5 flex flex-col gap-3 shadow-inner">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2.5">
                       <div className={cn(
                         "w-10 h-10 rounded-xl bg-gradient-to-tr flex items-center justify-center text-white font-black text-sm shadow-md shrink-0",
                         currentVoiceObj.avatarColor
                       )}>
                         {currentVoiceObj.name[0]}
                       </div>
                       <div>
                         <div className="flex items-center gap-1.5">
                           <h4 className="text-xs font-black text-white">{currentVoiceObj.name}</h4>
                           <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full font-bold">
                             {currentVoiceObj.gender === "male" ? "صوت رجالي" : "صوت نسائي"}
                           </span>
                         </div>
                         <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/10 mt-0.5 inline-block">
                           {currentVoiceObj.badge}
                         </span>
                       </div>
                     </div>
                     <button
                       onClick={() => previewVoice(currentVoiceObj.id, true)}
                       disabled={isGenerating || isPlaying}
                       className="p-2 bg-emerald-500/15 border border-emerald-500/20 hover:bg-emerald-500/25 rounded-lg text-emerald-400 flex items-center gap-1.5 text-[9px] font-black transition-all active:scale-95 shadow-sm"
                     >
                       <Volume2 size={12} />
                       معاينة الصوت
                     </button>
                   </div>

                   <p className="text-[10px] text-slate-400 leading-normal text-right pr-0.5">
                     {currentVoiceObj.description}
                   </p>

                   {/* Tags rendering */}
                   <div className="flex flex-wrap gap-1.5 pt-1">
                     {currentVoiceObj.tags.map((tag, idx) => (
                       <span key={idx} className="text-[9px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-lg border border-slate-850/50">
                         #{tag}
                       </span>
                     ))}
                   </div>
                 </div>
               )}

               {/* Expression Tone dropdown */}
               <div className="flex flex-col gap-1.5">
                 <label className="text-[11px] font-bold text-slate-400">
                   أسلوب الأداء التعبيري (Style Profile)
                 </label>
                 <select
                   value={expressionStyle}
                   onChange={(e) => setExpressionStyle(e.target.value)}
                   disabled={isGenerating}
                   className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs font-bold p-3 rounded-xl focus:outline-none focus:border-emerald-500/50"
                 >
                   <option value="documentary">وثائقي / تعليق وقور ورصين</option>
                   <option value="commercial">إعلاني / حيوي، حماسي وسلس</option>
                   <option value="educational">تعليمي / هادئ، واعد ومخارج واضحة</option>
                   <option value="dramatic">قصصي درامي / نبرة دافئة معبرة</option>
                 </select>
               </div>

               {/* Vocal IQ Switch */}
               <div 
                 onClick={() => { if(!isGenerating) setVocalIQ(!vocalIQ); }}
                 className={cn(
                   "flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all duration-300 mt-1.5",
                   vocalIQ ? "bg-slate-950 border-emerald-500/30 text-emerald-400" : "bg-slate-950/60 border-slate-850 text-slate-500"
                 )}
               >
                 <span className="text-xs font-bold">ذكاء الوقفات والتنفس الآلي</span>
                 <div className={cn(
                   "w-7 h-4 rounded-full flex items-center transition-all p-0.5",
                   vocalIQ ? "bg-emerald-500" : "bg-slate-800"
                 )}>
                   <div className={cn(
                     "w-3 h-3 rounded-full bg-slate-950 transition-all",
                     vocalIQ ? "translate-x-0 ml-auto" : "translate-x-0"
                   )}></div>
                 </div>
               </div>

               {/* Speed slider */}
               <div className="flex flex-col gap-2 bg-slate-950/50 p-3 rounded-xl border border-slate-850/50 mt-1.5">
                 <div className="flex items-center justify-between">
                   <span className="text-[10px] font-bold text-slate-400">
                     سرعة النطق الفعلية للراوي (Speed)
                   </span>
                   <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                     {speechRate.toFixed(2)}x
                   </span>
                 </div>
                 <input 
                   type="range"
                   min="0.80"
                   max="1.25"
                   step="0.05"
                   value={speechRate}
                   onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                   disabled={isGenerating}
                   className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                 />
                 <div className="flex justify-between text-[8px] text-slate-550 font-bold select-none px-0.5">
                   <span>بطيء (0.8x)</span>
                   <span>طبيعي</span>
                   <span>سريع (1.25x)</span>
                 </div>
               </div>

             </div>

             {/* Dynamic Loading progress alert */}
             {isGenerating && (
                <div className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 flex flex-col gap-2 animate-pulse shrink-0">
                   <div className="flex items-center justify-between text-[10px] font-black text-emerald-400">
                      <span className="flex items-center gap-1">
                         <Loader2 size={12} className="animate-spin text-emerald-400" />
                         {progressStep}
                      </span>
                      <span className="font-mono text-emerald-300">{progress}%</span>
                   </div>
                   <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-indigo-500 h-full rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      ></div>
                   </div>
                </div>
             )}

             {/* Generation button controls */}
             <div className="flex flex-col gap-2 shrink-0 pt-3 border-t border-slate-850">
                <button 
                  onClick={handleGenerate}
                  disabled={!text || isGenerating || isPlaying || isImproving}
                  className={cn(
                    "w-full py-3.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-40",
                    isProVoice 
                      ? "bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-emerald-500/10 border border-emerald-500/20" 
                      : "bg-slate-950 hover:bg-slate-900 border border-slate-850"
                  )}
                >
                  {isGenerating ? (
                    <><Loader2 size={14} className="animate-spin" /> جاري التوليد والمعالجة...</>
                  ) : (
                    <><Play size={14} className="fill-white"/> استماع وتوليد صوتي احترافي (Pro)</>
                  )}
                </button>

                <div className="flex gap-2">
                    {generatedAudioUrl && (
                        <a 
                            href={generatedAudioUrl}
                            download={`fluxcore-audio-${selectedVoice}-${selectedDialect}-${Date.now()}.wav`}
                            className="flex-1 bg-slate-950 hover:bg-slate-900 text-amber-400 border border-slate-850 py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all shadow-sm">
                            <Download size={13} /> تحميل الملف الصوتي
                        </a>
                    )}
                    
                    {isPlaying && (
                        <button 
                            onClick={stopPlayback}
                            className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all">
                            <Pause size={12} className="fill-current" /> إيقاف الصوت
                        </button>
                    )}
                </div>
             </div>

          </div>

       </div>
    </div>
  );
}
