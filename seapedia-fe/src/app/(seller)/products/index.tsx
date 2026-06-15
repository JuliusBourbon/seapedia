import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { sellerService } from "../../../../services/seller.service";
import { Product } from "../../../../types/api.types";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export default function SellerProductsScreen() {
    const qc = useQueryClient();
    const { data: products, isLoading } = useQuery({
        queryKey: ["seller-products"],
        queryFn: sellerService.getProducts,
    });

    const deleteMutation = useMutation({
        mutationFn: sellerService.deleteProduct,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["seller-products"] }),
    });

    const handleDelete = (p: Product) => {
        Alert.alert("Hapus Produk", `Hapus "${p.name}"?`, [
            { text: "Batal", style: "cancel" },
            { text: "Hapus", style: "destructive", onPress: () => deleteMutation.mutate(p.id) },
        ]);
    };

    return (
        <View className="flex-1 bg-gray-50">
            <Header
                title="Produk Saya"
                rightElement={
                    <TouchableOpacity onPress={() => router.push("/(seller)/products/create" as any)}>
                        <Text className="text-emerald-600 font-semibold">+ Tambah</Text>
                    </TouchableOpacity>
                }
            />
            {isLoading ? <LoadingSpinner fullScreen /> : (
                <FlatList
                    data={products ?? []}
                    keyExtractor={(item) => item.id}
                    contentContainerClassName="px-4 pt-4 pb-8"
                    renderItem={({ item }) => (
                        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3">
                            <View className="flex-row items-start justify-between mb-2">
                                <View className="flex-1">
                                    <Text className="font-semibold text-gray-900" numberOfLines={1}>{item.name}</Text>
                                    <Text className="text-emerald-600 font-bold mt-0.5">{formatRupiah(item.price)}</Text>
                                </View>
                                <View className={`rounded-full px-2.5 py-0.5 ${item.stock > 0 ? "bg-green-100" : "bg-red-100"}`}>
                                    <Text className={`text-xs font-semibold ${item.stock > 0 ? "text-green-700" : "text-red-600"}`}>
                                        Stok: {item.stock}
                                    </Text>
                                </View>
                            </View>
                            {item.description ? <Text className="text-gray-400 text-xs mb-3" numberOfLines={1}>{item.description}</Text> : null}
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => router.push({ pathname: "/(seller)/products/[id]", params: { id: item.id } } as any)}
                                    className="border border-gray-200 rounded-xl px-3 py-1.5"
                                >
                                    <Text className="text-gray-600 text-xs font-semibold">Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleDelete(item)}
                                    className="border border-red-200 rounded-xl px-3 py-1.5"
                                >
                                    <Text className="text-red-500 text-xs font-semibold">Hapus</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View className="items-center py-20">
                            <Text className="text-5xl mb-3">📦</Text>
                            <Text className="text-gray-400 mb-4">Belum ada produk</Text>
                            <Button label="+ Tambah Produk" onPress={() => router.push("/(seller)/products/create" as any)} />
                        </View>
                    }
                />
            )}
        </View>
    );
}