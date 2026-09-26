import { QueryClient } from "@tanstack/react-query";

// Tanstack Query Client configured to prevent aggressive refetches on browser tab switch
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false, // Prevent background refetch flicker/re-render when switching browser tabs
            staleTime: 1000 * 60 * 2, // 2 minutes data freshness
            retry: 1,
        },
    },
});
