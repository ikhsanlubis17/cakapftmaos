import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { createApiClient } from '@/services/api';

export interface User {
    id: number;
    email: string;
    name: string;
    role: string;
}

interface LoginResponse {
    token: string;
    user: User;
}

// The query key for the user data
export const userQueryKey = ['user'];

export const useAuthApi = (apiClient: ReturnType<typeof createApiClient>, { updateToken }: { updateToken: (token: string | null) => void }) => {
    const queryClient = useQueryClient();

    const { mutate: login, isPending: isLoggingIn } = useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) =>
            apiClient.post('/api/auth/login', { email, password }),
        onSuccess: (response: { data: LoginResponse }) => {
            const { token: newToken, user: userData } = response.data;
            updateToken(newToken);
            // Manually set the user data in the cache after login
            queryClient.setQueryData(userQueryKey, userData);
        },
    });

    const { mutate: logout, isPending: isLoggingOut } = useMutation({
        mutationFn: () => apiClient.post('/api/auth/logout'),
        onSuccess: () => {
            updateToken(null);
            // Clear the user data from the cache
            queryClient.setQueryData(userQueryKey, null);
        },
        onError: () => {
            // Still log out on the client even if the server call fails
            updateToken(null);
            queryClient.setQueryData(userQueryKey, null);
        }
    });

    const fetchUser = useCallback(async (): Promise<User> => {
        try {
            const response = await apiClient.get('/api/auth/user');
            return response.data;
        } catch (error) {
            console.error("Failed to fetch user", error);
            // Let useQuery handle the error
            throw error;
        }
    }, [apiClient]);

    return {
        login,
        isLoggingIn,
        logout,
        isLoggingOut,
        fetchUser
    };
};