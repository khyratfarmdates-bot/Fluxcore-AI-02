import { db, auth } from "../../lib/firebase";
import { collection, getDocs, query, limit, where } from "firebase/firestore";
import { healthMonitor } from "../monitoring/HealthMonitor";
import { errorTracker } from "../monitoring/ErrorTracker";

export interface DiagnosticsReport {
  timestamp: number;
  health: any;
  database: {
    latency: number;
    reachable: boolean;
    authStatus: string;
  };
  recentErrors: number;
}

class DiagnosticsService {
  public async runFullSuite(): Promise<DiagnosticsReport> {
    const start = Date.now();
    let dbReachable = false;
    let dbLatency = 0;

    try {
      if (auth.currentUser) {
        const q = query(collection(db, "brands"), where("userId", "==", auth.currentUser.uid), limit(1));
        await getDocs(q);
        dbReachable = true;
        dbLatency = Date.now() - start;
      }
    } catch (e) {
      errorTracker.captureError(e, "diagnostics:db", "high");
    }

    return {
      timestamp: Date.now(),
      health: healthMonitor.getHealthStatus(),
      database: {
        latency: dbLatency,
        reachable: dbReachable,
        authStatus: auth.currentUser ? "Authenticated" : "Unauthenticated"
      },
      recentErrors: errorTracker.getRecentErrors().length
    };
  }

  public async verifyWorkspace(workspaceId: string) {
    // Check if workspace is isolated and accessible
    try {
      const q = query(collection(db, "brands"), where("id", "==", workspaceId), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return { status: "missing", error: "Workspace not found" };
      
      const data = snap.docs[0].data();
      if (data.userId !== auth.currentUser?.uid) return { status: "violation", error: "Permission denied" };
      
      return { status: "ok" };
    } catch (e: any) {
      return { status: "error", error: e.message };
    }
  }
}

export const diagnostics = new DiagnosticsService();
