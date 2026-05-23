import { BaseService } from './base';
import { type Workflow } from '../automation/types';
import { where, orderBy } from 'firebase/firestore';

class AutomationService extends BaseService<Workflow> {
  constructor() {
    super('workflows');
  }

  getWorkflowsQuery(brandId: string) {
    return this.getBaseQuery(
      where('brandId', '==', brandId),
      orderBy('createdAt', 'desc')
    );
  }

  async toggleActive(id: string, currentStatus: boolean) {
    const newActive = !currentStatus;
    return this.update(id, { 
      active: newActive,
      status: newActive ? 'Waiting' : 'Idle'
    } as any);
  }
}

export const automationService = new AutomationService();
