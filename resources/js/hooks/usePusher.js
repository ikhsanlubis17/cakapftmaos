import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for Pusher connection with automatic reconnection
 * @param {Object} options - Configuration options
 * @returns {Object} - Pusher state and methods
 */
export const usePusher = (options = {}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [error, setError] = useState(null);
    const pusherRef = useRef(null);
    const channelRef = useRef(null);
    
    const {
        appKey = 'your-pusher-key',
        cluster = 'ap1',
        onMessage = null,
        onConnect = null,
        onDisconnect = null,
        onError = null
    } = options;

    const connect = useCallback(() => {
        try {
            // Initialize Pusher
            if (typeof Pusher !== 'undefined') {
                pusherRef.current = new Pusher(appKey, {
                    cluster: cluster,
                    encrypted: true
                });

                // Get current user
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                
                if (user.id) {
                    // Subscribe to user-specific channel
                    channelRef.current = pusherRef.current.subscribe(`user.${user.id}`);
                    
                    // Bind to repair approval status change events
                    channelRef.current.bind('repair-approval-status-change', (data) => {
                        setLastMessage(data);
                        if (onMessage) onMessage(data);
                        
                        // Trigger custom event for other components
                        window.dispatchEvent(new CustomEvent('repairApprovalUpdate', { detail: data }));
                    });
                }

                // Connection events
                pusherRef.current.connection.bind('connected', () => {
                    setIsConnected(true);
                    setError(null);
                    if (onConnect) onConnect();
                    console.log('Pusher connected successfully');
                });

                pusherRef.current.connection.bind('disconnected', () => {
                    setIsConnected(false);
                    if (onDisconnect) onDisconnect();
                    console.log('Pusher disconnected');
                });

                pusherRef.current.connection.bind('error', (err) => {
                    setError('Pusher connection error');
                    if (onError) onError(err);
                    console.error('Pusher error:', err);
                });

            } else {
                setError('Pusher library not loaded');
                console.error('Pusher library not available');
            }

        } catch (err) {
            setError('Failed to create Pusher connection');
            console.error('Pusher connection failed:', err);
        }
    }, [appKey, cluster, onMessage, onConnect, onDisconnect, onError]);

    const disconnect = useCallback(() => {
        if (channelRef.current) {
            pusherRef.current.unsubscribe(channelRef.current.name);
            channelRef.current = null;
        }
        
        if (pusherRef.current) {
            pusherRef.current.disconnect();
            pusherRef.current = null;
        }
        
        setIsConnected(false);
    }, []);

    // Connect on mount
    useEffect(() => {
        connect();
        
        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected,
        lastMessage,
        error,
        connect,
        disconnect
    };
};

/**
 * Hook for handling repair approval updates
 * @param {Function} onUpdate - Callback when update is received
 * @returns {Object} - Update handler
 */
export const useRepairApprovalUpdates = (onUpdate) => {
    useEffect(() => {
        const handleUpdate = (event) => {
            if (onUpdate) {
                onUpdate(event.detail);
            }
        };

        window.addEventListener('repairApprovalUpdate', handleUpdate);
        
        return () => {
            window.removeEventListener('repairApprovalUpdate', handleUpdate);
        };
    }, [onUpdate]);

    return {
        // This hook doesn't return anything, it just sets up the event listener
    };
};
