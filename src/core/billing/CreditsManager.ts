import { quotaManager } from "./QuotaManager";

export class CreditsManager {
  
  // Cost definitions for different AI operations
  public readonly COSTS = {
    generate_text_standard: 1,
    generate_text_advanced: 3,
    generate_image_sd: 5,
    generate_image_pro: 10,
    generate_voice_1m: 8,
    generate_video_1s: 15,
  };

  /**
   * Evaluates cost and attempts to authorize & deduct credits before a task runs.
   */
  public async authorizeTransaction(
    workspaceId: string, 
    operationId: keyof typeof this.COSTS
  ): Promise<boolean> {
    
    const requiredCredits = this.COSTS[operationId];
    if (!requiredCredits) throw new Error("Invalid operation cost configuration.");

    return await quotaManager.consumeQuota(workspaceId, "credits", requiredCredits);
  }

  /**
   * Pre-flight check to see if UI should enable a button
   */
  public async canAfford(workspaceId: string, operationId: keyof typeof this.COSTS): Promise<boolean> {
    const requiredCredits = this.COSTS[operationId];
    const { allowed } = await quotaManager.checkQuota(workspaceId, "credits", requiredCredits);
    return allowed;
  }
}

export const creditsManager = new CreditsManager();
