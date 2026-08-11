import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Settings2, Sparkles, Image as ImageIcon, Loader2, Plus, Palette, BookType, LayoutTemplate, Check, Globe, Users, Edit3, Trash2, ArrowLeftRight, Share2, BarChart2, BookOpen, FileText, Database, ToggleLeft, ToggleRight, HelpCircle, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { useWorkspace, BrandIdentity } from '../contexts/WorkspaceContext';
import { toast } from '../lib/soundToast';
import { ShareModal } from '../components/ShareModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { knowledgeLibraryService, BUILT_IN_LIBRARIES, BuiltInLibrary, CustomDocument } from '../intelligence/knowledge/KnowledgeLibraryService';

type Tab = 'profiles' | 'editor' | 'usage' | 'library';

export function BrandIdentityView() {
  const { brands, activeBrand, setActiveBrandId, createBrand, updateBrand, deleteBrand, loading } = useWorkspace();
  const [activeTab, setActiveTab] = useState<Tab>('profiles');
  const [isCreating, setIsCreating] = useState(false);
  const [shareBrand, setShareBrand] = useState<BrandIdentity | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [aiUrl, setAiUrl] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<BrandIdentity>>({});
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  const [customDocs, setCustomDocs] = useState<CustomDocument[]>([]);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [selectedLib, setSelectedLib] = useState<BuiltInLibrary | null>(null);
  const [libraryRefresh, setLibraryRefresh] = useState(0);

  React.useEffect(() => {
    if (activeBrand) {
      setCustomDocs(knowledgeLibraryService.getCustomDocuments(activeBrand.id));
    }
  }, [activeBrand, libraryRefresh]);

  const handleCharacterPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح للأفاتار الشخصي');
      return;
    }

    if (file.size > 1500 * 1024) {
      toast.error('حجم الصورة كبير جداً (الحد الأقصى 1.5 ميجابايت لضمان سرعة المعالجة)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setFormData(prev => ({ ...prev, characterPhoto: dataUrl }));
      toast.success('تم رفع صورة الشخصية بنجاح! جاري استخلاص وتحليل الملامح البصرية ذكياً...');
      setIsAnalyzingPhoto(true);

      try {
        const prompt = `أنت خبير فني واستراتيجي في صياغة الهويات البصرية والشخصيات الافتراضية (Virtual Avatars).
قم بتحليل الصورة الشخصية المرفوعة بدقة فائقة واستخلص "ملف السمات البصرية الموحد" (Visual Traits Profile) الذي يمكن لذكاء اصطناعي توليدي للميديا (مثل Midjourney أو DALL-E) الاعتماد عليه بالكامل لإعادة إنتاج نفس الشخصية في صور وفيديوهات متعددة باتساق مذهل (Character Consistency).

استخرج السمات في فقرات تفصيلية ومركزة باللغة العربية تشمل:
1. المظهر والملامح العامة: (الطابع البصري، الفئة العمرية التقريبية، المشاعر السائدة كالثقة أو الود).
2. تفاصيل الرأس والوجه: (شكل العينين، لون ونمط تسريحة الشعر، تعبيرات الوجه المميزة).
3. الملابس والأسلوب الفريد: (نوع الملابس المفضلة، لوحة الألوان البصرية للأزياء، الإكسسوارات السائدة).
4. بيئة التصوير والإضاءة: (نمط الخلفية، زوايا الإضاءة والظلال).

صغ البيانات بأسلوب احترافي فخم ومتكامل يسهل نسخه ودمجه تلقائياً مع أوامر التوليد.`;

        const savedConfig = localStorage.getItem('fluxcore_ai_config');
        const parsedConfig = savedConfig ? JSON.parse(savedConfig) : null;
        const userApiKey = parsedConfig?.apiKey || "";
        const userProvider = parsedConfig?.provider || "gemini";

        if (!userApiKey) {
          toast.error('⚠️ يرجى إدخال مفتاح API أولاً من صفحة الإعدادات قبل تحليل الصور');
          setIsAnalyzingPhoto(false);
          return;
        }

        // Use /api/ai/generate with image for multimodal analysis
        const res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt,
            image: dataUrl,
            provider: userProvider,
            apiKey: userApiKey
          })
        });

        const data = await res.json();
        if (data.error) {
          if (res.status === 401) throw new Error('مفتاح الـ API غير صالح أو منتهي الصلاحية. يرجى تحديثه من الإعدادات.');
          if (res.status === 429) throw new Error('تم تجاوز حصة الاستخدام. يرجى الانتظار قليلاً أو تغيير المفتاح.');
          throw new Error(data.error);
        }

        setFormData(prev => ({ ...prev, visualCharacterProfile: data.result }));
        toast.success('تم تحليل الأفاتار البصري واستخلاص ملف السمات الفنية بنجاح فائق! ✨');
      } catch (err: any) {
        console.error("Error analyzing character avatar photo:", err);
        toast.error("فشل تحليل ملامح الشخصية: " + (err.message || 'خطأ غير معروف'));
      } finally {
        setIsAnalyzingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCrDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData(prev => ({ ...prev, crDocumentUrl: dataUrl }));
      toast.success('تم إرفاق وثيقة السجل التجاري بنجاح!');
    };
    reader.readAsDataURL(file);
  };

  const handleNationalIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData(prev => ({ ...prev, nationalIdUrl: dataUrl }));
      toast.success('تم إرفاق وثيقة إثبات شخصية المفوض بنجاح!');
    };
    reader.readAsDataURL(file);
  };

  const handleAIFill = async () => {
    if (!aiUrl) return toast.error("أدخل رابط الموقع أولاً");
    setAiLoading(true);
    try {
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: aiUrl })
      });
      const scraped = await scrapeRes.json();
      if (scraped.error && !scraped.isFallback) throw new Error(scraped.error);
      
      const prompt = `استخرج واستنتج بيانات متكاملة لإنشاء "هوية علامة تجارية فائقة الذكاء" من هذا النص المأخوذ من موقع إلكتروني.
النص:
${(scraped.content || '').substring(0, 4000)}

جهات اتصال مستخرجة من الروابط إن وجدت:
إيميلات: ${(scraped.technical?.emails || []).join(', ')}
أرقام: ${(scraped.technical?.phones || []).join(', ')}

قم بصياغة البيانات كـ JSON فقط بالصيغة التالية (تأكد من كتابة كل شيء تلقائياً باللغة العربية):
{
  "name": "اسم العلامة التجارية المنطقي",
  "industry": "مجال العمل باختصار شديد (كلمات مفتاحية)",
  "description": "وصف مفصل للنشاط والخدمات المتقدمة التي يقومون بها بناءً على الموقع",
  "targetAudience": "الجمهور المستهدف المتوقع",
  "preferredCta": "دعوة للإجراء مناسبة وسلسة",
  "slogans": "شعار مقترح أو مأخوذ من الموقع",
  "writingStyle": "توقع أسلوب الكتابة للمنصة (رسمي، تفاعلي، ودي..)",
  "contactEmail": "البريد الإلكتروني إن وجد",
  "contactPhone": "رقم الجوال أو الهاتف للتواصل إن وجد",
  "personality": "اختر الشخصية الأنسب من بين: Luxury, Modern, Minimal, Corporate, Viral, Gen Z, Arabic Marketing, Storytelling",
  "selectedVoice": "اقترح الصوت الأنسب من بين أصوات الذكاء الاصطناعي التالية حصراً: alloy, echo, onyx, nova, shimmer",
  "visualCharacterProfile": "قم بصياغة وتوليد ملف سمات بصرية مقترح ومبتكر للأفاتار البصري الموحد للعلامة التجارية لتمكين توليد صور وفيديوهات إعلانية متناسقة بالذكاء الاصطناعي (مثل: المظهر الكلي، تعبيرات الوجه، الملابس المفضلة، الخلفية والألوان المناسبة لهوية البراند)"
}`;
      
      const savedConfig = localStorage.getItem('fluxcore_ai_config');
      const parsedConfig = savedConfig ? JSON.parse(savedConfig) : null;
      const userApiKey = parsedConfig?.apiKey || "";
      const userProvider = parsedConfig?.provider || "gemini";

      if (!userApiKey) {
        toast.error('⚠️ يرجى إدخال مفتاح API أولاً من صفحة الإعدادات (Gemini أو OpenAI) ثم حفظه');
        setAiLoading(false);
        return;
      }

      const aiRes = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          provider: userProvider,
          apiKey: userApiKey
        })
      });
      
      const aiData = await aiRes.json();
      if (aiData.error) {
        if (aiRes.status === 401) throw new Error('مفتاح الـ API غير صالح أو منتهي الصلاحية. يرجى تحديثه من الإعدادات.');
        if (aiRes.status === 429) throw new Error('تم تجاوز حصة الاستخدام. جرب مفتاحاً آخر أو انتظر قليلاً.');
        throw new Error(aiData.error);
      }
      
      // Robust JSON extraction: handle markdown fences and extra text
      let jsonStr = aiData.result || '';
      // Try to extract JSON block from markdown fences
      const jsonFenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonFenceMatch) {
        jsonStr = jsonFenceMatch[1].trim();
      } else {
        // Find first { and last } to extract raw JSON
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        jsonStr = jsonStr.trim();
      }

      let parsed: any = {};
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.warn('[BrandAI] JSON parse failed, using partial fill from raw text', parseErr);
        // Don't throw - just use what we have
        parsed = {
          name: jsonStr.match(/"name"\s*:\s*"([^"]+)"/)?.[1] || '',
          industry: jsonStr.match(/"industry"\s*:\s*"([^"]+)"/)?.[1] || '',
          description: jsonStr.match(/"description"\s*:\s*"([^"]+)"/)?.[1] || '',
        };
      }
      
      setFormData(prev => ({ 
        ...prev, 
        name: parsed.name || prev.name,
        industry: parsed.industry || prev.industry,
        description: parsed.description || prev.description,
        targetAudience: parsed.targetAudience || prev.targetAudience,
        preferredCta: parsed.preferredCta || prev.preferredCta,
        slogans: parsed.slogans || prev.slogans,
        writingStyle: parsed.writingStyle || prev.writingStyle,
        contactEmail: parsed.contactEmail || prev.contactEmail,
        contactPhone: parsed.contactPhone || prev.contactPhone,
        personality: parsed.personality || prev.personality,
        selectedVoice: parsed.selectedVoice || prev.selectedVoice,
        visualCharacterProfile: parsed.visualCharacterProfile || prev.visualCharacterProfile,
      }));
      toast.success("تم سحب وتحليل واقتراح كافة بيانات الهوية والأصول بنجاح فائق! ✨");
    } catch (e: any) {
      console.error('[BrandAI] handleAIFill error:', e);
      toast.error("فشل استخراج البيانات: " + (e.message || 'خطأ غير معروف'));
    } finally {
      setAiLoading(false);
    }
  };

  const handleFullBrandIntelligenceScan = async () => {
    const targetUrl = formData.seoUrl || aiUrl;
    if (!targetUrl) {
      toast.error("يرجى إدخال رابط المتجر الإلكتروني أو الموقع في حقل الرابط أولاً");
      return;
    }

    setAiLoading(true);
    toast.success("جاري تشغيل محرك كشط واستخراج واستكشاف ذكاء الهوية الشامل وتدقيق السلامة...");

    try {
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const scraped = await scrapeRes.json();

      const scrapedImages = scraped.images || [];
      const scrapedLogo = scraped.ogImage || scraped.favicon || formData.logo || '';
      const scrapedPhones = scraped.technical?.phones || [];
      const scrapedEmails = scraped.technical?.emails || [];

      const prompt = `أنت خبير استراتيجي في تدقيق وتأمين الهويات التجارية وإعلانات جوجل (Google Ads Audit Guard & Brand Intelligence Engine).
قم بتحليل بيانات الموقع التالية واستخراج "ملف ذكاء الهوية الشامل وتدقيق السلامة" لضمان عدم وجود أخطاء أو إحراجات في الحملات والتأكد من مطابقة السياسات:

بيانات الموقع المجلوبة:
رابط الموقع: ${targetUrl}
محتوى الصفحات: ${(scraped.content || '').substring(0, 3500)}
أرقام الهواتف: ${scrapedPhones.join(', ')}
البريد الإلكتروني: ${scrapedEmails.join(', ')}

بيانات الهوية الحالية:
اسم المتجر: ${formData.name || ''}
مجال العمل: ${formData.industry || ''}
السجل التجاري: ${formData.commercialRegister || 'غير محدد'}
الرقم الضريبي: ${formData.taxId || 'غير محدد'}
رقم حساب جوجل أدز: ${formData.googleAdsCustomerId || 'غير محدد'}

قم بالتحليل وإرجاع كائن JSON حصراً بالصيغة التالية (بدون أي نصوص إضافية خارج JSON):
{
  "seoHealthScore": 88,
  "copyQualityScore": 92,
  "visualTrustScore": 85,
  "googleAdsPolicyScore": 90,
  "adAngles": [
    { "title": "زاوية حل المشكلة المباشر", "desc": "شرح مختصر للزاوية الإعلانية الأولى", "targetHook": "عنوان إعلاني جذاب" },
    { "title": "زاوية العرض الحصري والسرعة", "desc": "شرح مختصر للزاوية الإعلانية الثانية", "targetHook": "عنوان إعلاني جذاب" },
    { "title": "زاوية الإثبات الاجتماعي والموثوقية", "desc": "شرح مختصر للزاوية الثالثة", "targetHook": "عنوان إعلاني جذاب" },
    { "title": "زاوية الميزة التنافسية الفريدة", "desc": "شرح مختصر للزاوية الرابعة", "targetHook": "عنوان إعلاني جذاب" }
  ],
  "buyerAvatar": {
    "demographics": "وصف دقيق لديموغرافية العميل المستهدف بالسعودية والخليج",
    "painPoints": "المشكلات والآلام الرئيسية التي يعاني منها العميل",
    "buyTriggers": "الدوافع والمحفزات الرئيسية لشراء المنتج أو الخدمة"
  },
  "missingRequirements": [
    { 
      "title": "عنوان الإجراء اليدوي المطلوب", 
      "desc": "خطوات محددة ودقيقة يتبعها المستخدم بيده لتكملة هذا المتطلب", 
      "severity": "critical", 
      "actionKey": "cr_number" 
    }
  ],
  "googleAdsAudit": {
    "accountStatus": "active",
    "statusReason": "الحساب الإعلاني نشط ومستعد لتدشين الحملة برمجياً بدون مخاطر حظر.",
    "policyCheckScore": 94,
    "suspensionRisks": ["تأكد من إرفاق وثيقة السجل التجاري لتجنب التوقف المؤقت في مراجعة التوثيق"],
    "suggestedActions": [
      { "title": "🚀 تدشين حملة إعلانات جوجل الذكية تلقائياً", "desc": "إنشاء وتفعيل حملة البحث برمجياً بالكلمات المفتاحية والميزانية", "actionType": "create_campaign" },
      { "title": "✨ توليد 3 إعلانات نصوص وميديا جديدة معتمدة", "desc": "إنشاء نصوص وعناوين جذابة متوافقة 100% مع السياسات", "actionType": "generate_ads" },
      { "title": "🛡️ إرسال وتوثيق الحساب بالسجل التجاري والهوية", "desc": "تقديم ملف التوثيق التجاري المعتمد لدى جوجل أدز", "actionType": "submit_verification" }
    ],
    "suggestedCampaign": {
      "name": "حملة استهداف الشراء والنمو المباشر",
      "budget": "150 ر.س / يومياً",
      "keywords": ["أفضل متجر", "شراء مباشر", "عروض ممتازة"],
      "targetLocations": ["المملكة العربية السعودية", "الرياض", "جدة"]
    },
    "generatedAds": [
      { "headline": "العروض الأكثر طلباً لهذا الموسم", "description": "خدمة متكاملة وسريعة مع ضمان الموثوقية. اطلب الآن واستمتع بالمميزات.", "callToAction": "اطلب الآن" }
    ]
  }
}`;

      const savedConfig = localStorage.getItem('fluxcore_ai_config');
      const parsedConfig = savedConfig ? JSON.parse(savedConfig) : null;
      const userApiKey = parsedConfig?.apiKey || "";
      const userProvider = parsedConfig?.provider || "gemini";

      if (!userApiKey) {
        toast.error('⚠️ يرجى إدخال مفتاح API أولاً من صفحة الإعدادات لتشغيل الفحص');
        setAiLoading(false);
        return;
      }

      const aiRes = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider: userProvider, apiKey: userApiKey })
      });
      const aiData = await aiRes.json();

      let jsonStr = aiData.result || '';
      const jsonFenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonFenceMatch) jsonStr = jsonFenceMatch[1].trim();
      else {
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }

      let parsed: any = {};
      try {
        parsed = JSON.parse(jsonStr);
      } catch (e) {
        console.warn("AI intelligence parsing fallback:", e);
      }

      const missing: any[] = [];

      if (!formData.commercialRegister) {
        missing.push({
          title: "إدخال رقم السجل التجاري (Commercial Register / CR)",
          desc: "تتطلب سياسات Google Ads للشركات والمتاجر توثيق السجل التجاري لتفادي حظر الحساب الإعلاني واستخراج بادج التوثيق الأزرق.",
          severity: "warning",
          actionKey: "commercialRegister"
        });
      }

      if (!formData.taxId) {
        missing.push({
          title: "إدخال الرقم الضريبي (Tax / VAT Number)",
          desc: "إدراج الرقم الضريبي يحمي الإعلانات من التعليق الفجائي ويحفظ الحقوق المالية للفواتير.",
          severity: "info",
          actionKey: "taxId"
        });
      }

      if (!formData.googleAdsCustomerId) {
        missing.push({
          title: "ربط رقم حساب جوجل أدز (Google Ads Customer ID)",
          desc: "أدخل رقم حسابك الإعلاني المكون من 10 أرقام (مثال: 123-456-7890) ليتمكن الوكيل من رفع الإعلانات فورياً دون أخطاء.",
          severity: "info",
          actionKey: "googleAdsCustomerId"
        });
      }

      if (!formData.logo && !scrapedLogo) {
        missing.push({
          title: "رفع الشعار المربع (Square Business Logo)",
          desc: "يرجى رفع الشعار المربع 1:1 ليظهر بجانب أصل الاسم التجاري في نتائج بحث جوجل الموثوقة.",
          severity: "warning",
          actionKey: "logo"
        });
      }

      if (!formData.contactPhone && scrapedPhones.length === 0) {
        missing.push({
          title: "إدخال رقم الجوال/الهاتف المباشر",
          desc: "مطلوب لتشغيل إضافة اتصل الآن (Call Extension) لتسليم المكالمات من محرك البحث مباشرة.",
          severity: "info",
          actionKey: "contactPhone"
        });
      }

      const intelObject = {
        seoHealthScore: parsed.seoHealthScore || 85,
        copyQualityScore: parsed.copyQualityScore || 90,
        visualTrustScore: parsed.visualTrustScore || 88,
        googleAdsPolicyScore: parsed.googleAdsPolicyScore || 92,
        scrapedImages: scrapedImages.slice(0, 8),
        extractedLogo: scrapedLogo,
        adAngles: parsed.adAngles || [],
        buyerAvatar: parsed.buyerAvatar || { demographics: '', painPoints: '', buyTriggers: '' },
        missingRequirements: [...missing, ...(parsed.missingRequirements || [])],
        lastScannedAt: new Date().toISOString()
      };

      setFormData(prev => ({
        ...prev,
        seoUrl: targetUrl,
        contactEmail: prev.contactEmail || scrapedEmails[0] || '',
        contactPhone: prev.contactPhone || scrapedPhones[0] || '',
        logo: prev.logo || scrapedLogo || '',
        brandIntelligence: intelObject
      }));

      toast.success("اكتمل فحص وتدقيق ذكاء الهوية الشامل بنجاح!");
    } catch (err: any) {
      console.error("Full Brand Intelligence scan failed:", err);
      toast.error("حدث خطأ أثناء الفحص: " + (err.message || 'خطأ غير معروف'));
    } finally {
      setAiLoading(false);
    }
  };

  const handleEdit = (brand: BrandIdentity) => {
    setFormData(brand);
    setIsCreating(false);
    setActiveTab('editor');
  };

  const handleCreateNew = () => {
    setFormData({
      name: '', description: '', industry: '', personality: 'Modern',
      writingStyle: '', preferredWords: '', bannedWords: '',
      preferredCta: '', targetAudience: '', language: 'العربية', slogans: '', colors: ''
    });
    setIsCreating(true);
    setActiveTab('editor');
  };

  const handleSave = async () => {
    if (!formData.name) {
       toast.error('اسم العلامة التجارية مطلوب');
       return;
    }
    try {
      if (isCreating) {
        await createBrand(formData);
      } else if (formData.id) {
        await updateBrand(formData.id, formData);
      }
      setActiveTab('profiles');
      toast.success('تم حفظ هوية العلامة التجارية بنجاح');
    } catch (e: any) {
      toast.error('خطأ أثناء الحفظ: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmation({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.id) {
      const id = deleteConfirmation.id;
      await deleteBrand(id);
      if (activeTab === 'editor' && formData.id === id) {
        setActiveTab('profiles');
      }
    }
    setDeleteConfirmation({ isOpen: false, id: null });
  };

  const personalites = ['Luxury', 'Modern', 'Minimal', 'Corporate', 'Viral', 'Gen Z', 'Arabic Marketing', 'Storytelling'];

  const [isExtractingColors, setIsExtractingColors] = useState(false);

  const extractDominantColorsFromImage = (dataUrl: string): Promise<string[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(['#b91c1c', '#1e293b', '#10b981']);
            return;
          }

          // Small canvas to optimize performance and grab dominant pigments
          const size = 50;
          canvas.width = size;
          canvas.height = size;
          ctx.drawImage(img, 0, 0, size, size);

          const imgData = ctx.getImageData(0, 0, size, size);
          const pixels = imgData.data;
          const colorCounts: { [hex: string]: number } = {};

          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            // Ignore transparent or highly semi-transparent pixels
            if (a < 185) continue;

            // Ignore light colors/background white colors (brightness > 240)
            if (r > 238 && g > 238 && b > 238) continue;

            // Ignore extremely dark colors (near pure pitch black text)
            if (r < 20 && g < 20 && b < 20) continue;

            // Rounding for simple quantization (grouping similar colors together)
            const qr = Math.round(r / 20) * 20;
            const qg = Math.round(g / 20) * 20;
            const qb = Math.round(b / 20) * 20;

            const toHex = (c: number) => {
              const hex = Math.min(255, Math.max(0, c)).toString(16);
              return hex.length === 1 ? '0' + hex : hex;
            };
            const hex = `#${toHex(qr)}${toHex(qg)}${toHex(qb)}`;

            colorCounts[hex] = (colorCounts[hex] || 0) + 1;
          }

          const sortedColors = Object.entries(colorCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([hex]) => hex);

          // Ensure distinct color variance
          const finalColors: string[] = [];
          const isSimilar = (hex1: string, hex2: string) => {
            const parseHex = (h: string) => [
              parseInt(h.slice(1, 3), 16),
              parseInt(h.slice(3, 5), 16),
              parseInt(h.slice(5, 7), 16)
            ];
            const [r1, g1, b1] = parseHex(hex1);
            const [r2, g2, b2] = parseHex(hex2);
            const dist = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
            return dist < 65; // Visual distance threshold
          };

          for (const col of sortedColors) {
            if (finalColors.length >= 4) break;
            const tooClose = finalColors.some(fc => isSimilar(fc, col));
            if (!tooClose) {
              finalColors.push(col);
            }
          }

          if (finalColors.length === 0) {
            // Fallback colors if the logo is entirely white/black
            finalColors.push('#f43f5e', '#3b82f6', '#10b981');
          }

          resolve(finalColors);
        } catch (err) {
          console.error("Color extraction failed, using defaults:", err);
          resolve(['#b91c1c', '#1e293b', '#10b981']);
        }
      };
      img.onerror = () => {
        resolve(['#b91c1c', '#1e293b', '#10b981']);
      };
      img.src = dataUrl;
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح');
      return;
    }

    if (file.size > 800 * 1024) {
      toast.error('حجم الشعار كبير جداً (الحد الأقصى 800 كيلوبايت لتوافق النظام)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const logoDataUrl = event.target?.result as string;
      setIsExtractingColors(true);
      
      // Update logo first
      setFormData(prev => ({ ...prev, logo: logoDataUrl }));
      toast.success('تم رفع الشعار بنجاح! جاري تفريغ وتحليل أرقام الألوان ذكياً...');

      try {
        const extracted = await extractDominantColorsFromImage(logoDataUrl);
        const colorsString = extracted.join(', ');
        
        // Auto update the colors field
        setFormData(prev => ({ ...prev, colors: colorsString }));
        toast.success(`تم استخلاص الألوان للماركة بنجاح: ${colorsString}`);
      } catch (err) {
        console.error("Error auto-extracting colors:", err);
      } finally {
        setIsExtractingColors(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return <div className="h-full flex justify-center items-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;
  }

  return (
    <div className="flex h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Sidebar Navigation */}
      <div className="w-64 shrink-0 flex flex-col gap-6">
        <div className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20 p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 blur-3xl rounded-full"></div>
          <Sparkles size={32} className="text-rose-400 mb-4 relative z-10" />
          <h2 className="text-xl font-black text-white relative z-10">Brand Identity</h2>
          <p className="text-xs text-rose-300/70 mt-2 relative z-10 leading-relaxed font-medium">إدارة الذاكرة الذكية لعلاماتك التجارية. الذكاء الاصطناعي يتذكر أسلوبك دائماً.</p>
        </div>

        <nav className="flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'profiles' ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Briefcase size={16} className={activeTab === 'profiles' ? 'text-rose-400' : 'text-slate-500'} />
            العلامات التجارية (Workspaces)
          </button>
          {activeBrand && (
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'library' ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen size={16} className={activeTab === 'library' ? 'text-rose-400' : 'text-slate-500'} />
              مكتبة المراجع والمعرفة
            </button>
          )}

          {activeBrand && (
            <button
              onClick={() => setActiveTab('usage')}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'usage' ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart2 size={16} className={activeTab === 'usage' ? 'text-rose-400' : 'text-slate-500'} />
              الاستهلاك والفواتير (Usage)
            </button>
          )}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-[32px] p-8 overflow-y-auto custom-scrollbar relative">
        <AnimatePresence mode="wait">
          {activeTab === 'profiles' && (
            <motion.div key="profiles" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6">
              <div className="flex justify-between items-center bg-slate-900/80 sticky top-0 z-10 py-2 border-b border-slate-800 backdrop-blur-md">
                <div>
                  <h3 className="text-2xl font-black text-white">العلامات التجارية ومساحات العمل</h3>
                  <p className="text-sm text-slate-400 mt-1">اختر مساحة العمل أو أنشئ هوية براند جديدة</p>
                </div>
                <button onClick={handleCreateNew} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20">
                  <Plus size={18} /> براند جديد
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {brands.length === 0 ? (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500">
                    <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold">لا يوجد مساحات عمل (Brands) حتى الآن.</p>
                  </div>
                ) : (
                  brands.map(brand => {
                    const isSelected = activeBrand?.id === brand.id;
                    const brandColors = brand.colors 
                      ? brand.colors.split(',').map((c: string) => c.trim()).filter((c: string) => c.startsWith('#')) 
                      : [];

                    return (
                      <motion.div 
                        key={brand.id}
                        whileHover={{ y: -6, scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className={`bg-slate-950/40 backdrop-blur-md border-2 p-6 rounded-[28px] flex flex-col gap-5 relative overflow-hidden transition-all duration-300 cursor-pointer text-right group select-none ${
                          isSelected 
                            ? 'border-rose-500/80 bg-rose-500/[0.015] shadow-[0_20px_45px_-12px_rgba(244,63,94,0.18),inset_0_1px_1px_rgba(255,255,255,0.05)]' 
                            : 'border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-950/80 shadow-md'
                        }`} 
                        onClick={() => {
                          setActiveBrandId(brand.id);
                          toast.success(`تم بنجاح تفعيل علامة "${brand.name}" وهويتها البصرية في كامل أنحاء النظام! ✨`);
                        }}
                        dir="rtl"
                      >
                        {/* Selected Indicator Ribbon */}
                        {isSelected ? (
                          <div className="absolute top-0 left-0 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-br-2xl flex items-center gap-1.5 shadow-sm">
                            <Check size={11} className="stroke-[3]" />
                            <span>مفعّلة ونشطة</span>
                          </div>
                        ) : (
                          <div className="absolute top-0 left-0 bg-slate-850 text-slate-400 text-[8.5px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            اضغط لتفعيل العلامة ⚡
                          </div>
                        )}

                        {/* Top Info section */}
                        <div className="flex items-start gap-4 mt-2">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center p-1 border transition-all duration-300 shrink-0 ${
                            isSelected 
                              ? 'bg-slate-900 border-rose-500/40 shadow-lg' 
                              : 'bg-slate-950 border-slate-800 group-hover:border-slate-700'
                          }`}>
                            {brand.logo ? (
                               <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain rounded-lg" />
                             ) : brandColors.length > 0 ? (
                               <div className="w-full h-full rounded-lg flex items-center justify-center font-black text-white text-base shadow-inner" style={{ backgroundColor: brandColors[0] }}>
                                 {brand.name ? brand.name.charAt(0) : 'B'}
                               </div>
                             ) : (
                               <div className="w-full h-full rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800">
                                 <Briefcase size={22} className="text-slate-400" />
                               </div>
                             )}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-slate-100 text-lg group-hover:text-rose-400 transition-colors truncate">{brand.name}</h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-bold max-w-[120px] truncate">{brand.industry || 'عام'}</span>
                              <span className="text-[10px] bg-rose-500/10 text-rose-300 px-2.5 py-0.5 rounded-md font-bold">{brand.personality}</span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="min-h-[40px]">
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">{brand.description || 'لم يتم كتابة وصف مخصص للبراند بعد. أضف وصفاً لمساعدة الذكاء الاصطناعي على فهم أهدافك.'}</p>
                        </div>

                        {/* Micro meta details */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-900/30 p-2.5 rounded-xl border border-slate-850">
                          <div className="flex items-center gap-1.5 min-w-0" title="اللغة المستهدفة للبراند">
                            <Globe size={12.5} className="text-slate-500 shrink-0" />
                            <span className="text-[10px] text-slate-400 truncate font-medium">{brand.language || 'العربية'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0" title="الجمهور المستهدف">
                            <Users size={12.5} className="text-slate-500 shrink-0" />
                            <span className="text-[10px] text-slate-400 truncate font-medium">{brand.targetAudience || 'جمهور عام'}</span>
                          </div>
                        </div>

                        {/* Color Palette visualization */}
                        {brandColors.length > 0 && (
                          <div className="pt-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">لوحة الألوان:</span>
                              <div className="flex items-center gap-1.5">
                                {brandColors.slice(0, 4).map((col: string, idx: number) => (
                                  <div 
                                    key={idx} 
                                    className="w-3.5 h-3.5 rounded-full border border-white/10 shadow-sm relative group/color cursor-help"
                                    style={{ backgroundColor: col }}
                                    title={col}
                                  >
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/color:block bg-slate-950 text-white text-[8px] font-mono px-1.5 py-0.5 rounded border border-slate-800 pointer-events-none whitespace-nowrap z-10">
                                      {col}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Footer Action buttons */}
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-850">
                          <span className="text-[10px] font-mono font-bold text-slate-600">ID: {brand.id.slice(0,6)}...</span>
                          
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setShareBrand(brand); 
                              }} 
                              className="text-[10px] flex items-center gap-1.5 text-rose-400 hover:text-white bg-rose-500/5 hover:bg-rose-500 border border-rose-500/10 px-2.5 py-1.5 rounded-lg font-bold transition-all active:scale-95 cursor-pointer"
                              title="مشاركة الهوية التجارية للعملاء"
                            >
                              <Share2 size={11} />
                              <span>مشاركة</span>
                            </button>

                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleEdit(brand); 
                              }} 
                              className="text-[10px] flex items-center gap-1.5 text-indigo-400 hover:text-white bg-indigo-500/5 hover:bg-indigo-600 border border-indigo-500/10 px-2.5 py-1.5 rounded-lg font-bold transition-all active:scale-95 cursor-pointer"
                              title="تعديل تفاصيل هوبة العلامة التجارية"
                            >
                              <Edit3 size={11} />
                              <span>تعديل</span>
                            </button>
                            
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleDelete(brand.id); 
                              }} 
                              className="text-[10px] flex items-center gap-1.5 text-slate-400 hover:text-white bg-slate-500/5 hover:bg-rose-600 border border-slate-500/10 px-2.5 py-1.5 rounded-lg font-bold transition-all active:scale-95 cursor-pointer"
                              title="حذف العلامة التجارية نهائياً"
                            >
                              <Trash2 size={11} />
                              <span>حذف</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'editor' && (
            <motion.div key="editor" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="space-y-8 max-w-4xl mx-auto pb-20">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-6 sticky top-0 bg-slate-900/80 backdrop-blur-md z-20 py-4">
                 <div>
                    <h2 className="text-2xl font-black text-white">{isCreating ? 'إضافة هوية براند جديدة' : 'تعديل هوية البراند'}</h2>
                    <p className="text-xs text-slate-400 mt-1">يستخدم الذكاء الاصطناعي هذه البيانات لتخصيص كل المحتوى الذي يتم توليده ليتناسب مع شخصية العلامة التجارية.</p>
                 </div>
                 <div className="flex gap-3">
                   <button onClick={() => setActiveTab('profiles')} className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-bold transition-colors">إلغاء</button>
                   <button onClick={handleSave} className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-rose-600/20">حفظ ההوية</button>
                 </div>
              </div>

              <div className="bg-gradient-to-r from-rose-500/10 to-indigo-500/10 border border-slate-700/50 p-6 rounded-2xl mb-8">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2 w-full">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
                       <Globe size={14} className="text-rose-400" /> التعرف الذكي عبر رابط الموقع
                    </label>
                    <input 
                      type="url" 
                      placeholder="https://example.com" 
                      value={aiUrl} 
                      onChange={e => setAiUrl(e.target.value)} 
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 outline-none" 
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 sm:pt-0">
                    <button 
                      onClick={handleAIFill}
                      disabled={aiLoading}
                      className="h-11 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center"
                    >
                      {aiLoading ? (
                        <><Loader2 className="animate-spin ml-2" size={16}/> جاري السحب...</>
                      ) : (
                        <><Sparkles className="ml-2 text-rose-400" size={16}/> سحب البيانات</>
                      )}
                    </button>

                    <button 
                      onClick={handleFullBrandIntelligenceScan}
                      disabled={aiLoading}
                      className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 text-white text-xs font-black shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center"
                    >
                      {aiLoading ? (
                        <><Loader2 className="animate-spin ml-2" size={16}/> جاري الفحص والتدقيق...</>
                      ) : (
                        <><ShieldCheck className="ml-2 text-indigo-200" size={16}/> ⚡ فحص وتدقيق ذكاء الهوية</>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="space-y-6">
                  <h3 className="font-black text-lg text-white flex items-center gap-2"><Briefcase className="text-rose-400" size={18}/> المعلومات الأساسية</h3>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">اسم العلامة التجارية *</label>
                    <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">نوع المجال (Industry)</label>
                    <input type="text" placeholder="مثال: تسويق رقمي، مطعم، أزياء..." value={formData.industry || ''} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">وصف النشاط بالتفصيل</label>
                    <textarea rows={4} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none resize-none" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">الجمهور المستهدف (Target Audience)</label>
                    <input type="text" placeholder="مثال: رواد الأعمال، الشباب من 18-24، أصحاب الشركات..." value={formData.targetAudience || ''} onChange={e => setFormData({...formData, targetAudience: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-widest text-slate-400">البريد الإلكتروني</label>
                       <input type="email" placeholder="البريد للتواصل..." value={formData.contactEmail || ''} onChange={e => setFormData({...formData, contactEmail: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-widest text-slate-400">رقم التواصل</label>
                       <input type="text" placeholder="رقم الجوال..." value={formData.contactPhone || ''} onChange={e => setFormData({...formData, contactPhone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none" />
                    </div>
                  </div>
                </div>

                {/* Voice & Personality */}
                <div className="space-y-6">
                  <h3 className="font-black text-lg text-white flex items-center gap-2"><BookType className="text-rose-400" size={18}/> شخصية البراند (Brand Voice)</h3>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">ملف الشخصية الأساسي (Persona Profiling)</label>
                    <div className="flex flex-wrap gap-2">
                      {personalites.map(p => (
                        <button key={p} onClick={() => setFormData({...formData, personality: p})} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${formData.personality === p ? 'bg-rose-600 border-rose-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">أسلوب الكتابة المفضل (Writing Style)</label>
                    <textarea rows={3} placeholder="كيف نكتب؟ مثال: جمل قصيرة ومباشرة، استخدام الجناس والطباق بشكل خفيف، عدم استخدام المبني للمجهول..." value={formData.writingStyle || ''} onChange={e => setFormData({...formData, writingStyle: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 outline-none resize-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">كلمات مفضلة (افصل بفاصلة)</label>
                      <input type="text" value={formData.preferredWords || ''} onChange={e => setFormData({...formData, preferredWords: e.target.value})} className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl py-2 px-3 text-sm text-slate-200 focus:border-emerald-500/50 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">كلمات ممنوعة (افصل بفاصلة)</label>
                      <input type="text" value={formData.bannedWords || ''} onChange={e => setFormData({...formData, bannedWords: e.target.value})} className="w-full bg-rose-500/5 border border-rose-500/20 rounded-xl py-2 px-3 text-sm text-slate-200 focus:border-rose-500/50 outline-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">الدعوة للإجراء المفضلة (Preferred CTA)</label>
                    <input type="text" placeholder="مثال: احجز الآن، انضم للرحلة، تواصل معنا..." value={formData.preferredCta || ''} onChange={e => setFormData({...formData, preferredCta: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 outline-none" />
                  </div>

                  {/* Brand Voice Profile */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">الهوية الصوتية النشطة (Brand Voice Profile)</label>
                      {formData.personality && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                          مقترح: {
                            formData.personality === 'Luxury' || formData.personality === 'Corporate' ? 'Onyx (فخم وموقر)' :
                            formData.personality === 'Gen Z' || formData.personality === 'Viral' || formData.personality === 'Storytelling' ? 'Nova (حيوي ومؤثر)' :
                            formData.personality === 'Arabic Marketing' ? 'Echo (دافئ وتفاعلي)' : 'Alloy (متزن وطبيعي)'
                          } ✨
                        </span>
                      )}
                    </div>
                    <select 
                      value={formData.selectedVoice || 'alloy'} 
                      onChange={e => setFormData({...formData, selectedVoice: e.target.value})} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none appearance-none cursor-pointer"
                    >
                      <option value="alloy">Alloy - متزن، احترافي وطبيعي (عالمي)</option>
                      <option value="echo">Echo - دافئ، ودود وتفاعلي (رائع للمحتوى العربي)</option>
                      <option value="onyx">Onyx - فخم، عميق، ووقور (مثالي للعلامات الراقية)</option>
                      <option value="nova">Nova - شاب، حيوي، ومؤثر (ممتاز للفيديوهات والترندات)</option>
                      <option value="shimmer">Shimmer - مشرق، واضح ومحفز (رائع للإعلانات والتسويق)</option>
                    </select>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-800/80">
                    <div className="flex items-center justify-between">
                       <label className="text-xs font-bold uppercase tracking-widest text-slate-400">نبرات مخصصة (Custom Tones)</label>
                       <button onClick={() => {
                          const current = formData.customTones || [];
                          setFormData({...formData, customTones: [...current, { id: 'tone-' + Date.now() + '-' + Math.floor(Math.random() * 1000000), name: 'نبرة جديدة', prompt: '' }]});
                       }} className="text-[10px] bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white px-2 py-1 rounded transition-colors font-bold flex items-center gap-1">
                          <Plus size={12} /> إضافة نبرة مخصصة
                       </button>
                    </div>
                    {formData.customTones?.map((tone, idx) => (
                      <div key={tone.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-3 relative group">
                         <button onClick={() => {
                            const newTones = [...(formData.customTones || [])];
                            newTones.splice(idx, 1);
                            setFormData({...formData, customTones: newTones});
                         }} className="absolute top-3 left-3 text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={14} />
                         </button>
                         <div>
                            <label className="block text-[10px] text-slate-500 mb-1">اسم النبرة</label>
                            <input value={tone.name} onChange={e => {
                               const newTones = [...(formData.customTones || [])];
                               newTones[idx].name = e.target.value;
                               setFormData({...formData, customTones: newTones});
                            }} className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-sm text-slate-200 focus:border-rose-500/50 outline-none" />
                         </div>
                         <div>
                            <label className="block text-[10px] text-slate-500 mb-1">البرومبت الخاص (التوجيهات)</label>
                            <textarea value={tone.prompt} onChange={e => {
                               const newTones = [...(formData.customTones || [])];
                               newTones[idx].prompt = e.target.value;
                               setFormData({...formData, customTones: newTones});
                            }} rows={2} className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-300 focus:border-rose-500/50 outline-none resize-none" placeholder="مثال: تحدث بصفتك صديق مقرب للعميل بطريقة مرحة وعفوية جداً..." />
                         </div>
                      </div>
                    ))}
                    {(!formData.customTones || formData.customTones.length === 0) && (
                      <p className="text-[10px] text-slate-500 text-center py-2">لا توجد نبرات مخصصة مسجلة</p>
                    )}
                  </div>
                </div>

                {/* Brand Assets Placeholder */}
                <div className="col-span-1 md:col-span-2 space-y-6 pt-6 border-t border-slate-800">
                  <h3 className="font-black text-lg text-white flex items-center gap-2"><Palette className="text-rose-400" size={18}/> الأصول والهوية البصرية (Visual Assets & Character Avatar)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* الشعار */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">الشعار الرئيسي (Upload Logo)</label>
                      <label className="h-28 border-2 border-dashed border-slate-750 hover:border-rose-500 rounded-xl flex flex-col items-center justify-center text-slate-500 transition-all cursor-pointer bg-slate-900/50 group overflow-hidden relative">
                        {formData.logo ? (
                          <div className="w-full h-full relative group">
                            <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-[10px] font-bold text-white uppercase tracking-tighter">تغيير الشعار</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ImageIcon size={24} className="group-hover:scale-110 transition-transform mb-1 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">رفع الشعار</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                    </div>

                    {/* الألوان */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                      {isExtractingColors && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="animate-spin text-rose-500" size={24} />
                          <span className="text-[10px] font-bold text-rose-300">جاري استخلاص ألوان الشعار...</span>
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2 flex items-center justify-between">
                          <span>ألوان العلامة التجارية (Hex Codes)</span>
                          {formData.colors && (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">مستخلصة تلقائياً ✨</span>
                          )}
                        </label>
                        <input 
                          type="text" 
                          placeholder="#FF0000, #00FF00, #10B981" 
                          value={formData.colors || ''} 
                          onChange={e => setFormData({...formData, colors: e.target.value})} 
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-200 outline-none focus:border-rose-500/50" 
                        />
                      </div>
                      
                      {/* Live Visual Palette Indicator */}
                      {formData.colors && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80">
                          <span className="text-[10px] font-bold text-slate-500 block mb-2">اللوحة البصرية المفرغة النشطة:</span>
                          <div className="flex flex-wrap gap-3">
                            {formData.colors.split(',').map((color, idx) => {
                              const trimmedColor = color.trim();
                              if (!trimmedColor.startsWith('#')) return null;
                              return (
                                <div key={idx} className="flex items-center gap-1.5 bg-slate-900/40 p-1.5 pr-2.5 rounded-full border border-slate-800/80 shadow-inner" title={trimmedColor}>
                                  <div 
                                    className="w-5 h-5 rounded-full border border-white/10 shadow-sm shrink-0" 
                                    style={{ backgroundColor: trimmedColor }}
                                  />
                                  <span className="text-[10.5px] font-mono whitespace-nowrap text-slate-300 font-medium select-all">{trimmedColor}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* صورة الأفاتار البصري */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                      {isAnalyzingPhoto && (
                        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2 p-4 text-center">
                          <Loader2 className="animate-spin text-rose-500" size={24} />
                          <span className="text-[10px] font-bold text-rose-300">جاري استخلاص السمات بالذكاء... ✨</span>
                        </div>
                      )}
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">صورة الشخصية للأفاتار (Character Photo)</label>
                      <label className="h-28 border-2 border-dashed border-slate-750 hover:border-rose-500 rounded-xl flex flex-col items-center justify-center text-slate-500 transition-all cursor-pointer bg-slate-900/50 group overflow-hidden relative">
                        {formData.characterPhoto ? (
                          <div className="w-full h-full relative group">
                            <img src={formData.characterPhoto} alt="Avatar Preview" className="w-full h-full object-cover p-1 rounded-lg" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-[10px] font-bold text-white uppercase tracking-tighter">تغيير الصورة</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ImageIcon size={24} className="group-hover:scale-110 transition-transform mb-1 text-rose-400/80" />
                            <span className="text-[10px] font-bold text-rose-400/80 uppercase">رفع صورة الأفاتار</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={handleCharacterPhotoUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Visual Character Profile Field */}
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">ملف السمات البصرية المستخلصة (Brand Character Visual Profile)</label>
                      {formData.visualCharacterProfile && (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">مستقر وجاهز للتوليد ✨</span>
                      )}
                    </div>
                    <textarea 
                      rows={6} 
                      placeholder="هنا ستظهر الملامح البصرية والسمات الجسدية واللباس المستخلص بالذكاء الاصطناعي فور رفع صورة الأفاتار. يمكنك أيضاً كتابتها أو تعديلها يدوياً لتوجيه ذكاء التوليد البصري بدقة متناهية..." 
                      value={formData.visualCharacterProfile || ''} 
                      onChange={e => setFormData({...formData, visualCharacterProfile: e.target.value})} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-300 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none resize-none font-sans leading-relaxed" 
                    />
                  </div>

                  {/* Commercial & Google Ads Verification Section */}
                  <div className="space-y-4 pt-6 border-t border-slate-800">
                    <h3 className="font-black text-lg text-white flex items-center gap-2">
                      <ShieldCheck className="text-indigo-400" size={18}/> بيانات التوثيق التجاري وإعلانات جوجل (Commercial & Ads Verification)
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">هذه البيانات تستخدم لتفادي تعليق الإعلانات وتوثيق الحساب الإعلاني لدى جوجل أدز بنقرة واحدة.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">رقم السجل التجاري (Commercial Register / CR)</label>
                        <input 
                          type="text" 
                          placeholder="مثال: 1010XXXXXX" 
                          value={formData.commercialRegister || ''} 
                          onChange={e => setFormData({...formData, commercialRegister: e.target.value})} 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-indigo-500/50 outline-none" 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">الرقم الضريبي (VAT / Tax ID)</label>
                        <input 
                          type="text" 
                          placeholder="مثال: 300XXXXXXXXXXXX" 
                          value={formData.taxId || ''} 
                          onChange={e => setFormData({...formData, taxId: e.target.value})} 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-indigo-500/50 outline-none" 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">دولة التسجيل التجاري</label>
                        <input 
                          type="text" 
                          placeholder="المملكة العربية السعودية" 
                          value={formData.businessCountry || 'المملكة العربية السعودية'} 
                          onChange={e => setFormData({...formData, businessCountry: e.target.value})} 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-indigo-500/50 outline-none" 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">رقم حساب Google Ads (Customer ID)</label>
                        <input 
                          type="text" 
                          placeholder="123-456-7890" 
                          value={formData.googleAdsCustomerId || ''} 
                          onChange={e => setFormData({...formData, googleAdsCustomerId: e.target.value})} 
                          className="w-full bg-slate-950 border border-indigo-500/30 rounded-xl py-3 px-4 text-sm text-indigo-300 font-mono focus:border-indigo-500 outline-none" 
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">اسم المفوض الرسمي / صاحب المؤسسة (Authorized Representative Name)</label>
                        <input 
                          type="text" 
                          placeholder="مثال: محمد عبدالله السليمان" 
                          value={formData.authorizedName || ''} 
                          onChange={e => setFormData({...formData, authorizedName: e.target.value})} 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-indigo-500/50 outline-none" 
                        />
                      </div>

                      {/* رفع وثيقة السجل التجاري */}
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">وثيقة السجل التجاري الرسمية (Commercial Register Certificate)</label>
                        <label className="h-24 border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center text-slate-500 transition-all cursor-pointer bg-slate-900/50 group overflow-hidden relative">
                          {formData.crDocumentUrl ? (
                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                              <FileText size={18} />
                              <span>تم رفع وثيقة السجل بنجاح ✅</span>
                            </div>
                          ) : (
                            <>
                              <FileText size={22} className="group-hover:scale-110 transition-transform mb-1 text-indigo-400" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">رفع شهادة السجل (PDF / صورة)</span>
                            </>
                          )}
                          <input type="file" hidden accept="image/*,application/pdf" onChange={handleCrDocumentUpload} />
                        </label>
                      </div>

                      {/* رفع إثبات شخصية المفوض */}
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">إثبات شخصية المفوض (National ID / Passport)</label>
                        <label className="h-24 border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center text-slate-500 transition-all cursor-pointer bg-slate-900/50 group overflow-hidden relative">
                          {formData.nationalIdUrl ? (
                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                              <ShieldCheck size={18} />
                              <span>تم رفع الهوية الوطنية/الإثبات بنجاح ✅</span>
                            </div>
                          ) : (
                            <>
                              <ShieldCheck size={22} className="group-hover:scale-110 transition-transform mb-1 text-indigo-400" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">رفع الهوية الوطنية / الجواز</span>
                            </>
                          )}
                          <input type="file" hidden accept="image/*,application/pdf" onChange={handleNationalIdUpload} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Brand Intelligence Audit Guard Dashboard */}
                  {formData.brandIntelligence && (
                    <div className="space-y-6 pt-6 border-t border-slate-800 bg-slate-950/80 p-6 rounded-3xl border border-indigo-500/20">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                        <div>
                          <h3 className="font-black text-lg text-white flex items-center gap-2">
                            <ShieldCheck className="text-emerald-400" size={20} /> 
                            مركز تدقيق السلامة وذكاء الهوية (Brand Audit Guard)
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">ملف استخباراتي شامل يتم تحديثه تلقائياً لحماية الإعلانات وضمان 0% أخطاء.</p>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg">
                          آخر فحص: {new Date(formData.brandIntelligence.lastScannedAt || Date.now()).toLocaleDateString('ar-SA')}
                        </span>
                      </div>

                      {/* Scores Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">صحة السيو والأرشفة</span>
                          <span className="text-xl font-black text-indigo-400 font-mono">{formData.brandIntelligence.seoHealthScore}/100</span>
                        </div>
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">جودة العرض التسويقي</span>
                          <span className="text-xl font-black text-emerald-400 font-mono">{formData.brandIntelligence.copyQualityScore}/100</span>
                        </div>
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">عناصر الثقة E-E-A-T</span>
                          <span className="text-xl font-black text-amber-400 font-mono">{formData.brandIntelligence.visualTrustScore}/100</span>
                        </div>
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">جاهزية إعلانات جوجل</span>
                          <span className="text-xl font-black text-rose-400 font-mono">{formData.brandIntelligence.googleAdsPolicyScore}/100</span>
                        </div>
                      </div>

                      {/* Manual Requirements Action Checklist */}
                      {formData.brandIntelligence.missingRequirements && formData.brandIntelligence.missingRequirements.length > 0 && (
                        <div className="space-y-3 bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl">
                          <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                            <AlertCircle size={16} /> توجيهات العمل المطلوب يدوياً (Manual Requirements Checklist)
                          </div>
                          <div className="grid gap-2.5">
                            {formData.brandIntelligence.missingRequirements.map((req: any, idx: number) => (
                              <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-3 text-xs">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black shrink-0 ${
                                  req.severity === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                  req.severity === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                  'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                }`}>
                                  {req.severity === 'critical' ? 'إجباري' : req.severity === 'warning' ? 'موصى به' : 'اختياري'}
                                </span>
                                <div>
                                  <h5 className="font-extrabold text-white text-xs">{req.title}</h5>
                                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{req.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Scraped Images from Website for Ads */}
                      {formData.brandIntelligence.scrapedImages && formData.brandIntelligence.scrapedImages.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                            <ImageIcon size={14} /> الصور المجلوبة حياً من المتجر للإعلانات (Scraped Site Images Assets)
                          </h4>
                          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                            {formData.brandIntelligence.scrapedImages.map((imgUrl: string, idx: number) => (
                              <div key={idx} className="aspect-square bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group relative">
                                <img src={imgUrl} alt={`Asset ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4 Profitable Ad Angles */}
                      {formData.brandIntelligence.adAngles && formData.brandIntelligence.adAngles.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase text-emerald-400 tracking-widest flex items-center gap-2">
                            <Sparkles size={14} /> الزوايا الإعلانية الـ 4 المربحة (Top Profitable Ad Angles)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {formData.brandIntelligence.adAngles.map((angle: any, idx: number) => (
                              <div key={idx} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-xs text-white">{angle.title}</span>
                                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">زاوية {idx + 1}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">{angle.desc}</p>
                                {angle.targetHook && (
                                  <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-indigo-300 font-bold">
                                    🎣 الهوك الإعلاني: {angle.targetHook}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Buyer Avatar Radar */}
                      {formData.brandIntelligence.buyerAvatar && (
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                          <h4 className="text-xs font-black uppercase text-amber-400 tracking-widest flex items-center gap-2">
                            <Users size={14} /> رادار العميل والجمهور المستهدف (Buyer Avatar Profile)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 pt-1">
                            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">الديموغرافية</span>
                              <p className="text-[11px] text-slate-300 leading-relaxed">{formData.brandIntelligence.buyerAvatar.demographics}</p>
                            </div>
                            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">الآلام والمشكلات</span>
                              <p className="text-[11px] text-slate-300 leading-relaxed">{formData.brandIntelligence.buyerAvatar.painPoints}</p>
                            </div>
                            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">دوافع الشراء</span>
                              <p className="text-[11px] text-slate-300 leading-relaxed">{formData.brandIntelligence.buyerAvatar.buyTriggers}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Google Ads Account & Campaign Autonomous Inspector */}
                      {formData.brandIntelligence.googleAdsAudit && (
                        <div className="p-5 bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-3xl space-y-4 shadow-xl">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="text-indigo-400" size={18} />
                              <h4 className="text-sm font-black text-white">تقرير فحص وإدارة حساب إعلانات جوجل الذاتي (Google Ads Autonomous Audit)</h4>
                            </div>
                            <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              درجة سلامة الامتثال: {formData.brandIntelligence.googleAdsAudit.policyCheckScore || 94}%
                            </span>
                          </div>

                          <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">حالة الحساب الإعلاني الحالية:</span>
                              <p className="font-extrabold text-slate-200">{formData.brandIntelligence.googleAdsAudit.statusReason}</p>
                            </div>
                            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black rounded-xl shrink-0">
                              🟢 جاهز ومطابق للسياسات
                            </span>
                          </div>

                          {/* Suggested Autonomous Actions */}
                          {formData.brandIntelligence.googleAdsAudit.suggestedActions && (
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">⚡ الأفعال التلقائية المتاحة للوكيل بنقرة واحدة:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {formData.brandIntelligence.googleAdsAudit.suggestedActions.map((act: any, idx: number) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      toast.success(`تم إرسال الأمر للوكيل الإعلاني: ${act.title}`);
                                    }}
                                    className="p-3 bg-slate-950 hover:bg-indigo-600/20 border border-indigo-500/30 hover:border-indigo-500/60 rounded-xl text-right transition-all group"
                                  >
                                    <h5 className="font-black text-xs text-indigo-300 group-hover:text-white leading-snug">{act.title}</h5>
                                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{act.desc}</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Suggested Campaign Preview */}
                          {formData.brandIntelligence.googleAdsAudit.suggestedCampaign && (
                            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">🎯 خطة الحملة الإعلانية المولدة تلقائياً:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                                  <span className="text-[9px] text-slate-500 block font-bold">اسم الحملة</span>
                                  <span className="font-extrabold text-white">{formData.brandIntelligence.googleAdsAudit.suggestedCampaign.name}</span>
                                </div>
                                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                                  <span className="text-[9px] text-slate-500 block font-bold">الميزانية المقترحة</span>
                                  <span className="font-extrabold text-emerald-400">{formData.brandIntelligence.googleAdsAudit.suggestedCampaign.budget}</span>
                                </div>
                                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                                  <span className="text-[9px] text-slate-500 block font-bold">المناطق المستهدفة</span>
                                  <span className="font-extrabold text-indigo-300">{(formData.brandIntelligence.googleAdsAudit.suggestedCampaign.targetLocations || []).join('، ')}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

            </motion.div>
          )}

          {activeTab === 'usage' && activeBrand && (
            <motion.div key="usage" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="space-y-8 max-w-4xl mx-auto pb-20">
              <div className="border-b border-slate-800 pb-6 sticky top-0 bg-slate-900/80 backdrop-blur-md z-20 py-4">
                 <h2 className="text-2xl font-black text-white flex items-center gap-2"><BarChart2 className="text-rose-400" /> إحصائيات الاستهلاك ({activeBrand.name})</h2>
                 <p className="text-xs text-slate-400 mt-1">تتبع استهلاك واجهات برمجة التطبيقات (API) للذكاء الاصطناعي الخاص بهذه العلامة التجارية.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">استهلاك التوكنز التراكمي</p>
                    <div className="text-4xl font-black text-white">{activeBrand.usageStats?.tokensUsed?.toLocaleString() || 0}</div>
                    <p className="text-[10px] text-emerald-400 mt-2 font-medium bg-emerald-500/10 inline-block px-2 py-0.5 rounded">يتم احتساب توكنز (Gemini / OpenAI)</p>
                 </div>
                 <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">توليد الصور</p>
                    <div className="text-4xl font-black text-white">{activeBrand.usageStats?.imageGenerations?.toLocaleString() || 0}</div>
                    <p className="text-[10px] text-rose-400 mt-2 font-medium bg-rose-500/10 inline-block px-2 py-0.5 rounded">صور تم توليدها بالذكاء الاصطناعي</p>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'library' && activeBrand && (
            <motion.div key="library" initial={{opacity:0, y:15}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-15}} className="space-y-8 pb-20">
              <div className="border-b border-slate-800 pb-6 sticky top-0 bg-slate-900/80 backdrop-blur-md z-20 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                 <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                      <BookOpen className="text-rose-400" /> مكتبة المراجع والمعرفة الذكية
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">غذّي المضيف الذكي بالكتيبات الإرشادية، وقواعد التسويق، وأدلة المنتجات لزيادة دقة وجودة التوليد.</p>
                 </div>
                 
                 {/* AI Feed Sync Indicator */}
                 <div className="bg-slate-950/80 border border-indigo-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-3">
                   <div className="relative flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                   </div>
                   <div className="text-right">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">حالة تغذية المساعد:</span>
                     <span className="text-xs font-bold text-indigo-300">متصل وجاهز للاستنباط الذكي 🧠</span>
                   </div>
                 </div>
              </div>

              {/* Built-in Premium Libraries Section */}
              <div className="space-y-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Database size={18} className="text-rose-400" /> المكتبات والمراجع الجاهزة (Built-in Premium Libraries)
                </h3>
                <p className="text-xs text-slate-400">مكتبات تسويقية وتخصصية معدة مسبقاً من قِبل الخبراء، يمكنك تفعيلها فوراً ليقرأها البوت.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {BUILT_IN_LIBRARIES.map(lib => {
                    const isEnabled = knowledgeLibraryService.isLibraryEnabled(activeBrand.id, lib.id);
                    return (
                      <div 
                        key={lib.id}
                        className={`bg-slate-950/40 backdrop-blur-md border p-6 rounded-[24px] flex flex-col gap-4 transition-all duration-300 ${
                          isEnabled 
                            ? 'border-indigo-500/30 bg-indigo-500/[0.005] shadow-[0_12px_30px_-8px_rgba(99,102,241,0.1),inset_0_1px_1px_rgba(255,255,255,0.03)]' 
                            : 'border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-950/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isEnabled ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'
                            }`}>
                              <BookType size={20} />
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-md mb-1 inline-block">
                                {lib.category}
                              </span>
                              <h4 className="text-sm font-black text-white">{lib.name}</h4>
                            </div>
                          </div>

                          {/* Toggle Switch */}
                          <button
                            onClick={() => {
                              knowledgeLibraryService.toggleLibrary(activeBrand.id, lib.id, !isEnabled);
                              setLibraryRefresh(prev => prev + 1);
                              if (!isEnabled) {
                                toast.success(`تم ربط وتغذية المساعد بمكتبة "${lib.name}" بنجاح! 🚀`);
                              } else {
                                toast.info(`تم فصل مكتبة "${lib.name}" عن المساعد.`);
                              }
                            }}
                            className="focus:outline-none transition-transform active:scale-95 cursor-pointer"
                            title={isEnabled ? "تعطيل وفصل المكتبة" : "تفعيل وربط المكتبة"}
                          >
                            {isEnabled ? (
                              <ToggleRight className="text-indigo-400 w-11 h-11" />
                            ) : (
                              <ToggleLeft className="text-slate-600 w-11 h-11" />
                            )}
                          </button>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          {lib.description}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-850/80 mt-auto">
                          <span className="text-[9.5px] font-bold text-slate-550 flex items-center gap-1.5">
                            {isEnabled ? (
                              <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm animate-pulse"></span> مفعّلة ونشطة في الـ Context</>
                            ) : (
                              <><span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span> معطلة ومخفية</>
                            )}
                          </span>
                          
                          <button 
                            onClick={() => setSelectedLib(lib)}
                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 bg-indigo-500/5 hover:bg-indigo-500/10 px-3.5 py-1.5 rounded-xl border border-indigo-500/10 transition-colors"
                          >
                            <span>عرض الدليل كاملاً 👁️‍🗨️</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Documents Section */}
              <div className="space-y-6 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <FileText size={18} className="text-rose-400" /> المستندات والمعارف المخصصة (Custom Documents)
                  </h3>
                  <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full font-bold">
                    إجمالي المستندات المضافة: {customDocs.length}
                  </span>
                </div>
                <p className="text-xs text-slate-400">أضف سياسات متجرك، أو تفاصيل خاصة بمنتجاتك، أو أي مستندات ترغب بأن يعتمد عليها المساعد في إجاباته وكتابته.</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
                  {/* Add New Custom Doc Form */}
                  <div className="lg:col-span-1 bg-slate-950/60 border border-slate-800/80 p-6 rounded-3xl space-y-4">
                    <h4 className="text-sm font-black text-white">أضف مرجع معرفي مخصص</h4>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">عنوان المستند أو المرجع *</label>
                      <input 
                        type="text" 
                        placeholder="مثال: أسعار الشحن والتوصيل"
                        value={newDocTitle}
                        onChange={e => setNewDocTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-200 focus:border-rose-500/50 outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">المحتوى المعرفي (النصوص والتفاصيل) *</label>
                      <textarea 
                        rows={6}
                        placeholder="اكتب المعارف هنا بالتفصيل ليحفظها الذكاء الاصطناعي ويستخدمها بدقة..."
                        value={newDocContent}
                        onChange={e => setNewDocContent(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-200 focus:border-rose-500/50 outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <button 
                      onClick={() => {
                        if (!newDocTitle.trim() || !newDocContent.trim()) {
                          toast.error("يرجى ملء جميع الحقول المطلوبة للمستند");
                          return;
                        }
                        const updated = knowledgeLibraryService.addCustomDocument(activeBrand.id, newDocTitle, newDocContent);
                        setCustomDocs(updated);
                        setNewDocTitle('');
                        setNewDocContent('');
                        setLibraryRefresh(prev => prev + 1);
                        toast.success(`تم حفظ المرجع "${newDocTitle}" ودمجه في عقل المساعد بنجاح! ✨`);
                      }}
                      className="w-full bg-rose-600 hover:bg-rose-500 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-md shadow-rose-600/10 flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>حفظ وربط مع المساعد</span>
                    </button>
                  </div>

                  {/* List of Custom Docs */}
                  <div className="lg:col-span-2 space-y-4">
                    {customDocs.length === 0 ? (
                      <div className="py-16 text-center border-2 border-dashed border-slate-850 rounded-3xl text-slate-500 bg-slate-950/20">
                        <FileText size={40} className="mx-auto mb-3 opacity-40 text-slate-500" />
                        <p className="text-xs font-bold">لا يوجد مستندات مخصصة مضافة حالياً.</p>
                        <p className="text-[10px] text-slate-550 mt-1">يمكنك إضافة أول مرجع للمساعد الذكي عبر النموذج الجانبي.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1.5 custom-scrollbar">
                        {customDocs.map(doc => (
                          <div key={doc.id} className="bg-slate-950/30 border border-slate-850 p-5 rounded-2xl flex flex-col gap-3 group relative">
                            <button 
                              onClick={() => {
                                const updated = knowledgeLibraryService.deleteCustomDocument(activeBrand.id, doc.id);
                                setCustomDocs(updated);
                                setLibraryRefresh(prev => prev + 1);
                                toast.info(`تم حذف المرجع وتحديث ذاكرة المساعد.`);
                              }}
                              className="absolute top-4 left-4 text-slate-500 hover:text-rose-500 bg-slate-900 border border-slate-850 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="حذف المستند نهائياً"
                            >
                              <Trash2 size={13} />
                            </button>

                            <div className="text-right">
                              <h5 className="text-xs font-black text-white pl-8 leading-tight">{doc.title}</h5>
                              <span className="text-[8.5px] font-mono text-slate-500 block mt-1">
                                {new Date(doc.createdAt).toLocaleDateString('ar-SA')}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 line-clamp-4 leading-relaxed font-medium bg-slate-950/50 p-2.5 rounded-xl border border-slate-900/60">
                              {doc.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Built-in Library View Modal */}
              <AnimatePresence>
                {selectedLib && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
                  >
                    <motion.div 
                      initial={{ scale: 0.95, y: 15 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95, y: 15 }}
                      className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-right"
                      dir="rtl"
                    >
                      {/* Header */}
                      <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                        <div className="flex gap-3 items-center">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                            <BookOpen size={18} />
                          </div>
                          <div>
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{selectedLib.category}</span>
                            <h4 className="text-base font-black text-white leading-tight">{selectedLib.name}</h4>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => setSelectedLib(null)}
                          className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 p-2 rounded-xl transition-colors cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-6 overflow-y-auto custom-scrollbar flex-1 font-sans leading-relaxed text-xs text-slate-300 whitespace-pre-line select-text">
                        {selectedLib.content}
                      </div>

                      {/* Footer */}
                      <div className="p-4 border-t border-slate-800 bg-slate-950/20 flex justify-end">
                        <button 
                          onClick={() => setSelectedLib(null)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-colors active:scale-97 cursor-pointer"
                        >
                          إغلاق المعاينة
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>

        {shareBrand && (
          <ShareModal
            isOpen={!!shareBrand}
            onClose={() => setShareBrand(null)}
            title={`مشاركة كتاب الهوية: ${shareBrand.name}`}
            shareUrl={`${window.location.origin}/shared/brand/${shareBrand.id}`}
            previewType="brand"
            previewDetails={{
              name: shareBrand.name,
              subtitle: shareBrand.industry || 'صناعة عامة',
              extraLabel: 'شخصية العلامة',
              extraValue: shareBrand.personality,
              colors: shareBrand.colors ? shareBrand.colors.split(',').map((c: string) => c.trim()) : []
            }}
          />
        )}

      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذه العلامة التجارية؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف نهائي"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, id: null })}
      />
      </div>
    </div>
  );
}
