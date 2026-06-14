import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

export const API_BASE_URL = "http://192.168.1.3:3000/api/v1";
export const TOKEN_KEY = "seapedia_token";

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor — attach token ke setiap request
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (token expired / revoked)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Hapus token yang tidak valid
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            // Redirect ke login
            router.replace("/(public)/login" as any);
        }
        return Promise.reject(error);
    }
);

export default api;