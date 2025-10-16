// services/firestore.ts
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  WhereFilterOp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BaseDocument } from '@/types/firebase';

export class FirestoreService {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Crear documento
  async create<T extends BaseDocument>(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  // Obtener documento por ID
  async getById<T extends BaseDocument>(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  // Obtener todos los documentos
  async getAll<T extends BaseDocument>(): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T));
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  // Actualizar documento
  async update<T extends BaseDocument>(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>) {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // Eliminar documento
  async delete(id: string) {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Consulta personalizada
  async query<T extends BaseDocument>(
    whereConditions: Array<{field: string, operator: WhereFilterOp, value: unknown}> = [],
    orderByField?: string,
    limitCount?: number
  ): Promise<T[]> {
    try {
      let q = query(collection(db, this.collectionName));

      // Agregar condiciones where
      whereConditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });

      // Agregar ordenamiento
      if (orderByField) {
        q = query(q, orderBy(orderByField));
      }

      // Agregar límite
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T));
    } catch (error) {
      console.error('Error querying documents:', error);
      throw error;
    }
  }
}