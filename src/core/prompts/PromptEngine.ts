import { WorkspaceContext, PromptTemplate } from "../types";

export type Platform = "TikTok" | "X" | "Instagram" | "LinkedIn" | "YouTube" | "Snapchat" | "WhatsApp" | "Telegram";
export type Goal = "Viral" | "Educational" | "Sales" | "Engagement" | "Brand Loyalty" | "Lead Generation" | "Event Promotion" | "Social Awareness";
export type ContentType = "Social Post" | "Video Script" | "TikTok/Snapchat Story" | "Thread" | "Article" | "VideoScript" | "ImagePrompt" | "Ramadan Campaign" | "National Day Campaign" | "Product Review" | "Podcast Script" | "WhatsApp Broadcast";
export type Persona = "Viral Creator" | "Corporate Writer" | "Story Teller" | "Professional" | "Gulf Influencer" | "Marketing Consultant" | "Storyteller" | "Tech Expert" | "Self-made Entrepreneur" | "Saudi Traditionalist" | "Luxury Ambassador" | "Empathetic Guide" | "Analytical Academic";
export type Audience = "General Audience" | "Tech Savvy" | "Business Owners" | "Youth" | "Mothers & Families" | "Luxury Seekers" | "Gamers" | "Local Saudi Community" | "GCC Professional Class";
export type Tone = "Friendly" | "Serious" | "Funny" | "Luxury" | "Neutral" | "Enthusiastic" | "Professional" | "Humorous" | "Poetic" | "Saudi/Najdi Accent" | "Hijazi Accent" | "Emirati/Gulf White" | "Motivating";

import { safeStringify } from "../../lib/safe-stringify";

export class PromptEngine {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.registerCoreTemplates();
  }

  private registerCoreTemplates() {
    this.templates.set("social_post", {
      id: "social_post",
      category: "text",
      template: "Write a {{platform}} post about {{topic}}. Tone: {{brandVoice}}. Target Audience: {{audience}}. Context: {{performanceContext}}",
      variables: ["platform", "topic", "brandVoice", "audience", "performanceContext"]
    });

    this.templates.set("content_strategy", {
      id: "content_strategy",
      category: "text",
      template: "As a Content Strategist, develop a high-level narrative and key messages for the objective: {{objective}}. Context: {{context}}. Tone: {{brandVoice}}.",
      variables: ["objective", "context", "brandVoice"]
    });

    this.templates.set("media_brief", {
      id: "media_brief",
      category: "image",
      template: "Create a detailed visual prompt for generating an image related to: {{objective}}. Style: Digital Art, High Quality. Tone: {{brandVoice}}.",
      variables: ["objective", "brandVoice"]
    });

    this.templates.set("image_generator", {
      id: "image_generator",
      category: "image",
      template: "You are an elite AI photographic director and concept artist. Translate this brief (which may be in Arabic) to English if necessary: '{{prompt}}'. Then, expand it into a highly detailed, cinematic, and breathtaking visual prompt in English for premium image generators like Midjourney v6, Imagen 4.0, or Flux. Describe the subject with lifelike textures and anatomical accuracy, the rich environment details and depth, the precise lighting theme ({{lighting}} lighting with high contrast and natural shadows), the camera angle and lens specs ({{cameraShot}} shot composition), volumetric rendering, intricate texture details (such as skin pores, reflections, fabric weaves), and style: '{{style}}'. Output ONLY the single-paragraph expanded English visual prompt. Do not write intros, explanations, or quotes.",
      variables: ["prompt", "style", "aspectRatio", "lighting", "cameraShot"]
    });

    this.templates.set("youtube_strategy", {
      id: "youtube_strategy",
      category: "text",
      template: "Create a YouTube strategy for: {{topic}}.",
      variables: ["topic"]
    });

    this.templates.set("automation_post", {
      id: "automation_post",
      category: "text",
      template: "Generate an automated post for {{platform}} based on trigger {{triggerType}}.",
      variables: ["platform", "triggerType"]
    });

    this.templates.set("campaign_planner", {
      id: "campaign_planner",
      category: "text",
      template: "Plan a campaign for {{goal}} targeting {{audience}}.",
      variables: ["goal", "audience"]
    });

    this.templates.set("insight_generator", {
      id: "insight_generator",
      category: "text",
      template: "Generate marketing insights from this data: {{data}}.",
      variables: ["data"]
    });

    this.templates.set("content_scorer", {
      id: "content_scorer",
      category: "text",
      template: "Score this content based on engagement probability: {{content}}.",
      variables: ["content"]
    });

    this.templates.set("custom", {
      id: "custom",
      category: "text",
      template: "{{rawPrompt}}",
      variables: ["rawPrompt"]
    });
  }

  /**
   * Static helper for quick prompt building (used by StudioView)
   */
  public static buildPrompt(params: any): string {
    const { idea, platform, goal, contentType, persona, audience, tone, brandIdentity } = params;
    return `
أنت كاتب محتوى وخبير تسويق رقمي عبقري ومستشار إبداعي ريادي متفوق في منطقة الشرق الأوسط والخليج العربي.
مهمتك هي صياغة محتوى إبداعي استثنائي وموجه خصيصاً للجمهور العربي والخليجي بقمة الذكاء اللغوي والثقافي بناءً على المدخلات المحددة بدقة بالغة:

المعلومات الأساسية والخيارات المحددة:
- الفكرة الأساسية أو المفهوم العام: ${idea}
- المنصة المستهدفة: ${platform}
- الهدف التسويقي المطلوب: ${goal}
- نوع المحتوى والقالب: ${contentType}
- الهوية الإبداعية/شخصية كاتب المحتوى: ${persona}
- الجمهور المستهدف بدقة: ${audience}
- نبرة الصوت اللغوية واللهجة: ${tone}
- هوية العلامة التجارية النشطة: ${brandIdentity?.name || 'عامة'} (صوت البراند: ${brandIdentity?.voice || 'تفاعلي'})

إرشادات الصياغة اللغوية والتسويقية شديدة الذكاء:
1. المنصة (${platform}): 
   - إذا كانت المنصة "Snapchat" أو "TikTok"، اجعل النص تفاعلياً وموجهاً للمستهلك الفوري بأسلوب عفوي وشبابي مع وضع علامات تعجب وتساؤلات وتفاعل مباشر.
   - إذا كانت المنصة "X" (تويتر)، التزم بالاختصار البليغ وجاذبية الجمل الأولى وأضف هاشتاغات رسمية ترند في الخليج.
   - إذا كانت المنصة "WhatsApp" أو "Telegram"، اجعل الرسالة تسويقية مباشرة ومنظمة بنقاط واضحة مع Emojis جذابة للغاية ودعوة فورية للنقر والاشتراك.
   - إذا كانت "LinkedIn"، اجعل النص ذا طابع احترافي، يركز على الريادة، الأرقام، وتطوير الأعمال.

2. الشخصية والهوية الإبداعية (${persona}):
   - "Saudi Traditionalist": شخصية تعتز بالهوية النجدية/الحجازية والثقافة العربية الأصيلة، تستخدم مصطلحات الترحيب والكرم (مثل: يا هلا، حياكم الله، فنجال قهوة، أصالة).
   - "Gulf Influencer": صانع محتوى عصري، عفوي، محبوب، يتكلم بلهجة بيضاء لطيفة ويدمج تعبيرات شبابية شائعة بالخليج.
   - "Luxury Ambassador": سفير الفخامة والذوق الرفيع، صياغة نصوصه توحي بالنخبوية والخصوصية والأناقة المفرطة.
   - "Storyteller" (الحكواتي): يبدأ بسرد قصصي جذاب (مثلاً: "في يوم من الأيام..." أو "تخيل لو...") لشد القارئ حتى النهاية.
   - "Analytical Academic": أسلوب رصين، يعتمد على الحقائق والتحليل الهادئ والمنطقي.

3. نبرة الصوت واللهجة اللغوية (${tone}):
   - "Saudi/Najdi Accent": صياغة الكلمات بلهجة نجدية أصيلة (مثل: وش لونكم، الله يحييكم، تسلم، وش صار، ذي، هالحين).
   - "Hijazi Accent": صياغة الكلمات بلهجة حجازية عذبة ولطيفة (مثل: يا سيدي، إيش الهرجة، يا واد، تسلم دياتك، دحين).
   - "Emirati/Gulf White": لهجة خليجية بيضاء راقية وسلسة مفهومة لجميع شعوب مجلس التعاون الخليجي دون تعقيد.
   - "Luxury": استخدام مفردات فخمة جداً (مثل: تحفة معمارية، تفرد مطلق، تجربة نخبوية، صُمم خصيصاً لمن يقدر الفخامة).
   - "Poetic" (شاعري): استخدام أسلوب ذو جرس موسيقي، بليغ، وله أثر وجداني وعاطفي دافئ.

4. نوع المحتوى المختار (${contentType}):
   - "Ramadan Campaign": حملة روحانية، دافئة، تركز على قيم العطاء، التجمع العائلي، والخير بأسلوب رمضاني مميز.
   - "National Day Campaign": حماسي جداً، مليء بمفردات العز والوطن والفخر بالإنجازات التاريخية والتطور.
   - "Podcast Script": يحتوي على مقدمة ترحيبية بالجمهور مع فواصل ومؤثرات صوتية مكتوبة بين قوسين مثل [موسيقى هادئة] أو [تأثير صوتي حماسي].
   - "WhatsApp Broadcast": نص قصير، مركز، يحتوي على عرض خطاب تسويقي مباشر ورموز تعبيرية ملفتة جداً.

يجب أن تقوم بإرجاع النتيجة ككائن JSON نظيف تماماً ومطابق للترميز أدناه، بدون أي نصوص تمهيدية أو تعليقات خارجية، وبصيغة صالحة للتحليل (JSON valid object).
الترميز المطلوب للـ JSON:
{
  "hook": "الافتتاحية أو الخطاف الجاذب للانتباه بأسلوب مبهر يناسب المنصة المحددة والنبرة المختارة",
  "content": "قوام المحتوى الأساسي والسيناريو أو المنشور بالكامل مصاغ بقمة الروعة والجاذبية والتأثير الثقافي والاجتماعي العربي بما يطابق نوع المحتوى واللهجة المحددة تماماً",
  "cta": "الدعوة لاتخاذ إجراء (Call to Action) ذكية ومقنعة للغاية تدفع العميل للتفاعل الفوري أو الشراء أو الضغط على الرابط",
  "visualConcept": "A highly detailed visual prompt describing the scene, lighting, atmosphere, style and characters for this post. WRITE THIS FIELD ENTIRELY IN ENGLISH to ensure seamless image generation with engines like Fal.ai, Imagen, or Midjourney.",
  "hashtags": ["هاشتاغ1", "هاشتاغ2", "هاشتاغ3", "هاشتاغ4"]
}
`;
  }

  /**
   * Compiles a dynamic prompt based on the unified workspace context and specific request parameters
   */
  public buildPrompt(templateId: string, context: WorkspaceContext, requestParams: Record<string, string>): string {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);

    let compiled = template.template;

    // Inject Context Variables
    const variables = {
      ...requestParams,
      brandVoice: context.brandIdentity.voice || "Neutral",
      audience: safeStringify(context.targetAudience),
      performanceContext: "Utilize formatting that previously yielded high engagement (e.g., bullet points)."
    };

    for (const key of template.variables) {
      const value = variables[key as keyof typeof variables] || "";
      compiled = compiled.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    return compiled;
  }
}

export const promptEngine = new PromptEngine();
