import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
    ClipboardDocumentListIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    MapPinIcon,
    CalendarIcon,
    FireIcon,
    TruckIcon,
    UserCircleIcon,
    ExclamationTriangleIcon,
    CameraIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

const InspectionsList = () => {
    const { apiClient } = useAuth();
    const [filters, setFilters] = useState({
        status: 'all',
        location: 'all',
        search: '',
    });
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);

    // Fetch inspections data
    const {
        data: inspectionsData = [],
        isLoading: loading,
        isFetching,
        refetch,
        error,
    } = useQuery({
        queryKey: ['inspections-list'],
        queryFn: async () => {
            const res = await apiClient.get('/api/inspections');
            return res.data?.data || [];
        },
        refetchOnWindowFocus: false,
        staleTime: 60000,
        keepPreviousData: true,
        throwOnError: false,
    });

    // Extract unique locations for filter
    const locations = useMemo(() => {
        const uniqueLocations = new Set();
        inspectionsData.forEach(inspection => {
            if (inspection.apar?.location_name) {
                uniqueLocations.add(inspection.apar.location_name);
            }
        });
        return Array.from(uniqueLocations).sort();
    }, [inspectionsData]);

    // Filter inspections
    const filteredInspections = useMemo(() => {
        return inspectionsData.filter(inspection => {
            // Status filter
            if (filters.status !== 'all' && inspection.status !== filters.status) {
                return false;
            }

            // Location filter
            if (filters.location !== 'all' && inspection.apar?.location_name !== filters.location) {
                return false;
            }

            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const serialNumber = inspection.apar?.serial_number?.toLowerCase() || '';
                const location = inspection.apar?.location_name?.toLowerCase() || '';
                const inspectorName = inspection.user?.name?.toLowerCase() || '';

                return (
                    serialNumber.includes(searchLower) ||
                    location.includes(searchLower) ||
                    inspectorName.includes(searchLower)
                );
            }

            return true;
        });
    }, [inspectionsData, filters]);

    // Sort inspections: pending first, then by date
    const sortedInspections = useMemo(() => {
        return [...filteredInspections].sort((a, b) => {
            // Pending items first
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;

            // Then sort by created date (newest first)
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB - dateA;
        });
    }, [filteredInspections]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'failed':
                return <XCircleIcon className="h-5 w-5 text-red-500" />;
            case 'pending':
                return <ClockIcon className="h-5 w-5 text-yellow-500" />;
            case 'needs_reinspection':
                return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
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
            case 'needs_reinspection':
                return 'Perlu Inspeksi Ulang';
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
            case 'needs_reinspection':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getLocationTypeIcon = (type) => {
        return type === 'static' ? (
            <MapPinIcon className="h-4 w-4" />
        ) : (
            <TruckIcon className="h-4 w-4" />
        );
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handlePhotoClick = (url) => {
        setSelectedPhoto(url);
        setShowPhotoModal(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Memuat data inspeksi...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Terjadi Kesalahan
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Gagal memuat data inspeksi
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                <ClipboardDocumentListIcon className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Daftar Inspeksi
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Monitoring seluruh kegiatan inspeksi APAR
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            <ArrowPathIcon
                                className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
                            />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari Serial Number, Lokasi, atau Teknisi..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm transition duration-150 ease-in-out"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FunnelIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm transition duration-150 ease-in-out appearance-none"
                            >
                                <option value="all">Semua Status</option>
                                <option value="completed">Selesai</option>
                                <option value="failed">Gagal (Perlu Perbaikan)</option>
                                <option value="pending">Menunggu</option>
                                <option value="needs_reinspection">Perlu Inspeksi Ulang</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Location Filter */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MapPinIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                value={filters.location}
                                onChange={(e) => handleFilterChange('location', e.target.value)}
                                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm transition duration-150 ease-in-out appearance-none"
                            >
                                <option value="all">Semua Lokasi</option>
                                {locations.map((loc, idx) => (
                                    <option key={idx} value={loc}>{loc}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Info */}
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-gray-600">
                        Menampilkan <span className="font-semibold text-gray-900">{sortedInspections.length}</span> dari{' '}
                        <span className="font-semibold text-gray-900">{inspectionsData.length}</span> inspeksi
                    </p>
                </div>

                {/* Inspections List */}
                <div className="space-y-4">
                    {sortedInspections.length > 0 ? (
                        sortedInspections.map((inspection) => (
                            <div key={inspection.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                        {/* Left Section: Info */}
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                                                        <FireIcon className="h-6 w-6 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {inspection.apar?.serial_number || 'N/A'}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {inspection.apar?.apar_type?.name || 'Tipe tidak tersedia'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                                                    {getStatusText(inspection.status)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    {getLocationTypeIcon(inspection.apar?.location_type)}
                                                    <span className="truncate">
                                                        {inspection.apar?.location_name || 'Lokasi tidak tersedia'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <UserCircleIcon className="h-4 w-4 flex-shrink-0" />
                                                    <span>
                                                        {inspection.user?.name || 'Teknisi tidak tersedia'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                                                    <span>
                                                        {formatDate(inspection.created_at)}
                                                    </span>
                                                </div>
                                                {inspection.is_schedule && (
                                                    <div className="flex items-center gap-2 text-blue-600">
                                                        <ClockIcon className="h-4 w-4 flex-shrink-0" />
                                                        <span className="font-medium">Jadwal Inspeksi</span>
                                                    </div>
                                                )}
                                            </div>

                                            {inspection.notes && (
                                                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                                                    <span className="font-medium text-gray-900">Catatan: </span>
                                                    {inspection.notes}
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Section: Photos & Actions */}
                                        <div className="lg:w-1/3 space-y-4">
                                            {!inspection.is_schedule && (
                                                <div className="text-sm text-gray-600">
                                                    <div className="flex items-center mb-2">
                                                        <CameraIcon className="h-4 w-4 mr-2 text-gray-400" />
                                                        <span className="font-medium">Foto Inspeksi:</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {/* APAR Photo */}
                                                        {inspection.photo_url && (
                                                            <div 
                                                                className="relative group cursor-pointer"
                                                                onClick={() => handlePhotoClick(inspection.photo_url)}
                                                            >
                                                                <img
                                                                    src={inspection.photo_url}
                                                                    alt="Foto APAR"
                                                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                                                                />
                                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all" />
                                                            </div>
                                                        )}
                                                        
                                                        {/* Selfie Photo */}
                                                        {inspection.selfie_url && (
                                                            <div 
                                                                className="relative group cursor-pointer"
                                                                onClick={() => handlePhotoClick(inspection.selfie_url)}
                                                            >
                                                                <img
                                                                    src={inspection.selfie_url}
                                                                    alt="Foto Selfie"
                                                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                                                                />
                                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all" />
                                                            </div>
                                                        )}

                                                        {/* Damage Photos */}
                                                        {inspection.inspection_damages && inspection.inspection_damages.map((damage, idx) => (
                                                            damage.damage_photo_url && (
                                                                <div 
                                                                    key={idx}
                                                                    className="relative group cursor-pointer"
                                                                    onClick={() => handlePhotoClick(damage.damage_photo_url)}
                                                                >
                                                                    <img
                                                                        src={damage.damage_photo_url}
                                                                        alt={`Kerusakan ${idx + 1}`}
                                                                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                                                                    />
                                                                    <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-[10px] px-1 rounded-full">
                                                                        Rusak
                                                                    </div>
                                                                </div>
                                                            )
                                                        ))}
                                                    </div>
                                                    
                                                    {(!inspection.photo_url && !inspection.selfie_url && (!inspection.inspection_damages || inspection.inspection_damages.length === 0)) && (
                                                        <div className="text-sm text-gray-500 italic">
                                                            Tidak ada foto
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {inspection.is_schedule && (
                                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 text-center">
                                                    <ClockIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                                                    <p className="text-sm font-medium text-blue-900">Belum Dilakukan</p>
                                                    <p className="text-xs text-blue-700 mt-1">
                                                        Inspeksi dijadwalkan pada {formatDate(inspection.scheduled_date)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ClipboardDocumentListIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Tidak ada data
                            </h3>
                            <p className="text-sm text-gray-600 max-w-md mx-auto">
                                {filters.search || filters.status !== 'all' || filters.location !== 'all'
                                    ? 'Tidak ada inspeksi yang sesuai dengan filter yang dipilih.'
                                    : 'Belum ada data inspeksi yang tersedia.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Photo Modal */}
            {showPhotoModal && selectedPhoto && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowPhotoModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
                            <div className="flex items-center">
                                <CameraIcon className="h-6 w-6 text-red-600 mr-3" />
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Foto Inspeksi</h3>
                            </div>
                            <button 
                                onClick={() => setShowPhotoModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                            >
                                <XMarkIcon className="h-6 w-6 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 flex justify-center items-center bg-gray-100 flex-1 overflow-auto">
                            <img
                                src={selectedPhoto}
                                alt="Foto inspeksi full"
                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InspectionsList;