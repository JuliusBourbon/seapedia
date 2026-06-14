import { useState } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buyerService } from "../../../../services/buyer.service";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function TopUpScreen() {
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");
    const qc = useQueryClient();

    const topUp = useMutation({
        mutationFn: (amt: number) => buyerService.topUpWallet(amt),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["wallet"] });
            qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
            qc.invalidateQueries({ queryKey: ["buyer-dashboard"] });
            router.back();
        },
        onError: (err: any) => {
            setError(err?.response?.data?.message ?? "Top up gagal");
        },
    });

    const handleTopUp = () => {
        const parsed = parseInt(amount.replace(/\D/g, ""), 10);
        if (!parsed || parsed < 10000) {
            setError("Minimal top up Rp 10.000");
            return;
        }
        setError("");
        topUp.mutate(parsed);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-gray-50"
        >
            <Header title="Top Up Saldo" showBack />

            <ScrollView contentContainerClassName="px-4 pt-6 pb-12">
                {/* Quick amounts */}
                <Text className="text-sm font-semibold text-gray-700 mb-3">
                    Pilih nominal
                </Text>
                <View className="flex-row flex-wrap gap-3 mb-6">
                    {QUICK_AMOUNTS.map((amt) => (
                        <TouchableOpacity
                            key={amt}
                            onPress={() => setAmount(String(amt))}
                            className={`border rounded-xl px-4 py-2.5 ${amount === String(amt)
                                ? "bg-sea-500 border-sea-500"
                                : "bg-white border-gray-200"
                                }`}
                        >
                            <Text
                                className={`text-sm font-semibold ${amount === String(amt) ? "text-white" : "text-gray-700"
                                    }`}
                            >
                                {formatRupiah(amt)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Manual input */}
                <Input
                    label="Atau masukkan nominal lain"
                    value={amount ? formatRupiah(parseInt(amount, 10)) : ""}
                    onChangeText={(v) => setAmount(v.replace(/\D/g, ""))}
                    keyboardType="numeric"
                    placeholder="Rp 0"
                    error={error}
                />

                <Button
                    label={`Top Up ${amount ? formatRupiah(parseInt(amount, 10)) : ""}`}
                    onPress={handleTopUp}
                    loading={topUp.isPending}
                    disabled={!amount}
                    fullWidth
                    size="lg"
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}