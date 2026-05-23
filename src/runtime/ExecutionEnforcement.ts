import { serviceRegistry } from './ServiceRegistry';
import { ExecutionResult } from './types';
import { safeStringify } from '../lib/safe-stringify';

export class ExecutionEnforcement {
  /**
   * Enforces that an action is real and not mocked.
   * If the service is in 'mocked' state, it will throw an error in production-ready mode
   * or log a critical warning.
   */
  static async executeReal<T>(
    serviceId: string, 
    actionName: string, 
    action: () => Promise<T>
  ): Promise<ExecutionResult<T>> {
    const startTime = Date.now();
    const service = serviceRegistry.getService(serviceId);

    if (!service || !service.isReal || service.status === 'mocked') {
      console.error(`[RUNTIME ENFORCEMENT] محاولة تنفيذ عملية وهمية مرفوضة: ${actionName} في خدمة ${serviceId}`);
      
      return {
        success: false,
        error: `ENFORCEMENT_ERROR: الخدمة ${serviceId} تعمل بنظام الـ Mock وغير مسموح لها بتنفيذ ${actionName}`,
        executionTime: Date.now() - startTime,
        isMocked: true,
        timestamp: Date.now()
      };
    }

    try {
      const result = await action();
      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
        isMocked: false,
        timestamp: Date.now()
      };
    } catch (error: any) {
      serviceRegistry.updateStatus(serviceId, 'degraded', error.message);
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        isMocked: false,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Validates if a dataset is real or mock-generated.
   */
  static isRealData(data: any): boolean {
    if (!data) return false;
    // Check for common mock patterns
    const mockIndicators = ['lorem', 'ipsum', 'mock', 'test_user', 'fake_id'];
    const stringified = safeStringify(data).toLowerCase();
    
    return !mockIndicators.some(indicator => stringified.includes(indicator));
  }
}
