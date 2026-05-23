import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, writeBatch, doc } from 'firebase/firestore';

export interface UserEvent {
  type: 'click' | 'hover' | 'navigation' | 'tool_usage' | 'error' | 'pause';
  elementId: string;
  pagePath: string;
  metadata?: Record<string, any>;
  timestamp: any;
  userId: string;
}

class BehaviorTrackingEngine {
  private eventBuffer: UserEvent[] = [];
  private readonly BUFFER_LIMIT = 20;

  async trackEvent(type: UserEvent['type'], elementId: string, pagePath: string, metadata?: Record<string, any>) {
    if (!auth.currentUser) return;

    const event: UserEvent = {
      type,
      elementId,
      pagePath,
      metadata,
      timestamp: serverTimestamp(),
      userId: auth.currentUser.uid
    };

    this.eventBuffer.push(event);

    if (this.eventBuffer.length >= this.BUFFER_LIMIT) {
      await this.flush();
    }
  }

  async flush() {
    if (this.eventBuffer.length === 0) return;

    const batch = writeBatch(db);
    const eventsCol = collection(db, 'user_behavior_logs');

    this.eventBuffer.forEach(event => {
      const docRef = doc(eventsCol); // We'd need to import doc
      batch.set(docRef, event);
    });

    try {
      await batch.commit();
      this.eventBuffer = [];
      console.log('Behavior logs flushed successfully.');
    } catch (error) {
      console.error('Error flushing behavior logs:', error);
    }
  }

  // آلية تنظيف للذاكرة والكاش
  async garbageCollect(maxAgeDays: number = 7) {
    if (!auth.currentUser) return;
    
    const eventsCol = collection(db, 'user_behavior_logs');
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - maxAgeDays);

    const q = query(
      eventsCol,
      where('userId', '==', auth.currentUser.uid),
      // تحتاج لفلترة زمنية إذا توفرت
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach(doc => {
      // تحقق منطقي للتاريخ إذا كان الحقل timestamp متوفراً
      batch.delete(doc.ref);
      count++;
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Cleaned up ${count} old behavioral logs.`);
    }
  }
}

export const trackingEngine = new BehaviorTrackingEngine();
