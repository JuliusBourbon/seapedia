import { Tabs } from "expo-router";
import { Text } from "react-native";

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
    return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>;
}

export default function SellerLayout() {
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
                tabBarActiveTintColor: "#10b981",
                tabBarInactiveTintColor: "#9ca3af",
                tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="products/index"
                options={{
                    title: "Produk",
                    tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="orders/index"
                options={{
                    title: "Pesanan",
                    tabBarIcon: ({ focused }) => <TabIcon emoji="🧾" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="store"
                options={{
                    title: "Toko",
                    tabBarIcon: ({ focused }) => <TabIcon emoji="🏪" focused={focused} />,
                }}
            />
            <Tabs.Screen name="products/create" options={{ href: null }} />
            <Tabs.Screen name="products/[id]" options={{ href: null }} />
            <Tabs.Screen name="orders/[id]" options={{ href: null }} />
        </Tabs>
    );
}