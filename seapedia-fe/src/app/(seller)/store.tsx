import { View, Text, ScrollView, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "../../../services/seller.service";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useState } from "react";

export default function SellerStoreScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const qc = useQueryClient();

    const { data: store, isLoading } = useQuery({
        queryKey: ["seller-store"],
        queryFn: sellerService.getStore,
    });

    const createMutation = useMutation({
        mutationFn: () => sellerService.createStore({ name, description: description || undefined }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["seller-store"] }); qc.invalidateQueries({ queryKey: ["seller-dashboard"] }); setModalVisible(false); },
        onError: (err: any) => setError(err?.response?.data?.message ?? "Gagal membuat toko"),
    });

    const updateMutation = useMutation({
        mutationFn: () => sellerService.updateStore({ name, description: description || undefined }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["seller-store"] }); qc.invalidateQueries({ queryKey: ["seller-dashboard"] }); setModalVisible(false); },
        onError: (err: any) => setError(err?.response?.data?.message ?? "Gagal update toko"),
    });

    const openModal = (edit = false) => {
        if (edit && store) { setName(store.name); setDescription(store.description ?? ""); }
        else { setName(""); setDescription(""); }
        setError("");
        setModalVisible(true);
    };

    const isEdit = !!store;
    const isSaving = createMutation.isPending || updateMutation.isPending;

    if (isLoading) return <LoadingSpinner fullScreen />;

    return (
        <View className="flex-1 bg-gray-50">
            <Header title="Kelola Toko" />
            <ScrollView contentContainerClassName="px-4 pt-5 pb-10">
                {!store ? (
                    <View className="items-center py-20">
                        <Text className="text-6xl mb-4">🏪</Text>
                        <Text className="text-gray-700 font-semibold text-lg mb-2">Belum punya toko</Text>
                        <Text className="text-gray-400 text-sm mb-6 text-center">Buat toko untuk mulai berjualan</Text>
                        <Button label="Buat Toko Sekarang" onPress={() => openModal(false)} />
                    </View>
                ) : (
                    <View>
                        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
                            <View className="flex-row items-center gap-4 mb-4">
                                <View className="w-16 h-16 bg-emerald-100 rounded-2xl items-center justify-center">
                                    <Text className="text-3xl">🏪</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xl font-bold text-gray-900">{store.name}</Text>
                                    <Text className="text-gray-500 text-sm mt-1">{store.description ?? "Tidak ada deskripsi"}</Text>
                                </View>
                            </View>
                            <Button label="✏️  Edit Info Toko" onPress={() => openModal(true)} variant="outline" fullWidth />
                        </View>
                        <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                            <Text className="font-bold text-gray-800 mb-3">Daftar Produk ({store.products?.length ?? 0})</Text>
                            {(store.products ?? []).map((p) => (
                                <View key={p.id} className="flex-row items-center justify-between py-2 border-b border-gray-50">
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>{p.name}</Text>
                                        <Text className="text-xs text-gray-400">Stok: {p.stock}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                        <Text className="text-lg font-bold text-gray-900 mb-4">{isEdit ? "Edit Toko" : "Buat Toko"}</Text>
                        <Input label="Nama Toko" value={name} onChangeText={setName} placeholder="Masukkan nama toko" />
                        <Input label="Deskripsi (opsional)" value={description} onChangeText={setDescription} placeholder="Deskripsi singkat toko Anda" multiline numberOfLines={3} />
                        {error ? <Text className="text-red-500 text-sm mb-3">{error}</Text> : null}
                        <View className="flex-row gap-3">
                            <Button label="Batal" onPress={() => setModalVisible(false)} variant="outline" fullWidth />
                            <Button label="Simpan" onPress={() => isEdit ? updateMutation.mutate() : createMutation.mutate()} loading={isSaving} fullWidth />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}