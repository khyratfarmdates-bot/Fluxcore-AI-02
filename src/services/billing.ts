import { BaseService } from './base';
import { where, limit, getDocs } from 'firebase/firestore';

export interface BillingRecord {
  id: string;
  userId: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  credits: number;
  usedCredits: number;
  nextBillingDate: any;
}

class BillingService extends BaseService<BillingRecord> {
  constructor() {
    super('billing');
  }

  async getMyPlan(): Promise<BillingRecord | null> {
    const q = this.getBaseQuery(limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as BillingRecord;
    }
    return null;
  }

  async hasCredits(amount: number = 1): Promise<boolean> {
    const plan = await this.getMyPlan();
    if (!plan) return false;
    return (plan.credits - plan.usedCredits) >= amount;
  }

  async deductCredits(amount: number) {
    const plan = await this.getMyPlan();
    if (plan) {
      await this.update(plan.id, {
        usedCredits: plan.usedCredits + amount
      });
    }
  }
}

export const billingService = new BillingService();
