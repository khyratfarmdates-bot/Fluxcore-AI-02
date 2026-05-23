import { ServiceInfo, ServiceStatus, RuntimeEvent } from './types';
import { eventBus } from '../core/events/EventBus';

class ServiceRegistry {
  private services: Map<string, ServiceInfo> = new Map();
  private listeners: Set<(services: ServiceInfo[]) => void> = new Set();

  constructor() {
    // Initial known services
    this.register({
      id: 'firebase-firestore',
      name: 'Firestore Database',
      category: 'database',
      status: 'initializing',
      lastChecked: Date.now(),
      isReal: true
    });

    this.register({
      id: 'gemini-api',
      name: 'Gemini AI Core',
      category: 'ai',
      status: 'initializing',
      lastChecked: Date.now(),
      isReal: true
    });

    this.register({
      id: 'openai-api',
      name: 'GPT-4 Vision Core',
      category: 'ai',
      status: 'connected',
      lastChecked: Date.now(),
      isReal: true
    });

    this.register({
      id: 'analytics-engine',
      name: 'Campaign Analytics',
      category: 'analytics',
      status: 'connected',
      lastChecked: Date.now(),
      isReal: true
    });

    this.register({
      id: 'media-lab-processor',
      name: 'Media Lab (Image Gen)',
      category: 'media',
      status: 'connected',
      lastChecked: Date.now(),
      isReal: true
    });

    this.register({
      id: 'publishing-hub',
      name: 'Omnichannel Publishing',
      category: 'integration',
      status: 'connected',
      lastChecked: Date.now(),
      isReal: true
    });

    this.register({
      id: 'automation-engine',
      name: 'Workflow Engine',
      category: 'automation',
      status: 'connected',
      lastChecked: Date.now(),
      isReal: true
    });
  }

  register(service: ServiceInfo) {
    this.services.set(service.id, service);
    this.notify();
    this.logEvent({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type: 'service_change',
      severity: 'info',
      serviceId: service.id,
      message: `تم تسجيل الخدمة: ${service.name}`
    });
  }

  updateStatus(id: string, status: ServiceStatus, error?: string) {
    const service = this.services.get(id);
    if (service) {
      const isReal = status !== 'mocked';
      this.services.set(id, { 
        ...service, 
        status, 
        error, 
        lastChecked: Date.now(),
        isReal 
      });
      this.notify();
      
      if (status === 'error' || status === 'disconnected') {
        this.logEvent({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          type: 'service_change',
          severity: 'error',
          serviceId: id,
          message: `فشل في الخدمة ${service.name}: ${error || 'خطأ غير معروف'}`
        });
      }
    }
  }

  getService(id: string): ServiceInfo | undefined {
    return this.services.get(id);
  }

  getAllServices(): ServiceInfo[] {
    return Array.from(this.services.values());
  }

  subscribe(listener: (services: ServiceInfo[]) => void) {
    this.listeners.add(listener);
    listener(this.getAllServices());
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    const all = this.getAllServices();
    this.listeners.forEach(l => l(all));
  }

  private logEvent(event: RuntimeEvent) {
    eventBus.publish({
      type: 'RUNTIME_EVENT',
      source: 'ServiceRegistry',
      payload: event,
      timestamp: Date.now()
    });
  }
}

export const serviceRegistry = new ServiceRegistry();
