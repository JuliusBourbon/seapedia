import { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import queryClient from "../../lib/queryClient";
import { useAuthStore } from "../../stores/auth.store";
import "../global.css";

export default function RootLayout() {
  const loadToken = useAuthStore((s) => s.loadToken);

  useEffect(() => {
    loadToken();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </QueryClientProvider>
  );
}