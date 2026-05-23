import { PlanId, PlanDetails } from "./types";

export const PRICING_PLANS: Record<PlanId, PlanDetails> = {
  free: {
    id: "free",
    name: "مبتدئ (Free)",
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      workspaces: 1,
      teamMembers: 1,
      monthlyCredits: 100,
      socialProfiles: 3,
      canUseVideoAI: false,
      canUseVoiceAI: false,
      canUseAutomations: false,
      hasWhiteLabel: false,
      hasApiAccess: false,
    }
  },
  creator: {
    id: "creator",
    name: "صانع المحتوى (Creator)",
    priceMonthly: 19,
    priceYearly: 190,
    limits: {
      workspaces: 1,
      teamMembers: 1,
      monthlyCredits: 1000,
      socialProfiles: 10,
      canUseVideoAI: false,
      canUseVoiceAI: true,
      canUseAutomations: true,
      hasWhiteLabel: false,
      hasApiAccess: false,
    }
  },
  pro: {
    id: "pro",
    name: "محترف (Pro)",
    priceMonthly: 49,
    priceYearly: 490,
    limits: {
      workspaces: 3,
      teamMembers: 3,
      monthlyCredits: 5000,
      socialProfiles: 30,
      canUseVideoAI: true,
      canUseVoiceAI: true,
      canUseAutomations: true,
      hasWhiteLabel: false,
      hasApiAccess: false,
    }
  },
  agency: {
    id: "agency",
    name: "الوكالة (Agency)",
    priceMonthly: 99,
    priceYearly: 990,
    limits: {
      workspaces: 10,
      teamMembers: 10,
      monthlyCredits: 20000,
      socialProfiles: 100,
      canUseVideoAI: true,
      canUseVoiceAI: true,
      canUseAutomations: true,
      hasWhiteLabel: true,
      hasApiAccess: false,
    }
  },
  enterprise: {
    id: "enterprise",
    name: "أعمال (Enterprise)",
    priceMonthly: 299,
    priceYearly: 2990,
    limits: {
      workspaces: -1, // Unlimited
      teamMembers: -1,
      monthlyCredits: 100000,
      socialProfiles: -1,
      canUseVideoAI: true,
      canUseVoiceAI: true,
      canUseAutomations: true,
      hasWhiteLabel: true,
      hasApiAccess: true,
    }
  }
};

export class PricingConfig {
  public static getPlan(planId: PlanId): PlanDetails {
    return PRICING_PLANS[planId];
  }

  public static getAllPlans(): PlanDetails[] {
    return Object.values(PRICING_PLANS);
  }
}
