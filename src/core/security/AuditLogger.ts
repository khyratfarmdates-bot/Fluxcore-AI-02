import { AuditLogEntry } from "./types";
import { eventBus } from "../events/EventBus";

export class AuditLogger {
  private logs: AuditLogEntry[] = [];

  public log(entry: Omit<AuditLogEntry, "id" | "timestamp">) {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `adt_${(Math.random() * 1000000000).toString(36).substring(0, 7)}`,
      timestamp: Date.now()
    };
    
    this.logs.unshift(fullEntry); // Prepend for UI visualization
    
    if (this.logs.length > 1000) {
       this.logs.pop();
    }
    
    eventBus.publish({
      type: "SECURITY_AUDIT_LOG",
      source: "AuditLogger",
      timestamp: Date.now(),
      payload: fullEntry
    });
  }

  public getRecentLogs(limit = 100) {
    return this.logs.slice(0, limit);
  }
}

export const auditLogger = new AuditLogger();
