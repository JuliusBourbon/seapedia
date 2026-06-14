import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Product } from "../../../types/api.types";

interface ProductCardProps {
    product: Product;
}

function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function ProductCard({ product }: ProductCardProps) {
    return (
        <TouchableOpacity
            onPress={() => router.push({ pathname: "/(public)/product/[id]", params: { id: product.id } })}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3"
        >
            {/* Placeholder image */}
            <View className="h-40 bg-sea-50 items-center justify-center">
                <Text className="text-5xl">🛍️</Text>
            </View>

            <View className="p-3">
                <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
                    {product.name}
                </Text>

                <Text className="text-sea-600 font-bold text-base mb-2">
                    {formatRupiah(product.price)}
                </Text>

                <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-gray-400" numberOfLines={1}>
                        {product.store?.name ?? "-"}
                    </Text>
                    <Text className="text-xs text-gray-400">
                        Stok: {product.stock}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}