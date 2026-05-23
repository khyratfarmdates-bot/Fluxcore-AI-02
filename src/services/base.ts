import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  getDocs,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

export class BaseService<T extends DocumentData> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected get user() {
    if (!auth.currentUser) throw new Error("User not authenticated");
    return auth.currentUser;
  }

  async create(data: Partial<T>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...data,
        userId: this.user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, this.collectionName);
      return '';
    }
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${this.collectionName}/${id}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${this.collectionName}/${id}`);
    }
  }

  async getById(id: string): Promise<T | null> {
    if (!id || id === 'default') {
      return null;
    }
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as unknown as T;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${this.collectionName}/${id}`);
      return null;
    }
  }

  async getAll(): Promise<T[]> {
    try {
      const q = this.getBaseQuery();
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, this.collectionName);
      return [];
    }
  }

  async getByField(field: string, value: any): Promise<T[]> {
    try {
      const q = this.getBaseQuery(where(field, '==', value));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, this.collectionName);
      return [];
    }
  }

  protected getBaseQuery(...constraints: QueryConstraint[]) {
    return query(
      collection(db, this.collectionName),
      where('userId', '==', this.user.uid),
      ...constraints
    );
  }
}
