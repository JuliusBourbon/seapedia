import { OrderStatus } from "../../types/api.types";

export const ORDER_STATUS_CONFIG: Record<
    OrderStatus,
    { label: string; color: string; description: string }
> = {
    SEDANG_DIKEMAS: {
        label: "Sedang Dikemas",
        color: "#f59e0b",
        description: "Penjual sedang mempersiapkan pesanan Anda",
    },
    MENUNGGU_PENGIRIM: {
        label: "Menunggu Pengirim",
        color: "#3b82f6",
        description: "Pesanan siap, menunggu driver mengambil",
    },
    SEDANG_DIKIRIM: {
        label: "Sedang Dikirim",
        color: "#8b5cf6",
        description: "Driver sedang menuju lokasi Anda",
    },
    PESANAN_SELESAI: {
        label: "Pesanan Selesai",
        color: "#10b981",
        description: "Pesanan telah diterima",
    },
    DIKEMBALIKAN: {
        label: "Dikembalikan",
        color: "#ef4444",
        description: "Pesanan dibatalkan, dana dikembalikan",
    },
};

export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
    "SEDANG_DIKEMAS",
    "MENUNGGU_PENGIRIM",
    "SEDANG_DIKIRIM",
    "PESANAN_SELESAI",
];