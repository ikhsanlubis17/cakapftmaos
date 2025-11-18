import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { createApiClient } from '@/services/api';

export interface User {
    id: number;
    email: string;
    name: string;
    role: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

// The query key for the user data
export const userQueryKey = ['user'];

export const useAuthApi = (apiClient: ReturnType<typeof createApiClient>, { updateToken }: { updateToken: (token: string | null) => void }) => {
    const queryClient = useQueryClient();

    const { mutateAsync: login, isPending: isLoggingIn } = useMutation({
        mutationFn: async ({ email, password }: { email: string; password: string }) => {
            const response = await apiClient.post<LoginResponse>('/api/login', { email, password });
            return response.data; // Directly return the LoginResponse
        },
        onSuccess: (data) => { // data is now LoginResponse
            const { token: newToken, user: userData } = data;
            updateToken(newToken);
            queryClient.setQueryData(userQueryKey, userData);
        },
    });

    const { mutateAsync: logout, isPending: isLoggingOut } = useMutation({
        mutationFn: () => apiClient.post('/api/logout'),
        onSuccess: () => {
            updateToken(null);
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
            const response = await apiClient.get('/api/user');
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