import { Stack } from "expo-router";

export default function PublicLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="home" />
            <Stack.Screen name="login" />
            <Stack.Screen name="product/[id]" />
            <Stack.Screen name="store/[id]" />
        </Stack>
    );
}