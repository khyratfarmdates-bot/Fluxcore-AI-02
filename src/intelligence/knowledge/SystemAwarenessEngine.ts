import { eventBus } from '../../core/events/EventBus';
import { knowledgeGraph } from './KnowledgeGraphService';

class SystemAwarenessEngine {
  constructor() {
    this.startDiscovery();
  }

  private startDiscovery() {
    // Discovery of core systems
    eventBus.subscribe('SYSTEM_BOOT', async (evt: any) => {
       // Register core components as system entities
    });

    eventBus.subscribe('TASK_COMPLETED', async (evt: any) => {
      await this.mapExecutionToKnowledge(evt);
    });

    eventBus.subscribe('CAMPAIGN_CREATED', async (evt: any) => {
      await this.mapCampaignToKnowledge(evt);
    });

    eventBus.subscribe('CONTENT_PUBLISHED', async (evt: any) => {
      await this.mapContentToKnowledge(evt);
    });

    eventBus.subscribe('DECISION_MADE', async (evt: any) => {
      await this.mapDecisionToKnowledge(evt);
    });
  }

  private async mapContentToKnowledge(event: any) {
    const { brandId, contentId, campaignId, platform } = event.payload;
    const contentNodeId = await knowledgeGraph.addEntity(brandId, 'content', `Post: ${contentId}`, { contentId });
    
    if (campaignId) {
      await knowledgeGraph.linkEntities(brandId, contentNodeId, campaignId, 'PART_OF', 1.0);
    }
  }

  private async mapDecisionToKnowledge(event: any) {
    const { brandId, title, steps, outcome } = event.payload;
    await knowledgeGraph.addEntity(brandId, 'decision', title, { steps, outcome }, 'HIGH');
  }

  private async mapExecutionToKnowledge(event: any) {
    const { brandId, type, payload } = event;
    if (!brandId) return;

    // Create execution entity (returns ID as string)
    const executionNodeId = await knowledgeGraph.addEntity(brandId, 'process', `Execution: ${type}`, {
      status: 'completed',
      originalEvent: event
    });

    // Link to system
    await knowledgeGraph.linkEntities(brandId, executionNodeId, 'SYSTEM_CORE', 'EXECUTED_BY');
  }

  private async mapCampaignToKnowledge(event: any) {
    const { brandId, campaignId, name, platforms } = event.payload;
    
    const campaignNodeId = await knowledgeGraph.addEntity(brandId, 'campaign', name, { campaignId });

    for (const platform of platforms) {
      const platformNodeId = await knowledgeGraph.addEntity(brandId, 'platform', platform, {});
      await knowledgeGraph.linkEntities(brandId, campaignNodeId, platformNodeId, 'DEPLOYED_ON');
    }
  }

  public async getSituationalContext(brandId: string) {
    // Get recent entities and relationships to provide "Awareness"
    const graph = await knowledgeGraph.getWorkspaceGraph(brandId);
    return graph;
  }
}

export const systemAwareness = new SystemAwarenessEngine();
