import { useState, useCallback, useRef } from 'react';
import { tokenStorage } from '@/services/tokenStorage';

export const useAuthState = () => {
    const [token, setToken] = useState(tokenStorage.get());
    const tokenRef = useRef<string | null>(token);

    // updateToken(null) clears the token
    const updateToken = useCallback((newToken: string | null) => {
        setToken(newToken);
        tokenRef.current = newToken;
        if (newToken) {
            tokenStorage.set(newToken);
        } else {
            tokenStorage.remove();
        }
    }, []);

    // This function is useful for interceptors to get the latest token value
    // without needing to wait for setState.
    const getTokenImmediate = useCallback(() => tokenRef.current, []);

    return {
        token,
        updateToken,
        getTokenImmediate,
    };
};