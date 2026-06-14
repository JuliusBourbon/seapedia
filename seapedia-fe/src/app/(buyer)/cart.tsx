import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { buyerService } from "../../../services/buyer.service";
import { useCartStore } from "../../../stores/cart.store";
import { CartItem } from "../../../types/api.types";
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

export default function CartScreen() {
    const [clearModalVisible, setClearModalVisible] = useState(false);
    const setCartSummary = useCartStore((s) => s.setCartSummary);
    const clearCartStore = useCartStore((s) => s.clearCart);
    const qc = useQueryClient();

    const { data: cart, isLoading } = useQuery({
        queryKey: ["cart"],
        queryFn: async () => {
            const data = await buyerService.getCart();
            setCartSummary(data.totalItems ?? 0, data.storeId ?? null);
            return data;
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
            buyerService.updateCartItem(productId, quantity),
        onSuccess: (data) => {
            setCartSummary(data.totalItems ?? 0, data.storeId ?? null);
            qc.invalidateQueries({ queryKey: ["cart"] });
        },
    });

    const removeMutation = useMutation({
        mutationFn: buyerService.removeCartItem,
        onSuccess: (data) => {
            setCartSummary(data.totalItems ?? 0, data.storeId ?? null);
            qc.invalidateQueries({ queryKey: ["cart"] });
        },
    });

    const clearMutation = useMutation({
        mutationFn: buyerService.clearCart,
        onSuccess: () => {
            clearCartStore();
            qc.invalidateQueries({ queryKey: ["cart"] });
            setClearModalVisible(false);
        },
    });

    const handleQtyChange = (productId: string, newQty: number) => {
        if (newQty < 1) {
            Alert.alert("Hapus Item", "Hapus produk ini dari keranjang?", [
                { text: "Batal", style: "cancel" },
                { text: "Hapus", style: "destructive", onPress: () => removeMutation.mutate(productId) },
            ]);
            return;
        }
        updateMutation.mutate({ productId, quantity: newQty });
    };

    const items: CartItem[] = cart?.items ?? [];
    const subtotal = items.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
    );

    if (isLoading) return <LoadingSpinner fullScreen message="Memuat keranjang..." />;

    return (
        <View className="flex-1 bg-gray-50">
            <Header
                title="Keranjang"
                rightElement={
                    items.length > 0 ? (
                        <TouchableOpacity onPress={() => setClearModalVisible(true)}>
                            <Text className="text-red-400 text-sm">Kosongkan</Text>
                        </TouchableOpacity>
                    ) : undefined
                }
            />

            {items.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-6xl mb-4">🛒</Text>
                    <Text className="text-gray-500 font-semibold mb-2">Keranjang kosong</Text>
                    <Text className="text-gray-400 text-sm mb-6">Tambahkan produk dari katalog</Text>
                    <Button
                        label="Lihat Katalog"
                        onPress={() => router.push("/(public)/home" as any)}
                    />
                </View>
            ) : (
                <>
                    <ScrollView contentContainerClassName="px-4 pt-4 pb-36">
                        {/* Store info */}
                        {cart?.storeId && (
                            <View className="bg-sea-50 border border-sea-100 rounded-xl px-4 py-2 mb-3 flex-row items-center gap-2">
                                <Text className="text-sm">🏪</Text>
                                <Text className="text-sea-700 text-sm font-medium">
                                    Semua item dari 1 toko
                                </Text>
                            </View>
                        )}

                        {/* Items */}
                        <View className="gap-3">
                            {items.map((item) => (
                                <View key={item.productId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                    <View className="flex-row gap-3">
                                        <View className="w-16 h-16 bg-sea-50 rounded-xl items-center justify-center">
                                            <Text className="text-3xl">🛍️</Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text className="font-semibold text-gray-800 text-sm" numberOfLines={2}>
                                                {item.product.name}
                                            </Text>
                                            <Text className="text-sea-600 font-bold mt-1">
                                                {formatRupiah(item.product.price)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Qty control */}
                                    <View className="flex-row items-center justify-between mt-3">
                                        <Text className="text-xs text-gray-400">
                                            Subtotal: {formatRupiah(item.product.price * item.quantity)}
                                        </Text>
                                        <View className="flex-row items-center gap-3">
                                            <TouchableOpacity
                                                onPress={() => handleQtyChange(item.productId, item.quantity - 1)}
                                                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                                            >
                                                <Text className="text-gray-600 font-bold">−</Text>
                                            </TouchableOpacity>
                                            <Text className="font-bold text-gray-800 w-6 text-center">
                                                {item.quantity}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => handleQtyChange(item.productId, item.quantity + 1)}
                                                disabled={item.quantity >= item.product.stock}
                                                className={`w-8 h-8 rounded-full items-center justify-center ${item.quantity >= item.product.stock ? "bg-gray-50" : "bg-sea-100"
                                                    }`}
                                            >
                                                <Text className={item.quantity >= item.product.stock ? "text-gray-300 font-bold" : "text-sea-600 font-bold"}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Bottom checkout bar */}
                    <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-gray-500 text-sm">Subtotal ({items.length} item)</Text>
                            <Text className="font-bold text-gray-900 text-lg">{formatRupiah(subtotal)}</Text>
                        </View>
                        <Button
                            label="Lanjut ke Checkout →"
                            onPress={() => router.push("/(buyer)/checkout" as any)}
                            fullWidth
                            size="lg"
                        />
                    </View>
                </>
            )}

            {/* Konfirmasi kosongkan cart */}
            <Modal
                visible={clearModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setClearModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-center px-6">
                    <View className="bg-white rounded-3xl p-6">
                        <Text className="text-lg font-bold text-gray-900 mb-2">Kosongkan Keranjang?</Text>
                        <Text className="text-gray-500 text-sm mb-5">
                            Semua item di keranjang akan dihapus. Tindakan ini tidak bisa dibatalkan.
                        </Text>
                        <View className="flex-row gap-3">
                            <Button label="Batal" onPress={() => setClearModalVisible(false)} variant="outline" fullWidth />
                            <Button
                                label="Kosongkan"
                                onPress={() => clearMutation.mutate()}
                                loading={clearMutation.isPending}
                                variant="danger"
                                fullWidth
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}