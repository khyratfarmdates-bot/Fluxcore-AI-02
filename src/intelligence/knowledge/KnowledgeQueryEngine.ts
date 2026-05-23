import { knowledgeGraph, KnowledgeEntity, KnowledgeRelationship } from './KnowledgeGraphService';
import { safeStringify } from '../../lib/safe-stringify';

class KnowledgeQueryEngine {
  async queryByContext(brandId: string, keyword: string): Promise<KnowledgeEntity[]> {
    const graph = await knowledgeGraph.getWorkspaceGraph(brandId);
    const searchLower = keyword.toLowerCase();

    return graph.nodes.filter(node => 
      node.name.toLowerCase().includes(searchLower) ||
      safeStringify(node.metadata).toLowerCase().includes(searchLower)
    ).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  async getOperationalPath(brandId: string, startNodeId: string, depth: number = 2): Promise<any> {
    const graph = await knowledgeGraph.getWorkspaceGraph(brandId);
    
    const nodes = new Map<string, KnowledgeEntity>();
    const links: KnowledgeRelationship[] = [];
    
    const traverse = (currentId: string, currentDepth: number) => {
      if (currentDepth > depth) return;
      
      const node = graph.nodes.find(n => n.id === currentId);
      if (node) nodes.set(node.id, node);

      const relatedLinks = graph.links.filter(l => l.sourceId === currentId || l.targetId === currentId);
      relatedLinks.forEach(link => {
        links.push(link);
        const nextId = link.sourceId === currentId ? link.targetId : link.sourceId;
        if (!nodes.has(nextId)) {
          traverse(nextId, currentDepth + 1);
        }
      });
    };

    traverse(startNodeId, 0);

    return {
      nodes: Array.from(nodes.values()),
      links: Array.from(new Set(links)) // Deduplicate links
    };
  }

  async getExecutiveInsights(brandId: string) {
    const graph = await knowledgeGraph.getWorkspaceGraph(brandId);
    
    // Find clusters or high-priority nodes
    const highPriority = graph.nodes.filter(n => n.priorityLevel === 'CRITICAL' || n.priorityLevel === 'HIGH');
    const decisions = graph.nodes.filter(n => n.type === 'decision');

    return {
      focusNodes: highPriority,
      recentDecisions: decisions.slice(0, 5),
      graphHealth: graph.nodes.length > 0 ? "STABLE" : "EMPTY"
    };
  }
}

export const knowledgeQueryEngine = new KnowledgeQueryEngine();
