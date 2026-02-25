import { db } from './client';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';

function generateUniqueKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 12; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export const adminAdapter = {
  async generateKey(role: string = 'user') {
    const key = generateUniqueKey();
    const docRef = await addDoc(collection(db, 'keys'), {
      key,
      role,
      createdAt: serverTimestamp(),
      expiresAt: null,
      used: false,
    });
    return { id: docRef.id, key };
  },

  async listKeys() {
    const q = query(collection(db, 'keys'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async deactivateKey(id: string) {
    await deleteDoc(doc(db, 'keys', id));
  },

  async updateKey(id: string, data: Record<string, unknown>) {
    await updateDoc(doc(db, 'keys', id), data);
  },
};
