import api from "../lib/api";
import { Product, Store, Review } from "../types/api.types";

export const catalogService = {
    getProducts: async (): Promise<Product[]> => {
        const res = await api.get("/products");
        return res.data;
    },

    getProduct: async (id: string): Promise<Product> => {
        const res = await api.get(`/products/${id}`);
        return res.data;
    },

    getStore: async (id: string): Promise<Store & { products: Product[] }> => {
        const res = await api.get(`/stores/${id}`);
        return res.data;
    },

    getReviews: async (): Promise<Review[]> => {
        const res = await api.get("/reviews");
        return res.data;
    },

    submitReview: async (data: {
        reviewerName: string;
        rating: number;
        comment: string;
    }): Promise<Review> => {
        const res = await api.post("/reviews", data);
        return res.data;
    },
};