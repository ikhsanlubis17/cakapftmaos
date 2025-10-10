import axios, { AxiosError, AxiosInstance } from "axios";

interface InterceptorSetup {
    getToken: () => string | null;
    onTokenRefresh: (newToken: string) => void | Promise<void>;
    onAuthError: () => void;
}

export const createApiClient = (baseURL = 'http://localhost:8000') => {
    return axios.create({
        baseURL,
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

const refreshClient = createApiClient();

export function setupInterceptors(
    apiClient: AxiosInstance,
    setup: {
        getToken: () => string | null;
        onTokenRefresh: (newToken: string) => Promise<void> | void;
        onAuthError: () => void;
    }
) {
    let isRefreshing = false;
    let refreshPromise: Promise<string | null> | null = null;

    const requestInterceptor = apiClient.interceptors.request.use((config) => {
        const token = setup.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    const responseInterceptor = apiClient.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const originalRequest: any = error.config;

            // Only handle 401 errors once per request
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                // ✅ If refresh already in progress — wait for it
                if (isRefreshing && refreshPromise) {
                    const newToken = await refreshPromise;
                    if (newToken) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return apiClient(originalRequest);
                    } else {
                        setup.onAuthError();
                        return Promise.reject(error);
                    }
                }

                // ✅ Otherwise, start a refresh
                isRefreshing = true;
                refreshPromise = (async () => {
                    try {
                        const response = await refreshClient.post('/api/refresh', {}, {
                            headers: {
                                Authorization: `Bearer ${setup.getToken()}`,
                            },
                        });
                        const newToken = (response.data as any).token;
                        await setup.onTokenRefresh(newToken);
                        return newToken;
                    } catch (refreshError) {
                        setup.onAuthError();
                        return null;
                    } finally {
                        isRefreshing = false;
                        refreshPromise = null;
                    }
                })();

                const newToken = await refreshPromise;
                if (newToken) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return apiClient(originalRequest);
                } else {
                    return Promise.reject(error);
                }
            }

            return Promise.reject(error);
        }
    );
    // ✅ Cleanup function
    return () => {
        apiClient.interceptors.request.eject(requestInterceptor);
        apiClient.interceptors.response.eject(responseInterceptor);
    };
}