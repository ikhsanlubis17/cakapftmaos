import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ type, title, message, duration = 5000 }) => {
        const id = Date.now() + Math.random();
        const newToast = { id, type, title, message, duration, show: true };
        
        setToasts(prev => [...prev, newToast]);

        // Auto remove toast after duration
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showSuccess = useCallback((message, title = 'Berhasil', duration = 5000) => {
        return addToast({ type: 'success', title, message, duration });
    }, [addToast]);

    const showError = useCallback((message, title = 'Error', duration = 7000) => {
        return addToast({ type: 'error', title, message, duration });
    }, [addToast]);

    const showWarning = useCallback((message, title = 'Peringatan', duration = 6000) => {
        return addToast({ type: 'warning', title, message, duration });
    }, [addToast]);

    const showInfo = useCallback((message, title = 'Informasi', duration = 5000) => {
        return addToast({ type: 'info', title, message, duration });
    }, [addToast]);

    const clearAllToasts = useCallback(() => {
        setToasts([]);
    }, []);

    const value = {
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        clearAllToasts,
        toasts
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 space-y-4">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        type={toast.type}
                        title={toast.title}
                        message={toast.message}
                        duration={toast.duration}
                        show={toast.show}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}; 