import { eventBus } from '../core/events/EventBus';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

class UsageTrackingService {
  constructor() {
    eventBus.subscribe('CONTENT_GENERATED', async (evt: any) => {
      const { workspaceId, type } = evt.payload;
      if (!workspaceId || workspaceId === 'default') return;

      try {
        const brandRef = doc(db, 'brands', workspaceId);
        
        // Let's do a simple increment for the fields
        const updates: Record<string, any> = {};
        
        // Approximate token cost
        const tokenCost = type === 'image' ? 0 : 500; // rough estimate
        
        updates['usageStats.tokensUsed'] = increment(tokenCost);
        
        if (type === 'image') {
           updates['usageStats.imageGenerations'] = increment(1);
        }

        // Just blindly increment, assuming document structure can take composite fields
        await updateDoc(brandRef, updates);
      } catch (e) {
        console.error('Failed to track AI usage on brand:', e);
      }
    });
  }
}

export const usageTrackingService = new UsageTrackingService();
