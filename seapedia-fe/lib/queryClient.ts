import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 30 * 1000, // 30 detik
            gcTime: 5 * 60 * 1000, // 5 menit
        },
        mutations: {
            retry: 0,
        },
    },
});

export default queryClient;