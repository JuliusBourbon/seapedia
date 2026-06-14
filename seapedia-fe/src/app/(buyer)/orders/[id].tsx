import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { buyerService } from "../../../../services/buyer.service";
import { ORDER_STATUS_CONFIG, ORDER_STATUS_SEQUENCE } from "@/constants/orderStatus";
import { OrderStatus, OrderStatusHistory } from "../../../../types/api.types";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
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
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function StatusTimeline({ currentStatus, statusHistory }: {
    currentStatus: OrderStatus;
    statusHistory: OrderStatusHistory[];
}) {
    const isReturned = currentStatus === "DIKEMBALIKAN";
    const sequence = isReturned
        ? [...ORDER_STATUS_SEQUENCE, "DIKEMBALIKAN" as OrderStatus]
        : ORDER_STATUS_SEQUENCE;

    const historyMap = Object.fromEntries(
        statusHistory.map((h) => [h.status, h])
    );

    const currentIndex = sequence.indexOf(currentStatus);

    return (
        <View className="py-2">
            {sequence.map((status, idx) => {
                const cfg = ORDER_STATUS_CONFIG[status];
                const historyItem = historyMap[status];
                const isDone = idx <= currentIndex;
                const isCurrent = status === currentStatus;

                return (
                    <View key={status} className="flex-row gap-3">
                        <View className="items-center w-6">
                            <View
                                className="w-5 h-5 rounded-full border-2 items-center justify-center mt-0.5"
                                style={{
                                    borderColor: isDone ? cfg.color : "#e5e7eb",
                                    backgroundColor: isDone ? cfg.color : "#fff",
                                }}
                            >
                                {isDone && <Text className="text-white text-xs font-bold">✓</Text>}
                            </View>
                            {idx < sequence.length - 1 && (
                                <View
                                    className="w-0.5 flex-1 min-h-[24px]"
                                    style={{ backgroundColor: idx < currentIndex ? cfg.color : "#e5e7eb" }}
                                />
                            )}
                        </View>

                        {/* Content */}
                        <View className={`flex-1 pb-4 ${isCurrent ? "" : ""}`}>
                            <Text
                                className="font-semibold text-sm"
                                style={{ color: isDone ? cfg.color : "#9ca3af" }}
                            >
                                {cfg.label}
                            </Text>
                            {historyItem ? (
                                <Text className="text-xs text-gray-400 mt-0.5">
                                    {formatDate(historyItem.createdAt)}
                                </Text>
                            ) : (
                                <Text className="text-xs text-gray-300 mt-0.5">{cfg.description}</Text>
                            )}
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const { data: order, isLoading } = useQuery({
        queryKey: ["buyer-order", id],
        queryFn: () => buyerService.getOrder(id!),
        enabled: !!id,
    });

    if (isLoading) return <LoadingSpinner fullScreen message="Memuat pesanan..." />;
    if (!order) return (
        <View className="flex-1 bg-gray-50 items-center justify-center">
            <Text className="text-gray-400 mb-4">Pesanan tidak ditemukan</Text>
            <Button label="Kembali" onPress={() => router.back()} variant="ghost" />
        </View>
    );

    const statusCfg = ORDER_STATUS_CONFIG[order.status];

    return (
        <View className="flex-1 bg-gray-50">
            <Header title="Detail Pesanan" showBack />

            <ScrollView contentContainerClassName="px-4 pt-4 pb-10">
                {/* Status banner */}
                <View
                    className="rounded-2xl px-4 py-4 mb-4"
                    style={{ backgroundColor: statusCfg.color + "15" }}
                >
                    <Text className="font-bold text-base" style={{ color: statusCfg.color }}>
                        {statusCfg.label}
                    </Text>
                    <Text className="text-sm mt-0.5" style={{ color: statusCfg.color + "cc" }}>
                        {statusCfg.description}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-1">
                        ID: #{order.id.slice(-12).toUpperCase()}
                    </Text>
                </View>

                {/* Status timeline */}
                <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                    <Text className="font-bold text-gray-800 mb-3">Status Pengiriman</Text>
                    <StatusTimeline
                        currentStatus={order.status}
                        statusHistory={order.statusHistory ?? []}
                    />
                </View>

                {/* Items */}
                <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                    <Text className="font-bold text-gray-800 mb-3">Produk Dipesan</Text>
                    {order.items?.map((item, idx) => (
                        <View key={idx} className="flex-row justify-between py-2 border-b border-gray-50">
                            <View className="flex-1">
                                <Text className="text-sm text-gray-800" numberOfLines={1}>{item.productName}</Text>
                                <Text className="text-xs text-gray-400">{item.quantity}x {formatRupiah(item.price)}</Text>
                            </View>
                            <Text className="text-sm font-semibold text-gray-800">{formatRupiah(item.subtotal)}</Text>
                        </View>
                    ))}
                </View>

                {/* Ringkasan pembayaran */}
                <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                    <Text className="font-bold text-gray-800 mb-3">Ringkasan Pembayaran</Text>
                    {[
                        { label: "Subtotal", value: formatRupiah(order.subtotal) },
                        { label: "Diskon", value: order.discountAmount > 0 ? `-${formatRupiah(order.discountAmount)}` : "-" },
                        { label: "PPN", value: formatRupiah(order.ppn) },
                        { label: "Ongkos Kirim", value: formatRupiah(order.deliveryFee) },
                    ].map(({ label, value }) => (
                        <View key={label} className="flex-row justify-between py-1">
                            <Text className="text-sm text-gray-500">{label}</Text>
                            <Text className="text-sm text-gray-800">{value}</Text>
                        </View>
                    ))}
                    <View className="border-t border-gray-100 mt-2 pt-2 flex-row justify-between">
                        <Text className="font-bold text-gray-900">Total</Text>
                        <Text className="font-bold text-sea-600 text-base">{formatRupiah(order.total)}</Text>
                    </View>
                </View>

                {/* Info pengiriman */}
                {order.delivery && (
                    <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <Text className="font-bold text-gray-800 mb-2">Info Pengiriman</Text>
                        <Text className="text-sm text-gray-500">
                            Metode: <Text className="font-medium text-gray-800">{order.deliveryMethod}</Text>
                        </Text>
                        <Text className="text-sm text-gray-500 mt-1">
                            Status: <Text className="font-medium text-gray-800">{order.delivery.status}</Text>
                        </Text>
                        {order.delivery.driver && (
                            <Text className="text-sm text-gray-500 mt-1">
                                Driver: <Text className="font-medium text-gray-800">{order.delivery.driver.name}</Text>
                            </Text>
                        )}
                        {order.delivery.completedAt && (
                            <Text className="text-sm text-gray-500 mt-1">
                                Selesai: <Text className="font-medium text-gray-800">{formatDate(order.delivery.completedAt)}</Text>
                            </Text>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}