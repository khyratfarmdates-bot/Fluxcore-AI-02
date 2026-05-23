export type PlanId = "free" | "creator" | "pro" | "agency" | "enterprise";

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "unpaid" | "incomplete";

export interface PlanFeatureLimits {
  workspaces: number;
  teamMembers: number;
  monthlyCredits: number;
  socialProfiles: number;
  canUseVideoAI: boolean;
  canUseVoiceAI: boolean;
  canUseAutomations: boolean;
  hasWhiteLabel: boolean;
  hasApiAccess: boolean;
}

export interface PlanDetails {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  limits: PlanFeatureLimits;
}

export interface Subscription {
  id: string;
  workspaceId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  trialEnd?: number;
}

export interface UsageRecord {
  id: string;
  workspaceId: string;
  resourceId: "credits" | "workspaces" | "team_members" | "social_profiles";
  used: number;
  limit: number;
  resetAt: number;
}

export interface Invoice {
  id: string;
  workspaceId: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "uncollectible" | "void";
  createdAt: number;
  paidAt?: number;
  pdfUrl?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercentage?: number;
  discountAmount?: number;
  validUntil: number;
  maxRedemptions: number;
  timesRedeemed: number;
}
