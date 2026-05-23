import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export interface AutonomousExecution {
  id?: string;
  brandId: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentStep: number;
  triggeredBy: string;
  timestamp?: any;
}

export const ExecutionTracker = {
  async startExecution(brandId: string, workflowId: string, triggeredBy: string) {
    if (!auth.currentUser) return null;
    try {
      const docRef = await addDoc(collection(db, 'autonomous_executions'), {
         brandId,
         userId: auth.currentUser.uid, // ADDED: Required for security rules
         workflowId,
         status: 'running',
         currentStep: 0,
         triggeredBy,
         timestamp: serverTimestamp()
      });
      return docRef.id;
    } catch(e) {
      console.error(e);
      return null;
    }
  },

  async updateExecution(id: string, updates: Partial<AutonomousExecution>) {
    try {
      await updateDoc(doc(db, 'autonomous_executions', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    }
  },

  subscribe(brandId: string, callback: (executions: AutonomousExecution[]) => void) {
    if (!auth.currentUser) return () => {};
    const q = query(
      collection(db, 'autonomous_executions'),
      where('brandId', '==', brandId),
      where('userId', '==', auth.currentUser.uid), // ADDED: Filter by user
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
       const executions = snapshot.docs.map(d => ({
         id: d.id,
         ...d.data()
       } as AutonomousExecution));
       callback(executions);
    });
  }
};
