import { 
  WorkspaceIntelligence, 
  UnifiedMetric, 
  IntelligenceInsight, 
  ContentScore,
  PlatformStats
} from "./types";
import { AICore } from "../core/AICore";
import { db } from "../lib/firebase";
import { generateId } from "../lib/ids";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Platform } from "../core/prompts/PromptEngine";
import { safeStringify } from "../lib/safe-stringify";

export class IntelligenceEngine {
  private static instance: IntelligenceEngine;

  private constructor() {}

  public static getInstance(): IntelligenceEngine {
    if (!IntelligenceEngine.instance) {
      IntelligenceEngine.instance = new IntelligenceEngine();
    }
    return IntelligenceEngine.instance;
  }

  /**
   * Aggregates stats from multiple sources into a unified workspace profile
   */
  async getWorkspaceIntelligence(workspaceId: string): Promise<WorkspaceIntelligence> {
    const docRef = doc(db, "intelligence", workspaceId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return snap.data() as WorkspaceIntelligence;
    }

    // Default empty profile
    return this.generateMockIntelligence(workspaceId);
  }

  /**
   * AI-powered content scoring before publishing
   */
  async scoreContent(content: string, platform: Platform, goal: string): Promise<ContentScore> {
    const prompt = `
      Analyze this content for ${platform} with goal "${goal}".
      Return a JSON assessment:
      {
        "overall": number (0-100),
        "viralPotential": number (0-100),
        "readability": number (0-100),
        "brandAlignment": number (0-100),
        "ctaStrength": number (0-100),
        "suggestions": ["string"]
      }
      Content: "${content}"
    `;

    try {
      const result = await AICore.generateContent({
        workspaceId: "system",
        goal: "Content Assessment",
        templateId: "custom",
        params: { rawPrompt: prompt }
      });

      return JSON.parse(result.content.match(/\{[\s\S]*\}/)?.[0] || "{}");
    } catch (e) {
      console.error("Scoring failed", e);
      return { overall: 0, viralPotential: 0, readability: 0, brandAlignment: 0, ctaStrength: 0, suggestions: [] };
    }
  }

  /**
   * Generates AI recommendations based on performance history
   */
  async getRecommendations(workspaceId: string): Promise<IntelligenceInsight[]> {
    const intel = await this.getWorkspaceIntelligence(workspaceId);
    
    // In production, we'd feed real metrics to Gemini
    const prompt = `
      Based on these metrics: ${safeStringify(intel.totalStats)}
      And platform breakdown: ${safeStringify(intel.platformBreakdown)}
      
      Generate 3 strategic recommendations in Arabic for the brand executive.
      Each recommendation should have: title, description, and specific actionable step.
      Format: JSON array of { title, description, recommendation, severity: "low"|"medium"|"high" }
    `;

    try {
      const result = await AICore.generateContent({
        workspaceId: workspaceId,
        goal: "Strategic Recommendations",
        templateId: "custom",
        params: { rawPrompt: prompt }
      });
      
      const parsed = JSON.parse(result.content.match(/\[[\s\S]*\]/)?.[0] || "[]");
      return parsed.map((p: any) => ({
        ...p,
        id: generateId(),
        type: "PERFORMANCE",
        timestamp: Date.now()
      }));
    } catch (e) {
      return [];
    }
  }

  private generateMockIntelligence(workspaceId: string): WorkspaceIntelligence {
    return {
      workspaceId,
      totalStats: {
        reach: 45000,
        engagement: 3200,
        engagementRate: 0.071,
        impressions: 120000,
        clicks: 890,
        shares: 450,
        comments: 120,
        saves: 85
      },
      platformBreakdown: {
        "TikTok": { platform: "TikTok", reach: 25000, engagement: 2100, engagementRate: 0.084, impressions: 60000, clicks: 300, shares: 200, comments: 80, saves: 40, topPostIds: [], growthRate: 0.12 },
        "Instagram": { platform: "Instagram", reach: 12000, engagement: 800, engagementRate: 0.066, impressions: 40000, clicks: 450, shares: 150, comments: 30, saves: 35, topPostIds: [], growthRate: 0.05 },
        "X": { platform: "X", reach: 8000, engagement: 300, engagementRate: 0.037, impressions: 20000, clicks: 140, shares: 100, comments: 10, saves: 10, topPostIds: [], growthRate: -0.02 },
        "LinkedIn": { platform: "LinkedIn", reach: 0, engagement: 0, engagementRate: 0, impressions: 0, clicks: 0, shares: 0, comments: 0, saves: 0, topPostIds: [], growthRate: 0 },
        "YouTube": { platform: "YouTube", reach: 0, engagement: 0, engagementRate: 0, impressions: 0, clicks: 0, shares: 0, comments: 0, saves: 0, topPostIds: [], growthRate: 0 },
        "Snapchat": { platform: "Snapchat", reach: 0, engagement: 0, engagementRate: 0, impressions: 0, clicks: 0, shares: 0, comments: 0, saves: 0, topPostIds: [], growthRate: 0 },
        "WhatsApp": { platform: "WhatsApp", reach: 0, engagement: 0, engagementRate: 0, impressions: 0, clicks: 0, shares: 0, comments: 0, saves: 0, topPostIds: [], growthRate: 0 },
        "Telegram": { platform: "Telegram", reach: 0, engagement: 0, engagementRate: 0, impressions: 0, clicks: 0, shares: 0, comments: 0, saves: 0, topPostIds: [], growthRate: 0 }
      },
      audience: {
        ageRanges: { "18-24": 45, "25-34": 30, "35-44": 15, "45+": 10 },
        topLocations: ["الرياض، السعودية", "دبي، الإمارات", "القاهرة، مصر"],
        interests: ["ريادة الأعمال", "التسويق الرقمي", "الذكاء الاصطناعي"],
        activePeakHours: [10, 11, 14, 20, 21, 22],
        genderSplit: { male: 65, female: 30, other: 5 }
      },
      recentInsights: [],
      lastUpdated: Date.now()
    };
  }
}

export const intelEngine = IntelligenceEngine.getInstance();
