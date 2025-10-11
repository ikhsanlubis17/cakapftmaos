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
    MagnifyingGlassIcon,
    UserIcon,
    EyeIcon,
    XMarkIcon,
    CameraIcon,
} from '@heroicons/react/24/outline';

const InspectionsList = () => {
    const { user, apiClient } = useAuth();
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [technicianFilter, setTechnicianFilter] = useState('all');
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);

    const inspectionsQuery = useQuery({
        queryKey: ['inspections'],
        queryFn: async () => {
            const resp = await apiClient.get('/api/inspections');
            return resp.data;
        },
        refetchInterval: 30000,
        staleTime: 1000 * 30,
    });

    useEffect(() => {
        if (inspectionsQuery.data) {
            // Sort by created_at descending (newest first)
            const sorted = [...inspectionsQuery.data].sort((a, b) => {
                const aTime = new Date(a.created_at).getTime();
                const bTime = new Date(b.created_at).getTime();
                return bTime - aTime;
            });
            setInspections(sorted);
        }
        if (inspectionsQuery.isError) setError('Gagal memuat data inspeksi');
    }, [inspectionsQuery.data, inspectionsQuery.isError]);

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

    const getLocationTypeIcon = (type) => {
        return type === 'static' ? (
            <MapPinIcon className="h-4 w-4" />
        ) : (
            <TruckIcon className="h-4 w-4" />
        );
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

    // Filter inspections based on search and filters
    const filteredInspections = inspections
        .filter(inspection => {
        const matchesSearch = 
            inspection.apar?.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inspection.apar?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inspection.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inspection.apar?.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inspection.apar?.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inspection.notes?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter;
        const matchesLocation = locationFilter === 'all' || inspection.apar?.location_type === locationFilter;
        const matchesTechnician = technicianFilter === 'all' || inspection.user?.id?.toString() === technicianFilter;

        return matchesSearch && matchesStatus && matchesLocation && matchesTechnician;
    })
    // Ensure filtered results keep newest-first ordering
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Get unique technicians for filter
    const technicians = [...new Set(inspections.map(i => i.user?.id))].map(id => {
        const inspection = inspections.find(i => i.user?.id === id);
        return { id, name: inspection?.user?.name };
    });

    if (inspectionsQuery.isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <p className="text-gray-500">Memuat data inspeksi...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => inspectionsQuery.refetch()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Data Inspeksi APAR</h1>
                        <p className="text-gray-600 mt-1">
                            Monitoring semua inspeksi APAR yang dilakukan teknisi
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <ClipboardDocumentListIcon className="h-8 w-8 text-red-600" />
                        <span className="text-lg font-semibold text-gray-900">
                            {filteredInspections.length} dari {inspections.length} Inspeksi
                        </span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cari
                        </label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari APAR, teknisi, lokasi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="all">Semua Status</option>
                            <option value="completed">Selesai</option>
                            <option value="failed">Gagal</option>
                            <option value="pending">Menunggu</option>
                        </select>
                    </div>

                    {/* Location Type Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipe Lokasi
                        </label>
                        <select
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="all">Semua Lokasi</option>
                            <option value="static">Statis</option>
                            <option value="mobile">Mobil</option>
                        </select>
                    </div>

                    {/* Technician Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Teknisi
                        </label>
                        <select
                            value={technicianFilter}
                            onChange={(e) => setTechnicianFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="all">Semua Teknisi</option>
                            {technicians.map(tech => (
                                <option key={tech.id} value={tech.id}>{tech.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Selesai</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {inspections.filter(i => i.status === 'completed').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <XCircleIcon className="h-8 w-8 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Gagal</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {inspections.filter(i => i.status === 'failed').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ClockIcon className="h-8 w-8 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Menunggu</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {inspections.filter(i => i.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <UserIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Teknisi Aktif</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {technicians.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inspections List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Daftar Inspeksi</h2>
                </div>

                {filteredInspections.length === 0 ? (
                    <div className="p-8 text-center">
                        <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data</h3>
                        <p className="text-gray-500">
                            Tidak ada inspeksi yang sesuai dengan filter yang dipilih.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredInspections.map((inspection) => (
                            <div key={inspection.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <FireIcon className="h-5 w-5 text-red-600" />
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {inspection.apar?.serial_number || inspection.apar?.name || 'APAR Tidak Diketahui'}
                                            </h3>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                                                {getStatusText(inspection.status)}
                                            </span>
                                            {inspection.is_schedule && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Jadwal
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <UserIcon className="h-4 w-4 mr-2" />
                                                    <span className="font-medium">Teknisi:</span>
                                                    <span className="ml-1">{inspection.user?.name || 'Tidak diketahui'}</span>
                                                </div>

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
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    {getLocationTypeIcon(inspection.apar?.location_type)}
                                                    <span className="ml-2 font-medium">Lokasi:</span>
                                                    <span className="ml-1">{inspection.apar?.location_name || inspection.apar?.location || 'Tidak diketahui'}</span>
                                                </div>

                                                {!inspection.is_schedule && inspection.inspection_lat && inspection.inspection_lng && (
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">GPS:</span>
                                                        <span className="ml-1">
                                                            {inspection.inspection_lat}, {inspection.inspection_lng}
                                                        </span>
                                                    </div>
                                                )}

                                                {inspection.notes && (
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">Catatan:</span>
                                                        <p className="mt-1">{inspection.notes}</p>
                                                    </div>
                                                )}

                                                {inspection.is_schedule && (
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">Status:</span>
                                                        <p className="mt-1 text-yellow-600">Menunggu inspeksi</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                {!inspection.is_schedule && inspection.photo_url ? (
                                                    <div className="text-sm text-gray-600">
                                                        <div className="flex items-center mb-2">
                                                            <CameraIcon className="h-4 w-4 mr-2 text-gray-400" />
                                                            <span className="font-medium">Foto Inspeksi:</span>
                                                        </div>
                                                        <div className="mt-1">
                                                            <img
                                                                src={inspection.photo_url}
                                                                alt="Foto inspeksi"
                                                                className="w-24 h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow duration-200"
                                                                onClick={() => {
                                                                    setSelectedPhoto(inspection.photo_url);
                                                                    setShowPhotoModal(true);
                                                                }}
                                                                title="Klik untuk melihat foto dalam ukuran penuh"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : !inspection.is_schedule ? (
                                                    <div className="text-sm text-gray-500">
                                                        <div className="flex items-center">
                                                            <CameraIcon className="h-4 w-4 mr-2 text-gray-400" />
                                                            <span>Tidak ada foto</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-500">
                                                        <div className="flex items-center">
                                                            <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                                                            <span>Belum ada inspeksi</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-4 flex-shrink-0">
                                        {inspection.is_schedule ? (
                                            <div className="text-center">
                                                <ClockIcon className="h-8 w-8 text-yellow-500 mx-auto mb-1" />
                                                <span className="text-xs text-gray-500">Jadwal</span>
                                            </div>
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

            {/* Photo Modal */}
            {showPhotoModal && selectedPhoto && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-full overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <div className="flex items-center">
                                <CameraIcon className="h-6 w-6 text-red-600 mr-3" />
                                <h3 className="text-xl font-semibold text-gray-900">Foto Hasil Inspeksi</h3>
                            </div>
                            <button 
                                onClick={() => setShowPhotoModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                            >
                                <XMarkIcon className="h-6 w-6 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>
                        <div className="p-6 flex justify-center">
                            <img
                                src={selectedPhoto}
                                alt="Foto inspeksi"
                                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InspectionsList; 