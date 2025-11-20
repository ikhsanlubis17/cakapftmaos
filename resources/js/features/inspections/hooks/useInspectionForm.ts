import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import type {
    Apar,
    DamageCategory,
    InspectionFormData,
    LocationValidation,
} from '@/types/inspection.types';

interface LocationState {
    current: { lat: number; lng: number } | null;
    loading: boolean;
    valid: boolean;
    error: string;
    distance: number | null;
    validRadius: number | null;
    direction: number | null;
}

interface FormState {
    condition: 'good' | 'needs_refill' | 'expired' | 'damaged';
    notes: string;
    photos: string[];
    damage_categories: any[];
    damage_notes: string;
    needs_repair: boolean;
    repair_notes: string;
}

export const useInspectionForm = (qrCode?: string) => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { apiClient, user } = useAuth();
    const queryClient = useQueryClient();

    // State management
    const [apar, setApar] = useState<Apar | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [aparList, setAparList] = useState<Apar[]>([]);
    const [filteredAparList, setFilteredAparList] = useState<Apar[]>([]);

    // Location state
    const [location, setLocation] = useState<LocationState>({
        current: null,
        loading: false,
        valid: false,
        error: '',
        distance: null,
        validRadius: null,
        direction: null,
    });

    // Form state
    const [formData, setFormData] = useState<FormState>({
        condition: 'good',
        notes: '',
        photos: [],
        damage_categories: [],
        damage_notes: '',
        needs_repair: false,
        repair_notes: '',
    });

    // API Queries
    const { data: aparByQrData, isLoading: aparByQrLoading } = useQuery({
        queryKey: ['apar-from-qr', qrCode],
        queryFn: async () => {
            const res = await apiClient.get(`/api/qr/${qrCode}`);
            return res.data;
        },
        enabled: !!qrCode,
        throwOnError: false,
    });

    const { data: aparListData, isLoading: aparListLoading } = useQuery({
        queryKey: ['apars'],
        queryFn: async () => {
            const res = await apiClient.get('/api/apar');
            return res.data.data ?? res.data;
        },
        enabled: !qrCode,
        throwOnError: false,
    });

    const { data: damageCatsData, isLoading: damageLoading } = useQuery({
        queryKey: ['damage-categories'],
        queryFn: async () => {
            const res = await apiClient.get('/api/damage-categories');
            return res.data.data;
        },
        throwOnError: false,
    });

    const submitMutation = useMutation({
        mutationFn: async (form: FormData) => {
            const res = await apiClient.post('/api/inspections', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data;
        },
        throwOnError: true,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['aparList'] });
            queryClient.invalidateQueries({ queryKey: ['myInspections'] });
            queryClient.invalidateQueries({ queryKey: ['repair-approvals'] });
        },
    });

    // Computed values
    const isLoading = (qrCode ? aparByQrLoading : aparListLoading) || damageLoading;
    const damageCategories: DamageCategory[] = damageCatsData?.filter((cat: any) => cat.is_active) || [];

    // Effects
    useEffect(() => {
        if (qrCode) {
            if (aparByQrData?.success) {
                setApar(aparByQrData.data);
                if (aparByQrData.data.location_type === 'statis') {
                    setTimeout(() => getCurrentLocation(), 1000);
                }
            } else if (aparByQrData && !aparByQrData.success) {
                showError('APAR tidak ditemukan atau QR Code tidak valid');
            }
        } else {
            if (Array.isArray(aparListData)) {
                setAparList(aparListData);
                setFilteredAparList(aparListData);
            }
        }
    }, [qrCode, aparByQrData, aparListData]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = aparList.filter(
                (apar) =>
                    apar.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    apar.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    apar.aparType?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredAparList(filtered);
        } else {
            setFilteredAparList(aparList);
        }
    }, [searchTerm, aparList]);

    // Location validation functions
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocation((prev) => ({
                ...prev,
                error: 'Geolokasi tidak didukung di browser ini',
            }));
            return;
        }

        setLocation((prev) => ({ ...prev, loading: true, error: '' }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newLocation = { lat: latitude, lng: longitude };

                setLocation((prev) => ({ ...prev, current: newLocation }));

                if (
                    apar &&
                    apar.location_type === 'statis' &&
                    apar.latitude &&
                    apar.longitude
                ) {
                    validateLocation(newLocation, apar.latitude, apar.longitude, apar.valid_radius || 50);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                setLocation((prev) => ({
                    ...prev,
                    error: 'Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.',
                    loading: false,
                }));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    };

    const validateLocation = (
        userLocation: { lat: number; lng: number },
        aparLat: number,
        aparLng: number,
        validRadius: number
    ) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (userLocation.lat * Math.PI) / 180;
        const φ2 = (aparLat * Math.PI) / 180;
        const Δφ = ((aparLat - userLocation.lat) * Math.PI) / 180;
        const Δλ = ((aparLng - userLocation.lng) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c;
        const isValid = distance <= validRadius;

        // Calculate direction
        const bearing =
            (Math.atan2(
                Math.sin(Δλ) * Math.cos(φ2),
                Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
            ) *
                180) /
            Math.PI;

        setLocation({
            current: userLocation,
            loading: false,
            valid: isValid,
            error: isValid
                ? ''
                : `Anda berada di luar radius valid. Jarak: ${Math.round(distance)}m, Maksimal: ${validRadius}m`,
            distance: Math.round(distance),
            validRadius,
            direction: (bearing + 360) % 360,
        });
    };

    // Photo handling
    const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFormData((prev) => ({
                    ...prev,
                    photos: [...prev.photos, e.target?.result as string],
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index),
        }));
    };

    // Form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!location.current && apar?.location_type === 'statis') {
            showError('Lokasi harus divalidasi terlebih dahulu');
            return;
        }

        if (apar?.location_type === 'statis' && !location.valid) {
            showError('Anda harus berada di lokasi APAR untuk melakukan inspeksi');
            return;
        }

        try {
            setSubmitting(true);

            const formDataToSend = new FormData();
            formDataToSend.append('apar_id', apar!.id.toString());
            formDataToSend.append('condition', formData.condition);
            formDataToSend.append('notes', formData.notes);
            formDataToSend.append('lat', location.current?.lat.toString() || '0');
            formDataToSend.append('lng', location.current?.lng.toString() || '0');
            formDataToSend.append('damage_categories', JSON.stringify(formData.damage_categories));
            formDataToSend.append('damage_notes', formData.damage_notes);
            formDataToSend.append('needs_repair', formData.needs_repair.toString());
            formDataToSend.append('repair_notes', formData.repair_notes);

            // Add photos
            formData.photos.forEach((photo, index) => {
                if (photo.startsWith('data:')) {
                    const byteString = atob(photo.split(',')[1]);
                    const mimeString = photo.split(',')[0].split(':')[1].split(';')[0];
                    const ab = new ArrayBuffer(byteString.length);
                    const ia = new Uint8Array(ab);
                    for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                    }
                    const blob = new Blob([ab], { type: mimeString });
                    formDataToSend.append(`photos[${index}]`, blob, `photo_${index}.jpg`);
                }
            });

            await submitMutation.mutateAsync(formDataToSend);

            showSuccess('Inspeksi berhasil disimpan!');
            setTimeout(() => {
                if (user?.role === 'teknisi') {
                    // @ts-ignore
                    navigate({ to: '/my-inspections' });
                } else {
                    // @ts-ignore
                    navigate({ to: '/apar' });
                }
            }, 2000);
        } catch (error: any) {
            console.error('Error submitting inspection:', error);

            if (error.response?.status === 422 && error.response?.data?.error) {
                showError(error.response.data.error);

                if (error.response.data.distance !== null) {
                    setLocation((prev) => ({
                        ...prev,
                        distance: Math.round(error.response.data.distance),
                        validRadius: error.response.data.valid_radius,
                        valid: false,
                        error: error.response.data.error,
                    }));
                }
            } else {
                showError(error.response?.data?.message || 'Gagal menyimpan inspeksi');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // APAR selection
    const handleAparSelect = (selectedApar: Apar) => {
        setApar(selectedApar);
        if (selectedApar.location_type === 'statis') {
            setTimeout(() => {
                getCurrentLocation();
            }, 1000);
        }
    };

    const handleCancel = () => {
        if (user?.role === 'teknisi') {
            // @ts-ignore
            navigate({ to: '/my-inspections' });
        } else {
            // @ts-ignore
            navigate({ to: '/apar' });
        }
    };

    return {
        // State
        apar,
        submitting,
        searchTerm,
        setSearchTerm,
        aparList,
        filteredAparList,
        location,
        formData,
        setFormData,
        damageCategories,
        isLoading,

        // Functions
        getCurrentLocation,
        handlePhotoCapture,
        removePhoto,
        handleSubmit,
        handleAparSelect,
        handleCancel,
    };
};
