import { useState, useCallback } from 'react';
import { tokenStorage } from '@/services/tokenStorage';

export const useAuthState = () => {
    const [token, setToken] = useState(tokenStorage.get());

    // updateToken(null) clears the token
    const updateToken = useCallback((newToken: string | null) => {
        setToken(newToken);
        if (newToken) {
            tokenStorage.set(newToken);
        } else {
            tokenStorage.remove();
        }
    }, []);

    return {
        token,
        updateToken,
    };
};