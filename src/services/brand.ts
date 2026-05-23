import { BaseService } from './base';
import { where, getDocs, limit } from 'firebase/firestore';

export interface Brand {
  id: string;
  userId: string;
  name: string;
  description: string;
  industry: string;
  personality?: string;
  writingStyle?: string;
  preferredWords?: string[];
  bannedWords?: string[];
  preferredCta?: string;
  targetAudience?: string;
  language: string;
  slogans?: string[];
  colors?: string[];
  updatedAt: any;
}

class BrandService extends BaseService<Brand> {
  constructor() {
    super('brands');
  }

  async getMyBrands() {
    return this.getBaseQuery();
  }

  async updatePersonality(id: string, personality: string) {
    return this.update(id, { personality, updatedAt: new Date() } as any);
  }
}

export const brandService = new BrandService();
