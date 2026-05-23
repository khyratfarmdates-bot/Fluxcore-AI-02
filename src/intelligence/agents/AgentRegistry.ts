export type AgentRole = 
  | 'CONTENT_STRATEGIST'
  | 'PUBLISHING_OFFICER'
  | 'ANALYTICS_DIRECTOR'
  | 'AUTOMATION_ARCHITECT'
  | 'MEDIA_PRODUCER'
  | 'BRAND_INTELLIGENCE'
  | 'AUDIENCE_ARCHITECT'
  | 'WORKFLOW_OPS'
  | 'YOUTUBE_GROWTH_SPECIALIST';

export interface AgentDescriptor {
  role: AgentRole;
  description: string;
  capabilities: string[];
  permissions: string[];
}

export const AGENT_REGISTRY: AgentDescriptor[] = [
  {
    role: 'CONTENT_STRATEGIST',
    description: 'Expert in narrative development and cross-platform content planning.',
    capabilities: ['narrative_design', 'content_calendar_planning', 'creative_briefing'],
    permissions: ['write_content', 'query_memory']
  },
  {
    role: 'PUBLISHING_OFFICER',
    description: 'Specializes in optimal delivery and platform-specific execution.',
    capabilities: ['smart_scheduling', 'platform_compliance', 'distribution_optimization'],
    permissions: ['execute_publish', 'social_api_access']
  },
  {
    role: 'ANALYTICS_DIRECTOR',
    description: 'Decodes performance signals into operational intelligence.',
    capabilities: ['roi_analysis', 'trend_forecasting', 'anomaly_detection'],
    permissions: ['read_analytics', 'write_insights']
  },
  {
    role: 'AUTOMATION_ARCHITECT',
    description: 'Designs and maintains frictionless system workflows.',
    capabilities: ['logic_optimization', 'integration_design', 'error_recovery'],
    permissions: ['manage_workflows', 'trigger_events']
  },
  {
    role: 'MEDIA_PRODUCER',
    description: 'Engineers visual assets and aesthetic consistency.',
    capabilities: ['image_generation', 'video_editing_logic', 'style_preservation'],
    permissions: ['media_api_access', 'asset_storage']
  },
  {
    role: 'YOUTUBE_GROWTH_SPECIALIST',
    description: 'Specialized in YouTube algorithms, SEO, and audience retention strategies.',
    capabilities: ['video_seo_optimization', 'retention_analysis', 'youtube_trend_scouting'],
    permissions: ['read_analytics', 'social_api_access', 'write_insights']
  }
];
