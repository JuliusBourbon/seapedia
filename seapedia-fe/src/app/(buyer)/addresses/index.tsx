import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buyerService } from "../../../../services/buyer.service";
import { Address } from "../../../../types/api.types";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const EMPTY_FORM = {
    label: "",
    recipientName: "",
    phoneNumber: "",
    fullAddress: "",
    city: "",
    postalCode: "",
};

export default function AddressesScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    const [editTarget, setEditTarget] = useState<Address | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState("");
    const qc = useQueryClient();

    const { data: addresses, isLoading } = useQuery({
        queryKey: ["addresses"],
        queryFn: buyerService.getAddresses,
    });

    const createMutation = useMutation({
        mutationFn: buyerService.createAddress,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["addresses"] }); closeModal(); },
        onError: (err: any) => setFormError(err?.response?.data?.message ?? "Gagal menyimpan"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Address> }) =>
            buyerService.updateAddress(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["addresses"] }); closeModal(); },
        onError: (err: any) => setFormError(err?.response?.data?.message ?? "Gagal menyimpan"),
    });

    const deleteMutation = useMutation({
        mutationFn: buyerService.deleteAddress,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
    });

    const setDefaultMutation = useMutation({
        mutationFn: buyerService.setDefaultAddress,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
    });

    const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setFormError(""); setModalVisible(true); };
    const openEdit = (addr: Address) => {
        setEditTarget(addr);
        setForm({
            label: addr.label,
            recipientName: addr.recipientName,
            phoneNumber: addr.phoneNumber,
            fullAddress: addr.fullAddress,
            city: addr.city,
            postalCode: addr.postalCode,
        });
        setFormError("");
        setModalVisible(true);
    };
    const closeModal = () => setModalVisible(false);

    const handleSave = () => {
        if (!form.label || !form.recipientName || !form.phoneNumber || !form.fullAddress || !form.city || !form.postalCode) {
            setFormError("Semua field wajib diisi");
            return;
        }
        if (editTarget) {
            updateMutation.mutate({ id: editTarget.id, data: form });
        } else {
            createMutation.mutate(form);
        }
    };

    const handleDelete = (addr: Address) => {
        Alert.alert("Hapus Alamat", `Hapus alamat "${addr.label}"?`, [
            { text: "Batal", style: "cancel" },
            { text: "Hapus", style: "destructive", onPress: () => deleteMutation.mutate(addr.id) },
        ]);
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <View className="flex-1 bg-gray-50">
            <Header title="Alamat Saya" showBack />

            {isLoading ? (
                <LoadingSpinner fullScreen message="Memuat alamat..." />
            ) : (
                <ScrollView contentContainerClassName="px-4 pt-4 pb-8">
                    <Button label="+ Tambah Alamat" onPress={openCreate} fullWidth />

                    <View className="mt-4 gap-3">
                        {(addresses ?? []).length === 0 ? (
                            <View className="items-center py-16">
                                <Text className="text-4xl mb-3">📍</Text>
                                <Text className="text-gray-400">Belum ada alamat tersimpan</Text>
                            </View>
                        ) : (
                            addresses?.map((addr) => (
                                <View key={addr.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                    <View className="flex-row items-start justify-between mb-2">
                                        <View className="flex-row items-center gap-2">
                                            <Text className="font-bold text-gray-800">{addr.label}</Text>
                                            {addr.isDefault && (
                                                <View className="bg-sea-100 rounded-full px-2 py-0.5">
                                                    <Text className="text-sea-700 text-xs font-semibold">Utama</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <Text className="text-sm text-gray-700">{addr.recipientName} · {addr.phoneNumber}</Text>
                                    <Text className="text-sm text-gray-500 mt-0.5">{addr.fullAddress}</Text>
                                    <Text className="text-sm text-gray-500">{addr.city}, {addr.postalCode}</Text>

                                    <View className="flex-row gap-2 mt-3">
                                        {!addr.isDefault && (
                                            <TouchableOpacity
                                                onPress={() => setDefaultMutation.mutate(addr.id)}
                                                className="border border-sea-300 rounded-xl px-3 py-1.5"
                                            >
                                                <Text className="text-sea-600 text-xs font-semibold">Jadikan Utama</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            onPress={() => openEdit(addr)}
                                            className="border border-gray-200 rounded-xl px-3 py-1.5"
                                        >
                                            <Text className="text-gray-600 text-xs font-semibold">Edit</Text>
                                        </TouchableOpacity>
                                        {!addr.isDefault && (
                                            <TouchableOpacity
                                                onPress={() => handleDelete(addr)}
                                                className="border border-red-200 rounded-xl px-3 py-1.5"
                                            >
                                                <Text className="text-red-500 text-xs font-semibold">Hapus</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>
            )}

            {/* Modal form alamat */}
            <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-end">
                    <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
                        <Text className="text-lg font-bold text-gray-900 mb-4">
                            {editTarget ? "Edit Alamat" : "Tambah Alamat"}
                        </Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {([
                                { key: "label", label: "Label (mis. Rumah, Kantor)" },
                                { key: "recipientName", label: "Nama Penerima" },
                                { key: "phoneNumber", label: "Nomor HP" },
                                { key: "fullAddress", label: "Alamat Lengkap" },
                                { key: "city", label: "Kota" },
                                { key: "postalCode", label: "Kode Pos" },
                            ] as { key: keyof typeof EMPTY_FORM; label: string }[]).map(({ key, label }) => (
                                <Input
                                    key={key}
                                    label={label}
                                    value={form[key]}
                                    onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                                    keyboardType={key === "phoneNumber" || key === "postalCode" ? "numeric" : "default"}
                                />
                            ))}
                            {formError ? <Text className="text-red-500 text-sm mb-3">{formError}</Text> : null}
                            <View className="flex-row gap-3 mt-2">
                                <Button label="Batal" onPress={closeModal} variant="outline" fullWidth />
                                <Button label="Simpan" onPress={handleSave} loading={isSaving} fullWidth />
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}