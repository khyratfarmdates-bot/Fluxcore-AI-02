import { SecurityThreat } from "./types";
import { eventBus } from "../events/EventBus";

export class SecurityLayer {
  private blocklist: Set<string> = new Set();
  private recentRequests: Map<string, number[]> = new Map();

  // Rate limiting config
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 min
  private readonly MAX_REQUESTS = 100;

  /**
   * Central security entry point for all API requests / AI Generations
   */
  public async validateRequest(ip: string, userId: string): Promise<boolean> {
    if (this.blocklist.has(ip)) {
      this.reportThreat("unauthorized_access", "critical", ip, "IP is blocklisted");
      return false;
    }

    if (!this.checkRateLimit(ip)) {
      this.reportThreat("rate_limit_exceeded", "high", ip, "API usage anomaly detected");
      return false;
    }

    // Additional input validation & injection detection would go here
    return true;
  }

  private checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const timestamps = this.recentRequests.get(ip) || [];
    const windowStart = now - this.RATE_LIMIT_WINDOW;
    
    const validTimestamps = timestamps.filter(ts => ts > windowStart);
    validTimestamps.push(now);
    
    this.recentRequests.set(ip, validTimestamps);
    
    return validTimestamps.length <= this.MAX_REQUESTS;
  }

  private reportThreat(type: SecurityThreat["type"], severity: SecurityThreat["severity"], ip: string, details: string) {
    const threat: SecurityThreat = {
      id: `thr_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      type, severity, sourceIp: ip, details
    };

    console.warn(`[Security] THREAT DETECTED: ${type} from ${ip} - ${details}`);
    
    eventBus.publish({
      type: "SECURITY_THREAT",
      source: "SecurityLayer",
      timestamp: Date.now(),
      payload: threat
    });
  }
}

export const securityLayer = new SecurityLayer();
