import { IntegrationEngine } from '../integrations/CoreEngine';
import { db, auth } from '../lib/firebase';
import { getDoc, doc } from 'firebase/firestore';

export interface SystemHealthStatus {
  firebase: 'healthy' | 'degraded' | 'error';
  ai: 'healthy' | 'degraded' | 'error';
  integrations: Record<string, 'healthy' | 'degraded' | 'error'>;
  auth: 'authenticated' | 'anonymous';
  lastChecked: number;
}

export class SystemHealthService {
  private static instance: SystemHealthService;

  private constructor() {}

  public static getInstance(): SystemHealthService {
    if (!SystemHealthService.instance) {
      SystemHealthService.instance = new SystemHealthService();
    }
    return SystemHealthService.instance;
  }

  async checkFullStatus(brandId?: string): Promise<SystemHealthStatus> {
    const status: SystemHealthStatus = {
      firebase: 'healthy',
      ai: 'healthy',
      integrations: {},
      auth: auth.currentUser ? 'authenticated' : 'anonymous',
      lastChecked: Date.now()
    };

    // 1. Check Firebase Connection
    try {
      const testDoc = await getDoc(doc(db, '_system_health', 'test'));
    } catch (err) {
      status.firebase = 'error';
    }

    // 2. Check AI Core (Real Ping to /api/health)
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
         const data = await res.json();
         if (data.status === "ok" && (data.hasGeminiKey || data.hasOpenaiKey)) {
           status.ai = 'healthy';
         } else {
           status.ai = 'degraded'; // connected but missing model API keys
         }
         if (!data.dbInitialized) {
           status.firebase = 'degraded';
         }
      } else {
         status.ai = 'error';
      }
    } catch (err) {
      status.ai = 'error';
    }

    // 3. Check Active Integrations
    if (brandId) {
       const integrationHealth = await IntegrationEngine.checkHealth(brandId);
       Object.entries(integrationHealth).forEach(([key, val]: [string, any]) => {
          status.integrations[key] = val.status === 'healthy' ? 'healthy' : 'degraded';
       });
    }

    return status;
  }
}

export const healthService = SystemHealthService.getInstance();
