import { AgentRole, AGENT_REGISTRY } from './AgentRegistry';
import { BaseAgent } from './BaseAgent';
import { eventBus } from '../../core/events/EventBus';

class ExecutiveAgentOrchestrator {
  private agents: Map<AgentRole, BaseAgent> = new Map();

  public registerAgent(agent: BaseAgent) {
    this.agents.set(agent.getRole(), agent);
    console.log(`[Orchestrator] Registered ${agent.getRole()}`);
  }

  public getAgent(role: AgentRole): BaseAgent | undefined {
    return this.agents.get(role);
  }

  public async delegate(brandId: string, objective: string, context: any): Promise<any> {
    // 1. Determine best agent for objective (Simple routing for now)
    const targetRole = this.routeTask(objective);
    const agent = this.agents.get(targetRole);

    if (!agent) {
      throw new Error(`[Orchestrator] No agent active for role: ${targetRole}`);
    }

    eventBus.publish({
      type: 'TASK_DELEGATED',
      source: 'ORCHESTRATOR',
      payload: { targetRole, objective, brandId },
      timestamp: Date.now()
    });

    return agent.executeTask(brandId, objective, context);
  }

  private routeTask(objective: string): AgentRole {
    const obj = objective.toLowerCase();
    if (obj.includes('content') || obj.includes('post') || obj.includes('narrative')) return 'CONTENT_STRATEGIST';
    if (obj.includes('publish') || obj.includes('schedule')) return 'PUBLISHING_OFFICER';
    if (obj.includes('analytics') || obj.includes('data') || obj.includes('metrics')) return 'ANALYTICS_DIRECTOR';
    if (obj.includes('workflow') || obj.includes('automate')) return 'AUTOMATION_ARCHITECT';
    if (obj.includes('image') || obj.includes('media') || obj.includes('video')) return 'MEDIA_PRODUCER';
    if (obj.includes('youtube') || obj.includes('نشر') || obj.includes('يوتيوب') || obj.includes('retention') || obj.includes('subscriber')) return 'YOUTUBE_GROWTH_SPECIALIST';
    
    return 'CONTENT_STRATEGIST'; // Default
  }

  public async coordinateCollaborative(brandId: string, goal: string, context: any) {
    // Shared mission: e.g. "Launch a new campaign"
    // Orchestrator splits goal into multiple agent tasks
    
    // 1. Content Strategist creates brief
    const brief = await this.delegate(brandId, `Create brief for goal: ${goal}`, context);
    
    // 2. Media Producer creates visual assets based on brief
    const assets = await this.delegate(brandId, `Generate assets for mission`, { ...context, brief });
    
    // 3. Automation Architect sets up triggers
    await this.delegate(brandId, `Setup workflow for ${goal}`, { ...context, brief, assets });

    return { brief, assets, status: 'CAMPAIGN_STAGED' };
  }
}

export const agentOrchestrator = new ExecutiveAgentOrchestrator();
