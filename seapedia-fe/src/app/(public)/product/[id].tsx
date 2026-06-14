import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catalogService } from "../../../../services/catalog.service";
import { buyerService } from "../../../../services/buyer.service";
import { useAuthStore } from "../../../../stores/auth.store";
import { useCartStore } from "../../../../stores/cart.store";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Button from "@/components/ui/Button";
import Header from "@/components/layout/Header";

function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [conflictModalVisible, setConflictModalVisible] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const activeRole = useAuthStore((s) => s.activeRole);
    const setCartSummary = useCartStore((s) => s.setCartSummary);
    const qc = useQueryClient();

    const { data: product, isLoading, isError } = useQuery({
        queryKey: ["product", id],
        queryFn: () => catalogService.getProduct(id!),
        enabled: !!id,
    });

    const addToCartMutation = useMutation({
        mutationFn: () => buyerService.addToCart(id!, 1),
        onSuccess: (data) => {
            setCartSummary(data.totalItems ?? 0, data.storeId ?? null);
            qc.invalidateQueries({ queryKey: ["cart"] });
            setSuccessMsg("Berhasil ditambahkan ke keranjang!");
            setTimeout(() => setSuccessMsg(""), 2500);
        },
        onError: (err: any) => {
            if (err?.response?.status === 409) {
                setConflictModalVisible(true);
            }
        },
    });

    const clearAndAddMutation = useMutation({
        mutationFn: async () => {
            await buyerService.clearCart();
            return buyerService.addToCart(id!, 1);
        },
        onSuccess: (data) => {
            setCartSummary(data.totalItems ?? 0, data.storeId ?? null);
            qc.invalidateQueries({ queryKey: ["cart"] });
            setConflictModalVisible(false);
            setSuccessMsg("Keranjang dikosongkan dan produk ditambahkan!");
            setTimeout(() => setSuccessMsg(""), 2500);
        },
    });

    if (isLoading) return <LoadingSpinner fullScreen message="Memuat produk..." />;

    if (isError || !product) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <Text className="text-4xl mb-3">😕</Text>
                <Text className="text-gray-500">Produk tidak ditemukan</Text>
                <Button label="Kembali" onPress={() => router.back()} variant="ghost" />
            </View>
        );
    }

    const canAddToCart = isAuthenticated && activeRole === "BUYER";

    return (
        <View className="flex-1 bg-gray-50">
            <Header title="Detail Produk" showBack />

            <ScrollView contentContainerClassName="pb-32">
                {/* Placeholder image */}
                <View className="h-56 bg-sea-50 items-center justify-center">
                    <Text className="text-8xl">🛍️</Text>
                </View>

                <View className="px-4 pt-5">
                    <Text className="text-xl font-bold text-gray-900 mb-1">{product.name}</Text>
                    <Text className="text-2xl font-bold text-sea-600 mb-3">
                        {formatRupiah(product.price)}
                    </Text>

                    <View className="flex-row items-center gap-2 mb-4">
                        <View className={`rounded-full px-2.5 py-0.5 ${product.stock > 0 ? "bg-green-100" : "bg-red-100"}`}>
                            <Text className={`text-xs font-semibold ${product.stock > 0 ? "text-green-700" : "text-red-600"}`}>
                                {product.stock > 0 ? `Stok: ${product.stock}` : "Habis"}
                            </Text>
                        </View>
                    </View>

                    {product.description ? (
                        <View className="mb-5">
                            <Text className="text-sm font-semibold text-gray-700 mb-1">Deskripsi</Text>
                            <Text className="text-gray-600 leading-6">{product.description}</Text>
                        </View>
                    ) : null}

                    {product.store ? (
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: "/(public)/store/[id]", params: { id: product.store.id } })}
                            className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center justify-between"
                        >
                            <View>
                                <Text className="text-xs text-gray-400 mb-0.5">Dijual oleh</Text>
                                <Text className="font-semibold text-gray-800">{product.store.name}</Text>
                            </View>
                            <Text className="text-sea-500 text-lg">→</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </ScrollView>

            {/* Success toast */}
            {successMsg ? (
                <View className="absolute top-24 left-4 right-4 bg-green-500 rounded-xl px-4 py-3 shadow-lg">
                    <Text className="text-white font-semibold text-center text-sm">{successMsg}</Text>
                </View>
            ) : null}

            {/* Bottom action */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 gap-2">
                {canAddToCart ? (
                    <>
                        <Button
                            label={addToCartMutation.isPending ? "Menambahkan..." : "Tambah ke Keranjang"}
                            onPress={() => addToCartMutation.mutate()}
                            loading={addToCartMutation.isPending}
                            disabled={product.stock === 0}
                            fullWidth
                        />
                        <Button
                            label="Lihat Keranjang"
                            onPress={() => router.push("/(buyer)/cart" as any)}
                            variant="outline"
                            fullWidth
                        />
                    </>
                ) : (
                    <Button
                        label={isAuthenticated ? "Masuk sebagai Pembeli untuk membeli" : "Masuk untuk membeli"}
                        onPress={() => router.push("/(public)/login")}
                        variant="outline"
                        fullWidth
                    />
                )}
            </View>

            {/* Modal konflik toko (409) */}
            <Modal
                visible={conflictModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setConflictModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-center px-6">
                    <View className="bg-white rounded-3xl p-6">
                        <Text className="text-xl mb-2">⚠️</Text>
                        <Text className="text-lg font-bold text-gray-900 mb-2">
                            Produk dari Toko Berbeda
                        </Text>
                        <Text className="text-gray-500 text-sm mb-5">
                            Keranjang Anda berisi produk dari toko lain. Apakah ingin mengosongkan
                            keranjang dan menambahkan produk ini?
                        </Text>
                        <View className="flex-row gap-3">
                            <Button
                                label="Batal"
                                onPress={() => setConflictModalVisible(false)}
                                variant="outline"
                                fullWidth
                            />
                            <Button
                                label="Kosongkan & Tambah"
                                onPress={() => clearAndAddMutation.mutate()}
                                loading={clearAndAddMutation.isPending}
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