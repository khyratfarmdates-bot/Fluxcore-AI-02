import { AgentRole, AgentDescriptor } from './AgentRegistry';
import { aiMemory } from '../memory/AIMemoryService';
import { eventBus } from '../../core/events/EventBus';
import { BaseService } from '../../services/base';

export interface AgentTask {
  id?: string;
  brandId: string;
  agentRole: AgentRole;
  objective: string;
  context: any;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  assignedAt: Date;
  completedAt?: Date;
}

export abstract class BaseAgent {
  protected taskService = new BaseService<AgentTask>('agent_tasks');
  
  constructor(protected descriptor: AgentDescriptor) {}

  public getRole(): AgentRole {
    return this.descriptor.role;
  }

  public getDescriptor(): AgentDescriptor {
    return this.descriptor;
  }

  async executeTask(brandId: string, objective: string, context: any): Promise<any> {
    const task = await this.taskService.create({
      brandId,
      agentRole: this.descriptor.role,
      objective,
      context,
      status: 'in_progress',
      assignedAt: new Date()
    } as any);

    try {
      const result = await this.process(brandId, objective, context);
      await this.taskService.update(task, {
        status: 'completed',
        result,
        completedAt: new Date()
      });
      
      this.logActivity(brandId, `Objective Completed: ${objective}`);
      return result;
    } catch (error: any) {
      await this.taskService.update(task, {
        status: 'failed',
        result: { error: error.message }
      });
      throw error;
    }
  }

  protected abstract process(brandId: string, objective: string, context: any): Promise<any>;

  protected async logActivity(brandId: string, activity: string) {
    eventBus.publish({
      type: 'AGENT_ACTIVITY',
      source: this.descriptor.role as string,
      payload: { activity, brandId },
      timestamp: Date.now()
    });
    
    await aiMemory.saveMemory(brandId, 'interaction', `AGENT_ACTIVITY_${this.descriptor.role}`, { activity }, 0.4);
  }
}
