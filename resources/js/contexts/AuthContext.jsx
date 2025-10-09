import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:8000';

// Add request interceptor to include token in all requests
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token expiration
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && !isRefreshing) {
            setIsRefreshing(true);
            try {
                const refreshResponse = await axios.post('/api/refresh');
                const newToken = refreshResponse.data.token;
                setToken(newToken);
                localStorage.setItem('token', newToken);
                axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                originalRequest._retry = true;
                setIsRefreshing(false);
                return axios(originalRequest);
            } catch (refreshError) {
                setIsRefreshing(false);
                logout();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Set Authorization header when token changes
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get('/api/user');
                setUser(response.data);
            } catch (error) {
                console.error('Authentication check failed:', error);
                // Only logout if it's an authentication error (401, 403)
                if (error.response?.status === 401 || error.response?.status === 403) {
                    logout();
                } else {
                    // For other errors (network, server errors), don't logout immediately
                    // Just set loading to false to allow the app to continue
                    console.warn('Non-auth error during auth check, continuing with app');
                }
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await axios.post('/api/login', { email, password });
            const { token: newToken, user: userData } = response.data;

            setToken(newToken);
            setUser(userData);
            localStorage.setItem('token', newToken);

            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed',
            };
        }
    };

    const logout = async () => {
        try {
            // Call logout endpoint to invalidate token on server
            if (token) {
                await axios.post('/api/logout');
            }
        } catch (error) {
            console.error('Logout request failed:', error);
        } finally {
            // Always clear local state regardless of server response
            setUser(null);
            setToken(null);
            setIsRefreshing(false);
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
