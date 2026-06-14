import { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { authService } from "../../../services/auth.service";
import { useAuthStore } from "../../../stores/auth.store";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { setToken, setPreAuthToken } = useAuthStore();

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            setError("Username dan password wajib diisi");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await authService.login(username.trim(), password);

            if (res.requiresRoleSelection) {
                // Multi-role: simpan preAuthToken, arahkan ke halaman pilih role
                setPreAuthToken(res.preAuthToken, res.roles);
                router.replace("/role-select" as any);
            } else {
                // Single role: token final langsung tersedia
                await setToken(res.token, {
                    id: "",
                    username: username.trim(),
                    roles: res.roles,
                    activeRole: res.activeRole,
                });
                redirectToDashboard(res.activeRole);
            }
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ?? "Login gagal. Periksa username dan password.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const redirectToDashboard = (role: string) => {
        const map: Record<string, string> = {
            BUYER: "/(buyer)/dashboard",
            SELLER: "/(seller)/dashboard",
            DRIVER: "/(driver)/dashboard",
            ADMIN: "/(admin)/dashboard",
        };
        router.replace((map[role] ?? "/(public)/home") as any);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-gray-50"
        >
            <ScrollView
                contentContainerClassName="flex-grow justify-center px-6 py-12"
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo */}
                <View className="items-center mb-10">
                    <Text className="text-5xl mb-3">🌊</Text>
                    <Text className="text-3xl font-bold text-sea-600 tracking-tight">
                        SEAPEDIA
                    </Text>
                    <Text className="text-gray-400 text-sm mt-1">
                        Masuk ke akun Anda
                    </Text>
                </View>

                {/* Form */}
                <View className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <Input
                        label="Username"
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Masukkan username"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Input
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Masukkan password"
                        secureTextEntry
                    />

                    {error ? (
                        <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                            <Text className="text-red-600 text-sm">{error}</Text>
                        </View>
                    ) : null}

                    <Button
                        label="Masuk"
                        onPress={handleLogin}
                        loading={loading}
                        fullWidth
                        size="lg"
                    />
                </View>

                {/* Kembali ke katalog */}
                <TouchableOpacity
                    onPress={() => router.replace("/(public)/home")}
                    className="mt-6 items-center"
                >
                    <Text className="text-gray-400 text-sm">
                        Lanjutkan sebagai{" "}
                        <Text className="text-sea-600 font-semibold">tamu</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}