import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

export type UserRole = 'ADMIN' | 'BUYER' | 'SELLER' | 'DRIVER';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  roles: UserRole[];
}

interface AuthState {
  token: string | null;
  preAuthToken: string | null;
  user: UserProfile | null;
  activeRole: UserRole | null;
  roles: UserRole[];
  isAuthenticated: boolean;
  requiresRoleSelection: boolean;

  setPreAuth: (preAuthToken: string, roles: UserRole[]) => void;
  setAuth: (token: string, activeRole: UserRole, roles: UserRole[]) => void;
  setUser: (user: UserProfile) => void;
  updateActiveRole: (role: UserRole) => void;
  clearAuth: () => void;
}

// Custom storage adapter using Expo SecureStore for sensitive tokens
const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return (await SecureStore.getItemAsync(name)) || null;
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {
      // Handle silently or log if needed
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {
      // Handle silently
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      preAuthToken: null,
      user: null,
      activeRole: null,
      roles: [],
      isAuthenticated: false,
      requiresRoleSelection: false,

      setPreAuth: (preAuthToken, roles) =>
        set({
          preAuthToken,
          roles,
          requiresRoleSelection: true,
          token: null,
          user: null,
          activeRole: null,
          isAuthenticated: false,
        }),

      setAuth: (token, activeRole, roles) =>
        set({
          token,
          activeRole,
          roles,
          isAuthenticated: true,
          requiresRoleSelection: false,
          preAuthToken: null,
        }),

      setUser: (user) => set({ user }),

      updateActiveRole: (role) => set({ activeRole: role }),

      clearAuth: () =>
        set({
          token: null,
          preAuthToken: null,
          user: null,
          activeRole: null,
          roles: [],
          isAuthenticated: false,
          requiresRoleSelection: false,
        }),
    }),
    {
      name: 'seapedia-auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
