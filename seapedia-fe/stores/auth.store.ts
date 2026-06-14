import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { TOKEN_KEY } from "../lib/api";
import { Role, AuthUser } from "../types/api.types";

const USER_KEY = "seapedia_user";

interface AuthState {
    token: string | null;
    user: AuthUser | null;
    activeRole: Role | null;
    isAuthenticated: boolean;
    preAuthToken: string | null;
    availableRoles: Role[];

    setToken: (token: string, user: AuthUser) => Promise<void>;
    setPreAuthToken: (preAuthToken: string, roles: Role[]) => void;
    clearPreAuth: () => void;
    logout: () => Promise<void>;
    loadToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    activeRole: null,
    isAuthenticated: false,
    preAuthToken: null,
    availableRoles: [],

    setToken: async (token, user) => {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
        set({
            token,
            user,
            activeRole: user.activeRole,
            isAuthenticated: true,
            preAuthToken: null,
            availableRoles: [],
        });
    },

    setPreAuthToken: (preAuthToken, roles) => {
        set({ preAuthToken, availableRoles: roles });
    },

    clearPreAuth: () => {
        set({ preAuthToken: null, availableRoles: [] });
    },

    logout: async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
        set({
            token: null,
            user: null,
            activeRole: null,
            isAuthenticated: false,
            preAuthToken: null,
            availableRoles: [],
        });
    },

    loadToken: async () => {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const userRaw = await SecureStore.getItemAsync(USER_KEY);
        if (token && userRaw) {
            const user: AuthUser = JSON.parse(userRaw);
            set({
                token,
                user,
                activeRole: user.activeRole,
                isAuthenticated: true,
            });
        }
    },
}));