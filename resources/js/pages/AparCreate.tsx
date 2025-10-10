import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import axios from 'axios';
import { FireIcon, ArrowLeftIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AparTypeListResponse } from '@/types/api';

const AparCreate = () => {
    const { apiClient } = useAuth();
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [formData, setFormData] = useState({
        serial_number: '',
        location_type: 'statis',
        location_name: '',
        latitude: '',
        longitude: '',
        valid_radius: '50',
        apar_type_id: '',
        capacity: '',
        manufactured_date: '',
        expired_at: '',
        status: 'active',
        notes: ''
    });

    const {
        data: aparTypes = [],
        isLoading: isAparTypesLoading,
        isError: isAparTypesError,
    } = useQuery({
        queryKey: ['apar-types'],
        queryFn: async () => {
            const response = await apiClient.get('/api/apar-types');
            const data = response.data as AparTypeListResponse;
            return data.data.filter(type => type.is_active);
        },
    });

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            showError('Geolocation tidak didukung oleh browser ini.');
            return;
        }

        setGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({
                    ...prev,
                    latitude: latitude.toFixed(6),
                    longitude: longitude.toFixed(6)
                }));
                showSuccess('Lokasi berhasil diperoleh!');
                setGettingLocation(false);
            },
            (error) => {
                setGettingLocation(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        showError('Izin lokasi ditolak. Silakan izinkan akses lokasi di browser Anda.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        showError('Informasi lokasi tidak tersedia.');
                        break;
                    case error.TIMEOUT:
                        showError('Waktu tunggu untuk mendapatkan lokasi habis.');
                        break;
                    default:
                        showError('Terjadi kesalahan saat mendapatkan lokasi.');
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const {
        mutate: createApar,
        isPending: isCreatingApar,
    } = useMutation({
        mutationFn: (data: typeof formData) => {
            const dataToSend = {
                ...data,
                capacity: parseInt(data.capacity) || 0,
                valid_radius: parseInt(data.valid_radius) || 30,
                latitude: data.latitude ? parseFloat(data.latitude) : null,
                longitude: data.longitude ? parseFloat(data.longitude) : null,
            };
            return apiClient.post('/api/apar', dataToSend);
        },
        onSuccess: () => {
            showSuccess('APAR berhasil dibuat!');
            window.location.href = '/apar';
        },
        onError: (error: any) => {
            console.error('Error creating APAR:', error);
            if (axios.isAxiosError(error) && error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat();
                showError(errorMessages.join(', '), "Gagal Membuat APAR");
            } else {
                showError("Gagal membuat APAR. Silakan coba lagi.");
            }
        }
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        createApar(formData);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tambah APAR Baru</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Tambahkan APAR baru ke dalam sistem monitoring
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Link
                        to="/apar"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Kembali
                    </Link>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white shadow rounded-lg">
                <form onSubmit={handleSubmit} className="space-y-6 p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* Serial Number */}
                        <div>
                            <label htmlFor="serial_number" className="block text-sm font-medium text-gray-700">
                                Nomor Seri *
                            </label>
                            <input
                                type="text"
                                name="serial_number"
                                id="serial_number"
                                required
                                value={formData.serial_number}
                                onChange={handleChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            />
                        </div>

                        {/* Location Type */}
                        <div>
                            <label htmlFor="location_type" className="block text-sm font-medium text-gray-700">
                                Jenis Lokasi *
                            </label>
                            <select
                                name="location_type"
                                id="location_type"
                                required
                                value={formData.location_type}
                                onChange={handleChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="statis">Statis</option>
                                <option value="mobile">Mobil</option>
                            </select>
                        </div>

                        {/* Location Name */}
                        <div className="sm:col-span-2">
                            <label htmlFor="location_name" className="block text-sm font-medium text-gray-700">
                                Nama Lokasi *
                            </label>
                            <input
                                type="text"
                                name="location_name"
                                id="location_name"
                                required
                                value={formData.location_name}
                                onChange={handleChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            />
                        </div>

                        {/* Latitude */}
                        <div>
                            <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                                Latitude
                            </label>
                            <input
                                type="number"
                                step="any"
                                min="-90"
                                max="90"
                                name="latitude"
                                id="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                placeholder="-6.2088"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">Range: -90 sampai 90</p>
                        </div>

                        {/* Longitude */}
                        <div>
                            <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                                Longitude
                            </label>
                            <input
                                type="number"
                                step="any"
                                min="-180"
                                max="180"
                                name="longitude"
                                id="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                placeholder="106.8456"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">Range: -180 sampai 180</p>
                        </div>

                        {/* Get Current Location Button */}
                        <div className="col-span-2">
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                disabled={gettingLocation}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <MapPinIcon className="h-4 w-4 mr-2" />
                                {gettingLocation ? 'Mendapatkan Lokasi...' : 'Dapatkan Lokasi Saat Ini'}
                            </button>
                            <p className="mt-1 text-xs text-gray-500">
                                Klik tombol di atas untuk mendapatkan latitude dan longitude otomatis dari lokasi Anda saat ini
                            </p>
                        </div>

                        {/* Valid Radius */}
                        <div>
                            <label htmlFor="valid_radius" className="block text-sm font-medium text-gray-700">
                                Radius Valid (meter)
                            </label>
                            <input
                                type="number"
                                name="valid_radius"
                                id="valid_radius"
                                value={formData.valid_radius}
                                onChange={handleChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label htmlFor="apar_type_id" className="block text-sm font-medium text-gray-700">
                                Jenis APAR *
                            </label>
                            <select
                                name="apar_type_id"
                                id="apar_type_id"
                                required
                                value={formData.apar_type_id}
                                onChange={handleChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="">Pilih Jenis APAR</option>
                                {aparTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Capacity */}
                        <div>
                            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                                Kapasitas (kg) *
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                name="capacity"
                                id="capacity"
                                required
                                value={formData.capacity}
                                onChange={handleChange}
                                placeholder="6"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">Masukkan angka saja (contoh: 6)</p>
                        </div>

                        {/* Manufactured Date */}
                        <div>
                            <label htmlFor="manufactured_date" className="block text-sm font-medium text-gray-700">
                                Tanggal Produksi
                            </label>
                            <input
                                type="date"
                                name="manufactured_date"
                                id="manufactured_date"
                                value={formData.manufactured_date}
                                onChange={handleChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            />
                        </div>

                        {/* Expired Date */}
                        <div>
                            <label htmlFor="expired_at" className="block text-sm font-medium text-gray-700">
                                Tanggal Kadaluarsa
                            </label>
                            <input
                                type="date"
                                name="expired_at"
                                id="expired_at"
                                value={formData.expired_at}
                                onChange={handleChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                Status *
                            </label>
                            <select
                                name="status"
                                id="status"
                                required
                                value={formData.status}
                                onChange={handleChange}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="active">Aktif</option>
                                <option value="needs_repair">Perlu Perbaikan</option>
                                <option value="inactive">Nonaktif</option>
                                <option value="under_repair">Sedang Perbaikan</option>
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                            Catatan
                        </label>
                        <textarea
                            name="notes"
                            id="notes"
                            rows={3}
                            value={formData.notes}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-3">
                        <Link
                            to="/apar"
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={isCreatingApar}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                            {isCreatingApar ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <FireIcon className="h-4 w-4 mr-2" />
                                    Simpan APAR
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AparCreate;

