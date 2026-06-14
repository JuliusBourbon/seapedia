import { create } from "zustand";

interface CartState {
    totalItems: number;
    storeId: string | null;
    setCartSummary: (totalItems: number, storeId: string | null) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
    totalItems: 0,
    storeId: null,

    setCartSummary: (totalItems, storeId) => set({ totalItems, storeId }),

    clearCart: () => set({ totalItems: 0, storeId: null }),
}));