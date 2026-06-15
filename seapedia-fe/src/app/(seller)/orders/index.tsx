import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { sellerService } from "../../../../services/seller.service";
import { Order } from "../../../../types/api.types";
import { ORDER_STATUS_CONFIG } from "@/constants/orderStatus";
import Header from "@/components/layout/Header";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function formatRupiah(n: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}
function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function SellerOrdersScreen() {
    const { data: orders, isLoading } = useQuery({
        queryKey: ["seller-orders"],
        queryFn: sellerService.getOrders,
    });

    return (
        <View className="flex-1 bg-gray-50">
            <Header title="Pesanan Masuk" />
            {isLoading ? <LoadingSpinner fullScreen /> : (
                <FlatList
                    data={orders ?? []}
                    keyExtractor={(item) => item.id}
                    contentContainerClassName="px-4 pt-4 pb-8"
                    renderItem={({ item }: { item: Order }) => {
                        const cfg = ORDER_STATUS_CONFIG[item.status];
                        return (
                            <TouchableOpacity
                                onPress={() => router.push({ pathname: "/(seller)/orders/[id]", params: { id: item.id } } as any)}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3"
                            >
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-xs text-gray-400">#{item.id.slice(-8).toUpperCase()}</Text>
                                    <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: cfg.color + "20" }}>
                                        <Text className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</Text>
                                    </View>
                                </View>
                                <Text className="text-sm text-gray-600 mb-1">
                                    Pembeli: <Text className="font-semibold">{(item as any).buyer?.name ?? "-"}</Text>
                                </Text>
                                <Text className="text-sm text-gray-500 mb-2" numberOfLines={1}>
                                    {(item.items ?? []).map((i) => i.productName).join(", ")}
                                </Text>
                                <View className="flex-row justify-between">
                                    <Text className="text-xs text-gray-400">{formatDate(item.createdAt)}</Text>
                                    <Text className="font-bold text-gray-900">{formatRupiah(item.total)}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View className="items-center py-20">
                            <Text className="text-5xl mb-3">🧾</Text>
                            <Text className="text-gray-400">Belum ada pesanan masuk</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}