import { useCompanionStore, CompanionState } from './CompanionState';
import { trackingEngine } from '../../services/behaviorTracking';

class CompanionEngine {
  constructor() {
    // Subscription to behavioral tracking needed here if we want real-time reactivity
  }

  triggerState(state: CompanionState, duration = 3000) {
    useCompanionStore.getState().setState(state);
    if (duration > 0) {
      setTimeout(() => {
        useCompanionStore.getState().setState('idle');
      }, duration);
    }
  }

  async processIntent(context: string, behaviorData: any) {
    // Logic to interpret behavior vs context
    console.log(`Processing intent: ${context}`, behaviorData);
    
    // Example: Thinking state
    this.triggerState('thinking', 2000);
  }

  startGuide(selector: string, message: string) {
    useCompanionStore.getState().setGuide(selector, message);
  }
}

export const companionEngine = new CompanionEngine();
