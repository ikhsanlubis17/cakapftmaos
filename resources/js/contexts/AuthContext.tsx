import React, { createContext, useContext, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { createApiClient, setupInterceptors } from '../services/api';
import { useAuthState } from '../hooks/useAuthState';
import { useAuthApi, userQueryKey, User } from '../hooks/useAuthApi';

export interface AuthContextType {
    user: User | undefined;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialLoading: boolean;
    login: ReturnType<typeof useAuthApi>['login'];
    logout: ReturnType<typeof useAuthApi>['logout'];
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
    const { token, updateToken, getTokenImmediate } = useAuthState();
    const { login, isLoggingIn, logout, isLoggingOut, fetchUser } = useAuthApi(apiClient, {
        updateToken,
    });

    useEffect(() => {
        const cleanup = setupInterceptors(apiClient, {
            getToken: getTokenImmediate,
            onTokenRefresh: async (newToken: string) => {
                updateToken(newToken);
            },
            onAuthError: () => {
                updateToken(null);
                logout();
            },
        });

        return cleanup;
    }, [apiClient, token, updateToken, logout]);


    const {
        data: user,
        isLoading: isUserLoading,
        isFetching: isUserFetching,
        isError,
    } = useQuery({
        queryKey: userQueryKey,
        queryFn: fetchUser,
        // Only run this query if a token exists!
        enabled: !!token,
        staleTime: 1000 * 60 * 5, // 5 minutes data freshness for user profile
        refetchOnWindowFocus: false, // Prevent re-fetching user profile on window/tab focus
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
            updateToken(null);
            logout();
        }
    }, [isError, updateToken, logout]);

    const value: AuthContextType = useMemo(
        () => ({
            user,
            token,
            isAuthenticated: !!token && !!user && !isUserLoading,
            isLoading: isUserLoading || isLoggingIn || isLoggingOut,
            isInitialLoading: isUserLoading,
            login,
            logout,
            apiClient,
        }),
        [user, token, isUserLoading, isLoggingIn, isLoggingOut, login, logout, apiClient]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};