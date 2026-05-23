import { BaseService } from './base';
import { Timestamp } from 'firebase/firestore';

export interface StrategicInsight {
  id: string;
  brandId: string;
  type: 'trend' | 'gap' | 'audience' | 'performance';
  title: string;
  description: string;
  confidence: number;
  actionability: number;
  actionItems?: string[];
  data: Record<string, any>;
  createdAt: Timestamp;
}

export class IntelligenceService extends BaseService<StrategicInsight> {
  constructor() {
    super('strategic_insights');
  }

  async getLatestInsights(brandId: string, limitCount = 5) {
     // For simplicity using field filter, real impl might need order
     return this.getByField('brandId', brandId);
  }
}

export const intelligenceService = new IntelligenceService();
