import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

export interface BrandIdentity {
  id: string;
  userId: string;
  name: string;
  logo?: string;
  description: string;
  industry: string;
  personality: string;
  writingStyle: string;
  preferredWords: string;
  bannedWords: string;
  preferredCta: string;
  targetAudience: string;
  language: string;
  slogans: string;
  colors: string;
  seoUrl?: string;
  seoAutomationEnabled?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  characterPhoto?: string;
  visualCharacterProfile?: string;
  selectedVoice?: string;
  customTones?: { id: string, name: string, prompt: string }[];
  commercialRegister?: string;
  taxId?: string;
  businessCountry?: string;
  googleAdsCustomerId?: string;
  brandIntelligence?: {
    seoHealthScore?: number;
    copyQualityScore?: number;
    visualTrustScore?: number;
    googleAdsPolicyScore?: number;
    scrapedImages?: string[];
    extractedLogo?: string;
    adAngles?: { title: string; desc: string; targetHook: string }[];
    buyerAvatar?: { demographics: string; painPoints: string; buyTriggers: string };
    missingRequirements?: { title: string; desc: string; severity: 'critical' | 'warning' | 'info'; actionKey: string }[];
    lastScannedAt?: string;
  };
  usageStats?: { tokensUsed: number, imageGenerations: number, modelsUsed: Record<string, number> };
  createdAt: any;
  updatedAt: any;
}

interface WorkspaceState {
  brands: BrandIdentity[];
  activeBrand: BrandIdentity | null;
  setActiveBrandId: (id: string) => void;
  createBrand: (brand: Partial<BrandIdentity>) => Promise<void>;
  updateBrand: (id: string, updates: Partial<BrandIdentity>) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export function WorkspaceProvider({ children, user }: { children: React.ReactNode, user: User | null }) {
  const [brands, setBrands] = useState<BrandIdentity[]>([]);
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seedingStartedRef = React.useRef(false);

  useEffect(() => {
    if (!user) {
       setBrands([]);
       setActiveBrandId(null);
       setLoading(false);
       seedingStartedRef.current = false;
       return;
    }
    
    // We are querying by user's actual UID
    const q = query(collection(db, 'brands'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBrands = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BrandIdentity));
      setBrands(fetchedBrands);
      
      if (fetchedBrands.length > 0) {
        setActiveBrandId(current => {
          if (!current || !fetchedBrands.find(b => b.id === current)) {
            return fetchedBrands[0].id;
          }
          return current;
        });
      } else {
        setActiveBrandId(null);
      }
      setLoading(false);
    }, (error: any) => {
      handleFirestoreError(error, OperationType.LIST, 'brands');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]); // Removed activeBrandId dependency

  const activeBrand = brands.find(b => b.id === activeBrandId) || null;

  // Synchronize active brand details with companion store
  useEffect(() => {
    if (activeBrand) {
      import('../core/companion/CompanionState').then(({ useCompanionStore }) => {
        useCompanionStore.getState().setActiveBrandDetails(
          activeBrand.selectedVoice,
          activeBrand.characterPhoto,
          activeBrand.visualCharacterProfile
        );
      }).catch(err => console.warn("Failed to sync active brand details with companion store:", err));
    }
  }, [activeBrand]);

  const createBrand = async (brandData: Partial<BrandIdentity>) => {
    if (!user) throw new Error("Must be logged in to create brand");
    try {
      const docRef = await addDoc(collection(db, 'brands'), {
        ...brandData,
        userId: user.uid,
        usageStats: { tokensUsed: 0, imageGenerations: 0, modelsUsed: {} },
        customTones: brandData.customTones || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setActiveBrandId(docRef.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'brands');
    }
  };

  const updateBrand = async (id: string, updates: Partial<BrandIdentity>) => {
    try {
      // Exclude non-updatable keys (id, userId, createdAt) to satisfy Firestore rules
      const { id: _, userId: __, createdAt: ___, ...allowedUpdates } = updates;
      await updateDoc(doc(db, 'brands', id), {
        ...allowedUpdates,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `brands/${id}`);
    }
  };

  const deleteBrand = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'brands', id));
      if (activeBrandId === id) {
        setActiveBrandId(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `brands/${id}`);
    }
  };

  return (
    <WorkspaceContext.Provider value={{ brands, activeBrand, setActiveBrandId, createBrand, updateBrand, deleteBrand, loading }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}
