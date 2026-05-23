import axios from "axios";
import { AICore } from "../core/AICore";

export interface WebsiteAuditResult {
  url: string;
  title: string;
  description: string;
  seoScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  suggestedKeywords: string[];
  isFallback?: boolean;
  fallbackReason?: string;
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
    if (strategyMode === "competitors_search") {
      strategyFocusInstructions = `
        STRATEGY FOCUS: [تحليل المنافسين الفوري بالاستعانة ببحث الويب - SPY SEO]
        - Utilize simulated Google Search crawling and live web indexing database for the specific e-commerce niche and territory of this brand.
        - Identify at least 3 direct or organic search competitors ranking in Saudi/Gulf search engine results for similar queries.
        - Analyze competitors' estimated authority score, backlink presence, and keywords they win.
        - Formulate realistic comparisons based on real target market intent.
      `;
    } else if (strategyMode === "keywords_density") {
      strategyFocusInstructions = `
        STRATEGY FOCUS: [تحليل نية البحث ومعدل تحول الزوار - Commercial Intent & Keywords]
        - Focus heavily on semantic content, analyzing search intent (transactional vs. informational).
        - Point out "low-hanging fruit" keywords with high buyer-intent.
        - Evaluate keyword distribution on the site and how well they reflect actual user search queries on Google.
      `;
    } else if (strategyMode === "trust_ux") {
      strategyFocusInstructions = `
        STRATEGY FOCUS: [تحليل الموثوقية وتجربة مستخدم المتجر - E-E-A-T & UX Trust]
        - Review structural layouts, headings structure, image density without alt metrics, and trust factors.
        - Critique checkouts flow, safety signs, copywriting, and clarity of CTAs.
        - Provide actionable visual design changes to decrease cart abandonment and build search trust.
      `;
    } else {
      strategyFocusInstructions = `
        STRATEGY FOCUS: [فحص بنيوي وسيو شامل بالكامل - Standard Technical & Meta SEO]
        - Thorough analysis of meta descriptions, titles, technical performance index, site size, and script count warnings.
        - Detailed inspection of schema markups and microdata structures.
      `;
    }

    const prompt = `
      You are a World-Class Growth Hacker, Senior SEO Architect, and Spy-SEO Expert. 
      Analyze this ${rawData.isFallback ? 'estimated/fallback' : 'REAL'} website data and provide a hyper-intelligent, predictive SEO competitive blueprint in Arabic.
      
      SITE INTELLIGENCE:
      URL: ${url}
      Title: ${rawData.title}
      Description: ${rawData.description}
      Social Context: ${socialContext}
      Meta Data: ${metaContext}
      Technical Matrix: ${technicalContext}
      Semantic Content: ${rawData.content.substring(0, 12000)}
      
      ${strategyFocusInstructions}

      DIAGNOSTIC MANDATE:
      1. Predictive Reach: How likely is this site to rank in the next 3 months based on current authority signals and market search benchmarks?
      2. Semantic Gap Analysis: What critical sub-topics, commercial keywords, or entities are missing that top-tier competitors dominate in Google Search?
      3. Technical Debt & Structure: Analyze the hierarchy of H-tags, images without alt text, and presence of Schema Markup.
      4. Content Velocity & Tone: Does the writing style match modern high-conversion standards for this specific niche?
      5. Mobile Optimization: Insights based on viewport and meta tags.
      
      REPORT REQUIREMENTS (Arabic Only):
      - SEO Score: Precise evaluation from 0-100.
      - Strategic Summary: A deep executive perspective on current positioning.
      - Strengths: What's actually helping the site.
      - Weaknesses: Critical red flags and missing optimizations.
      - Technical Insights: Analysis of pageSize, scriptCount, and internal link logic.
      - Tactical Steps: Concrete, copy-pasteable actions to perform in the next 24 hours.
      - Semantic Keywords: List 5 "Hidden Gem" intent-based keywords targeting high conversion.
      
      Format (STRICT JSON):
      {
        "seoScore": 0-100,
        "technicalScore": 0-100,
        "contentScore": 0-100,
        "summary": "Full strategic analysis",
        "strengths": ["...", "...", "..."],
        "weaknesses": ["...", "...", "..."],
        "recommendations": ["...", "...", "...", "...", "..."],
        "suggestedKeywords": ["...", "...", "...", "...", "..."],
        "prediction": "Ranking forecast",
        "technicalInsights": "Deep dive into technical metrics"
      }
    `;

    const aiResult = await AICore.generateContent({
      workspaceId: brandId,
      goal: "Website SEO Analysis",
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
      Content: ${rawData.content.substring(0, 3000)}
      
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
