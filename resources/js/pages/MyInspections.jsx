import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    MapPinIcon,
    CalendarIcon,
    FireIcon,
    TruckIcon,
} from '@heroicons/react/24/outline';

const MyInspections = () => {
    const { user, apiClient } = useAuth();
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { data: inspectionsData, isLoading: inspectionsLoading, refetch } = useQuery({
        queryKey: ['myInspections'],
        queryFn: async () => {
            const res = await apiClient.get(`/api/inspections/my-inspections`);
            return res.data;
        },
        keepPreviousData: true,
        throwOnError: false,
    });

    useEffect(() => {
        setLoading(inspectionsLoading);
    }, [inspectionsLoading]);

    useEffect(() => {
        if (inspectionsData) setInspections(inspectionsData);
    }, [inspectionsData]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'failed':
                return <XCircleIcon className="h-5 w-5 text-red-500" />;
            case 'pending':
                return <ClockIcon className="h-5 w-5 text-yellow-500" />;
            default:
                return <ClockIcon className="h-5 w-5 text-gray-400" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'completed':
                return 'Selesai';
            case 'failed':
                return 'Gagal';
            case 'pending':
                return 'Menunggu';
            default:
                return 'Tidak Diketahui';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('id-ID', options);
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString;
    };

    const getLocationTypeIcon = (type) => {
        return type === 'static' ? (
            <MapPinIcon className="h-4 w-4" />
        ) : (
            <TruckIcon className="h-4 w-4" />
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48 sm:h-64">
                <div className="text-center">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <p className="text-xs sm:text-sm text-gray-500">Memuat riwayat inspeksi...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-48 sm:h-64">
                <div className="text-center">
                    <XCircleIcon className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-red-600">{error}</p>
                    <button
                        onClick={fetchMyInspections}
                        className="mt-4 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs sm:text-sm"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Riwayat Inspeksi Saya</h1>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Daftar inspeksi APAR yang telah Anda lakukan
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <ClipboardDocumentListIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                        <span className="text-base sm:text-lg font-semibold text-gray-900">
                            {inspections.length} Inspeksi
                        </span>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                        </div>
                        <div className="ml-2 sm:ml-4">
                            <p className="text-xs sm:text-sm font-medium text-gray-500">Selesai</p>
                            <p className="text-lg sm:text-2xl font-bold text-gray-900">
                                {inspections.filter(i => i.status === 'completed').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <XCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                        </div>
                        <div className="ml-2 sm:ml-4">
                            <p className="text-xs sm:text-sm font-medium text-gray-500">Gagal</p>
                            <p className="text-lg sm:text-2xl font-bold text-gray-900">
                                {inspections.filter(i => i.status === 'failed').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6 col-span-2 sm:col-span-1">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                        </div>
                        <div className="ml-2 sm:ml-4">
                            <p className="text-xs sm:text-sm font-medium text-gray-500">Menunggu</p>
                            <p className="text-lg sm:text-2xl font-bold text-gray-900">
                                {inspections.filter(i => i.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inspections List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">Daftar Inspeksi</h2>
                </div>

                {inspections.length === 0 ? (
                    <div className="p-6 sm:p-8 text-center">
                        <ClipboardDocumentListIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Belum ada inspeksi</h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                            Anda belum melakukan inspeksi APAR. Mulai dengan scan QR code APAR.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {inspections.map((inspection) => (
                            <div key={inspection.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-2">
                                            <FireIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                                            <h3 className="text-base sm:text-lg font-medium text-gray-900">
                                                {inspection.apar?.serial_number || inspection.apar?.name || 'APAR Tidak Diketahui'}
                                            </h3>
                                            <span className={`inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                                                {getStatusText(inspection.status)}
                                            </span>
                                            {inspection.is_schedule && (
                                                <span className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Jadwal
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                                            <div className="space-y-2">
                                                {inspection.is_schedule ? (
                                                    <>
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <CalendarIcon className="h-4 w-4 mr-2" />
                                                            <span>
                                                                Jadwal: {formatDate(inspection.scheduled_date)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <ClockIcon className="h-4 w-4 mr-2" />
                                                            <span>
                                                                Waktu: {formatTime(inspection.scheduled_time)}
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <CalendarIcon className="h-4 w-4 mr-2" />
                                                            <span>
                                                                {new Date(inspection.created_at).toLocaleDateString('id-ID', {
                                                                    weekday: 'long',
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <ClockIcon className="h-4 w-4 mr-2" />
                                                            <span>
                                                                {new Date(inspection.created_at).toLocaleTimeString('id-ID', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}

                                                <div className="flex items-center text-sm text-gray-600">
                                                    {getLocationTypeIcon(inspection.apar?.location_type)}
                                                    <span className="ml-2">
                                                        {inspection.apar?.location_name || inspection.apar?.location || 'Lokasi tidak diketahui'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {inspection.notes && (
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">Catatan:</span>
                                                        <p className="mt-1">{inspection.notes}</p>
                                                    </div>
                                                )}

                                                {!inspection.is_schedule && inspection.photo_url && (
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">Foto:</span>
                                                        <div className="mt-1">
                                                            <img
                                                                src={inspection.photo_url}
                                                                alt="Foto inspeksi"
                                                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {inspection.is_schedule && (
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">Status:</span>
                                                        <p className="mt-1 text-yellow-600">Menunggu inspeksi</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-0 sm:ml-4 flex-shrink-0">
                                        {inspection.is_schedule ? (
                                            <button
                                                onClick={() => window.location.href = `/scan`}
                                                className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <FireIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                <span className="hidden sm:inline">Mulai Inspeksi</span>
                                                <span className="sm:hidden">Inspeksi</span>
                                            </button>
                                        ) : (
                                            getStatusIcon(inspection.status)
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyInspections; 