import { knowledgeGraph } from './KnowledgeGraphService';

export interface DecisionStep {
  id: string;
  action: string;
  reasoning: string;
  impact?: string;
  timestamp: Date;
}

class DecisionChainTracker {
  async recordDecision(brandId: string, title: string, steps: DecisionStep[], outcome?: string) {
    // 1. Create a decision entity
    const decisionNodeId = await knowledgeGraph.addEntity(
      brandId, 
      'decision', 
      title, 
      { steps, outcome },
      'HIGH'
    );

    // 2. Link to related systems (Audit, Performance, etc if available)
    await knowledgeGraph.linkEntities(brandId, decisionNodeId, 'SYSTEM_OS', 'EXECUTED_BY', 1.0);

    return decisionNodeId;
  }

  async linkDecisionToCampaign(brandId: string, decisionId: string, campaignId: string) {
    await knowledgeGraph.linkEntities(brandId, decisionId, campaignId, 'AFFECTS', 0.9);
  }

  async linkDecisionToContent(brandId: string, decisionId: string, contentId: string) {
    await knowledgeGraph.linkEntities(brandId, decisionId, contentId, 'RESULTED_IN', 0.8);
  }
}

export const decisionChainTracker = new DecisionChainTracker();
