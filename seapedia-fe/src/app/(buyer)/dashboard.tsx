import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { buyerService } from "../../../services/buyer.service";
import { useAuthStore } from "../../../stores/auth.store";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { WalletTransaction } from "../../../types/api.types";

function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

const TX_CONFIG = {
    TOPUP: { label: "Top Up", color: "text-green-600", bg: "bg-green-50", sign: "+" },
    PAYMENT: { label: "Pembayaran", color: "text-red-500", bg: "bg-red-50", sign: "-" },
    REFUND: { label: "Refund", color: "text-blue-600", bg: "bg-blue-50", sign: "+" },
};

function TransactionItem({ tx }: { tx: WalletTransaction }) {
    const cfg = TX_CONFIG[tx.type] ?? TX_CONFIG.TOPUP;
    return (
        <View className="flex-row items-center justify-between py-3 border-b border-gray-50">
            <View className="flex-row items-center gap-3">
                <View className={`w-9 h-9 rounded-full ${cfg.bg} items-center justify-center`}>
                    <Text className="text-sm">
                        {tx.type === "TOPUP" ? "💳" : tx.type === "REFUND" ? "↩️" : "🛒"}
                    </Text>
                </View>
                <View>
                    <Text className="text-sm font-medium text-gray-800">{cfg.label}</Text>
                    <Text className="text-xs text-gray-400">{formatDate(tx.createdAt)}</Text>
                </View>
            </View>
            <Text className={`font-semibold text-sm ${cfg.color}`}>
                {cfg.sign}{formatRupiah(tx.amount)}
            </Text>
        </View>
    );
}

export default function BuyerDashboard() {
    const logout = useAuthStore((s) => s.logout);

    const { data, isLoading } = useQuery({
        queryKey: ["buyer-dashboard"],
        queryFn: buyerService.getDashboard,
    });

    if (isLoading) return <LoadingSpinner fullScreen message="Memuat dashboard..." />;

    return (
        <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="pb-8">
            {/* Header */}
            <View className="bg-sea-500 pt-12 pb-8 px-5">
                <View className="flex-row items-center justify-between mb-5">
                    <Text className="text-white font-bold text-xl">🌊 SEAPEDIA</Text>
                    <View className="flex-row items-center gap-3">
                        <View className="bg-white/20 rounded-full px-2.5 py-1">
                            <Text className="text-white text-xs font-semibold">Pembeli</Text>
                        </View>
                        <TouchableOpacity
                            onPress={async () => {
                                await logout();
                                router.replace("/(public)/home" as any);
                            }}
                        >
                            <Text className="text-white/70 text-xs">Keluar</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Wallet card */}
                <TouchableOpacity
                    onPress={() => router.push("/(buyer)/wallet/index" as any)}
                    className="bg-white/15 rounded-2xl p-4"
                >
                    <Text className="text-sea-100 text-sm mb-1">Saldo Dompet</Text>
                    <Text className="text-white text-3xl font-bold">
                        {formatRupiah(data?.walletBalance ?? 0)}
                    </Text>
                    <Text className="text-sea-200 text-xs mt-1">Tap untuk kelola dompet →</Text>
                </TouchableOpacity>
            </View>

            {/* Quick actions */}
            <View className="flex-row gap-3 px-4 mt-4 mb-2">
                {[
                    { icon: "🛍️", label: "Katalog", onPress: () => router.push("/(public)/home" as any) },
                    { icon: "🛒", label: "Keranjang", onPress: () => router.push("/(buyer)/cart" as any) },
                    { icon: "📦", label: "Pesanan", onPress: () => router.push("/(buyer)/orders/index" as any) },
                    { icon: "📍", label: "Alamat", onPress: () => router.push("/(buyer)/addresses/index" as any) },
                ].map((action) => (
                    <TouchableOpacity
                        key={action.label}
                        onPress={action.onPress}
                        className="flex-1 bg-white rounded-2xl py-3 items-center shadow-sm border border-gray-100"
                    >
                        <Text className="text-2xl mb-1">{action.icon}</Text>
                        <Text className="text-xs text-gray-600 font-medium">{action.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Active orders banner */}
            {(data?.activeOrders ?? 0) > 0 && (
                <TouchableOpacity
                    onPress={() => router.push("/(buyer)/orders/index" as any)}
                    className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex-row items-center justify-between"
                >
                    <View className="flex-row items-center gap-2">
                        <Text className="text-lg">📦</Text>
                        <Text className="text-amber-800 font-semibold text-sm">
                            {data?.activeOrders} pesanan sedang diproses
                        </Text>
                    </View>
                    <Text className="text-amber-600 text-sm">Lihat →</Text>
                </TouchableOpacity>
            )}

            {/* Recent transactions */}
            <View className="mx-4 mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-bold text-gray-800">Transaksi Terakhir</Text>
                    <TouchableOpacity onPress={() => router.push("/(buyer)/wallet/index" as any)}>
                        <Text className="text-sea-500 text-sm">Lihat semua</Text>
                    </TouchableOpacity>
                </View>

                {(data?.recentTransactions ?? []).length === 0 ? (
                    <Text className="text-gray-400 text-sm py-4 text-center">
                        Belum ada transaksi
                    </Text>
                ) : (
                    data?.recentTransactions.map((tx) => (
                        <TransactionItem key={tx.id} tx={tx} />
                    ))
                )}
            </View>
        </ScrollView>
    );
}