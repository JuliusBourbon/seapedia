import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { buyerService } from "../../../../services/buyer.service";
import { Order } from "../../../../types/api.types";
import { ORDER_STATUS_CONFIG } from "@/constants/orderStatus";
import Header from "@/components/layout/Header";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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

function OrderCard({ order }: { order: Order }) {
    const statusCfg = ORDER_STATUS_CONFIG[order.status];
    return (
        <TouchableOpacity
            onPress={() => router.push({ pathname: "/(buyer)/orders/[id]", params: { id: order.id } } as any)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3"
        >
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs text-gray-400">#{order.id.slice(-8).toUpperCase()}</Text>
                <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: statusCfg.color + "20" }}>
                    <Text className="text-xs font-semibold" style={{ color: statusCfg.color }}>
                        {statusCfg.label}
                    </Text>
                </View>
            </View>

            <Text className="text-sm text-gray-500 mb-2" numberOfLines={1}>
                {order.store?.name ?? "Toko tidak diketahui"}
            </Text>

            <View className="flex-row items-center justify-between">
                <Text className="text-xs text-gray-400">{formatDate(order.createdAt)}</Text>
                <Text className="font-bold text-gray-900">{formatRupiah(order.total)}</Text>
            </View>
        </TouchableOpacity>
    );
}

export default function OrdersScreen() {
    const { data: orders, isLoading } = useQuery({
        queryKey: ["buyer-orders"],
        queryFn: buyerService.getOrders,
    });

    return (
        <View className="flex-1 bg-gray-50">
            <Header title="Pesanan Saya" />

            {isLoading ? (
                <LoadingSpinner fullScreen message="Memuat pesanan..." />
            ) : (
                <FlatList
                    data={orders ?? []}
                    keyExtractor={(item) => item.id}
                    contentContainerClassName="px-4 pt-4 pb-8"
                    renderItem={({ item }) => <OrderCard order={item} />}
                    ListEmptyComponent={
                        <View className="items-center py-20">
                            <Text className="text-5xl mb-3">📦</Text>
                            <Text className="text-gray-500 font-semibold">Belum ada pesanan</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}