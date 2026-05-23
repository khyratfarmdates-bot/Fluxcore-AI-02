import { AICore } from "../core/AICore";
import { generateId } from "../lib/ids";

export interface TrendTopic {
  id: string;
  name: string;
  momentum: number; // 0-100
  relevance: number; // 0-1
  summary: string;
  hashtags: string[];
}

export class TrendDetectionEngine {
  static async discoverTrends(brandInterests: string[]): Promise<TrendTopic[]> {
    const prompt = `
      Identify 3 currently rising trends or topics relevant to: ${brandInterests.join(", ")}
      Return JSON array of { name, momentum, relevance, summary, hashtags }.
      Language: Arabic.
    `;

    try {
      const result = await AICore.generateContent({
        workspaceId: "system",
        goal: "Trend Discovery",
        templateId: "custom",
        params: { rawPrompt: prompt }
      });

      const parsed = JSON.parse(result.content.match(/\[[\s\S]*\]/)?.[0] || "[]");
      return parsed.map((t: any) => ({
        ...t,
        id: generateId()
      }));
    } catch (e) {
      return [];
    }
  }
}
