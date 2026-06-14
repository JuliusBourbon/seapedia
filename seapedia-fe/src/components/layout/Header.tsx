import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../../stores/auth.store";

const ROLE_LABEL: Record<string, string> = {
    BUYER: "Pembeli",
    SELLER: "Penjual",
    DRIVER: "Driver",
    ADMIN: "Admin",
};

const ROLE_COLOR: Record<string, string> = {
    BUYER: "bg-sea-500",
    SELLER: "bg-emerald-500",
    DRIVER: "bg-violet-500",
    ADMIN: "bg-red-500",
};

interface HeaderProps {
    title: string;
    showBack?: boolean;
    rightElement?: React.ReactNode;
}

export default function Header({ title, showBack = false, rightElement }: HeaderProps) {
    const activeRole = useAuthStore((s) => s.activeRole);

    return (
        <View className="bg-white border-b border-gray-100 px-4 pt-12 pb-3">
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                    {showBack && (
                        <TouchableOpacity onPress={() => router.back()} className="mr-1">
                            <Text className="text-sea-600 text-xl">←</Text>
                        </TouchableOpacity>
                    )}
                    <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={1}>
                        {title}
                    </Text>
                </View>

                <View className="flex-row items-center gap-2">
                    {activeRole && (
                        <View className={`rounded-full px-2.5 py-1 ${ROLE_COLOR[activeRole] ?? "bg-gray-400"}`}>
                            <Text className="text-white text-xs font-semibold">
                                {ROLE_LABEL[activeRole] ?? activeRole}
                            </Text>
                        </View>
                    )}
                    {rightElement}
                </View>
            </View>
        </View>
    );
}