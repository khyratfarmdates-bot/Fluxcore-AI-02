import { BaseService } from '../../services/base';
import { where, getDocs, query, limit, orderBy } from 'firebase/firestore';

export interface KnowledgeEntity {
  id: string;
  brandId: string;
  type: 'campaign' | 'content' | 'platform' | 'audience' | 'process' | 'system' | 'decision';
  name: string;
  relevanceScore?: number;
  priorityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata: any;
  timestamp: Date;
}

export interface KnowledgeRelationship {
  id: string;
  brandId: string;
  sourceId: string;
  targetId: string;
  type: string; // e.g., "PART_OF", "TARGETS", "DERIVED_FROM", "EXECUTED_BY"
  strength: number;
  metadata: any;
  timestamp: Date;
}

class KnowledgeGraphService {
  private entityService = new BaseService<KnowledgeEntity>('knowledge_entities');
  private relationshipService = new BaseService<KnowledgeRelationship>('knowledge_relationships');

  async addEntity(brandId: string, type: KnowledgeEntity['type'], name: string, metadata: any = {}, priority: KnowledgeEntity['priorityLevel'] = 'MEDIUM') {
    return this.entityService.create({
      brandId,
      type,
      name,
      metadata,
      priorityLevel: priority,
      relevanceScore: 1.0,
      timestamp: new Date()
    } as any);
  }

  async linkEntities(brandId: string, sourceId: string, targetId: string, type: string, strength: number = 1, metadata: any = {}) {
    return this.relationshipService.create({
      brandId,
      sourceId,
      targetId,
      type,
      strength,
      metadata,
      timestamp: new Date()
    } as any);
  }

  async getWorkspaceGraph(brandId: string) {
    const [entities, relationships] = await Promise.all([
      this.entityService.getAll(), // Needs filtering by brandId in real app
      this.relationshipService.getAll() // Needs filtering by brandId in real app
    ]);

    // Filter by brandId manually since getAll doesn't filter yet (I should probably use getRelevant if I had it)
    return {
      nodes: entities.filter(e => e.brandId === brandId),
      links: relationships.filter(r => r.brandId === brandId)
    };
  }

  async findRelated(entityId: string, brandId: string) {
    const relationships = await this.relationshipService.getAll();
    const relatedLinks = relationships.filter(r => r.brandId === brandId && (r.sourceId === entityId || r.targetId === entityId));
    
    const relatedEntityIds = Array.from(new Set(relatedLinks.flatMap(r => [r.sourceId, r.targetId])));
    const allEntities = await this.entityService.getAll();
    
    return allEntities.filter(e => relatedEntityIds.includes(e.id) && e.id !== entityId);
  }
}

export const knowledgeGraph = new KnowledgeGraphService();
