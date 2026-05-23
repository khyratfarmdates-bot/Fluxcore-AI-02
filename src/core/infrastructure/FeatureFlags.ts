// Enterprise Features Flags System

export type FeatureFlagId = "experimental_video_ai" | "v2_dashboard" | "advanced_analytics" | "maintenance_mode" | "sso_auth" | "distributed_queue";

class FeatureFlags {
  private flags: Map<FeatureFlagId, boolean> = new Map([
    ["experimental_video_ai", false],
    ["v2_dashboard", true],
    ["advanced_analytics", false],
    ["maintenance_mode", false],
    ["sso_auth", false],
    ["distributed_queue", true]
  ]);

  public isEnabled(flag: FeatureFlagId): boolean {
    return this.flags.get(flag) || false;
  }

  public toggle(flag: FeatureFlagId, value: boolean) {
    this.flags.set(flag, value);
    // In production, this syncs with LaunchDarkly or Redis
  }

  public getAll() {
    return Object.fromEntries(this.flags);
  }
}

export const featureFlags = new FeatureFlags();
