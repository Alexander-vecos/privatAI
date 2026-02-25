import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAdapter, UserProfile } from '../firebase/authAdapter';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  loginWithKey: (key: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  clearError: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      setUser: (user) => set({ user }),

      clearError: () => set({ error: null }),

      loginWithKey: async (key: string) => {
        set({ isLoading: true, error: null });
        try {
          const userData = await authAdapter.loginWithKey(key);
          set({
            user: userData,
            isLoading: false,
          });
        } catch (err: unknown) {
          console.error('Login failed:', err);
          set({
            error: err instanceof Error ? err.message : 'Authentication failed',
            isLoading: false,
          });
          throw err;
        }
      },

      loginAsGuest: async () => {
        set({ isLoading: true, error: null });
        try {
          const userData = await authAdapter.loginAsGuest();
          set({ user: userData, isLoading: false });
        } catch (err: unknown) {
          console.error('Guest login failed:', err);
          set({ error: err instanceof Error ? err.message : 'Guest login failed', isLoading: false });
          throw err;
        }
      },

      loginWithEmail: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const userData = await authAdapter.loginWithEmail(email, password);
          set({ user: userData, isLoading: false });
        } catch (err: unknown) {
          set({ error: err instanceof Error ? err.message : 'Ошибка входа', isLoading: false });
          throw err;
        }
      },

      registerWithEmail: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const userData = await authAdapter.registerWithEmail(email, password);
          set({ user: userData, isLoading: false });
        } catch (err: unknown) {
          set({ error: err instanceof Error ? err.message : 'Ошибка регистрации', isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authAdapter.logout();
          set({ user: null, isLoading: false });
        } catch (err: unknown) {
          console.error('Logout failed:', err);
          set({
            error: err instanceof Error ? err.message : 'Logout failed',
            isLoading: false,
          });
          throw err;
        }
      },

      initialize: () => {
        const unsubscribe = authAdapter.onAuthChange((firebaseUser) => {
          if (firebaseUser) {
            const storedUser = get().user;
            if (!storedUser || storedUser.uid !== firebaseUser.uid) {
              set({ isInitialized: true });
            }
          } else {
            set({ user: null, isInitialized: true });
          }
        });

        set({ isInitialized: true });
        return unsubscribe;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
