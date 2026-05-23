import { knowledgeGraph, KnowledgeEntity } from './KnowledgeGraphService';

class OperationalInsightsGraph {
  async detectOperationalGaps(brandId: string) {
    const graph = await knowledgeGraph.getWorkspaceGraph(brandId);
    
    // Gap: Campaigns without content
    const campaigns = graph.nodes.filter(n => n.type === 'campaign');
    const content = graph.nodes.filter(n => n.type === 'content');
    const contentIds = content.map(cn => cn.id);
    
    const gaps = campaigns.filter(c => {
      const hasContentLink = graph.links.some(l => 
        (l.sourceId === c.id && contentIds.includes(l.targetId)) ||
        (l.targetId === c.id && contentIds.includes(l.sourceId))
      );
      return !hasContentLink;
    });

    return {
      emptyCampaigns: gaps,
      orphanContent: content.filter(c => !graph.links.some(l => l.sourceId === c.id || l.targetId === c.id))
    };
  }

  async getPerformanceClusters(brandId: string) {
    // This would analyze performance metrics stored in metadata
    const graph = await knowledgeGraph.getWorkspaceGraph(brandId);
    return graph.nodes.filter(n => (n.metadata?.performance?.score || 0) > 0.8);
  }
}

export const operationalInsights = new OperationalInsightsGraph();
