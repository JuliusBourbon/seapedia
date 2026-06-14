import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { buyerService } from "../../../services/buyer.service";
import { useCartStore } from "../../../stores/cart.store";
import { Address, DeliveryMethod } from "../../../types/api.types";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string; desc: string }[] = [
    { value: "INSTANT", label: "Instan", desc: "Tiba dalam 2 jam" },
    { value: "SAME_DAY", label: "Same Day", desc: "Tiba hari ini" },
    { value: "NEXT_DAY", label: "Next Day", desc: "Tiba besok" },
];

export default function CheckoutScreen() {
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("SAME_DAY");
    const [discountCode, setDiscountCode] = useState("");
    const [previewed, setPreviewed] = useState(false);
    const [error, setError] = useState("");

    const clearCartStore = useCartStore((s) => s.clearCart);
    const qc = useQueryClient();

    const { data: addresses, isLoading: loadingAddresses } = useQuery({
        queryKey: ["addresses"],
        queryFn: buyerService.getAddresses,
        onSuccess: (data: Address[]) => {
            const def = data.find((a) => a.isDefault);
            if (def && !selectedAddressId) setSelectedAddressId(def.id);
        },
    } as any);

    const previewMutation = useMutation({
        mutationFn: () =>
            buyerService.previewCheckout({
                addressId: selectedAddressId!,
                deliveryMethod,
                discountCode: discountCode || undefined,
            }),
        onSuccess: () => { setPreviewed(true); setError(""); },
        onError: (err: any) => setError(err?.response?.data?.message ?? "Gagal memuat preview"),
    });

    const confirmMutation = useMutation({
        mutationFn: () =>
            buyerService.confirmCheckout({
                addressId: selectedAddressId!,
                deliveryMethod,
                discountCode: discountCode || undefined,
            }),
        onSuccess: (order) => {
            clearCartStore();
            qc.invalidateQueries({ queryKey: ["cart"] });
            qc.invalidateQueries({ queryKey: ["buyer-dashboard"] });
            qc.invalidateQueries({ queryKey: ["wallet"] });
            router.replace({ pathname: "/(buyer)/orders/[id]", params: { id: order.id } } as any);
        },
        onError: (err: any) => setError(err?.response?.data?.message ?? "Checkout gagal"),
    });

    const preview = previewMutation.data;
    const selectedAddress = (addresses as Address[] | undefined)?.find((a) => a.id === selectedAddressId);

    const SummaryRow = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
        <View className="flex-row justify-between py-1.5">
            <Text className={`text-sm ${highlight ? "font-bold text-gray-900" : "text-gray-500"}`}>{label}</Text>
            <Text className={`text-sm ${highlight ? "font-bold text-sea-600" : "text-gray-800"}`}>{value}</Text>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <Header title="Checkout" showBack />

            <ScrollView contentContainerClassName="px-4 pt-4 pb-36">
                {/* Pilih alamat */}
                <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                    <Text className="font-bold text-gray-800 mb-3">📍 Alamat Pengiriman</Text>
                    {loadingAddresses ? (
                        <LoadingSpinner />
                    ) : (addresses as Address[] | undefined)?.length === 0 ? (
                        <View>
                            <Text className="text-gray-400 text-sm mb-2">Belum ada alamat</Text>
                            <Button
                                label="+ Tambah Alamat"
                                onPress={() => router.push("/(buyer)/addresses/index" as any)}
                                variant="outline"
                                size="sm"
                            />
                        </View>
                    ) : (
                        <View className="gap-2">
                            {(addresses as Address[])?.map((addr) => (
                                <TouchableOpacity
                                    key={addr.id}
                                    onPress={() => { setSelectedAddressId(addr.id); setPreviewed(false); }}
                                    className={`border-2 rounded-xl p-3 ${selectedAddressId === addr.id ? "border-sea-400 bg-sea-50" : "border-gray-100 bg-gray-50"
                                        }`}
                                >
                                    <Text className="font-semibold text-gray-800 text-sm">{addr.label}</Text>
                                    <Text className="text-gray-500 text-xs mt-0.5">
                                        {addr.recipientName} · {addr.phoneNumber}
                                    </Text>
                                    <Text className="text-gray-400 text-xs">{addr.fullAddress}, {addr.city}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Metode pengiriman */}
                <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                    <Text className="font-bold text-gray-800 mb-3">🚚 Metode Pengiriman</Text>
                    <View className="gap-2">
                        {DELIVERY_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                onPress={() => { setDeliveryMethod(opt.value); setPreviewed(false); }}
                                className={`border-2 rounded-xl p-3 flex-row items-center justify-between ${deliveryMethod === opt.value ? "border-sea-400 bg-sea-50" : "border-gray-100"
                                    }`}
                            >
                                <View>
                                    <Text className="font-semibold text-gray-800 text-sm">{opt.label}</Text>
                                    <Text className="text-gray-400 text-xs">{opt.desc}</Text>
                                </View>
                                {deliveryMethod === opt.value && (
                                    <View className="w-5 h-5 rounded-full bg-sea-500 items-center justify-center">
                                        <Text className="text-white text-xs">✓</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Kode diskon */}
                <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                    <Text className="font-bold text-gray-800 mb-2">🏷️ Kode Diskon (opsional)</Text>
                    <Input
                        value={discountCode}
                        onChangeText={(v) => { setDiscountCode(v.toUpperCase()); setPreviewed(false); }}
                        placeholder="Masukkan kode diskon"
                        autoCapitalize="characters"
                    />
                </View>

                {/* Preview ringkasan */}
                {preview && previewed && (
                    <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                        <Text className="font-bold text-gray-800 mb-3">🧾 Ringkasan Pembayaran</Text>
                        <SummaryRow label="Subtotal" value={formatRupiah(preview.subtotal)} />
                        {preview.discount > 0 && (
                            <SummaryRow label="Diskon" value={`-${formatRupiah(preview.discount)}`} />
                        )}
                        <SummaryRow label="PPN (11%)" value={formatRupiah(preview.ppn)} />
                        <SummaryRow label="Ongkos Kirim" value={formatRupiah(preview.deliveryFee)} />
                        <View className="border-t border-gray-100 mt-2 pt-2">
                            <SummaryRow label="Total Bayar" value={formatRupiah(preview.total)} highlight />
                        </View>
                    </View>
                )}

                {error ? (
                    <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                        <Text className="text-red-600 text-sm">{error}</Text>
                    </View>
                ) : null}
            </ScrollView>

            {/* Bottom action */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
                {!previewed ? (
                    <Button
                        label="Lihat Ringkasan Harga"
                        onPress={() => {
                            if (!selectedAddressId) { setError("Pilih alamat pengiriman terlebih dahulu"); return; }
                            setError("");
                            previewMutation.mutate();
                        }}
                        loading={previewMutation.isPending}
                        disabled={!selectedAddressId}
                        fullWidth
                        size="lg"
                    />
                ) : (
                    <Button
                        label={`Bayar ${preview ? formatRupiah(preview.total) : ""}`}
                        onPress={() => confirmMutation.mutate()}
                        loading={confirmMutation.isPending}
                        fullWidth
                        size="lg"
                    />
                )}
            </View>
        </View>
    );
}