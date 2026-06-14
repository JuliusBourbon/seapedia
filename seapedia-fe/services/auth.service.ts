import api from "../lib/api";
import {
    LoginResponse,
    LoginResponseMultiRole,
    AuthUser,
    Role,
} from "../types/api.types";

export const authService = {
    login: async (
        username: string,
        password: string
    ): Promise<LoginResponse | LoginResponseMultiRole> => {
        const res = await api.post("/auth/login", { username, password });
        return res.data.data;
    },

    selectRole: async (
        role: Role,
        preAuthToken: string
    ): Promise<LoginResponse> => {
        const res = await api.post(
            "/auth/select-role",
            { role },
            { headers: { Authorization: `Bearer ${preAuthToken}` } }
        );
        return res.data.data;
    },

    me: async (): Promise<AuthUser> => {
        const res = await api.get("/auth/me");
        return res.data.data;
    },

    logout: async (): Promise<void> => {
        await api.post("/auth/logout");
    },
};