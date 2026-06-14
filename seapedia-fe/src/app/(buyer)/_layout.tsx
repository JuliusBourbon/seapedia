import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useCartStore } from "../../../stores/cart.store";

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
    return (
        <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
    );
}

export default function BuyerLayout() {
    const totalItems = useCartStore((s) => s.totalItems);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: "#fff",
                    borderTopColor: "#f1f5f9",
                    height: 60,
                    paddingBottom: 8,
                },
                tabBarActiveTintColor: "#06b6d4",
                tabBarInactiveTintColor: "#9ca3af",
                tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "Beranda",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="🏠" label="Beranda" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    title: "Keranjang",
                    tabBarBadge: totalItems > 0 ? totalItems : undefined,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="🛒" label="Keranjang" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="orders/index"
                options={{
                    title: "Pesanan",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="📦" label="Pesanan" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="wallet/index"
                options={{
                    title: "Dompet",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="💰" label="Dompet" focused={focused} />
                    ),
                }}
            />
            {/* Hidden screens — tidak muncul di tab bar */}
            <Tabs.Screen name="orders/[id]" options={{ href: null }} />
            <Tabs.Screen name="wallet/topup" options={{ href: null }} />
            <Tabs.Screen name="addresses/index" options={{ href: null }} />
            {/* <Tabs.Screen name="addresses/[id]" options={{ href: null }} /> */}
            <Tabs.Screen name="checkout" options={{ href: null }} />
        </Tabs>
    );
}