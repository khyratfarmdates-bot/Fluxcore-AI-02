export type IntegrationProvider = 
  | 'x' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube' | 'threads'
  | 'gemini' | 'openai' | 'claude' | 'runway' | 'pika' | 'elevenlabs' | 'googleslides';

export type IntegrationType = 'social' | 'ai' | 'media' | 'tool';

export type IntegrationStatus = 'connected' | 'disconnected' | 'expired' | 'error';

export interface IntegrationAccount {
  id: string;
  brandId: string;
  provider: IntegrationProvider;
  type: IntegrationType;
  status: IntegrationStatus;
  credentials: {
    accessToken?: string;
    refreshToken?: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    expiresAt?: any;
  };
  metadata: Record<string, any>;
  expiresAt?: Date;
  lastSyncedAt?: Date;
}

export interface IntegrationAction {
  id: string;
  integrationId: string;
  provider: IntegrationProvider;
  action: string;
  params: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  rateLimitRest?: Date;
}

export abstract class BaseConnector {
  abstract provider: IntegrationProvider;
  abstract type: IntegrationType;
  
  abstract validate(account: IntegrationAccount): Promise<boolean>;
  abstract execute(action: string, params: any, account: IntegrationAccount): Promise<ExecutionResult>;
}
