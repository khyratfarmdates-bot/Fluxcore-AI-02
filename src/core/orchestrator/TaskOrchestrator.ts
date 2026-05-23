import { AIRequest } from "../types";
import { eventBus } from "../events/EventBus";

export class TaskOrchestrator {
  private queue: AIRequest[] = [];
  private isProcessing: boolean = false;
  private maxConcurrency: number = 2; // For background jobs
  private activeJobs: number = 0;

  public submitTask(request: AIRequest) {
    this.queue.push(request);
    this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first
    
    eventBus.publish({
      type: 'TASK_SUBMITTED',
      payload: { taskId: request.id },
      timestamp: Date.now(),
      source: 'TaskOrchestrator'
    });

    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0 || this.activeJobs >= this.maxConcurrency) return;

    this.isProcessing = true;
    
    while(this.queue.length > 0 && this.activeJobs < this.maxConcurrency) {
       const task = this.queue.shift();
       if (!task) break;

       this.activeJobs++;
       this.executeTask(task).finally(() => {
         this.activeJobs--;
         this.processQueue(); // Check if more tasks are pending
       });
    }

    this.isProcessing = false;
  }

  private async executeTask(task: AIRequest) {
    task.status = "processing";
    eventBus.publish({
      type: 'TASK_STARTED',
      payload: { taskId: task.id },
      timestamp: Date.now(),
      source: 'TaskOrchestrator'
    });

    try {
      // Simulate task execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      task.status = "completed";
      eventBus.publish({
        type: 'TASK_COMPLETED',
        payload: { taskId: task.id, result: "Success" },
        timestamp: Date.now(),
        source: 'TaskOrchestrator'
      });
    } catch (err: any) {
      task.status = "failed";
      eventBus.publish({
        type: 'TASK_FAILED',
        payload: { taskId: task.id, error: err.message },
        timestamp: Date.now(),
        source: 'TaskOrchestrator'
      });
    }
  }

  public getQueueStatus() {
    return {
      pendingTasks: this.queue.length,
      activeJobs: this.activeJobs,
    };
  }
}

export const taskOrchestrator = new TaskOrchestrator();
