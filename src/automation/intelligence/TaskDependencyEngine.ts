import { knowledgeGraph } from '../../intelligence/knowledge/KnowledgeGraphService';

export interface TaskNode {
  id: string;
  brandId: string;
  name: string;
  dependencies: string[];
  status: 'pending' | 'ready' | 'blocked' | 'completed';
}

class TaskDependencyEngine {
  async resolveDependencies(brandId: string, taskId: string): Promise<boolean> {
    // Check Knowledge Graph for existing relationships
    const graph = await knowledgeGraph.getWorkspaceGraph(brandId);
    
    const taskLink = graph.links.find(l => l.targetId === taskId && l.type === 'DEPENDS_ON');
    
    if (!taskLink) return true; // No dependencies found

    // Check if the dependency is completed
    const sourceNode = graph.nodes.find(n => n.id === taskLink.sourceId);
    return sourceNode?.metadata?.status === 'completed';
  }

  async mapOperationalDependency(brandId: string, taskId: string, dependsOnId: string) {
    await knowledgeGraph.linkEntities(brandId, dependsOnId, taskId, 'DEPENDS_ON', 1.0);
  }
}

export const taskDependencyEngine = new TaskDependencyEngine();
