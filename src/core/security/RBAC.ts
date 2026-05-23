import { Role, Permission } from "./types";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ["workspaces:read", "workspaces:write", "workspaces:delete", "billing:read", "billing:write", "content:generate", "content:publish", "content:delete", "secrets:read", "secrets:write", "integrations:manage"],
  admin: ["workspaces:read", "workspaces:write", "billing:read", "content:generate", "content:publish", "content:delete", "secrets:read", "secrets:write", "integrations:manage"],
  editor: ["workspaces:read", "content:generate", "content:publish"],
  viewer: ["workspaces:read"],
  system: ["system:admin"]
};

export class RBACEngine {
  public hasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) || false;
  }

  public enforcePermission(role: Role, permission: Permission): void {
    if (!this.hasPermission(role, permission)) {
      throw new Error(`[Security] Access Denied: Missing permission ${permission}`);
    }
  }
}

export const rbac = new RBACEngine();
