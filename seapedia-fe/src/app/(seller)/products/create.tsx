import { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "../../../../services/seller.service";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function CreateProductScreen() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [error, setError] = useState("");
    const qc = useQueryClient();

    const mutation = useMutation({
        mutationFn: () => sellerService.createProduct({
            name, description: description || undefined,
            price: parseInt(price, 10),
            stock: parseInt(stock, 10),
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["seller-products"] });
            qc.invalidateQueries({ queryKey: ["seller-dashboard"] });
            router.back();
        },
        onError: (err: any) => setError(err?.response?.data?.message ?? "Gagal membuat produk"),
    });

    const handleSave = () => {
        if (!name.trim()) return setError("Nama produk wajib diisi");
        if (!price || isNaN(parseInt(price, 10))) return setError("Harga tidak valid");
        if (!stock || isNaN(parseInt(stock, 10))) return setError("Stok tidak valid");
        setError("");
        mutation.mutate();
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-gray-50">
            <Header title="Tambah Produk" showBack />
            <ScrollView contentContainerClassName="px-4 pt-5 pb-12">
                <Input label="Nama Produk" value={name} onChangeText={setName} placeholder="Masukkan nama produk" />
                <Input label="Deskripsi (opsional)" value={description} onChangeText={setDescription} placeholder="Deskripsi produk" multiline numberOfLines={3} />
                <Input label="Harga (Rp)" value={price} onChangeText={(v) => setPrice(v.replace(/\D/g, ""))} keyboardType="numeric" placeholder="0" />
                <Input label="Stok" value={stock} onChangeText={(v) => setStock(v.replace(/\D/g, ""))} keyboardType="numeric" placeholder="0" />
                {error ? <Text className="text-red-500 text-sm mb-3">{error}</Text> : null}
                <Button label="Simpan Produk" onPress={handleSave} loading={mutation.isPending} fullWidth size="lg" />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}