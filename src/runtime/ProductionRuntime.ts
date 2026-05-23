import { serviceRegistry } from './ServiceRegistry';
import { db, auth } from '../lib/firebase';
import { eventBus } from '../core/events/EventBus';

class ProductionRuntime {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    console.log("🚀 Initializing Unified Production Runtime...");
    
    // 1. Check Firebase Connectivity
    this.checkDatabase();
    
    // 2. Start Health Monitors
    this.startHealthChecks();
    
    // 3. Register System-wide Events
    this.setupEventListeners();

    this.initialized = true;
  }

  private async checkDatabase() {
    try {
      // Small write/read test can be here, but for now we look at auth
      auth.onAuthStateChanged((user) => {
        if (user) {
          serviceRegistry.updateStatus('firebase-firestore', 'connected');
        } else {
          serviceRegistry.updateStatus('firebase-firestore', 'disconnected', 'لم يتم تسجيل الدخول');
        }
      });
    } catch (e: any) {
      serviceRegistry.updateStatus('firebase-firestore', 'disconnected', e.message);
    }
  }

  private startHealthChecks() {
    setInterval(() => {
      this.performCrossSystemHealthCheck();
    }, 30000); // Every 30 seconds
  }

  private async performCrossSystemHealthCheck() {
    const services = serviceRegistry.getAllServices();
    
    for (const service of services) {
      if (service.isReal && service.status !== 'connected') {
        // Log warning for real services that are down
        console.warn(`[RUNTIME] خدمة حقيقية معطلة: ${service.name}`);
      }
    }
    
    eventBus.publish({
      type: 'RUNTIME_HEALTH_CHECK',
      source: 'ProductionRuntime',
      payload: { timestamp: Date.now(), serviceCount: services.length },
      timestamp: Date.now()
    });
  }

  private setupEventListeners() {
    eventBus.subscribe('SERVICE_MOCK_DETECTED', (data) => {
      console.error("⛔ [RUNTIME ALERT] تم اكتشاف بيانات وهمية في نظام المفروض أنه حقيقي!", data);
    });
  }
}

export const productionRuntime = new ProductionRuntime();
