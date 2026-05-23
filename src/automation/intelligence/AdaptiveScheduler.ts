export interface ScheduledTask {
  id: string;
  brandId: string;
  executionTime: Date;
  taskData: any;
  priority: number;
}

class AdaptiveScheduler {
  private queue: ScheduledTask[] = [];

  scheduleTask(brandId: string, task: any, preferredTime?: Date) {
    const newTask: ScheduledTask = {
      id: Math.random().toString(36).substr(2, 9),
      brandId,
      executionTime: preferredTime || new Date(),
      taskData: task,
      priority: task.priority || 1
    };

    this.queue.push(newTask);
    this.rebalanceQueue();
    return newTask.id;
  }

  private rebalanceQueue() {
    this.queue.sort((a, b) => b.priority - a.priority || a.executionTime.getTime() - b.executionTime.getTime());
  }

  getNextTask() {
    return this.queue.shift();
  }

  getQueueStatus(brandId: string) {
    return this.queue.filter(t => t.brandId === brandId);
  }
}

export const adaptiveScheduler = new AdaptiveScheduler();
