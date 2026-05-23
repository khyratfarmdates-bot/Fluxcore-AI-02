import { eventBus } from "../events/EventBus";

export class ObservabilityLayer {
  private metrics = {
    apiRequests: 0,
    errors: 0,
    backgroundJobs: 0,
    queueSize: 0,
    activeConnections: 12
  };

  private latencies: number[] = [];

  constructor() {
    eventBus.subscribe("*", (evt: any) => {
      this.metrics.apiRequests++;
      if (evt.type.includes("FAILED") || evt.type.includes("ERROR") || evt.status === "failure") {
        this.metrics.errors++;
      }
      if (evt.type === "TASK_SUBMITTED") {
        this.metrics.queueSize++;
      }
      if (evt.type === "TASK_COMPLETED") {
        this.metrics.backgroundJobs++;
        this.metrics.queueSize = Math.max(0, this.metrics.queueSize - 1);
        
        // Mock latency recording
        this.latencies.push(100 + Math.random() * 500);
        if (this.latencies.length > 100) this.latencies.shift();
      }
    });
  }

  public getMetrics() {
    const avgLatency = this.latencies.length > 0 ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length : 0;
    
    return {
      ...this.metrics,
      avgLatencyMs: Math.round(avgLatency),
      uptime: Math.round(process?.uptime ? process.uptime() : Date.now() / 1000), // Mock uptime
      memoryUsageMB: (performance as any)?.memory ? Math.round(((performance as any).memory).usedJSHeapSize / 1024 / 1024) : 45
    };
  }
}

export const observability = new ObservabilityLayer();
