export type Role = "owner" | "admin" | "editor" | "viewer" | "system";

export type Permission = 
  | "workspaces:read" | "workspaces:write" | "workspaces:delete"
  | "billing:read" | "billing:write"
  | "content:generate" | "content:publish" | "content:delete"
  | "secrets:read" | "secrets:write"
  | "integrations:manage"
  | "system:admin";

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userId: string;
  workspaceId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: any;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failure" | "blocked";
}

export interface SecurityThreat {
  id: string;
  timestamp: number;
  type: "rate_limit_exceeded" | "suspicious_login" | "unauthorized_access" | "api_abuse";
  severity: "low" | "medium" | "high" | "critical";
  sourceIp: string;
  details: string;
}
