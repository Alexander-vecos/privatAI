import {
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  runTransaction,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from './client';

export interface UserProfile {
  uid: string;
  role: 'admin' | 'user' | 'guest';
  phoneNumber?: string;
  createdAt?: Timestamp;
  lastLogin?: Timestamp;
}

export const authAdapter = {
  onAuthChange: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  },

  loginWithKey: async (keyString: string): Promise<UserProfile> => {
    try {
      const GUEST_KEY = 'GUEST-DEMO-001';
      if (keyString.trim().toUpperCase() === GUEST_KEY) {
        return await authAdapter.loginAsGuest();
      }

      const keysRef = collection(db, 'keys');
      const q = query(
        keysRef,
        where('key', '==', keyString),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Invalid access key');
      }

      const keyDoc = querySnapshot.docs[0];
      const keyData = keyDoc.data();

      if (keyData['used']) {
        throw new Error('This key has already been used');
      }

      if (keyData['expiresAt'] && keyData['expiresAt'].toMillis() < Date.now()) {
        throw new Error('This key has expired');
      }

      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      const userProfile: UserProfile = { uid: user.uid, role: 'user' };

      await runTransaction(db, async (transaction) => {
        const keyDocRef = doc(db, 'keys', keyDoc.id);
        const userDocRef = doc(db, 'users', user.uid);

        const freshKeyDoc = await transaction.get(keyDocRef);
        if (!freshKeyDoc.exists() || freshKeyDoc.data()?.['used']) {
          throw new Error('Key already used (concurrency protection)');
        }

        transaction.update(keyDocRef, {
          used: true,
          usedBy: user.uid,
          usedAt: serverTimestamp(),
        });

        transaction.set(
          userDocRef,
          {
            uid: user.uid,
            role: 'user',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            linkedKey: keyString,
          },
          { merge: true }
        );
      });

      return userProfile;
    } catch (error: unknown) {
      console.error('Login with key error:', error);
      try {
        await signOut(auth);
      } catch { /* ignore */ }
      throw error;
    }
  },

  loginAsGuest: async (): Promise<UserProfile> => {
    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      await (await import('firebase/firestore')).setDoc(userDocRef, {
        uid: user.uid,
        role: 'guest',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isGuest: true,
      }, { merge: true });

      return { uid: user.uid, role: 'guest' };
    } catch (error: unknown) {
      console.error('Guest login error:', error);
      try { await signOut(auth); } catch { /* ignore */ }
      const message = error instanceof Error ? error.message : 'Guest login failed';
      throw new Error(message);
    }
  },

  loginWithEmail: async (email: string, password: string): Promise<UserProfile> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      await (await import('firebase/firestore')).setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        role: 'user',
        lastLogin: serverTimestamp(),
      }, { merge: true });

      return { uid: user.uid, role: 'user' };
    } catch (error: unknown) {
      console.error('loginWithEmail error:', error);
      if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
          throw new Error('Неверный email или пароль');
        }
        if (code === 'auth/wrong-password') {
          throw new Error('Неверный пароль');
        }
        if (code === 'auth/too-many-requests') {
          throw new Error('Слишком много попыток. Подождите.');
        }
      }
      const message = error instanceof Error ? error.message : 'Ошибка входа';
      throw new Error(message);
    }
  },

  registerWithEmail: async (email: string, password: string): Promise<UserProfile> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      await (await import('firebase/firestore')).setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        role: 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      }, { merge: true });

      return { uid: user.uid, role: 'user' };
    } catch (error: unknown) {
      console.error('registerWithEmail error:', error);
      if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        if (code === 'auth/email-already-in-use') {
          throw new Error('Этот email уже зарегистрирован');
        }
        if (code === 'auth/weak-password') {
          throw new Error('Пароль слишком простой (мин. 6 символов)');
        }
        if (code === 'auth/invalid-email') {
          throw new Error('Некорректный email');
        }
      }
      const message = error instanceof Error ? error.message : 'Ошибка регистрации';
      throw new Error(message);
    }
  },

  loginWithCustomToken: async (customToken: string) => {
    try {
      const userCredential = await signInWithCustomToken(auth, customToken);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await (await import('firebase/firestore')).getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error('User profile not found in database');
      }

      const userData = userDocSnap.data();

      return {
        uid: user.uid,
        role: userData['role'] || 'user',
        phoneNumber: userData['phoneNumber'],
        lastLogin: userData['lastLogin'],
      };
    } catch (error: unknown) {
      console.error('Login with custom token error:', error);
      const message = error instanceof Error ? error.message : 'Authentication failed';
      throw new Error(message);
    }
  },

  getCurrentUser: (): FirebaseUser | null => {
    return auth.currentUser;
  },
};
