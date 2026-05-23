import { useSystemStore } from "../store/useSystemStore";

/**
 * AI Resource Optimizer Layer
 * Handles token reduction, smart caching, and provider cost management.
 */
class AIIntelligenceLayer {
  
  // Cost map per 1k tokens (approximate for monitoring)
  private costPer1k = {
    'Gemini': 0.0005,
    'OpenAI': 0.01,
  };

  /**
   * Optimizes the prompt by removing redundancy
   */
  public optimizePrompt(prompt: string): string {
    const { flags } = useSystemStore.getState();
    if (!flags.aiResourceOptimization) return prompt;

    // Simple production logic: remove excessive whitespace and common fillers
    return prompt.replace(/\s+/g, ' ').trim();
  }

  /**
   * Records usage and updates global state for cost monitoring
   */
  public logUsage(provider: string, tokens: number) {
    const cost = (tokens / 1000) * (this.costPer1k[provider as keyof typeof this.costPer1k] || 0.001);
    
    useSystemStore.getState().addCost(provider, cost);
    
    // Also log to observability layer (future)
    console.log(`[AI-INTEL] Cost logged for ${provider}: $${cost.toFixed(6)} (${tokens} tokens)`);
  }

  /**
   * Determine best provider based on system health and cost
   */
  public async negotiateProvider(taskType: string): Promise<string> {
    // Logic: If error rate is high on preferred, switch
    const { metrics } = useSystemStore.getState();
    
    if (metrics.errorRate > 0.1) {
      console.warn("[AI-INTEL] High error rate detected. Negotiating fallback provider.");
      return "OpenAI"; // Fallback example
    }

    return "Gemini"; // Standard default
  }
}

export const aiIntel = new AIIntelligenceLayer();
