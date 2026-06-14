import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../stores/auth.store";
import { Role } from "../../types/api.types";
import Button from "@/components/ui/Button";

const ROLE_CONFIG: Record<
    Role,
    { label: string; description: string; icon: string; color: string; bg: string }
> = {
    BUYER: {
        label: "Pembeli",
        description: "Jelajahi produk dan lakukan pembelian",
        icon: "🛒",
        color: "text-sea-700",
        bg: "bg-sea-50 border-sea-200",
    },
    SELLER: {
        label: "Penjual",
        description: "Kelola toko dan produk Anda",
        icon: "🏪",
        color: "text-emerald-700",
        bg: "bg-emerald-50 border-emerald-200",
    },
    DRIVER: {
        label: "Driver",
        description: "Ambil dan antar pesanan",
        icon: "🚴",
        color: "text-violet-700",
        bg: "bg-violet-50 border-violet-200",
    },
    ADMIN: {
        label: "Admin",
        description: "Monitor seluruh marketplace",
        icon: "⚙️",
        color: "text-red-700",
        bg: "bg-red-50 border-red-200",
    },
};

export default function RoleSelectScreen() {
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { preAuthToken, availableRoles, setToken, clearPreAuth } = useAuthStore();

    const handleConfirm = async () => {
        if (!selectedRole || !preAuthToken) return;

        setLoading(true);
        setError("");

        try {
            const res = await authService.selectRole(selectedRole, preAuthToken);
            await setToken(res.token, {
                id: "",
                username: "",
                roles: res.roles,
                activeRole: res.activeRole,
            });

            const map: Record<string, string> = {
                BUYER: "/(buyer)/dashboard",
                SELLER: "/(seller)/dashboard",
                DRIVER: "/(driver)/dashboard",
                ADMIN: "/(admin)/dashboard",
            };
            router.replace((map[res.activeRole] ?? "/(public)/home") as any);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Gagal memilih role");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        clearPreAuth();
        router.replace("/(public)/login");
    };

    return (
        <View className="flex-1 bg-gray-50 px-5 justify-center">
            <View className="items-center mb-8">
                <Text className="text-5xl mb-3">👤</Text>
                <Text className="text-2xl font-bold text-gray-900">Pilih Mode</Text>
                <Text className="text-gray-400 text-sm mt-1 text-center">
                    Akun Anda memiliki beberapa role.{"\n"}Pilih mode yang ingin digunakan sekarang.
                </Text>
            </View>

            <View className="gap-3 mb-6">
                {availableRoles.map((role) => {
                    const cfg = ROLE_CONFIG[role];
                    const isSelected = selectedRole === role;

                    return (
                        <TouchableOpacity
                            key={role}
                            onPress={() => setSelectedRole(role)}
                            className={`border-2 rounded-2xl p-4 flex-row items-center gap-4 ${isSelected
                                ? cfg.bg + " border-opacity-100"
                                : "bg-white border-gray-200"
                                }`}
                        >
                            <View className="w-12 h-12 rounded-xl bg-white items-center justify-center shadow-sm">
                                <Text className="text-2xl">{cfg.icon}</Text>
                            </View>
                            <View className="flex-1">
                                <Text
                                    className={`font-bold text-base ${isSelected ? cfg.color : "text-gray-800"
                                        }`}
                                >
                                    {cfg.label}
                                </Text>
                                <Text className="text-gray-400 text-sm">{cfg.description}</Text>
                            </View>
                            {isSelected && (
                                <View className="w-5 h-5 rounded-full bg-sea-500 items-center justify-center">
                                    <Text className="text-white text-xs font-bold">✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {error ? (
                <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                    <Text className="text-red-600 text-sm">{error}</Text>
                </View>
            ) : null}

            <Button
                label="Lanjutkan"
                onPress={handleConfirm}
                loading={loading}
                disabled={!selectedRole}
                fullWidth
                size="lg"
            />

            <Button
                label="Kembali ke Login"
                onPress={handleCancel}
                variant="ghost"
                fullWidth
            />
        </View>
    );
}