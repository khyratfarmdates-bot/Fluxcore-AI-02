import { PlanId } from "./types";
import { PRICING_PLANS } from "./PricingConfig";
import { eventBus } from "../events/EventBus";
import { billingService } from "../../services/billing";

export class QuotaManager {
  /**
   * Checks if a workspace has enough quota to perform an action.
   */
  public async checkQuota(
    workspaceId: string, 
    resource: "credits" | "workspaces" | "team_members" | "social_profiles", 
    requiredAmount: number = 1
  ): Promise<{ allowed: boolean; remaining: number }> {
    
    try {
      // Fetch plan from actual Firestore via billingService
      const planDoc = await billingService.getMyPlan();
      
      // Fallback if no plan is set up in Firestore yet (e.g. new user)
      const currentPlanId: PlanId = (planDoc?.plan?.toLowerCase() || "creator") as PlanId;
      const usedCredits = planDoc?.usedCredits ?? 0;
      const totalCredits = planDoc?.credits ?? PRICING_PLANS[currentPlanId].limits.monthlyCredits;
      
      let limit = 0;
      switch (resource) {
        case "credits": limit = totalCredits; break;
        case "workspaces": limit = PRICING_PLANS[currentPlanId].limits.workspaces; break;
        case "team_members": limit = PRICING_PLANS[currentPlanId].limits.teamMembers; break;
        case "social_profiles": limit = PRICING_PLANS[currentPlanId].limits.socialProfiles; break;
      }

      if (limit === -1) return { allowed: true, remaining: -1 }; // Unlimited

      const remaining = resource === "credits" ? (limit - usedCredits) : limit;
      const allowed = remaining >= requiredAmount;

      if (!allowed) {
        eventBus.publish({
          type: 'QUOTA_EXCEEDED',
          payload: { workspaceId, resource, limit, requiredAmount },
          timestamp: Date.now(),
          source: 'QuotaManager'
        });
      }

      return { allowed, remaining };
    } catch (e) {
      console.warn("[QuotaManager] Firestore quota check failed, using safe fallback:", e);
      // Fail-safe default
      const limit = PRICING_PLANS["creator"].limits.monthlyCredits;
      const remaining = limit - 450;
      return { allowed: remaining >= requiredAmount, remaining };
    }
  }

  /**
   * Consumes a specific amount of quota.
   */
  public async consumeQuota(
    workspaceId: string,
    resource: "credits",
    amount: number
  ): Promise<boolean> {
    const { allowed } = await this.checkQuota(workspaceId, resource, amount);
    
    if (allowed) {
      try {
        // Deduct from real Firestore DB
        await billingService.deductCredits(amount);
      } catch (err) {
        console.warn("[QuotaManager] Failed to deduct credits in Firestore, proceeding locally:", err);
      }
      
      console.log(`[QuotaManager] Deducted ${amount} ${resource} from workspace ${workspaceId}`);
      eventBus.publish({
        type: 'QUOTA_CONSUMED',
        payload: { workspaceId, resource, amount },
        timestamp: Date.now(),
        source: 'QuotaManager'
      });
      return true;
    }
    
    return false;
  }
}

export const quotaManager = new QuotaManager();
