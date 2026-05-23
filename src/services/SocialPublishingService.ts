import { eventBus } from '../core/events/EventBus';
import { IntegrationEngine } from '../integrations/CoreEngine';
import { IntegrationAccount } from '../integrations/types';
import { BaseService } from './base';
import { Timestamp } from 'firebase/firestore';

export interface SocialPostTask {
  id: string;
  brandId: string;
  platforms: string[];
  content: string;
  mediaUrls?: string[];
  scheduledTime?: Timestamp;
  status: 'pending' | 'processing' | 'published' | 'failed' | 'partially_published';
  results: Record<string, { success: boolean; postId?: string; error?: string }>;
  createdAt: Timestamp;
}

export class SocialPublishingService extends BaseService<SocialPostTask> {
  constructor() {
    super('social_publishing_tasks');
  }

  async publishNow(brandId: string, platforms: string[], content: string, mediaUrls?: string[]) {
    // Validation Layer
    const validationErrors: string[] = [];
    for (const platform of platforms) {
       if (platform === 'x' && content.length > 280) validationErrors.push('X: النص يتجاوز 280 حرفاً');
       if (platform === 'instagram' && (!mediaUrls || mediaUrls.length === 0)) validationErrors.push('Instagram: يتطلب صورة أو فيديو على الأقل');
    }

    if (validationErrors.length > 0) {
       throw new Error(validationErrors.join(' | '));
    }

    const task: Partial<SocialPostTask> = {
      brandId,
      platforms,
      content,
      mediaUrls,
      status: 'processing',
      results: {},
      createdAt: Timestamp.now()
    };

    const taskId = await this.create(task as SocialPostTask);
    
    // Process async
    this.executePublishing(taskId, brandId, platforms, content, mediaUrls);

    return taskId;
  }

  private async executePublishing(taskId: string, brandId: string, platforms: string[], content: string, mediaUrls?: string[]) {
    const results: SocialPostTask['results'] = {};
    let successCount = 0;

    // Notify operational hub
    eventBus.publish({
      type: 'OPERATIONAL_LIVE_EVENT',
      source: 'SocialPublishingService',
      timestamp: Date.now(),
      payload: {
        type: 'PUBLISHING',
        message: `جاري النشر على ${platforms.join(', ')}...`,
        status: 'pending',
        timestamp: Date.now()
      }
    });

    for (const platform of platforms) {
      try {
        const result = await IntegrationEngine.executeAction(brandId, platform as any, 'publish_post', {
          content,
          mediaUrls
        });

        results[platform] = {
          success: result.success,
          postId: result.data?.postId,
          error: result.error
        };

        if (result.success) successCount++;
      } catch (err) {
        results[platform] = { success: false, error: String(err) };
      }
    }

    const finalStatus = successCount === platforms.length ? 'published' : (successCount > 0 ? 'partially_published' : 'failed');
    
    await this.update(taskId, {
      status: finalStatus,
      results
    });

    eventBus.publish({
      type: 'OPERATIONAL_LIVE_EVENT',
      source: 'SocialPublishingService',
      timestamp: Date.now(),
      payload: {
        type: 'PUBLISHING',
        message: finalStatus === 'published' ? 'تم النشر بنجاح على جميع المنصات!' : `فشل النشر على بعض المنصات. تم النشر على ${successCount}/${platforms.length}`,
        status: finalStatus === 'published' ? 'success' : 'failure',
        timestamp: Date.now()
      }
    });
  }

  async getPlatformStatus(brandId: string) {
     const integrations = await IntegrationEngine.getActiveIntegrations(brandId);
     return integrations.map(i => ({
        id: i.id,
        provider: i.provider,
        status: i.status,
        lastSyncedAt: i.lastSyncedAt
     }));
  }
}

export const socialPublishing = new SocialPublishingService();
