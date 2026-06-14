import { View, Text, FlatList } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { catalogService } from "../../../../services/catalog.service";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ProductCard from "@/components/product/ProductCard";
import Button from "@/components/ui/Button";
import Header from "@/components/layout/Header";

export default function StoreDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const { data: store, isLoading, isError } = useQuery({
        queryKey: ["store", id],
        queryFn: () => catalogService.getStore(id!),
        enabled: !!id,
    });

    if (isLoading) return <LoadingSpinner fullScreen message="Memuat toko..." />;

    if (isError || !store) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <Text className="text-4xl mb-3">🏪</Text>
                <Text className="text-gray-500">Toko tidak ditemukan</Text>
                <Button label="Kembali" onPress={() => router.back()} variant="ghost" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Header title="Detail Toko" showBack />

            <FlatList
                data={store.products ?? []}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperClassName="gap-3 px-4"
                contentContainerClassName="pb-8"
                ListHeaderComponent={
                    <View className="bg-white px-5 py-6 mb-4 border-b border-gray-100">
                        <View className="flex-row items-center gap-3 mb-2">
                            <View className="w-14 h-14 rounded-2xl bg-sea-100 items-center justify-center">
                                <Text className="text-3xl">🏪</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-xl font-bold text-gray-900">{store.name}</Text>
                                {store.description ? (
                                    <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                                        {store.description}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                        <Text className="text-xs text-gray-400 mt-1">
                            {store.products?.length ?? 0} produk tersedia
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View className="flex-1">
                        <ProductCard product={{ ...item, store }} />
                    </View>
                )}
                ListEmptyComponent={
                    <View className="items-center py-16">
                        <Text className="text-4xl mb-3">📦</Text>
                        <Text className="text-gray-400">Toko ini belum punya produk</Text>
                    </View>
                }
            />
        </View>
    );
}