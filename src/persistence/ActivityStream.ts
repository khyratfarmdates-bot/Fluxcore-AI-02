import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export interface ActivityEvent {
  id?: string;
  userId: string;
  brandId?: string;
  action: string;
  resource: string;
  metadata?: any;
  timestamp?: any;
}

export const ActivityStream = {
  async log(action: string, resource: string, metadata?: any, brandId?: string) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'audit_logs'), {
         userId: auth.currentUser.uid,
         brandId: brandId || null,
         action,
         resource,
         metadata: metadata || {},
         timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  },

  subscribe(brandId: string | null, callback: (events: ActivityEvent[]) => void) {
    if (!auth.currentUser) return () => {};
    
    let q;
    if (brandId) {
      q = query(
        collection(db, 'audit_logs'), 
        where('userId', '==', auth.currentUser.uid),
        where('brandId', '==', brandId),
        orderBy('timestamp', 'desc')
      );
    } else {
      q = query(
        collection(db, 'audit_logs'), 
        where('userId', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc')
      );
    }

    return onSnapshot(q, (snapshot) => {
       const events = snapshot.docs.map(d => ({
         id: d.id,
         ...d.data()
       } as ActivityEvent));
       callback(events);
    });
  }
};
