import { BaseService } from './base';
import { where, orderBy, limit } from 'firebase/firestore';

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  metadata?: any;
  timestamp: any;
}

class AuditService extends BaseService<AuditLog> {
  constructor() {
    super('audit_logs');
  }

  async log(action: string, resource: string, metadata: any = {}) {
    return this.create({
      action,
      resource,
      metadata
    });
  }

  getLogs(userId: string) {
    return this.getBaseQuery(
      orderBy('timestamp', 'desc'),
      limit(50)
    );
  }
}

export const auditService = new AuditService();
