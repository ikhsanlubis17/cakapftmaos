import axios, { AxiosInstance } from "axios";

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

export const setupInterceptors = (apiClient: AxiosInstance, setup: InterceptorSetup): (() => void) => {
    // Request interceptor
    const requestInterceptor = apiClient.interceptors.request.use(
        (config) => {
            const token = setup.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor
    const responseInterceptor = apiClient.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            if (
                originalRequest._retry ||
                originalRequest.url.includes('/api/refresh') ||
                originalRequest.url.includes('/api/logout')
            ) {
                return Promise.reject(error);
            }

            // If 401 and not already retrying
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    // Try to refresh token
                    const response = await refreshClient.post('/api/refresh', {
                        token: setup.getToken()
                    });

                    const newToken = response.data.token;

                    // Notify about new token
                    await setup.onTokenRefresh(newToken);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return apiClient(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, trigger logout
                    setup.onAuthError();
                    return Promise.reject(refreshError);
                }
            }

            return Promise.reject(error);
        }
    );

    // Return cleanup function
    return () => {
        apiClient.interceptors.request.eject(requestInterceptor);
        apiClient.interceptors.response.eject(responseInterceptor);
    };
};