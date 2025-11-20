import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useQuery, useMutation } from '@tanstack/react-query';

/**
 * Custom hook for managing system settings
 * Handles data fetching, state management, mutations, and validation errors
 */
export const useSettings = () => {
    const { apiClient } = useAuth();
    const { showSuccess, showError } = useToast();
    const [settings, setSettings] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Fetch settings from API
    const { data: settingsData, isLoading, refetch } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await apiClient.get('/api/settings');
            return res.data;
        },
        throwOnError: false,
    });

    // Update local state when data is fetched
    useEffect(() => {
        if (settingsData) {
            setSettings(settingsData);
        }
    }, [settingsData]);

    // Mutation for saving settings
    const saveMutation = useMutation({
        mutationFn: async (newSettings) => {
            const res = await apiClient.put('/api/settings', newSettings);
            return res.data;
        },
        onSuccess: (data) => {
            showSuccess('Pengaturan berhasil disimpan');
            setValidationErrors({}); // Clear validation errors on success
            refetch();
        },
        onError: (error) => {
            console.error('Error saving settings:', error);
            
            // Handle validation errors
            if (error.response && error.response.status === 422) {
                const errors = error.response.data.errors || {};
                setValidationErrors(errors);
                showError('Terdapat kesalahan validasi. Mohon periksa input Anda.');
            } else {
                showError('Gagal menyimpan pengaturan');
            }
        }
    });

    /**
     * Handle form submission
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await saveMutation.mutateAsync(settings);
        } finally {
            setSaving(false);
        }
    };

    /**
     * Handle field value change
     */
    const handleChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));

        // Clear validation error for this field when user starts typing
        if (validationErrors[key]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };

    /**
     * Get validation error for a specific field
     */
    const getFieldError = (fieldName) => {
        return validationErrors[fieldName] ? validationErrors[fieldName][0] : null;
    };

    /**
     * Check if a field has an error
     */
    const hasError = (fieldName) => {
        return !!validationErrors[fieldName];
    };

    return {
        settings,
        isLoading,
        saving,
        validationErrors,
        handleSubmit,
        handleChange,
        getFieldError,
        hasError,
        refetch,
    };
};
