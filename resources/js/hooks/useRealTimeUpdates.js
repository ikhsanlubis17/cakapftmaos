import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for real-time updates using polling
 * @param {Function} fetchFunction - Function to fetch data
 * @param {number} interval - Polling interval in milliseconds
 * @param {boolean} enabled - Whether to enable real-time updates
 * @param {Array} dependencies - Dependencies for the fetch function
 * @returns {Object} - Real-time update controls
 */
export const useRealTimeUpdates = (fetchFunction, interval = 30000, enabled = true, dependencies = []) => {
    const intervalRef = useRef(null);
    const isMountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Start real-time updates
    const startRealTimeUpdates = useCallback(() => {
        if (!enabled || intervalRef.current) return;

        intervalRef.current = setInterval(() => {
            if (isMountedRef.current) {
                console.log('Real-time update triggered...');
                fetchFunction(true); // Silent refresh
            }
        }, interval);
    }, [enabled, fetchFunction, interval]);

    // Stop real-time updates
    const stopRealTimeUpdates = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // Restart real-time updates
    const restartRealTimeUpdates = useCallback(() => {
        stopRealTimeUpdates();
        startRealTimeUpdates();
    }, [startRealTimeUpdates, stopRealTimeUpdates]);

    // Setup real-time updates when dependencies change
    useEffect(() => {
        if (enabled) {
            startRealTimeUpdates();
        } else {
            stopRealTimeUpdates();
        }

        return () => {
            stopRealTimeUpdates();
        };
    }, [enabled, startRealTimeUpdates, stopRealTimeUpdates, ...dependencies]);

    return {
        startRealTimeUpdates,
        stopRealTimeUpdates,
        restartRealTimeUpdates,
        isEnabled: enabled
    };
};

/**
 * Custom hook for real-time updates with status change detection
 * @param {Function} fetchFunction - Function to fetch data
 * @param {Array} currentData - Current data array
 * @param {number} interval - Polling interval in milliseconds
 * @param {Function} onStatusChange - Callback when status changes
 * @param {Array} dependencies - Dependencies for the fetch function
 * @returns {Object} - Real-time update controls and status
 */
export const useRealTimeUpdatesWithStatusDetection = (
    fetchFunction, 
    currentData, 
    interval = 30000, 
    onStatusChange = null,
    dependencies = []
) => {
    const previousDataRef = useRef([]);
    const { startRealTimeUpdates, stopRealTimeUpdates, restartRealTimeUpdates, isEnabled } = useRealTimeUpdates(
        fetchFunction, 
        interval, 
        true, 
        dependencies
    );

    // Detect status changes
    useEffect(() => {
        if (currentData.length > 0 && previousDataRef.current.length > 0 && onStatusChange) {
            currentData.forEach(newItem => {
                const oldItem = previousDataRef.current.find(old => old.id === newItem.id);
                if (oldItem && oldItem.status !== newItem.status) {
                    onStatusChange(newItem, oldItem);
                }
            });
        }
        
        previousDataRef.current = currentData;
    }, [currentData, onStatusChange]);

    return {
        startRealTimeUpdates,
        stopRealTimeUpdates,
        restartRealTimeUpdates,
        isEnabled
    };
};

export const useWebSocket = (url) => {
    const [data, setData] = useState(null);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);

    useEffect(() => {
        const connect = () => {
            try {
                wsRef.current = new WebSocket(url);

                wsRef.current.onopen = () => {
                    setConnected(true);
                    console.log('WebSocket connected');
                };

                wsRef.current.onmessage = (event) => {
                    const message = JSON.parse(event.data);
                    setData(message);
                };

                wsRef.current.onclose = () => {
                    setConnected(false);
                    console.log('WebSocket disconnected');
                    
                    // Attempt to reconnect after 5 seconds
                    setTimeout(connect, 5000);
                };

                wsRef.current.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    setConnected(false);
                };
            } catch (error) {
                console.error('WebSocket connection failed:', error);
                setConnected(false);
            }
        };

        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [url]);

    const sendMessage = (message) => {
        if (wsRef.current && connected) {
            wsRef.current.send(JSON.stringify(message));
        }
    };

    return { data, connected, sendMessage };
}; 