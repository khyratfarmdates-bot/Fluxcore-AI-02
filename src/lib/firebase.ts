import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore, initializeFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfigImport from "../../firebase-applet-config.json";
import { toast } from './soundToast';

const firebaseConfig = firebaseConfigImport as any;

console.log("Firebase initialized with project:", firebaseConfig.projectId);

export const app = initializeApp(firebaseConfig);

const getDb = () => {
  try {
    return firebaseConfig.firestoreDatabaseId &&
      firebaseConfig.firestoreDatabaseId !== "(default)"
      ? initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId)
      : initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch (e) {
    console.error("Failed to initialize Firestore:", e);
    return getFirestore(app);
  }
};
export const db = getDb();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const appleProvider = new OAuthProvider("apple.com");

// TikTok is not natively supported in standard Firebase Auth providers list
// It usually requires a custom backend or OIDC setup.
// We will placeholder it for visibility
export const tiktokProvider = new OAuthProvider("oidc.tiktok"); 

// Standard login function using popup (best for iframe environments)
export const signInWithProvider = async (provider: any) => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.error("Detailed Login Error:", error);
    handleAuthError(error);
    throw error;
  }
};

const handleAuthError = (error: any) => {
  if (error.code === "auth/unauthorized-domain") {
    toast.error(
      "خطأ في النطاق: يرجى إضافة " +
        window.location.hostname +
        " إلى 'Authorized Domains' في إعدادات Firebase.",
    );
  } else if (error.code === "auth/api-key-not-valid") {
    toast.error(
      "خطأ في مفتاح الـ API: المفتاح الموجود في ملف الإعدادات غير صالح.",
    );
  } else if (error.code === "auth/popup-blocked") {
    toast.error("Popup Blocked: يرجى السماح بالنوافذ المنبثقة.");
  } else if (error.code === "auth/operation-not-allowed") {
    toast.error("هذه الطريقة غير مفعلة في لوحة تحكم Firebase.");
  } else {
    toast.error("Login Error: " + error.message);
  }
};

export const signInWithGoogle = () => signInWithProvider(googleProvider);
export const signInWithFacebook = () => signInWithProvider(facebookProvider);
export const signInWithApple = () => signInWithProvider(appleProvider);
export const signInWithTikTok = () => signInWithProvider(tiktokProvider);

export const signUpEmail = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const signInEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);

export const logout = () => signOut(auth);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
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
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", errInfo.error, "Path:", errInfo.path);
  // Throw a simpler stringified version or just the error message
  throw new Error(
    `Firestore Error [${operationType}] at ${path}: ${errInfo.error}`,
  );
}
