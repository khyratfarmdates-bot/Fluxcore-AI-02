import { WebhookEndpoint } from "./types";
import { eventBus } from "../events/EventBus";

export class WebhookManager {
  
  constructor() {
    // Listen to system events to dispatch webhooks
    eventBus.subscribe("*", (event) => this.dispatchWebhooks(event));
  }

  public async registerWebhook(endpoint: Omit<WebhookEndpoint, "id" | "status" | "secret">): Promise<WebhookEndpoint> {
    return {
      ...endpoint,
      id: `whk_${Math.random().toString(36).substring(7)}`,
      status: "active",
      secret: `whsec_${Math.random().toString(36).substring(7)}`
    };
  }

  private async dispatchWebhooks(event: any) {
    // Match event type to registered webhooks, sign payload with secret, send via background queue with retry logic
    // console.log(`[WebhookManager] Evaluating dispatch for event: ${event.type}`);
  }
}

export const webhookManager = new WebhookManager();
