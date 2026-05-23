import { eventBus } from "../events/EventBus";
import { generateId } from "../../lib/ids";

export interface SystemError {
  id: string;
  message: string;
  stack?: string;
  context?: any;
  timestamp: number;
  severity: "low" | "medium" | "high" | "critical";
  source: string;
}

class ErrorTracker {
  private errors: SystemError[] = [];
  private maxErrors = 100;

  constructor() {
    // Catch unhandled rejections and errors
    window.addEventListener("unhandledrejection", (event) => {
      this.captureError(event.reason, "unhandled_rejection", "critical");
    });

    window.addEventListener("error", (event) => {
      this.captureError(event.error || event.message, "window_error", "high");
    });
  }

  public captureError(error: any, source: string, severity: SystemError["severity"] = "medium", context: any = {}) {
    const systemError: SystemError = {
      id: generateId(),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: Date.now(),
      severity,
      source,
      context
    };

    this.errors.unshift(systemError);
    if (this.errors.length > this.maxErrors) {
      this.errors.pop();
    }

    // Notify system about the error
    eventBus.publish({
      type: "SYSTEM_ERROR",
      payload: systemError,
      timestamp: Date.now(),
      source: "ErrorTracker"
    });

    // In production, you would send this to Sentry, LogRocket, or a custom API
    console.error(`[ErrorTracker] [${severity.toUpperCase()}] at ${source}:`, systemError.message, context);
  }

  public getRecentErrors(count: number = 20) {
    return this.errors.slice(0, count);
  }

  public clearErrors() {
    this.errors = [];
  }
}

export const errorTracker = new ErrorTracker();
