import React, { createContext, useContext, useEffect, useRef } from 'react';
import { UseMutateAsyncFunction, useQuery } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import { createApiClient, setupInterceptors } from '../services/api';
import { useAuthState } from '../hooks/useAuthState';
import { useAuthApi, userQueryKey, User, LoginResponse } from '../hooks/useAuthApi';

export interface AuthContextType {
    user: User | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
    isPending: boolean;
    login: UseMutateAsyncFunction<{
        data: LoginResponse;
    }, Error, {
        email: string;
        password: string;
    }, unknown>
    logout: UseMutateAsyncFunction<AxiosResponse<any, any, {}>, Error, void, unknown>;
    apiClient: ReturnType<typeof createApiClient>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children, apiClient: externalApiClient }: { children: React.ReactNode; apiClient?: ReturnType<typeof createApiClient> }) => {
    // Prevent re-creating the API client on every render by using useRef
    const apiClientRef = useRef(externalApiClient || createApiClient());
    const apiClient = apiClientRef.current;
    const { token, updateToken } = useAuthState();
    const { login, isLoggingIn, logout, isLoggingOut, fetchUser } = useAuthApi(apiClient, {
        updateToken,
    });

    useEffect(() => {
        const cleanup = setupInterceptors(apiClient, {
            getToken: () => token,
            onTokenRefresh: async (newToken: string) => {
                updateToken(newToken);
            },
            onAuthError: () => {
                // When refresh fails, log out.
                logout();
            },
        });
        return cleanup;
    }, [apiClient, token, updateToken, logout]);

    const {
        data: user,
        isLoading: isUserLoading,
        isFetching: isUserFetching,
        isPending,
        isError,
    } = useQuery({
        queryKey: userQueryKey,
        queryFn: fetchUser,
        // Only run this query if a token exists!
        enabled: !!token,
        // We don't want to retry on 401/403, as that means the token is bad.
        retry: (failureCount, error) => {
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
                return false;
            }
            return failureCount < 3;
        },
        // Prevent re-throwing errors to the console
        throwOnError: false,
    });

    // If the query errors (e.g., with a 401), it means the token is invalid. Log out.
    useEffect(() => {
        if (isError) {
            logout();
        }
    }, [isError, logout]);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user && !isUserLoading,
        isLoading: isUserLoading || isUserFetching || isLoggingIn || isLoggingOut,
        isPending: isPending,
        login,
        logout,
        apiClient
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};