import { auth } from "./firebase";
import { errorTracker } from "../core/monitoring/ErrorTracker";

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

import { safeStringify } from './safe-stringify';

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  
  // Track error in system monitoring
  errorTracker.captureError(error, `firestore:${operationType}`, "high", { path, operation: operationType });
  
  console.error('Firestore Error: ', safeStringify(errInfo));
  
  // We throw a standardized error that can be caught by services or UI
  const friendlyMessage = translateFirestoreError(error);
  const finalError = new Error(friendlyMessage);
  (finalError as any).details = errInfo;
  throw finalError;
}

function translateFirestoreError(error: any): string {
  if (error?.code === 'permission-denied') {
    return 'عذراً، ليس لديك الصلاحية لتنفيذ هذه العملية.';
  }
  if (error?.code === 'unauthenticated') {
    return 'يرجى تسجيل الدخول أولاً.';
  }
  return error instanceof Error ? error.message : 'حدث خطأ غير متوقع في قاعدة البيانات.';
}
