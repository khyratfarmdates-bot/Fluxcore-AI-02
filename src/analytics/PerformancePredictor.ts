import { AICore } from "../core/AICore";
import { Platform } from "../core/prompts/PromptEngine";

export interface PredictionResult {
  expectedReach: [number, number]; // Range [min, max]
  expectedEngagement: number; // Rate
  viralityScore: number; // 0-1
  confidence: number;
  reasoning: string;
}

export class PerformancePredictor {
  static async predict(
    content: string, 
    platform: Platform, 
    historicalData: any
  ): Promise<PredictionResult> {
    
    const prompt = `
      Predict performance for:
      Platform: ${platform}
      Content: "${content}"
      Recent reach avg: ${historicalData?.reach || 'N/A'}
      
      Return JSON:
      {
        "expectedReach": [number, number],
        "expectedEngagement": number,
        "viralityScore": number,
        "confidence": number,
        "reasoning": "Explain why in Arabic"
      }
    `;

    try {
      const result = await AICore.generateContent({
        workspaceId: "system",
        goal: "Performance Prediction",
        templateId: "custom",
        params: { rawPrompt: prompt }
      });

      return JSON.parse(result.content.match(/\{[\s\S]*\}/)?.[0] || "{}");
    } catch (e) {
      return {
        expectedReach: [0, 0],
        expectedEngagement: 0,
        viralityScore: 0,
        confidence: 0,
        reasoning: "فشل في عملية التوقع"
      };
    }
  }
}
