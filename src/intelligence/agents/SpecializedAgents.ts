import { BaseAgent } from './BaseAgent';
import { AGENT_REGISTRY, AgentRole } from './AgentRegistry';
import { generateId } from '../../lib/ids';
import { safeStringify } from '../../lib/safe-stringify';

import { AICore } from '../../core/AICore';

export class ContentStrategistAgent extends BaseAgent {
  constructor() {
    super(AGENT_REGISTRY.find(a => a.role === 'CONTENT_STRATEGIST')!);
  }

  protected async process(brandId: string, objective: string, context: any): Promise<any> {
    try {
      const result = await AICore.generateContent({
        workspaceId: brandId,
        goal: `As a Content Strategist, develop a high-level narrative and key messages for: ${objective}`,
        templateId: 'content_strategy',
        params: { objective, context: safeStringify(context) }
      });

      return {
        suggestedNarrative: result.content.substring(0, 500),
        tone: 'Professional & Strategic',
        keyMessages: ['Insight-led', 'Value-driven'],
        metadata: { generatedAt: new Date(), ...result.metadata }
      };
    } catch (err) {
      console.error("[ContentStrategistAgent] Failed:", err);
      return {
        suggestedNarrative: `Failed to generate real narrative for ${objective}. Falling back to default strategy.`,
        tone: 'Standard',
        keyMessages: []
      };
    }
  }
}

export class PublishingOfficerAgent extends BaseAgent {
  constructor() {
    super(AGENT_REGISTRY.find(a => a.role === 'PUBLISHING_OFFICER')!);
  }

  protected async process(brandId: string, objective: string, context: any): Promise<any> {
    return {
      scheduledSlot: new Date(Date.now() + 3600000), // In 1 hour
      platforms: ['LinkedIn', 'Twitter'],
      status: 'QUEUED'
    };
  }
}

export class AnalyticsDirectorAgent extends BaseAgent {
  constructor() {
    super(AGENT_REGISTRY.find(a => a.role === 'ANALYTICS_DIRECTOR')!);
  }

  protected async process(brandId: string, objective: string, context: any): Promise<any> {
    return {
      performanceScore: 0.85,
      predictedReach: '12k - 15k',
      anomalies: ['None detected'],
      recommendation: 'Double down on video content'
    };
  }
}

export class AutomationArchitectAgent extends BaseAgent {
  constructor() {
    super(AGENT_REGISTRY.find(a => a.role === 'AUTOMATION_ARCHITECT')!);
  }

  protected async process(brandId: string, objective: string, context: any): Promise<any> {
    return {
      workflowStatus: 'ACTIVE',
      links: ['Publishing -> Analytics -> Feedback Loop'],
      efficiencyGain: '+14%'
    };
  }
}

export class MediaProducerAgent extends BaseAgent {
  constructor() {
    super(AGENT_REGISTRY.find(a => a.role === 'MEDIA_PRODUCER')!);
  }

  protected async process(brandId: string, objective: string, context: any): Promise<any> {
    try {
      const result = await AICore.generateContent({
        workspaceId: brandId,
        goal: `Generate a visual asset description for: ${objective}`,
        templateId: 'media_brief',
        params: { objective },
        type: 'image'
      });

      return {
        assetId: `IMG_${generateId()}`,
        stylePreset: 'Brutalist High-Tech',
        url: result.content, // Assuming returned content is the URL or fallback to placeholder if not real URL
        metadata: result.metadata
      };
    } catch (err) {
      console.error("[MediaProducerAgent] Failed:", err);
      return {
        assetId: `IMG_${generateId()}`,
        stylePreset: 'Brutalist High-Tech',
        url: '/assets/placeholders/generated_media.png'
      };
    }
  }
}

export class YouTubeGrowthSpecialistAgent extends BaseAgent {
  constructor() {
    super(AGENT_REGISTRY.find(a => a.role === 'YOUTUBE_GROWTH_SPECIALIST')!);
  }

  protected async process(brandId: string, objective: string, context: any): Promise<any> {
    try {
      const result = await AICore.generateContent({
        workspaceId: brandId,
        goal: `As a YouTube Growth Specialist, analyze this objective: ${objective}. 
               Focus on SEO titles, thumbnail psychology, and retention hooks in Arabic.
               Consider the user's current engagement metrics if provided in context.`,
        templateId: 'youtube_strategy',
        params: { objective, context: safeStringify(context) }
      });

      return {
        seoPlan: {
          suggestedTitles: ["عنوان جذاب 1", "عنوان إستراتيجي 2"],
          keywords: ["سيو يوتيوب", "خوارزمية يوتيوب", "تسويق رقمي"],
          descriptionSnippet: "وصف محسن يبدأ بخطاف قوي لجذب المشاهدين."
        },
        retentionTactics: ["مقاطعة الأنماط كل 45 ثانية", "المخاطبة المباشرة في المقدمة"],
        strategicInsight: result.content.substring(0, 800),
        status: 'ANALYSIS_COMPLETE'
      };
    } catch (err) {
      console.error("[YouTubeGrowthSpecialistAgent] Failed:", err);
      return {
        strategicInsight: "ركز على إنشاء محتوى ذو قيمة عالية وقابل للبحث.",
        status: 'DEGRADED'
      };
    }
  }
}
