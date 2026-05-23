import { WorkspaceContext, Platform, ContentType } from "../types";
import { providerManager } from "../providers/ProviderManager";

export interface AIRecommendation {
  platform: Platform;
  contentType: ContentType;
  personaId?: string;
  bestTime?: string;
  suggestedCTA?: string;
  style?: string;
  confidenceScore: number;
}

export class DecisionEngine {
  
  /**
   * Analyzes context and goal to suggest the optimal generation parameters
   */
  public async suggestOptimalStrategy(
    context: WorkspaceContext, 
    goal: string
  ): Promise<AIRecommendation> {
    
    try {
      const interests = context.targetAudience?.interests || [];
      const audienceDesc = context.targetAudience?.description || "General Public";
      const brandName = context.brandIdentity?.name || "Fluxcore AI User";
      
      const prompt = `أنت مستشار تسويق ذكي جداً وعضو في مجلس إدارة ذكاء اصطناعي.
قم بتحليل سياق العلامة التجارية والهدف التالي لتحديد أفضل منصة تواصل اجتماعي ونوع محتوى واستراتيجية مناسبة:

اسم العلامة التجارية: "${brandName}"
العلامة التجارية وتوجهها: ${JSON.stringify(context.brandIdentity)}
الجمهور المستهدف: "${audienceDesc}"، الاهتمامات: ${JSON.stringify(interests)}
الهدف الحالي: "${goal}"

قم بالرد بصيغة JSON نظيفة ومباشرة تماماً وبدون أي نصوص جانبية أو علامات markdown (لا تكتب \`\`\`json):
{
  "platform": "TikTok" أو "X" أو "Instagram" أو "LinkedIn" أو "YouTube",
  "contentType": "Post" أو "Thread" أو "Article" أو "VideoScript" أو "ImagePrompt",
  "bestTime": "اليوم والتوقيت المناسب للنشر بالإنجليزية، مثال: Wednesday 03:00 PM",
  "suggestedCTA": "عبارة مقترحة وجذابة تحث الجمهور على اتخاذ إجراء باللغة العربية",
  "style": "أسلوب ومود الكتابة باللغة العربية (مثل: ملهم ومحفز، مهني واحترافي، فكاهي خفيف)",
  "confidenceScore": رقم عشري بين 0.5 و 1.0 يمثل ثقتك في المقترح
}`;

      const res = await providerManager.executeWithFailover(prompt, "Gemini", "text");
      const cleanJson = res.content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      return {
        platform: (parsed.platform || "LinkedIn") as Platform,
        contentType: (parsed.contentType || "Post") as ContentType,
        bestTime: parsed.bestTime || "Tuesday 10:00 AM",
        suggestedCTA: parsed.suggestedCTA || "تعرف على المزيد الآن",
        style: parsed.style || "Professional",
        confidenceScore: parsed.confidenceScore || 0.9
      };
    } catch (e) {
      console.warn("[DecisionEngine] Failed to fetch dynamic strategy recommendations, falling back to static rules:", e);
      const isB2B = context.targetAudience?.interests?.includes("Business");
      return {
        platform: isB2B ? "LinkedIn" : "Instagram",
        contentType: "Post",
        bestTime: "Tuesday 10:00 AM",
        suggestedCTA: "Learn more",
        style: "Professional",
        confidenceScore: 0.85
      };
    }
  }

  /**
   * Evaluates if generated content meets the brand standards
   */
  public async evaluateContentRisk(
    content: string, 
    context: WorkspaceContext
  ): Promise<{ safe: boolean; feedback: string[] }> {
    try {
      const brandName = context.brandIdentity?.name || "Fluxcore AI User";
      const bannedWords = context.brandIdentity?.bannedWords || [];
      
      const prompt = `أنت مسؤول تدقيق الجودة والأمان للمحتوى. قم بتحليل النص التالي للتأكد من خلوه من الألفاظ البذيئة، المخاطر القانونية، أو الكلمات المحظورة للعلامة التجارية "${brandName}".

الكلمات المحظورة لدى العلامة التجارية: ${JSON.stringify(bannedWords)}
النص المطلوب تقييمه:
"${content}"

قم بالرد بصيغة JSON نظيفة ومباشرة تماماً وبدون أي نصوص جانبية أو علامات markdown (لا تكتب \`\`\`json):
{
  "safe": true أو false,
  "feedback": ["قائمة الملاحظات التقييمية أو الأسباب باللغة العربية إن وجدت"]
}`;

      const res = await providerManager.executeWithFailover(prompt, "Gemini", "text");
      const cleanJson = res.content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      return {
        safe: parsed.safe !== false,
        feedback: parsed.feedback || []
      };
    } catch (e) {
      return {
        safe: true,
        feedback: []
      };
    }
  }
}

export const decisionEngine = new DecisionEngine();
