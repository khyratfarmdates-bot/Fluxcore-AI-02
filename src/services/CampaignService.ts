import { BaseService } from './base';
import { Timestamp } from 'firebase/firestore';

export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  objective: 'awareness' | 'conversion' | 'engagement' | 'sales' | 'community';
  status: 'draft' | 'active' | 'completed' | 'paused';
  startDate: Timestamp;
  endDate: Timestamp;
  platforms: string[];
  kpis: Record<string, any>;
  budget: number;
  createdAt: Timestamp;
}

export class CampaignService extends BaseService<Campaign> {
  constructor() {
    super('campaigns');
  }

  async getActiveCampaigns(brandId: string) {
    return this.getByField('brandId', brandId);
  }
}

export const campaignService = new CampaignService();
