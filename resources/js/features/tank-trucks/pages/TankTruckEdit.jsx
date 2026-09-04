import React, { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { TruckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/contexts/ToastContext';

const TankTruckEdit = () => {
    const { id } = useParams({ from: "/authenticated/tank-trucks/$id/edit" });
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { apiClient } = useAuth();
    const queryClient = useQueryClient();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        plate_number: '',
        driver_name: '',
        driver_phone: '',
        description: '',
        status: 'active'
    });

    const { data: truckData, isLoading } = useQuery({
        queryKey: ['tank-truck', id],
        queryFn: async () => {
            const res = await apiClient.get(`/api/tank-trucks/${id}`);
            return res.data || res;
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 2,
    });

    const tankTruck = truckData?.data || truckData || null;

    // Populate form data when truck data is loaded
    React.useEffect(() => {
        if (tankTruck) {
            setFormData({
                plate_number: tankTruck.plate_number || '',
                driver_name: tankTruck.driver_name || '',
                driver_phone: tankTruck.driver_phone || '',
                description: tankTruck.description || '',
                status: tankTruck.status || 'active'
            });
        }
    }, [tankTruck]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const updateMutation = useMutation({
        mutationFn: (payload) => apiClient.put(`/api/tank-trucks/${id}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tank-trucks'] });
            queryClient.invalidateQueries({ queryKey: ['tank-truck', id] });
            showSuccess('Mobil tangki berhasil diperbarui');
            navigate({ to: '/tank-trucks' });
        },
        onError: (err) => {
            console.error('Error updating tank truck:', err);
            const resp = err?.response?.data;
            if (resp?.errors) {
                const errorMessages = Object.values(resp.errors).flat();
                showError(errorMessages.join(', '));
            } else if (resp?.message) {
                showError(resp.message);
            } else {
                showError('Gagal memperbarui mobil tangki. Silakan coba lagi.');
            }
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateMutation.mutateAsync(formData);
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11468F] mx-auto mb-4"></div>
                    <p className="text-slate-600 text-sm">Memuat data mobil tangki...</p>
                </div>
            </div>
        );
    }

    if (!tankTruck) {
        return (
            <div className="text-center py-12">
                <TruckIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">Mobil Tangki Tidak Ditemukan</h3>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header - Responsive */}
            <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Edit Mobil Tangki</h1>
                    <p className="mt-1 text-sm text-slate-500 truncate">
                        Edit data mobil tangki: {tankTruck.plate_number}
                    </p>
                </div>
                <div className="flex justify-start sm:justify-end">
                    <button
                        onClick={() => navigate({ to: '/tank-trucks' })}
                        className="inline-flex items-center justify-center px-3.5 py-2 border border-slate-300 rounded-[6px] shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#11468F]"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Kembali</span>
                        <span className="sm:hidden">Kembali</span>
                    </button>
                </div>
            </div>

            {/* Form - Responsive */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-[6px]">
                <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* Plate Number */}
                        <div className="sm:col-span-2">
                            <label htmlFor="plate_number" className="block text-sm font-semibold text-slate-700 mb-2">
                                Nomor Plat <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="plate_number"
                                id="plate_number"
                                required
                                value={formData.plate_number}
                                onChange={handleChange}
                                className="block w-full border border-slate-300 rounded-[6px] shadow-sm focus:ring-[#11468F] focus:border-[#11468F] px-3 py-2 text-sm"
                                placeholder="B 1234 ABC"
                            />
                        </div>

                        {/* Driver Name */}
                        <div>
                            <label htmlFor="driver_name" className="block text-sm font-semibold text-slate-700 mb-2">
                                Nama Supir <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="driver_name"
                                id="driver_name"
                                required
                                value={formData.driver_name}
                                onChange={handleChange}
                                className="block w-full border border-slate-300 rounded-[6px] shadow-sm focus:ring-[#11468F] focus:border-[#11468F] px-3 py-2 text-sm"
                                placeholder="Nama lengkap supir"
                            />
                        </div>

                        {/* Driver Phone */}
                        <div>
                            <label htmlFor="driver_phone" className="block text-sm font-semibold text-slate-700 mb-2">
                                Nomor Telepon Supir
                            </label>
                            <input
                                type="tel"
                                name="driver_phone"
                                id="driver_phone"
                                value={formData.driver_phone}
                                onChange={handleChange}
                                className="block w-full border border-slate-300 rounded-[6px] shadow-sm focus:ring-[#11468F] focus:border-[#11468F] px-3 py-2 text-sm"
                                placeholder="081234567890"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-semibold text-slate-700 mb-2">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="status"
                                id="status"
                                required
                                value={formData.status}
                                onChange={handleChange}
                                className="block w-full border border-slate-300 rounded-[6px] shadow-sm focus:ring-[#11468F] focus:border-[#11468F] px-3 py-2 text-sm"
                            >
                                <option value="active">Aktif</option>
                                <option value="inactive">Tidak Aktif</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
                            Deskripsi
                        </label>
                        <textarea
                            name="description"
                            id="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="block w-full border border-slate-300 rounded-[6px] shadow-sm focus:ring-[#11468F] focus:border-[#11468F] px-3 py-2 text-sm"
                            placeholder="Deskripsi mobil tangki..."
                        />
                    </div>

                    {/* Submit Button - Responsive */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={() => navigate({ to: '/tank-trucks' })}
                            className="px-4 py-2 border border-slate-300 rounded-[6px] shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#11468F]"
                        >
                            <span className="hidden sm:inline">Batal</span>
                            <span className="sm:hidden">Batal</span>
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-[6px] shadow-sm text-sm font-semibold text-white bg-[#11468F] hover:bg-[#0d3873] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#11468F]"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    <span className="hidden sm:inline">Menyimpan...</span>
                                    <span className="sm:hidden">Simpan...</span>
                                </>
                            ) : (
                                <>
                                    <TruckIcon className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline">Simpan Perubahan</span>
                                    <span className="sm:hidden">Simpan</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TankTruckEdit; 


