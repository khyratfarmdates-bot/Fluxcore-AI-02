export type IntegrationProviderId = "google" | "meta" | "tiktok" | "x" | "linkedin" | "discord" | "slack" | "notion" | "shopify" | "wordpress" | "zapier" | "make";

export type ConnectionStatus = "connected" | "expired" | "needs_reconnect" | "limited" | "disconnected";

export interface IntegrationProvider {
  id: IntegrationProviderId;
  name: string;
  category: "social" | "messaging" | "productivity" | "ecommerce" | "automation";
  authType: "oauth2" | "api_key" | "webhook_only";
  capabilities: string[];
}

export interface ConnectedApp {
  id: string;
  workspaceId: string;
  providerId: IntegrationProviderId;
  status: ConnectionStatus;
  accountName: string;
  connectedAt: number;
  lastSyncAt?: number;
  scopes: string[];
  healthScore: number; // 0-100
}

export interface WebhookEndpoint {
  id: string;
  workspaceId: string;
  url: string;
  events: string[];
  status: "active" | "failing" | "disabled";
  secret: string;
}

export interface ApiKey {
  id: string;
  workspaceId: string;
  name: string;
  keyPrefix: string;
  createdAt: number;
  lastUsedAt?: number;
  expiresAt?: number;
  scopes: string[];
}
