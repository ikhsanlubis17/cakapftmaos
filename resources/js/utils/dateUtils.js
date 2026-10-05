/**
 * Shared date & time formatting utilities for ID locale.
 */

export const formatDate = (dateString, options = {}) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        const defaultOptions = {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            ...options
        };

        return date.toLocaleDateString('id-ID', defaultOptions);
    } catch {
        return '-';
    }
};

export const formatTime = (dateString, options = {}) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        const defaultOptions = {
            hour: '2-digit',
            minute: '2-digit',
            ...options
        };

        return date.toLocaleTimeString('id-ID', defaultOptions);
    } catch {
        return '-';
    }
};

export const formatDateTime = (dateString, options = {}) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        const defaultOptions = {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            ...options
        };

        return date.toLocaleString('id-ID', defaultOptions);
    } catch {
        return '-';
    }
};
