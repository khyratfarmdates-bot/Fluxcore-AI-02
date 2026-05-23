import { aiMemory } from './AIMemoryService';
import { eventBus } from '../../core/events/EventBus';

class BehavioralLearner {
  constructor() {
    this.initListeners();
  }

  private initListeners() {
    eventBus.subscribe('TASK_COMPLETED', async (evt: any) => {
      await this.learnFromSuccess(evt);
    });

    eventBus.subscribe('TASK_FAILED', async (evt: any) => {
      await this.learnFromFailure(evt);
    });
  }

  private async learnFromSuccess(event: any) {
    const { brandId, type, payload } = event;
    if (!brandId) return;

    // Pattern recognition: if a specific content type works well
    await aiMemory.saveMemory(
      brandId, 
      'pattern', 
      `SUCCESS_${type}`, 
      { observations: "Completed successfully", data: payload },
      0.7
    );
  }

  private async learnFromFailure(event: any) {
    const { brandId, type, payload } = event;
    if (!brandId) return;

    await aiMemory.saveMemory(
      brandId, 
      'decision', 
      `FAILURE_${type}`, 
      { error: payload?.error, context: payload?.context },
      0.9
    );
  }

  public async getBehavioralInsights(brandId: string) {
    const memories = await aiMemory.getRelevantMemory(brandId, 'pattern', 10);
    // process memories to return actionable insights
    return memories;
  }
}

export const behavioralLearner = new BehavioralLearner();
