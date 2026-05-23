import { BaseService } from '../../services/base';
import { where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

export interface MemoryEntry {
  id: string;
  brandId: string;
  type: 'preference' | 'interaction' | 'decision' | 'pattern' | 'knowledge';
  key: string;
  value: any;
  importance: number;
  expiresAt?: Date | null;
  timestamp: Date;
}

class AIMemoryService extends BaseService<MemoryEntry> {
  constructor() {
    super('ai_memory');
  }

  async saveMemory(brandId: string, type: MemoryEntry['type'], key: string, value: any, importance: number = 0.5) {
    return this.create({
      brandId,
      type,
      key,
      value,
      importance,
      timestamp: new Date()
    } as any);
  }

  async getRelevantMemory(brandId: string, type?: MemoryEntry['type'], count: number = 10) {
    const filters = [where('brandId', '==', brandId)];
    if (type) filters.push(where('type', '==', type));
    
    const q = this.getBaseQuery(
      ...filters,
      orderBy('importance', 'desc'),
      orderBy('timestamp', 'desc'),
      limit(count)
    );

    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as MemoryEntry));
  }

  async getBrandIdentity(brandId: string) {
    return this.getRelevantMemory(brandId, 'preference', 20);
  }

  async forgetOldMemories() {
    // Logic for memory expiration policies
    // In a real app, this would be a cloud function
  }
}

export const aiMemory = new AIMemoryService();
