import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { buyerService } from "../../../../services/buyer.service";
import { WalletTransaction } from "../../../../types/api.types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";

function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const TX_CONFIG = {
    TOPUP: { label: "Top Up", icon: "💳", color: "text-green-600", bg: "bg-green-50", sign: "+" },
    PAYMENT: { label: "Pembayaran", icon: "🛒", color: "text-red-500", bg: "bg-red-50", sign: "-" },
    REFUND: { label: "Refund", icon: "↩️", color: "text-blue-600", bg: "bg-blue-50", sign: "+" },
};

function TransactionRow({ tx }: { tx: WalletTransaction }) {
    const cfg = TX_CONFIG[tx.type] ?? TX_CONFIG.TOPUP;
    return (
        <View className="flex-row items-center gap-3 py-3 border-b border-gray-50">
            <View className={`w-10 h-10 rounded-full ${cfg.bg} items-center justify-center`}>
                <Text>{cfg.icon}</Text>
            </View>
            <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-800">{cfg.label}</Text>
                <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
                    {tx.description}
                </Text>
                <Text className="text-xs text-gray-300 mt-0.5">{formatDate(tx.createdAt)}</Text>
            </View>
            <View className="items-end">
                <Text className={`font-bold text-sm ${cfg.color}`}>
                    {cfg.sign}{formatRupiah(tx.amount)}
                </Text>
                <Text className="text-xs text-gray-400 mt-0.5">
                    Sisa {formatRupiah(tx.balanceAfter)}
                </Text>
            </View>
        </View>
    );
}

export default function WalletScreen() {
    const { data: wallet, isLoading: loadingWallet } = useQuery({
        queryKey: ["wallet"],
        queryFn: buyerService.getWallet,
    });

    const { data: transactions, isLoading: loadingTx } = useQuery({
        queryKey: ["wallet-transactions"],
        queryFn: buyerService.getWalletTransactions,
    });

    return (
        <View className="flex-1 bg-gray-50">
            <Header title="Dompet Saya" />

            <ScrollView contentContainerClassName="pb-8">
                {/* Balance card */}
                <View className="mx-4 mt-4 bg-sea-500 rounded-3xl p-5 shadow-sm">
                    {loadingWallet ? (
                        <LoadingSpinner />
                    ) : (
                        <>
                            <Text className="text-sea-100 text-sm mb-1">Saldo tersedia</Text>
                            <Text className="text-white text-4xl font-bold mb-4">
                                {formatRupiah(wallet?.balance ?? 0)}
                            </Text>
                            <Button
                                label="+ Top Up Saldo"
                                onPress={() => router.push("/(buyer)/wallet/topup" as any)}
                                variant="outline"
                                size="sm"
                            />
                        </>
                    )}
                </View>

                {/* Transaction history */}
                <View className="mx-4 mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <Text className="font-bold text-gray-800 mb-2">Riwayat Transaksi</Text>

                    {loadingTx ? (
                        <LoadingSpinner message="Memuat transaksi..." />
                    ) : (transactions ?? []).length === 0 ? (
                        <View className="items-center py-10">
                            <Text className="text-3xl mb-2">💸</Text>
                            <Text className="text-gray-400 text-sm">Belum ada transaksi</Text>
                        </View>
                    ) : (
                        transactions?.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
                    )}
                </View>
            </ScrollView>
        </View>
    );
}