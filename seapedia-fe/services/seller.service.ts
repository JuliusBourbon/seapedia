import api from "../lib/api";
import { Product, Order } from "../types/api.types";

export interface SellerStore {
    id: string;
    name: string;
    description: string | null;
    sellerId: string;
    createdAt: string;
    updatedAt: string;
    products?: Product[];
}

export interface SellerDashboardData {
    hasStore: boolean;
    storeId: string | null;
    storeName: string | null;
    totalProducts: number;
    pendingOrders: number;
    totalIncome: number;
    note?: string;
}

export const sellerService = {
    // ─── Dashboard ────────────────────────────────
    getDashboard: async (): Promise<SellerDashboardData> => {
        const res = await api.get("/seller/dashboard/summary");
        return res.data.data;
    },

    // ─── Store ────────────────────────────────────
    getStore: async (): Promise<SellerStore> => {
        const res = await api.get("/seller/store");
        return res.data.data;
    },

    createStore: async (data: { name: string; description?: string }): Promise<SellerStore> => {
        const res = await api.post("/seller/store", data);
        return res.data.data;
    },

    updateStore: async (data: { name?: string; description?: string }): Promise<SellerStore> => {
        const res = await api.put("/seller/store", data);
        return res.data.data;
    },

    // ─── Products ─────────────────────────────────
    getProducts: async (): Promise<Product[]> => {
        const res = await api.get("/seller/products");
        return res.data.data;
    },

    createProduct: async (data: {
        name: string;
        description?: string;
        price: number;
        stock: number;
    }): Promise<Product> => {
        const res = await api.post("/seller/products", data);
        return res.data.data;
    },

    updateProduct: async (id: string, data: {
        name?: string;
        description?: string;
        price?: number;
        stock?: number;
    }): Promise<Product> => {
        const res = await api.put(`/seller/products/${id}`, data);
        return res.data.data;
    },

    deleteProduct: async (id: string): Promise<void> => {
        await api.delete(`/seller/products/${id}`);
    },

    // ─── Orders ───────────────────────────────────
    getOrders: async (): Promise<Order[]> => {
        const res = await api.get("/seller/orders");
        return res.data.data;
    },

    getOrder: async (id: string): Promise<Order> => {
        const res = await api.get(`/seller/orders/${id}`);
        return res.data.data;
    },

    processOrder: async (id: string): Promise<Order> => {
        const res = await api.post(`/seller/orders/${id}/process`);
        return res.data.data;
    },
};