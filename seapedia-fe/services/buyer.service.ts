import api from "../lib/api";
import {
    Wallet,
    WalletTransaction,
    Address,
    Cart,
    CheckoutPreview,
    Order,
    DeliveryMethod,
} from "../types/api.types";

export interface BuyerDashboardData {
    walletBalance: number;
    activeOrders: number;
    recentTransactions: WalletTransaction[];
}

export const buyerService = {
    // ─── Dashboard ────────────────────────────────────────────────────────────
    getDashboard: async (): Promise<BuyerDashboardData> => {
        const res = await api.get("/buyer/dashboard/summary");
        return res.data.data;
    },

    // ─── Wallet ───────────────────────────────────────────────────────────────
    getWallet: async (): Promise<Wallet> => {
        const res = await api.get("/buyer/wallet");
        return res.data.data;
    },

    getWalletTransactions: async (): Promise<WalletTransaction[]> => {
        const res = await api.get("/buyer/wallet/transactions");
        return res.data.data;
    },

    topUpWallet: async (amount: number): Promise<Wallet> => {
        const res = await api.post("/buyer/wallet/topup", { amount });
        return res.data.data;
    },

    // ─── Addresses ────────────────────────────────────────────────────────────
    getAddresses: async (): Promise<Address[]> => {
        const res = await api.get("/buyer/addresses");
        return res.data.data;
    },

    createAddress: async (
        data: Omit<Address, "id" | "isDefault">
    ): Promise<Address> => {
        const res = await api.post("/buyer/addresses", data);
        return res.data.data;
    },

    updateAddress: async (
        id: string,
        data: Partial<Omit<Address, "id">>
    ): Promise<Address> => {
        const res = await api.put(`/buyer/addresses/${id}`, data);
        return res.data.data;
    },

    deleteAddress: async (id: string): Promise<void> => {
        await api.delete(`/buyer/addresses/${id}`);
    },

    setDefaultAddress: async (id: string): Promise<Address> => {
        const res = await api.patch(`/buyer/addresses/${id}/default`);
        return res.data.data;
    },

    // ─── Cart ─────────────────────────────────────────────────────────────────
    getCart: async (): Promise<Cart> => {
        const res = await api.get("/buyer/cart");
        return res.data.data;
    },

    addToCart: async (
        productId: string,
        quantity: number
    ): Promise<Cart> => {
        const res = await api.post("/buyer/cart", { productId, quantity });
        return res.data.data;
    },

    updateCartItem: async (
        productId: string,
        quantity: number
    ): Promise<Cart> => {
        const res = await api.put(`/buyer/cart/${productId}`, { quantity });
        return res.data.data;
    },

    removeCartItem: async (productId: string): Promise<Cart> => {
        const res = await api.delete(`/buyer/cart/${productId}`);
        return res.data.data;
    },

    clearCart: async (): Promise<void> => {
        await api.delete("/buyer/cart");
    },

    // ─── Checkout ─────────────────────────────────────────────────────────────
    previewCheckout: async (data: {
        addressId: string;
        deliveryMethod: DeliveryMethod;
        discountCode?: string;
    }): Promise<CheckoutPreview> => {
        const res = await api.post("/buyer/checkout/preview", data);
        return res.data.data;
    },

    confirmCheckout: async (data: {
        addressId: string;
        deliveryMethod: DeliveryMethod;
        discountCode?: string;
    }): Promise<Order> => {
        const res = await api.post("/buyer/checkout", data);
        return res.data.data;
    },

    // ─── Orders ───────────────────────────────────────────────────────────────
    getOrders: async (): Promise<Order[]> => {
        const res = await api.get("/buyer/orders");
        return res.data.data;
    },

    getOrder: async (id: string): Promise<Order> => {
        const res = await api.get(`/buyer/orders/${id}`);
        return res.data.data;
    },
};