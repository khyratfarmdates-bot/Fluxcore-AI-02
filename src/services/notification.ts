import { BaseService } from './base';
import { where, orderBy, limit } from 'firebase/firestore';

import { db, auth } from '../lib/firebase';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: any;
}

class NotificationService extends BaseService<Notification> {
  constructor() {
    super('notifications');
  }

  getNotificationsQuery() {
    return this.getBaseQuery(
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }

  async markAsRead(id: string) {
    return this.update(id, { read: true });
  }

  async markAllAsRead(notifications: Notification[]) {
    const unread = notifications.filter(n => !n.read);
    return Promise.all(unread.map(n => this.markAsRead(n.id)));
  }

  async createNotification(userId: string, title: string, message: string, type: Notification['type'] = 'info') {
    return this.create({
      userId: userId === 'system' && auth.currentUser ? auth.currentUser.uid : userId,
      title,
      message,
      type,
      read: false
    } as any);
  }
}

export const notificationService = new NotificationService();
