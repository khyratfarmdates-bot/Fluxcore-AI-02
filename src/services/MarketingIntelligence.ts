import axios from "axios";
import { AICore } from "../core/AICore";

export interface CompetitorBenchmark {
  name: string;
  domain: string;
  authorityScore: number;
  winningKeywords: string;
  gapAdvantage: string;
}

export interface KeywordIntentItem {
  keyword: string;
  intent: 'تجاري (Commercial)' | 'استكشافي (Informational)';
  occurrences: number;
  density: string;
  conversionPotential: 'مرتفع جداً' | 'متوسط' | 'منخفض';
}

export interface TrustMetrics {
  sslVerified: boolean;
  contactPointFound: boolean;
  taxOrCRFound: boolean;
  returnPolicyFound: boolean;
  trustScore: number;
  croFixes: string[];
}

export interface WebsiteAuditResult {
  url: string;
  title: string;
  description: string;
  seoScore: number;
  technicalScore: number;
  contentScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  suggestedKeywords: string[];
  prediction: string;
  technicalInsights: string;
  strategyMode: string;
  competitorsTable?: CompetitorBenchmark[];
  keywordsIntentTable?: KeywordIntentItem[];
  trustMetrics?: TrustMetrics;
  isFallback?: boolean;
  fallbackReason?: string;
  technicalDetails?: {
    h1s: string[];
    h2sCount: number;
    imagesCount: number;
    imagesWithoutAlt: number;
    linksCount: number;
    internalLinks: number;
    scriptCount: number;
    styleCount: number;
    pageSizeKB: number;
    hasSchema: boolean;
    emails: string[];
    phones: string[];
  };
}

export class MarketingIntelligence {
  private static async scrape(url: string) {
    try {
      const response = await axios.post("/api/scrape", { url });
      return response.data;
    } catch (e: any) {
      console.error("Scrape service error:", e);
      const errMsg = e?.response?.data?.error || e?.message || "تعذر الوصول للموقع. يرجى التأكد من الرابط.";
      throw new Error(errMsg);
    }
  }

  static async analyzeWebsite(url: string, brandId: string, strategyMode: string = "full_site"): Promise<WebsiteAuditResult> {
    const rawData = await this.scrape(url);
    
    const technicalContext = JSON.stringify(rawData.technical, null, 2);
    const socialContext = JSON.stringify(rawData.social, null, 2);
    const metaContext = JSON.stringify(rawData.meta, null, 2);
    
    let strategyFocusInstructions = "";
    let jsonSchemaExtra = "";

    if (strategyMode === "competitors_search") {
      strategyFocusInstructions = `
        MANDATORY STRATEGY FOCUS: [تحليل المنافسين الفوري وبحث الويب الجاسوس - SPY SEO]
        - Based on the site's actual industry and content (${rawData.title}), analyze 3 real direct competitors operating in the same market (Saudi Arabia / Gulf).
        - For each competitor, specify their domain, authority score (0-100), top winning keyword, and strategic gap/advantage you can exploit.
      `;
      jsonSchemaExtra = `
        "competitorsTable": [
          { "name": "اسم المنافس الأول", "domain": "competitor1.com", "authorityScore": 85, "winningKeywords": "كلمة مفتاحية يفوز بها", "gapAdvantage": "ميزة أو ثغرة تقتنصها منه" },
          { "name": "اسم المنافس الثاني", "domain": "competitor2.com", "authorityScore": 78, "winningKeywords": "كلمة مفتاحية يفوز بها", "gapAdvantage": "ميزة أو ثغرة تقتنصها منه" },
          { "name": "اسم المنافس الثالث", "domain": "competitor3.com", "authorityScore": 72, "winningKeywords": "كلمة مفتاحية يفوز بها", "gapAdvantage": "ميزة أو ثغرة تقتنصها منه" }
        ],
      `;
    } else if (strategyMode === "keywords_density") {
      strategyFocusInstructions = `
        MANDATORY STRATEGY FOCUS: [تحليل نية البحث ومعدل الكثافة - Commercial Intent & Keywords Density]
        - Extract top keywords from the real page text, evaluate intent (Commercial Purchase vs Informational Search).
        - Provide exact calculated occurrences and density estimation based on actual text length (${rawData.content ? rawData.content.length : 0} chars).
      `;
      jsonSchemaExtra = `
        "keywordsIntentTable": [
          { "keyword": "كلمة تجارية شراءية", "intent": "تجاري (Commercial)", "occurrences": 14, "density": "2.8%", "conversionPotential": "مرتفع جداً" },
          { "keyword": "كلمة استكشافية بحثية", "intent": "استكشافي (Informational)", "occurrences": 8, "density": "1.6%", "conversionPotential": "متوسط" },
          { "keyword": "كلمة منتج محدد", "intent": "تجاري (Commercial)", "occurrences": 6, "density": "1.2%", "conversionPotential": "مرتفع جداً" },
          { "keyword": "كلمة خدمات محلية", "intent": "تجاري (Commercial)", "occurrences": 5, "density": "1.0%", "conversionPotential": "مرتفع جداً" }
        ],
      `;
    } else if (strategyMode === "trust_ux") {
      strategyFocusInstructions = `
        MANDATORY STRATEGY FOCUS: [تحليل الموثوقية وتجربة مستخدم المتجر - E-E-A-T & CRO UX Trust Audit]
        - Audit real trust signals: SSL HTTPS presence (${url.startsWith('https')}), extracted contact points (Phones: ${rawData.technical?.phones?.join(', ') || 'none'}, Emails: ${rawData.technical?.emails?.join(', ') || 'none'}).
        - Evaluate CRO friction factors, safety signs, return policy clarity, and payment trust.
      `;
      jsonSchemaExtra = `
        "trustMetrics": {
          "sslVerified": ${url.startsWith('https')},
          "contactPointFound": ${Boolean(rawData.technical?.phones?.length || rawData.technical?.emails?.length)},
          "taxOrCRFound": true,
          "returnPolicyFound": true,
          "trustScore": 88,
          "croFixes": [
            "توضيح الرقم الضريبي والسجل التجاري في الترويسة السفلية.",
            "إضافة أيقونات الدفع الآمن بجانب زر إكمال الطلب.",
            "تفعيل التقييمات الموثقة للعملاء السابقين."
          ]
        },
      `;
    } else {
      strategyFocusInstructions = `
        MANDATORY STRATEGY FOCUS: [فحص بنيوي وسيو شامل بالكامل - Standard Technical & Meta SEO]
        - Deep dive into technical indicators: H1 tags (${rawData.technical?.h1s?.length || 0}), images without alt (${rawData.technical?.imagesWithoutAlt || 0} of ${rawData.technical?.imagesCount || 0}), page size (${Math.round((rawData.technical?.pageSize || 0)/1024)} KB), script count (${rawData.technical?.scriptCount || 0}).
      `;
    }

    const prompt = `
      You are an Elite Senior SEO Architect and Web Intelligence Expert. 
      Analyze the REAL empirical scraped data for this website and generate a realistic, non-hallucinated, highly accurate Arabic analysis report matching the user's selected strategy mode (${strategyMode}).
      
      REAL SCRAPED DOM DATA:
      URL: ${url}
      Title: ${rawData.title}
      Description: ${rawData.description}
      Social Meta: ${socialContext}
      Meta Attributes: ${metaContext}
      Technical Matrix: ${technicalContext}
      Raw Body Text Sample: ${rawData.content ? rawData.content.substring(0, 10000) : "N/A"}
      
      ${strategyFocusInstructions}

      STRICT JSON FORMAT (Output MUST be valid JSON only):
      {
        "seoScore": 75,
        "technicalScore": 80,
        "contentScore": 70,
        "summary": "ملخص استراتيجي تحليلي دقيق يستند لواقع البيانات المجلوبة بدقة...",
        ${jsonSchemaExtra}
        "strengths": ["نقطة قوة حقيقية 1", "نقطة قوة حقيقية 2", "نقطة قوة حقيقية 3"],
        "weaknesses": ["ثغرة حقيقية 1", "ثغرة حقيقية 2", "ثغرة حقيقية 3"],
        "recommendations": ["توصية عملية 1", "توصية عملية 2", "توصية عملية 3"],
        "suggestedKeywords": ["كلمة 1", "كلمة 2", "كلمة 3", "كلمة 4", "كلمة 5"],
        "prediction": "توقع الأرشفة والظهور خلال 90 يوماً بناءً على الإشارات الفعلية",
        "technicalInsights": "تحليل للأكواد وحجم الصفحة وسكربتات التتبع بناءً على البيانات الفعلية المجلوبة"
      }
    `;

    const aiResult = await AICore.generateContent({
      workspaceId: brandId,
      goal: `SEO Analysis - ${strategyMode}`,
      templateId: "custom",
      params: { rawPrompt: prompt }
    });

    const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      url,
      title: rawData.title,
      description: rawData.description,
      isFallback: !!rawData.isFallback,
      fallbackReason: rawData.fallbackReason || "",
      strategyMode,
      technicalDetails: {
        h1s: rawData.technical?.h1s || [],
        h2sCount: rawData.technical?.h2s?.length || 0,
        imagesCount: rawData.technical?.imagesCount || 0,
        imagesWithoutAlt: rawData.technical?.imagesWithoutAlt || 0,
        linksCount: rawData.technical?.linksCount || 0,
        internalLinks: rawData.technical?.internalLinks || 0,
        scriptCount: rawData.technical?.scriptCount || 0,
        styleCount: rawData.technical?.styleCount || 0,
        pageSizeKB: Math.round((rawData.technical?.pageSize || 0) / 1024),
        hasSchema: !!rawData.technical?.hasSchema,
        emails: rawData.technical?.emails || [],
        phones: rawData.technical?.phones || []
      },
      ...analysis
    };
  }

  static async optimizeSEO(url: string, brandId: string, focusArea: 'content' | 'technical' | 'keywords') {
    const rawData = await this.scrape(url);
    
    const prompt = `
      You are an Executive SEO optimizer. 
      Focus on ${focusArea} optimization for this website: ${url}
      
      Title: ${rawData.title}
      Description: ${rawData.description}
      Content: ${rawData.content ? rawData.content.substring(0, 3000) : ''}
      
      Task: Provide specific, copy-pasteable optimizations (Titles, Meta Tags, Hero Text improvements) in Arabic.
      Give strategic advice on how to rank higher for this specific store.
    `;

    const aiResult = await AICore.generateContent({
      workspaceId: brandId,
      goal: "SEO Optimization Strategy",
      templateId: "custom",
      params: { rawPrompt: prompt }
    });

    return aiResult.content;
  }
}
