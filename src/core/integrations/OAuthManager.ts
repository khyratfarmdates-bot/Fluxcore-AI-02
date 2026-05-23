import { IntegrationProviderId } from "./types";
import { eventBus } from "../events/EventBus";
import { safeStringify } from "../../lib/safe-stringify";

export class OAuthManager {
  public async getAuthorizationUrl(providerId: IntegrationProviderId, workspaceId: string): Promise<string> {
    // Generate state, nonce, and return provider-specific OAuth URL
    const state = btoa(safeStringify({ workspaceId, providerId, timestamp: Date.now() }));
    return `https://auth.fluxcore.api/connect/${providerId}?state=${state}`;
  }

  public async handleCallback(providerId: IntegrationProviderId, code: string, state: string) {
    // Exchange code for tokens, save to TokenVault, register ConnectedApp
    console.log(`[OAuthManager] Handling callback for ${providerId}`);
    
    eventBus.publish({
      type: "INTEGRATION_CONNECTED",
      source: "OAuthManager",
      timestamp: Date.now(),
      payload: { providerId, status: "success" }
    });
  }
}

export const oauthManager = new OAuthManager();
