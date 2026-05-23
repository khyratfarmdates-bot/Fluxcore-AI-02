import { BaseService } from './base';
import { where, orderBy, limit } from 'firebase/firestore';

export interface PublishingTask {
  id: string;
  brandId: string;
  userId: string;
  content: string;
  platform: string;
  status: 'queued' | 'scheduled' | 'publishing' | 'published' | 'failed';
  scheduledTime: any;
  error?: string;
  createdAt: any;
}

class PublishingService extends BaseService<PublishingTask> {
  constructor() {
    super('publishing_queue');
  }

  getQueueQuery(brandId: string) {
    return this.getBaseQuery(
      where('brandId', '==', brandId),
      orderBy('createdAt', 'desc')
    );
  }

  async retryTask(id: string) {
    return this.update(id, { status: 'queued', error: '' });
  }

  async schedulePost(brandId: string, content: string, platform: string, scheduledTime?: Date) {
    return this.create({
      brandId,
      content,
      platform,
      status: scheduledTime ? 'scheduled' : 'queued',
      scheduledTime: scheduledTime || null
    } as any);
  }

  async getHistory(brandId: string) {
    return this.getBaseQuery(
      where('brandId', '==', brandId),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(20)
    );
  }

  async deleteTask(id: string) {
    return this.delete(id);
  }
}

export const publishingService = new PublishingService();
