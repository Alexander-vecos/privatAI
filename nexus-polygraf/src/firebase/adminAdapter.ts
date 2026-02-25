import { getFunctions, httpsCallable } from 'firebase/functions';
import { adminAdapter as legacy } from './adminAdapterLegacy';

const functions = getFunctions();

export const adminAdapter = {
  async generateKey(role: string = 'user') {
    try {
      const fn = httpsCallable(functions, 'generateKey');
      const res = await fn({ role });
      return { key: (res.data as { key: string }).key };
    } catch (err: unknown) {
      console.warn('generateKey via functions failed, falling back to Firestore:', err instanceof Error ? err.message : err);
      if (legacy && legacy.generateKey) return legacy.generateKey();
      throw err;
    }
  },

  async listKeys() {
    try {
      const fn = httpsCallable(functions, 'listKeys');
      const res = await fn({});
      return (res.data as { items: unknown[] }).items;
    } catch (err: unknown) {
      console.warn('listKeys via functions failed, falling back to Firestore:', err instanceof Error ? err.message : err);
      if (legacy && legacy.listKeys) return legacy.listKeys();
      throw err;
    }
  },

  async deactivateKey(id: string) {
    try {
      const fn = httpsCallable(functions, 'deactivateKey');
      await fn({ id });
      return { success: true };
    } catch (err: unknown) {
      console.warn('deactivateKey via functions failed, falling back to Firestore:', err instanceof Error ? err.message : err);
      if (legacy && legacy.deactivateKey) return legacy.deactivateKey(id);
      throw err;
    }
  },

  async updateKey(id: string, data: Record<string, unknown>) {
    try {
      const fn = httpsCallable(functions, 'updateKey');
      await fn({ id, data });
      return { success: true };
    } catch (err: unknown) {
      console.warn('updateKey via functions failed:', err instanceof Error ? err.message : err);
    }

    if (legacy && legacy.updateKey) return legacy.updateKey(id, data);
    throw new Error('updateKey failed');
  },
};
