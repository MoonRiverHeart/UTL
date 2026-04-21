import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';

interface User {
  id: string;
  username: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,

      init: async () => {
        const { token, isInitialized } = get();
        if (isInitialized) return;
        
        if (token) {
          try {
            const response = await api.get('/auth/me');
            set({ user: response.data, isAuthenticated: true, isInitialized: true });
          } catch {
            set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
          }
        } else {
          set({ isInitialized: true });
        }
      },

      login: async (username: string, password: string) => {
        const response = await api.post('/auth/login', { username, password });
        const { token, user } = response.data;
        set({ token, user, isAuthenticated: true, isInitialized: true });
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },

      loadUser: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const response = await api.get('/auth/me');
          set({ user: response.data, isAuthenticated: true });
        } catch {
          set({ token: null, user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'utl-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.init();
        }
      },
    }
  )
);