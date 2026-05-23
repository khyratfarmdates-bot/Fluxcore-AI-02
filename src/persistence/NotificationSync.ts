import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export interface NotificationRecord {
  id?: string;
  userId: string;
  brandId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt?: any;
}

export const NotificationSync = {
  async send(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', brandId?: string) {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: auth.currentUser.uid,
        brandId: brandId || null,
        title,
        message,
        type,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to send remote notification", e);
    }
  },

  async markAsRead(id: string) {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  },

  subscribe(callback: (notifications: NotificationRecord[]) => void) {
    if (!auth.currentUser) return () => {};

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid)
    );

    return onSnapshot(q, (snapshot) => {
       const notifications = snapshot.docs.map(d => ({
         id: d.id,
         ...d.data()
       } as NotificationRecord));
       
       // Sort locally since we removed orderBy to avoid composite index requirement
       notifications.sort((a, b) => {
          const tA = a.createdAt?.toMillis?.() || Date.now();
          const tB = b.createdAt?.toMillis?.() || Date.now();
          return tB - tA;
       });
       
       callback(notifications);
    });
  }
};
