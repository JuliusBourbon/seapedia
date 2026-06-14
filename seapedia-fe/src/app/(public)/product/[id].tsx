import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { catalogService } from "../../../../services/catalog.service";
import { useAuthStore } from "../../../../stores/auth.store";
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
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const activeRole = useAuthStore((s) => s.activeRole);

    const { data: product, isLoading, isError } = useQuery({
        queryKey: ["product", id],
        queryFn: () => catalogService.getProduct(id!),
        enabled: !!id,
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
                    {/* Nama & harga */}
                    <Text className="text-xl font-bold text-gray-900 mb-1">
                        {product.name}
                    </Text>
                    <Text className="text-2xl font-bold text-sea-600 mb-3">
                        {formatRupiah(product.price)}
                    </Text>

                    {/* Stok */}
                    <View className="flex-row items-center gap-2 mb-4">
                        <View
                            className={`rounded-full px-2.5 py-0.5 ${product.stock > 0 ? "bg-green-100" : "bg-red-100"
                                }`}
                        >
                            <Text
                                className={`text-xs font-semibold ${product.stock > 0 ? "text-green-700" : "text-red-600"
                                    }`}
                            >
                                {product.stock > 0 ? `Stok: ${product.stock}` : "Habis"}
                            </Text>
                        </View>
                    </View>

                    {/* Deskripsi */}
                    {product.description ? (
                        <View className="mb-5">
                            <Text className="text-sm font-semibold text-gray-700 mb-1">
                                Deskripsi
                            </Text>
                            <Text className="text-gray-600 leading-6">{product.description}</Text>
                        </View>
                    ) : null}

                    {/* Info toko */}
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

            {/* Bottom action */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
                {canAddToCart ? (
                    <Button
                        label="Tambah ke Keranjang"
                        onPress={() => router.push("/(buyer)/cart" as any)}
                        fullWidth
                        disabled={product.stock === 0}
                    />
                ) : (
                    <Button
                        label={isAuthenticated ? "Masuk sebagai Pembeli untuk membeli" : "Masuk untuk membeli"}
                        onPress={() => router.push("/(public)/login")}
                        variant="outline"
                        fullWidth
                    />
                )}
            </View>
        </View>
    );
}