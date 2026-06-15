import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { sellerService } from "../../../services/seller.service";
import { useAuthStore } from "../../../stores/auth.store";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency", currency: "IDR", minimumFractionDigits: 0,
    }).format(amount);
}

export default function SellerDashboard() {
    const logout = useAuthStore((s) => s.logout);
    const { data, isLoading } = useQuery({
        queryKey: ["seller-dashboard"],
        queryFn: sellerService.getDashboard,
    });

    if (isLoading) return <LoadingSpinner fullScreen message="Memuat dashboard..." />;

    return (
        <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="pb-8">
            <View className="bg-emerald-500 pt-12 pb-8 px-5">
                <View className="flex-row items-center justify-between mb-5">
                    <Text className="text-white font-bold text-xl">🌊 SEAPEDIA</Text>
                    <View className="flex-row items-center gap-3">
                        <View className="bg-white/20 rounded-full px-2.5 py-1">
                            <Text className="text-white text-xs font-semibold">Penjual</Text>
                        </View>
                        <TouchableOpacity onPress={async () => { await logout(); router.replace("/(public)/home" as any); }}>
                            <Text className="text-white/70 text-xs">Keluar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View className="bg-white/15 rounded-2xl p-4">
                    <Text className="text-emerald-100 text-sm mb-0.5">Toko Anda</Text>
                    <Text className="text-white text-2xl font-bold">
                        {data?.storeName ?? "Belum punya toko"}
                    </Text>
                </View>
            </View>

            <View className="flex-row gap-3 px-4 mt-4">
                {[
                    { label: "Total Produk", value: data?.totalProducts ?? 0, icon: "📦" },
                    { label: "Pesanan Masuk", value: data?.pendingOrders ?? 0, icon: "🧾" },
                ].map((stat) => (
                    <View key={stat.label} className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 items-center">
                        <Text className="text-3xl mb-1">{stat.icon}</Text>
                        <Text className="text-2xl font-bold text-gray-900">{stat.value}</Text>
                        <Text className="text-xs text-gray-400 mt-0.5">{stat.label}</Text>
                    </View>
                ))}
            </View>

            <View className="flex-row gap-3 px-4 mt-3">
                {[
                    { icon: "➕", label: "Tambah Produk", onPress: () => router.push("/(seller)/products/create" as any) },
                    { icon: "🧾", label: "Lihat Pesanan", onPress: () => router.push("/(seller)/orders/index" as any) },
                    { icon: "🏪", label: "Kelola Toko", onPress: () => router.push("/(seller)/store" as any) },
                ].map((a) => (
                    <TouchableOpacity
                        key={a.label}
                        onPress={a.onPress}
                        className="flex-1 bg-white rounded-2xl py-3 items-center shadow-sm border border-gray-100"
                    >
                        <Text className="text-2xl mb-1">{a.icon}</Text>
                        <Text className="text-xs text-gray-600 font-medium text-center">{a.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {(data?.pendingOrders ?? 0) > 0 && (
                <TouchableOpacity
                    onPress={() => router.push("/(seller)/orders/index" as any)}
                    className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex-row items-center justify-between"
                >
                    <Text className="text-amber-800 font-semibold text-sm">
                        🔔 {data?.pendingOrders} pesanan perlu diproses
                    </Text>
                    <Text className="text-amber-600 text-sm">Proses →</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}