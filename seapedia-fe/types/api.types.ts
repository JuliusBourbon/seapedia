// ─── Auth ────────────────────────────────────────────────────────────────────

export type Role = "BUYER" | "SELLER" | "DRIVER" | "ADMIN";

export interface LoginResponse {
    requiresRoleSelection: false;
    token: string;
    roles: Role[];
    activeRole: Role;
}

export interface LoginResponseMultiRole {
    requiresRoleSelection: true;
    preAuthToken: string;
    roles: Role[];
}

export interface AuthUser {
    id: string;
    username: string;
    roles: Role[];
    activeRole: Role;
}

// ─── Product & Store ─────────────────────────────────────────────────────────

export interface Store {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
}

export interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    storeId: string;
    store: Store;
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
    productId: string;
    quantity: number;
    product: Product;
}

export interface Cart {
    id: string;
    storeId: string | null;
    items: CartItem[];
    totalItems: number;
    subtotal: number;
}

// ─── Checkout ────────────────────────────────────────────────────────────────

export type DeliveryMethod = "INSTANT" | "SAME_DAY" | "NEXT_DAY";

export interface CheckoutPreview {
    subtotal: number;
    discount: number;
    ppn: number;
    deliveryFee: number;
    total: number;
    discountCode: string | null;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus =
    | "SEDANG_DIKEMAS"
    | "MENUNGGU_PENGIRIM"
    | "SEDANG_DIKIRIM"
    | "PESANAN_SELESAI"
    | "DIKEMBALIKAN";

export interface OrderStatusHistory {
    status: OrderStatus;
    timestamp: string;
    note: string | null;
}

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface Delivery {
    id: string;
    method: DeliveryMethod;
    status: "AVAILABLE" | "TAKEN" | "COMPLETED";
    fee: number;
    driverId: string | null;
}

export interface Order {
    id: string;
    status: OrderStatus;
    subtotal: number;
    discount: number;
    ppn: number;
    deliveryFee: number;
    total: number;
    discountCode: string | null;
    createdAt: string;
    items: OrderItem[];
    statusHistory: OrderStatusHistory[];
    delivery: Delivery | null;
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export type TransactionType = "TOPUP" | "PAYMENT" | "REFUND";

export interface WalletTransaction {
    id: string;
    type: TransactionType;
    amount: number;
    description: string;
    createdAt: string;
}

export interface Wallet {
    balance: number;
}

// ─── Address ─────────────────────────────────────────────────────────────────

export interface Address {
    id: string;
    label: string;
    recipientName: string;
    phoneNumber: string;
    fullAddress: string;
    city: string;
    postalCode: string;
    isDefault: boolean;
}

// ─── Review ──────────────────────────────────────────────────────────────────

export interface Review {
    id: string;
    reviewerName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

// ─── Driver ──────────────────────────────────────────────────────────────────

export interface DeliveryJob {
    id: string;
    orderId: string;
    method: DeliveryMethod;
    fee: number;
    status: "AVAILABLE" | "TAKEN" | "COMPLETED";
    order: Order;
}

export interface DriverEarnings {
    totalCompletedJobs: number;
    totalEarnings: number;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface BuyerDashboard {
    walletBalance: number;
    activeOrderCount: number;
    recentTransactions: WalletTransaction[];
}

export interface SellerDashboard {
    store: Store | null;
    productCount: number;
    pendingOrderCount: number;
}

export interface DriverDashboard {
    activeJob: DeliveryJob | null;
    completedJobCount: number;
    totalEarnings: number;
}

export interface AdminDashboard {
    userCount: number;
    storeCount: number;
    productCount: number;
    orderCount: number;
    voucherCount: number;
    promoCount: number;
    deliveryCount: number;
    overdueCount: number;
}

// ─── API Generic ─────────────────────────────────────────────────────────────

export interface ApiError {
    message: string;
    errors?: Record<string, string>;
}