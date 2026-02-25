import {
  doc,
  setDoc,
  getDoc,
  collection,
  writeBatch,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './client';

const CHUNK_SIZE = 800 * 1024; // ~800KB safe limit

export interface FileData {
  id?: string;
  name: string;
  type: string;
  size: number;
  base64: string;
  uploadedBy: string;
  uploadedAt?: Timestamp;
  linkedEntities?: string[];
}

export interface KeyData {
  id?: string;
  key: string;
  createdAt: Timestamp;
  expiresAt?: Timestamp | null;
  used: boolean;
  usedBy?: string;
  usedAt?: Timestamp;
  role: 'user';
}

export const firestoreAdapter = {
  addFile: async (fileData: Partial<FileData>): Promise<string> => {
    try {
      const fileId = crypto.randomUUID();
      const fileRef = doc(db, 'files', fileId);
      const batch = writeBatch(db);

      const base64 = fileData.base64 || '';

      if (base64.length <= CHUNK_SIZE) {
        batch.set(fileRef, {
          name: fileData.name,
          type: fileData.type,
          size: fileData.size,
          base64: base64,
          uploadedBy: fileData.uploadedBy,
          uploadedAt: serverTimestamp(),
          linkedEntities: fileData.linkedEntities || [],
          isChunked: false,
        });
      } else {
        const totalChunks = Math.ceil(base64.length / CHUNK_SIZE);

        batch.set(fileRef, {
          name: fileData.name,
          type: fileData.type,
          size: fileData.size,
          uploadedBy: fileData.uploadedBy,
          uploadedAt: serverTimestamp(),
          linkedEntities: fileData.linkedEntities || [],
          isChunked: true,
          totalChunks: totalChunks,
        });

        for (let i = 0; i < totalChunks; i++) {
          const chunkStart = i * CHUNK_SIZE;
          const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, base64.length);
          const chunkData = base64.substring(chunkStart, chunkEnd);

          const chunkRef = doc(db, 'files', fileId, 'chunks', String(i));
          batch.set(chunkRef, { data: chunkData });
        }
      }

      await batch.commit();
      return fileId;
    } catch (error: unknown) {
      console.error('Error adding file:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload file';
      throw new Error(message);
    }
  },

  getFile: async (fileId: string): Promise<FileData | null> => {
    try {
      const fileRef = doc(db, 'files', fileId);
      const fileSnap = await getDoc(fileRef);

      if (!fileSnap.exists()) {
        return null;
      }

      const fileData = fileSnap.data();

      if (fileData['isChunked']) {
        const chunksRef = collection(db, 'files', fileId, 'chunks');
        const chunksSnap = await getDocs(
          query(chunksRef, orderBy('__name__'))
        );

        let base64 = '';
        chunksSnap.docs.forEach((chunkSnap) => {
          base64 += chunkSnap.data()['data'];
        });

        return {
          id: fileId,
          name: fileData['name'],
          type: fileData['type'],
          size: fileData['size'],
          base64: base64,
          uploadedBy: fileData['uploadedBy'],
          uploadedAt: fileData['uploadedAt'],
          linkedEntities: fileData['linkedEntities'],
        };
      }

      return {
        id: fileId,
        name: fileData['name'],
        type: fileData['type'],
        size: fileData['size'],
        base64: fileData['base64'],
        uploadedBy: fileData['uploadedBy'],
        uploadedAt: fileData['uploadedAt'],
        linkedEntities: fileData['linkedEntities'],
      };
    } catch (error: unknown) {
      console.error('Error getting file:', error);
      const message = error instanceof Error ? error.message : 'Failed to retrieve file';
      throw new Error(message);
    }
  },

  listFiles: async (pageSize: number = 20, lastDoc?: QueryDocumentSnapshot | null): Promise<{
    files: FileData[];
    lastDoc: QueryDocumentSnapshot | null;
  }> => {
    try {
      const filesRef = collection(db, 'files');
      let q;

      if (lastDoc) {
        q = query(
          filesRef,
          orderBy('uploadedAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          filesRef,
          orderBy('uploadedAt', 'desc'),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const files = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FileData[];

      return {
        files,
        lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
      };
    } catch (error: unknown) {
      console.error('Error listing files:', error);
      const message = error instanceof Error ? error.message : 'Failed to list files';
      throw new Error(message);
    }
  },

  updateFile: async (fileId: string, updates: Partial<FileData>): Promise<void> => {
    try {
      const fileRef = doc(db, 'files', fileId);
      const updateData: Record<string, unknown> = {};

      if (updates.name) updateData['name'] = updates.name;
      if (updates.linkedEntities) updateData['linkedEntities'] = updates.linkedEntities;

      await updateDoc(fileRef, updateData);
    } catch (error: unknown) {
      console.error('Error updating file:', error);
      const message = error instanceof Error ? error.message : 'Failed to update file';
      throw new Error(message);
    }
  },

  deleteFile: async (fileId: string): Promise<void> => {
    try {
      const fileRef = doc(db, 'files', fileId);
      const fileSnap = await getDoc(fileRef);

      if (!fileSnap.exists()) {
        throw new Error('File not found');
      }

      const batch = writeBatch(db);
      batch.delete(fileRef);

      if (fileSnap.data()['isChunked']) {
        const chunksRef = collection(db, 'files', fileId, 'chunks');
        const chunksSnap = await getDocs(chunksRef);
        chunksSnap.docs.forEach((chunkSnap) => {
          batch.delete(chunkSnap.ref);
        });
      }

      await batch.commit();
    } catch (error: unknown) {
      console.error('Error deleting file:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete file';
      throw new Error(message);
    }
  },

  generateKey: async (expiresInDays?: number): Promise<string> => {
    try {
      const keysRef = collection(db, 'keys');
      const keyString = `KEY-${crypto.randomUUID().toUpperCase().slice(0, 12)}`;

      const keyData: Record<string, unknown> = {
        key: keyString,
        createdAt: serverTimestamp(),
        used: false,
        role: 'user',
      };

      if (expiresInDays) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + expiresInDays);
        keyData['expiresAt'] = Timestamp.fromDate(expirationDate);
      } else {
        keyData['expiresAt'] = null;
      }

      await (
        await import('firebase/firestore')
      ).addDoc(keysRef, keyData);

      return keyString;
    } catch (error: unknown) {
      console.error('Error generating key:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate key';
      throw new Error(message);
    }
  },

  listKeys: async (): Promise<KeyData[]> => {
    try {
      const keysRef = collection(db, 'keys');
      const q = query(keysRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as KeyData[];
    } catch (error: unknown) {
      console.error('Error listing keys:', error);
      const message = error instanceof Error ? error.message : 'Failed to list keys';
      throw new Error(message);
    }
  },

  getUserProfile: async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return null;
      }

      return { id: userSnap.id, ...userSnap.data() };
    } catch (error: unknown) {
      console.error('Error getting user profile:', error);
      const message = error instanceof Error ? error.message : 'Failed to get user profile';
      throw new Error(message);
    }
  },

  updateLastLogin: async (uid: string): Promise<void> => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
      });
    } catch (error: unknown) {
      console.error('Error updating last login:', error);
      const message = error instanceof Error ? error.message : 'Failed to update last login';
      throw new Error(message);
    }
  },

  addOrder: async (orderData: Record<string, unknown>): Promise<string> => {
    try {
      const ordersRef = collection(db, 'orders');
      const data = {
        ...orderData,
        status: orderData['status'] || 'new',
        createdAt: serverTimestamp(),
      };

      const docRef = await (await import('firebase/firestore')).addDoc(ordersRef, data);
      return docRef.id;
    } catch (error: unknown) {
      console.error('Error adding order:', error);
      const message = error instanceof Error ? error.message : 'Failed to add order';
      throw new Error(message);
    }
  },

  deleteKey: async (keyId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'keys', keyId));
    } catch (error: unknown) {
      console.error('Error deleting key:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete key';
      throw new Error(message);
    }
  },
};
