import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { TruckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useToast } from '../contexts/ToastContext';

const TankTruckEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tankTruck, setTankTruck] = useState(null);
    const [formData, setFormData] = useState({
        plate_number: '',
        driver_name: '',
        driver_phone: '',
        description: '',
        status: 'active'
    });

    useEffect(() => {
        fetchTankTruckDetail();
    }, [id]);

    const fetchTankTruckDetail = async () => {
        try {
            const response = await axios.get(`/api/tank-trucks/${id}`);
            const tankTruckData = response.data;
            setTankTruck(tankTruckData);
            setFormData({
                plate_number: tankTruckData.plate_number || '',
                driver_name: tankTruckData.driver_name || '',
                driver_phone: tankTruckData.driver_phone || '',
                description: tankTruckData.description || '',
                status: tankTruckData.status || 'active'
            });
        } catch (error) {
            console.error('Error fetching tank truck detail:', error);
            showError('Gagal memuat data mobil tangki. Silakan coba lagi.');
            navigate('/dashboard/tank-trucks');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await axios.put(`/api/tank-trucks/${id}`, formData);
            showSuccess('Mobil tangki berhasil diperbarui');
            navigate('/dashboard/tank-trucks');
        } catch (error) {
            console.error('Error updating tank truck:', error);
            
            if (error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat();
                showError(errorMessages.join(', '));
            } else {
                showError('Gagal memperbarui mobil tangki. Silakan coba lagi.');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat data mobil tangki...</p>
                </div>
            </div>
        );
    }

    if (!tankTruck) {
        return (
            <div className="text-center py-12">
                <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Mobil Tangki Tidak Ditemukan</h3>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header - Responsive */}
            <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Mobil Tangki</h1>
                    <p className="mt-1 text-sm text-gray-500 truncate">
                        Edit data mobil tangki: {tankTruck.plate_number}
                    </p>
                </div>
                <div className="flex justify-start sm:justify-end">
                    <button
                        onClick={() => navigate('/dashboard/tank-trucks')}
                        className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Kembali</span>
                        <span className="sm:hidden">Kembali</span>
                    </button>
                </div>
            </div>

            {/* Form - Responsive */}
            <div className="bg-white shadow rounded-lg">
                <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* Plate Number */}
                        <div className="sm:col-span-2">
                            <label htmlFor="plate_number" className="block text-sm font-medium text-gray-700 mb-2">
                                Nomor Plat <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="plate_number"
                                id="plate_number"
                                required
                                value={formData.plate_number}
                                onChange={handleChange}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 px-3 py-2"
                                placeholder="B 1234 ABC"
                            />
                        </div>

                        {/* Driver Name */}
                        <div>
                            <label htmlFor="driver_name" className="block text-sm font-medium text-gray-700 mb-2">
                                Nama Supir <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="driver_name"
                                id="driver_name"
                                required
                                value={formData.driver_name}
                                onChange={handleChange}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 px-3 py-2"
                                placeholder="Nama lengkap supir"
                            />
                        </div>

                        {/* Driver Phone */}
                        <div>
                            <label htmlFor="driver_phone" className="block text-sm font-medium text-gray-700 mb-2">
                                Nomor Telepon Supir
                            </label>
                            <input
                                type="tel"
                                name="driver_phone"
                                id="driver_phone"
                                value={formData.driver_phone}
                                onChange={handleChange}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 px-3 py-2"
                                placeholder="081234567890"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="status"
                                id="status"
                                required
                                value={formData.status}
                                onChange={handleChange}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 px-3 py-2"
                            >
                                <option value="active">Aktif</option>
                                <option value="inactive">Tidak Aktif</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Deskripsi
                        </label>
                        <textarea
                            name="description"
                            id="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 px-3 py-2"
                            placeholder="Deskripsi mobil tangki..."
                        />
                    </div>

                    {/* Submit Button - Responsive */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard/tank-trucks')}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            <span className="hidden sm:inline">Batal</span>
                            <span className="sm:hidden">Batal</span>
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
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