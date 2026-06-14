import { useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { catalogService } from "../../../services/catalog.service";
import { useAuthStore } from "../../../stores/auth.store";
import ProductCard from "@/components/product/ProductCard";
import ReviewCard from "@/components/order/ReviewCard";
import RatingStars from "@/components/ui/RatingStars";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type Tab = "products" | "reviews";

export default function HomeScreen() {
    const [activeTab, setActiveTab] = useState<Tab>("products");
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [reviewerName, setReviewerName] = useState("");
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [formError, setFormError] = useState("");

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const activeRole = useAuthStore((s) => s.activeRole);
    const qc = useQueryClient();

    const { data: products, isLoading: loadingProducts } = useQuery({
        queryKey: ["products"],
        queryFn: catalogService.getProducts,
    });

    const { data: reviews, isLoading: loadingReviews } = useQuery({
        queryKey: ["reviews"],
        queryFn: catalogService.getReviews,
        enabled: activeTab === "reviews",
    });

    const submitReview = useMutation({
        mutationFn: catalogService.submitReview,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["reviews"] });
            setReviewModalVisible(false);
            setReviewerName("");
            setRating(5);
            setComment("");
            setFormError("");
        },
        onError: (err: any) => {
            setFormError(err?.response?.data?.message ?? "Gagal mengirim ulasan");
        },
    });

    const handleSubmitReview = () => {
        if (!reviewerName.trim()) return setFormError("Nama wajib diisi");
        if (!comment.trim()) return setFormError("Komentar wajib diisi");
        setFormError("");
        submitReview.mutate({ reviewerName, rating, comment });
    };

    const getDashboardRoute = () => {
        if (!activeRole) return null;
        const map: Record<string, string> = {
            BUYER: "/(buyer)/dashboard",
            SELLER: "/(seller)/dashboard",
            DRIVER: "/(driver)/dashboard",
            ADMIN: "/(admin)/dashboard",
        };
        return map[activeRole] ?? null;
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-sea-500 pt-12 pb-5 px-5">
                <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-white text-2xl font-bold tracking-tight">
                        🌊 SEAPEDIA
                    </Text>
                    {isAuthenticated ? (
                        <TouchableOpacity
                            onPress={() => {
                                const route = getDashboardRoute();
                                if (route) router.push(route as any);
                            }}
                            className="bg-white/20 rounded-full px-3 py-1.5"
                        >
                            <Text className="text-white text-sm font-semibold">Dashboard</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => router.push("/(public)/login")}
                            className="bg-white/20 rounded-full px-3 py-1.5"
                        >
                            <Text className="text-white text-sm font-semibold">Masuk</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text className="text-sea-100 text-sm">
                    Marketplace multi-seller terpercaya
                </Text>
            </View>

            {/* Tab */}
            <View className="flex-row bg-white border-b border-gray-200 px-4">
                {(["products", "reviews"] as Tab[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        className={`mr-6 py-3 border-b-2 ${activeTab === tab ? "border-sea-500" : "border-transparent"
                            }`}
                    >
                        <Text
                            className={`text-sm font-semibold ${activeTab === tab ? "text-sea-600" : "text-gray-400"
                                }`}
                        >
                            {tab === "products" ? "Produk" : "Ulasan Aplikasi"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            {activeTab === "products" ? (
                loadingProducts ? (
                    <LoadingSpinner message="Memuat produk..." fullScreen />
                ) : (
                    <FlatList
                        data={products ?? []}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        columnWrapperClassName="gap-3 px-4"
                        contentContainerClassName="pt-4 pb-8"
                        renderItem={({ item }) => (
                            <View className="flex-1">
                                <ProductCard product={item} />
                            </View>
                        )}
                        ListEmptyComponent={
                            <View className="items-center py-20">
                                <Text className="text-4xl mb-3">🛒</Text>
                                <Text className="text-gray-400">Belum ada produk</Text>
                            </View>
                        }
                    />
                )
            ) : (
                <View className="flex-1">
                    {/* Tombol tulis ulasan */}
                    <View className="px-4 pt-4 pb-2">
                        <Button
                            label="✏️  Tulis Ulasan"
                            onPress={() => setReviewModalVisible(true)}
                            fullWidth
                        />
                    </View>

                    {loadingReviews ? (
                        <LoadingSpinner message="Memuat ulasan..." />
                    ) : (
                        <FlatList
                            data={reviews ?? []}
                            keyExtractor={(item) => item.id}
                            contentContainerClassName="px-4 pb-8"
                            renderItem={({ item }) => <ReviewCard review={item} />}
                            ListEmptyComponent={
                                <View className="items-center py-16">
                                    <Text className="text-4xl mb-3">💬</Text>
                                    <Text className="text-gray-400">Belum ada ulasan</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            )}

            {/* Modal tulis ulasan */}
            <Modal
                visible={reviewModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setReviewModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 justify-end"
                >
                    <View className="bg-white rounded-t-3xl p-6 shadow-xl">
                        <Text className="text-lg font-bold text-gray-900 mb-4">
                            Tulis Ulasan
                        </Text>

                        {/* Nama */}
                        <Text className="text-sm font-medium text-gray-700 mb-1">
                            Nama
                        </Text>
                        <TextInput
                            value={reviewerName}
                            onChangeText={setReviewerName}
                            placeholder="Nama Anda"
                            placeholderTextColor="#9ca3af"
                            className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-900"
                        />

                        {/* Rating */}
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                            Rating
                        </Text>
                        <View className="mb-4">
                            <RatingStars
                                rating={rating}
                                size={32}
                                interactive
                                onRate={setRating}
                            />
                        </View>

                        {/* Komentar */}
                        <Text className="text-sm font-medium text-gray-700 mb-1">
                            Komentar
                        </Text>
                        <TextInput
                            value={comment}
                            onChangeText={setComment}
                            placeholder="Ceritakan pengalaman Anda..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-900 h-28"
                        />

                        {formError ? (
                            <Text className="text-red-500 text-sm mb-3">{formError}</Text>
                        ) : null}

                        <View className="flex-row gap-3">
                            <Button
                                label="Batal"
                                onPress={() => setReviewModalVisible(false)}
                                variant="outline"
                                fullWidth
                            />
                            <Button
                                label="Kirim"
                                onPress={handleSubmitReview}
                                loading={submitReview.isPending}
                                fullWidth
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}