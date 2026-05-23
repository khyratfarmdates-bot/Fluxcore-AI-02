import { eventBus } from "../events/EventBus";
import { errorTracker } from "./ErrorTracker";

export class HealthMonitor {
  private metrics = {
    totalRequests: 0,
    failedRequests: 0,
    avgLatencyMs: 0,
    activeTasks: 0,
    criticalErrors: 0,
    uptime: Date.now()
  };

  private lastLatencies: number[] = [];

  constructor() {
    // Listen to core events to update metrics
    eventBus.subscribe('TASK_COMPLETED', (evt: any) => {
      this.metrics.totalRequests++;
      if (evt.payload?.duration) {
        this.addLatency(evt.payload.duration);
      }
    });

    eventBus.subscribe('TASK_FAILED', () => {
      this.metrics.totalRequests++;
      this.metrics.failedRequests++;
    });

    eventBus.subscribe('SYSTEM_ERROR', (evt: any) => {
      if (evt.payload?.severity === "critical" || evt.payload?.severity === "high") {
        this.metrics.criticalErrors++;
      }
    });
  }

  private addLatency(ms: number) {
    this.lastLatencies.push(ms);
    if (this.lastLatencies.length > 50) this.lastLatencies.shift();
    this.metrics.avgLatencyMs = Math.round(
      this.lastLatencies.reduce((a, b) => a + b, 0) / this.lastLatencies.length
    );
  }

  public getHealthStatus() {
    const errorRate = this.metrics.totalRequests > 0 
      ? (this.metrics.failedRequests / this.metrics.totalRequests) * 100 
      : 0;

    const uptimeSeconds = Math.floor((Date.now() - this.metrics.uptime) / 1000);

    return {
      status: errorRate > 10 || this.metrics.criticalErrors > 5 ? "DEGRADED" : "HEALTHY",
      metrics: {
        ...this.metrics,
        errorRate: errorRate.toFixed(2),
        uptimeSeconds
      },
      timestamp: Date.now()
    };
  }

  public trackUsage(workspaceId: string, tokens: number, feature: string) {
    console.log(`[UsageTracking] Client ${workspaceId} consumed ${tokens} tokens for ${feature}`);
  }
}

export const healthMonitor = new HealthMonitor();
