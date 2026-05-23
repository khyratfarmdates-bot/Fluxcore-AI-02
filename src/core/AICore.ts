import { contextMemory } from "./context/ContextMemory";
import { promptEngine } from "./prompts/PromptEngine";
import { providerManager } from "./providers/ProviderManager";
import { decisionEngine } from "./decision/DecisionEngine";
import { taskOrchestrator } from "./orchestrator/TaskOrchestrator";
import { eventBus } from "./events/EventBus";
import { healthMonitor } from "./monitoring/HealthMonitor";
import { aiIntel } from "./Intelligence";
import { ProviderType } from "./types";

/**
 * AI Core Engine (Unified AI Content Operating System)
 * 
 * This represents the central brain. Pages/Modules do not compose prompts
 * or hit LLMs directly. They ask the Core.
 */
class AICoreEngine {
  
  /**
   * The primary high-level method to generate content.
   * Connects context, prompts, failover, and execution.
   */
  public async generateContent({
    workspaceId,
    goal,
    templateId,
    params,
    preferredProvider = "Gemini",
    type = "text"
  }: {
    workspaceId: string;
    goal: string;
    templateId: string;
    params: Record<string, string>;
    preferredProvider?: ProviderType;
    type?: "text" | "image" | "video" | "voice"
  }) {
    
    // 1. Understand Workspace & Context
    const context = await contextMemory.getWorkspaceContext(workspaceId);

    // 2. AI Intelligence Layer (Provider Negotiation & Cost Optimization)
    const negotiatedProvider = await aiIntel.negotiateProvider(goal);
    const targetProvider = preferredProvider === "Gemini" ? negotiatedProvider : preferredProvider;

    // 3. AI Decision Engine (Optional Overrides)
    const strategy = await decisionEngine.suggestOptimalStrategy(context, goal);
    console.log(`[AICore] Selected strategy for goal '${goal}':`, strategy);

    // 4. Prompt Intelligence Build
    let intelligentPrompt = params.rawPrompt;
    if (!intelligentPrompt) {
      intelligentPrompt = promptEngine.buildPrompt(templateId, context, {
        ...params,
        platform: strategy.platform, // use suggested if not strict
      });
    }

    // 5. Resource Optimization
    const finalPrompt = aiIntel.optimizePrompt(intelligentPrompt);

    // 6. Execution via Provider Manager
    const result = await providerManager.executeWithFailover(finalPrompt, targetProvider as ProviderType, type);

    // 7. Track Usage, Cost & Dispatch Event
    aiIntel.logUsage(targetProvider, result.metadata.tokens);
    healthMonitor.trackUsage(workspaceId, result.metadata.tokens, `generate_${type}`);
    
    eventBus.publish({
      type: 'CONTENT_GENERATED',
      payload: { workspaceId, goal, type, costLogged: true },
      timestamp: Date.now(),
      source: 'AICoreEngine'
    });

    return result;
  }

  /**
   * Submit long-running task to the background Orchestrator
   */
  public submitBackgroundJob(request: any) {
    taskOrchestrator.submitTask(request);
  }

  /**
   * High-level image analysis (Vision)
   */
  public async analyzeImage(image: string, prompt?: string): Promise<string> {
    return await providerManager.analyzeImage(image, prompt);
  }

  // Expose subsystem accessors if needed
  public get events() { return eventBus; }
  public get decision() { return decisionEngine; }
  public get health() { return healthMonitor; }
}

export const AICore = new AICoreEngine();
