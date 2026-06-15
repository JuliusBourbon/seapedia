import { Platform } from 'react-native';

export const API_BASE_URL = "http://192.168.1.11:3000/api/v1";

export const DELIVERY_METHODS = {
  INSTANT: {
    label: 'Instant (3 Jam)',
    fee: 25000,
    slaHours: 3,
  },
  NEXT_DAY: {
    label: 'Next Day (24 Jam)',
    fee: 15000,
    slaHours: 24,
  },
  REGULAR: {
    label: 'Regular (72 Jam)',
    fee: 10000,
    slaHours: 72,
  },
} as const;

export type DeliveryMethodType = keyof typeof DELIVERY_METHODS;

export const ORDER_STATUS_LABELS = {
  SEDANG_DIKEMAS: 'Sedang Dikemas',
  MENUNGGU_PENGIRIM: 'Menunggu Pengirim',
  SEDANG_DIKIRIM: 'Sedang Dikirim',
  PESANAN_SELESAI: 'Pesanan Selesai',
  DIKEMBALIKAN: 'Dikembalikan (SLA Overdue)',
} as const;

export const DELIVERY_STATUS_LABELS = {
  AVAILABLE: 'Tersedia untuk Diambil',
  TAKEN: 'Sedang Dikirim',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
} as const;

export const ROLE_LABELS = {
  ADMIN: 'Administrator',
  BUYER: 'Pembeli (Buyer)',
  SELLER: 'Penjual (Seller)',
  DRIVER: 'Pengirim (Driver)',
} as const;
