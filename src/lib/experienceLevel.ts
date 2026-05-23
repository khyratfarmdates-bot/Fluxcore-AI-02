import { UserLevel } from "../onboarding/OnboardingService";

export function isSafeMode(level: UserLevel | undefined): boolean {
  return level === 'beginner';
}

export function isAdvancedMode(level: UserLevel | undefined): boolean {
  return level === 'pro' || level === 'agency' || level === 'enterprise';
}

export function shouldShowComplexity(level: UserLevel | undefined, threshold: UserLevel): boolean {
  const ranks: Record<UserLevel, number> = {
    beginner: 1,
    intermediate: 2,
    pro: 3,
    agency: 4,
    enterprise: 5
  };

  const levelRank = level ? ranks[level] : 0;
  const thresholdRank = ranks[threshold];

  return levelRank >= thresholdRank;
}
