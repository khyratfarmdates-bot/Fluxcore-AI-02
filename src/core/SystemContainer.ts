import { AICore } from "./AICore";
import { automationService } from "../services/automation";
import { publishingService } from "../services/publishing";
import { analyticsService } from "../services/analytics";
import { notificationService } from "../services/notification";

/**
 * Enterprise Service Container (DI-lite)
 * Centralizes all core services for easier mocking, testing, and lifecycle management.
 */
class SystemServiceContainer {
  public ai = AICore;
  public automation = automationService;
  public publishing = publishingService;
  public analytics = analyticsService;
  public notifications = notificationService;
  
  // New production layers to be initialized
  public config = null;
  public workerRegistry = null;
  public billing = null;

  public async initialize() {
    console.log("[SystemContainer] Initializing Enterprise Services...");
    // Initialize services that need boot sequence
    return this;
  }
}

export const container = new SystemServiceContainer();
