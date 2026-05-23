import { toast } from '../lib/soundToast';

/**
 * System Recovery & Fallback Layer
 * Ensures the system stays operational during API failures.
 */
class RecoverySystem {
  private retryCount: Record<string, number> = {};
  private MAX_RETRIES = 3;

  /**
   * Executes an operation with safe error handling and retry logic
   */
  public async executeSafe<T>(
    id: string, 
    operation: () => Promise<T>, 
    fallback: T
  ): Promise<T> {
    try {
      const result = await operation();
      // Clear retry history on success
      this.retryCount[id] = 0;
      return result;
    } catch (err: any) {
      console.error(`[RECOVERY] Failure in ${id}:`, err);
      
      const currentTry = (this.retryCount[id] || 0) + 1;
      this.retryCount[id] = currentTry;

      if (currentTry <= this.MAX_RETRIES) {
        console.warn(`[RECOVERY] Retrying ${id} (Attempt ${currentTry}/${this.MAX_RETRIES})...`);
        return this.executeSafe(id, operation, fallback);
      }

      toast.error(`[Recovery Mode] فشل تنفيذ العملية ${id}. تم تفعيل نظام الحماية.`);
      return fallback;
    }
  }

  public getCircuitStatus(id: string) {
     return (this.retryCount[id] || 0) >= this.MAX_RETRIES ? 'OFF' : 'ON';
  }
}

export const recovery = new RecoverySystem();
