import { BaseService } from '../services/base';

export type UserLevel = 'beginner' | 'intermediate' | 'pro' | 'agency' | 'enterprise';

export interface UserExperienceProfile {
  id?: string;
  userId: string;
  level: UserLevel;
  goal: string;
  completedMissions: string[];
  onboardingStep: number;
  lastActiveLevel: UserLevel;
  isExperienceLoaded: boolean;
}

class OnboardingService {
  private profileService = new BaseService<UserExperienceProfile>('user_profiles');

  async getProfile(userId: string): Promise<UserExperienceProfile | null> {
    const profiles = await this.profileService.getByField('userId', userId);
    return profiles[0] || null;
  }

  async saveProfile(profile: UserExperienceProfile) {
    if (profile.id) {
       await this.profileService.update(profile.id, profile);
    } else {
       await this.profileService.create(profile);
    }
  }

  async completeMission(userId: string, missionId: string) {
    const profile = await this.getProfile(userId);
    if (profile && !profile.completedMissions.includes(missionId)) {
      profile.completedMissions.push(missionId);
      await this.saveProfile(profile);
    }
  }

  calculateConfidenceScore(profile: UserExperienceProfile): number {
    const baseScores: Record<UserLevel, number> = {
      beginner: 20,
      intermediate: 50,
      pro: 80,
      agency: 90,
      enterprise: 100
    };
    
    const missionBonus = profile.completedMissions.length * 5;
    return Math.min(100, baseScores[profile.level] + missionBonus);
  }
}

export const onboardingService = new OnboardingService();
