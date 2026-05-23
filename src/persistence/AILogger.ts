import { db, auth } from '../lib/firebase';
import { safeStringify } from '../lib/safe-stringify';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc,
  getDoc
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', safeStringify(errInfo));
  throw new Error(safeStringify(errInfo));
}

export interface ChatSession {
  id: string;
  brandId: string;
  userId: string;
  title: string;
  lastMessage: string;
  lastMessageRole: string;
  updatedAt: any;
  createdAt: any;
}

export interface AIConversationLog {
  id?: string;
  sessionId?: string;
  brandId: string;
  userId: string;
  agentRole?: string;
  userMessage: string;
  aiResponse: string;
  context?: any;
  timestamp?: any;
  role?: string;
  content?: string;
}

export const AILogger = {
  async logInteraction(data: Omit<AIConversationLog, 'id' | 'timestamp' | 'userId'> & { sessionId?: string }) {
    if (!auth.currentUser) return;
    
    const { sessionId, ...rest } = data;
    const targetSessionId = sessionId || `default_${auth.currentUser.uid}`;

    // 1. Log the message
    let msgRef;
    try {
      msgRef = await addDoc(collection(db, 'ai_interactions'), {
         ...rest,
         sessionId: targetSessionId,
         userId: auth.currentUser.uid,
         timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'ai_interactions');
    }

    // 2. Update Session Metadata
    const sessionRef = doc(db, 'chat_sessions', targetSessionId);
    let sessionSnap;
    try {
      sessionSnap = await getDoc(sessionRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `chat_sessions/${targetSessionId}`);
    }
    
    const sessionData = {
      brandId: data.brandId,
      userId: auth.currentUser.uid,
      lastMessage: data.aiResponse || data.userMessage,
      lastMessageRole: 'assistant',
      updatedAt: serverTimestamp(),
    };

    try {
      if (!sessionSnap.exists()) {
        await setDoc(sessionRef, {
          ...sessionData,
          title: data.userMessage.substring(0, 40) + '...',
          createdAt: serverTimestamp()
        });
      } else {
        await updateDoc(sessionRef, sessionData);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chat_sessions/${targetSessionId}`);
    }
    
    return msgRef.id;
  },

  async createNewSession(brandId: string, title?: string) {
    if (!auth.currentUser) return null;
    try {
      const sessionRef = await addDoc(collection(db, 'chat_sessions'), {
        brandId,
        userId: auth.currentUser.uid,
        title: title || 'محادثة جديدة',
        lastMessage: '',
        lastMessageRole: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return sessionRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chat_sessions');
    }
  },

  subscribeSessions(brandId: string, callback: (sessions: ChatSession[]) => void) {
    if (!auth.currentUser) return () => {};
    const q = query(
      collection(db, 'chat_sessions'),
      where('brandId', '==', brandId),
      where('userId', '==', auth.currentUser.uid),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatSession));
      callback(sessions);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chat_sessions');
    });
  },

  subscribe(brandId: string, sessionId: string, callback: (logs: AIConversationLog[]) => void) {
    if (!auth.currentUser) return () => {};
    
    const q = query(
      collection(db, 'ai_interactions'), 
      where('sessionId', '==', sessionId),
      where('brandId', '==', brandId),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
       const logs = snapshot.docs.map(d => ({
         id: d.id,
         ...d.data()
       } as AIConversationLog));
       callback(logs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ai_interactions');
    });
  }
};
