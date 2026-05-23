import { Platform } from "../core/prompts/PromptEngine";

export interface UnifiedMetric {
  reach: number;
  engagement: number;
  engagementRate: number;
  impressions: number;
  clicks: number;
  shares: number;
  comments: number;
  saves: number;
  conversionValue?: number;
}

export interface PlatformStats extends UnifiedMetric {
  platform: Platform;
  topPostIds: string[];
  growthRate: number;
}

export interface AudienceProfile {
  ageRanges: Record<string, number>;
  topLocations: string[];
  interests: string[];
  activePeakHours: number[]; // 0-23
  genderSplit: { male: number; female: number; other: number };
}

export interface IntelligenceInsight {
  id: string;
  type: "PERFORMANCE" | "TREND" | "AUDIENCE" | "SYSTEM";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  recommendation: string;
  data?: any;
  timestamp: number;
}

export interface ContentScore {
  overall: number; // 0-100
  viralPotential: number;
  readability: number;
  brandAlignment: number;
  ctaStrength: number;
  suggestions: string[];
}

export interface WorkspaceIntelligence {
  workspaceId: string;
  totalStats: UnifiedMetric;
  platformBreakdown: Record<Platform, PlatformStats>;
  audience: AudienceProfile;
  recentInsights: IntelligenceInsight[];
  lastUpdated: number;
}
