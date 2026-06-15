import { useState, useEffect } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "../../../../services/seller.service";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function EditProductScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [error, setError] = useState("");
    const qc = useQueryClient();

    const { data: products } = useQuery({ queryKey: ["seller-products"], queryFn: sellerService.getProducts });
    const product = products?.find((p) => p.id === id);

    useEffect(() => {
        if (product) {
            setName(product.name);
            setDescription(product.description ?? "");
            setPrice(String(product.price));
            setStock(String(product.stock));
        }
    }, [product]);

    const mutation = useMutation({
        mutationFn: () => sellerService.updateProduct(id!, {
            name, description: description || undefined,
            price: parseInt(price, 10),
            stock: parseInt(stock, 10),
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["seller-products"] });
            router.back();
        },
        onError: (err: any) => setError(err?.response?.data?.message ?? "Gagal update produk"),
    });

    const handleSave = () => {
        if (!name.trim()) return setError("Nama produk wajib diisi");
        if (!price || isNaN(parseInt(price, 10))) return setError("Harga tidak valid");
        if (!stock || isNaN(parseInt(stock, 10))) return setError("Stok tidak valid");
        setError("");
        mutation.mutate();
    };

    if (!product) return <LoadingSpinner fullScreen />;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-gray-50">
            <Header title="Edit Produk" showBack />
            <ScrollView contentContainerClassName="px-4 pt-5 pb-12">
                <Input label="Nama Produk" value={name} onChangeText={setName} />
                <Input label="Deskripsi" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
                <Input label="Harga (Rp)" value={price} onChangeText={(v) => setPrice(v.replace(/\D/g, ""))} keyboardType="numeric" />
                <Input label="Stok" value={stock} onChangeText={(v) => setStock(v.replace(/\D/g, ""))} keyboardType="numeric" />
                {error ? <Text className="text-red-500 text-sm mb-3">{error}</Text> : null}
                <Button label="Simpan Perubahan" onPress={handleSave} loading={mutation.isPending} fullWidth size="lg" />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}