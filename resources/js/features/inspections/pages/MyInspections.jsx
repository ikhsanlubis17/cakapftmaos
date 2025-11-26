import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
    UserCircleIcon,
    ExclamationTriangleIcon,
    ChatBubbleLeftRightIcon,
    CameraIcon,
    XMarkIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';

const MyInspections = () => {
    const { apiClient } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);

    const { data: inspections = [], isLoading, refetch, error } = useQuery({
        queryKey: ['myInspections'],
        queryFn: async () => {
            const res = await apiClient.get(`/api/inspections/my-inspections`);
            return res.data;
        },
        keepPreviousData: true,
        throwOnError: false,
    });

    const filteredInspections = useMemo(() => {
        if (activeTab === 'all') return inspections;
        if (activeTab === 'completed') return inspections.filter(i => i.status === 'completed' && !i.is_schedule);
        if (activeTab === 'pending') return inspections.filter(i => i.status === 'pending');
        if (activeTab === 'failed') return inspections.filter(i => i.status === 'failed');
        if (activeTab === 'needs_reinspection') return inspections.filter(i => i.status === 'needs_reinspection');
        return inspections;
    }, [inspections, activeTab]);

    const tabs = [
        { id: 'all', label: 'Semua' },
        { id: 'completed', label: 'Selesai' },
        { id: 'pending', label: 'Menunggu' },
        { id: 'failed', label: 'Gagal' },
        { id: 'needs_reinspection', label: 'Inspeksi Ulang' },
    ];

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Selesai</span>;
            case 'failed':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Gagal</span>;
            case 'pending':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Menunggu</span>;
            case 'needs_reinspection':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Perlu Inspeksi Ulang</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handlePhotoClick = (url) => {
        setSelectedPhoto(url);
        setShowPhotoModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Memuat riwayat inspeksi...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center max-w-md px-4">
                    <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-900 font-medium mb-2">Gagal memuat data</p>
                    <p className="text-sm text-gray-500 mb-6">{error.message || 'Terjadi kesalahan saat memuat data inspeksi'}</p>
                    <button
                        onClick={refetch}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 pb-20">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Riwayat Inspeksi Saya</h1>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Kelola dan pantau riwayat inspeksi APAR Anda
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-red-50 px-3 py-2 sm:px-4 sm:py-2 rounded-lg border border-red-100 w-fit">
                        <ClipboardDocumentListIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                        <span className="text-sm sm:text-base font-semibold text-red-900">
                            {inspections.length} Total Inspeksi
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-4 sm:mt-6 border-b border-gray-200 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                    <nav className="-mb-px flex space-x-6 sm:space-x-8 min-w-max" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors
                                    ${activeTab === tab.id
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                `}
                            >
                                {tab.label}
                                <span className={`ml-2 py-0.5 px-2 rounded-full text-[10px] sm:text-xs ${
                                    activeTab === tab.id ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-900'
                                }`}>
                                    {tab.id === 'all' 
                                        ? inspections.length 
                                        : inspections.filter(i => {
                                            if (tab.id === 'completed') return i.status === 'completed' && !i.is_schedule;
                                            return i.status === tab.id;
                                        }).length
                                    }
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-3 sm:space-y-4">
                {filteredInspections.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                        <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada inspeksi</h3>
                        <p className="text-gray-500 text-sm">Belum ada data inspeksi untuk kategori ini.</p>
                    </div>
                ) : (
                    filteredInspections.map((inspection) => (
                        <div key={inspection.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    {/* Left Side: Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between sm:block">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-red-50 rounded-lg flex-shrink-0">
                                                    <FireIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                                        {inspection.apar?.serial_number || 'N/A'}
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                                                        {inspection.apar?.location_name || 'Lokasi tidak diketahui'}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Mobile Status Badge (Top Right) */}
                                            <div className="sm:hidden">
                                                {getStatusBadge(inspection.status)}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3">
                                            <div className="flex items-center gap-1.5">
                                                <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                                                {formatDate(inspection.created_at || inspection.scheduled_date)}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <ClockIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                                                {inspection.is_schedule ? inspection.scheduled_time : formatTime(inspection.created_at)}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {inspection.apar?.location_type === 'static' ? (
                                                    <MapPinIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                                                ) : (
                                                    <TruckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                                                )}
                                                <span className="capitalize">{inspection.apar?.location_type || 'Static'}</span>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {inspection.notes && (
                                            <div className="mt-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg text-xs sm:text-sm text-gray-600 border border-gray-100">
                                                <span className="font-medium text-gray-900">Catatan: </span>
                                                {inspection.notes}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Side: Status & Action (Desktop) */}
                                    <div className="hidden sm:flex flex-col items-end gap-3">
                                        {getStatusBadge(inspection.status)}
                                        {inspection.is_schedule && (
                                            <button
                                                onClick={() => window.location.href = `/scan`}
                                                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                                            >
                                                <CameraIcon className="h-4 w-4 mr-2" />
                                                Mulai Inspeksi
                                            </button>
                                        )}
                                    </div>

                                    {/* Mobile Action Button */}
                                    {inspection.is_schedule && (
                                        <div className="sm:hidden w-full mt-2">
                                            <button
                                                onClick={() => window.location.href = `/scan`}
                                                className="w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                                            >
                                                <CameraIcon className="h-4 w-4 mr-2" />
                                                Mulai Inspeksi
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Photos Section */}
                                {!inspection.is_schedule && (
                                    <div className="mt-4 sm:mt-5 border-t border-gray-100 pt-3 sm:pt-4">
                                        <h4 className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
                                            Foto Dokumentasi
                                        </h4>
                                        <div className="flex flex-wrap gap-2 sm:gap-3">
                                            {/* APAR Photo */}
                                            {inspection.photo_url && (
                                                <div 
                                                    className="relative group cursor-pointer"
                                                    onClick={() => handlePhotoClick(inspection.photo_url)}
                                                >
                                                    <img
                                                        src={inspection.photo_url}
                                                        alt="Foto APAR"
                                                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                                                        <EyeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow-lg" />
                                                    </div>
                                                    <span className="absolute bottom-1 left-1 text-[8px] sm:text-[10px] font-medium text-white bg-black/50 px-1.5 py-0.5 rounded">APAR</span>
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
                                                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                                                        <EyeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow-lg" />
                                                    </div>
                                                    <span className="absolute bottom-1 left-1 text-[8px] sm:text-[10px] font-medium text-white bg-black/50 px-1.5 py-0.5 rounded">Selfie</span>
                                                </div>
                                            )}

                                            {/* Damage Photos */}
                                            {inspection.inspection_damages?.map((damage, idx) => (
                                                damage.damage_photo_url && (
                                                    <div 
                                                        key={idx}
                                                        className="relative group cursor-pointer"
                                                        onClick={() => handlePhotoClick(damage.damage_photo_url)}
                                                    >
                                                        <img
                                                            src={damage.damage_photo_url}
                                                            alt={`Kerusakan ${idx + 1}`}
                                                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all border-red-200"
                                                        />
                                                        <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full shadow-sm z-10">
                                                            Rusak
                                                        </div>
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                                                            <EyeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow-lg" />
                                                        </div>
                                                        <span className="absolute bottom-1 left-1 text-[8px] sm:text-[10px] font-medium text-white bg-black/50 px-1.5 py-0.5 rounded truncate max-w-[60px] sm:max-w-[70px]">
                                                            {damage.damage_category?.name || 'Kerusakan'}
                                                        </span>
                                                    </div>
                                                )
                                            ))}

                                            {(!inspection.photo_url && !inspection.selfie_url && (!inspection.inspection_damages || inspection.inspection_damages.length === 0)) && (
                                                <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                                                    <CameraIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Supervisor Approval Section */}
                                {inspection.repairApproval && (
                                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                                        <div className={`rounded-lg p-3 sm:p-4 border ${
                                            inspection.repairApproval.status === 'rejected' ? 'bg-red-50 border-red-100' :
                                            inspection.repairApproval.status === 'approved' ? 'bg-green-50 border-green-100' :
                                            'bg-blue-50 border-blue-100'
                                        }`}>
                                            <div className="flex items-start gap-3">
                                                {inspection.repairApproval.approver?.photo ? (
                                                    <img 
                                                        src={inspection.repairApproval.approver.photo} 
                                                        alt={inspection.repairApproval.approver.name}
                                                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-sm"
                                                    />
                                                ) : (
                                                    <UserCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                                {inspection.repairApproval.approver?.name || 'Supervisor'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">Supervisor</p>
                                                        </div>
                                                        <span className={`text-xs font-medium px-2 py-1 rounded-full w-fit ${
                                                            inspection.repairApproval.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                            inspection.repairApproval.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {inspection.repairApproval.status === 'rejected' ? 'Ditolak' :
                                                             inspection.repairApproval.status === 'approved' ? 'Disetujui' : 'Pending'}
                                                        </span>
                                                    </div>

                                                    {inspection.repairApproval.supervisor_notes && (
                                                        <div className="mt-2 text-xs sm:text-sm text-gray-700 bg-white/50 p-2 rounded border border-black/5">
                                                            <div className="flex items-start gap-2">
                                                                <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                                <p>{inspection.repairApproval.supervisor_notes}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {inspection.repairApproval.status === 'rejected' && inspection.repairApproval.rejection_reason && (
                                                        <div className="mt-2 text-xs sm:text-sm text-red-700 bg-red-100/50 p-2 rounded border border-red-200">
                                                            <div className="flex items-start gap-2">
                                                                <ExclamationTriangleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                                                <div>
                                                                    <p className="font-medium">Alasan Penolakan:</p>
                                                                    <p>{inspection.repairApproval.rejection_reason}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Photo Modal */}
            {showPhotoModal && selectedPhoto && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={() => setShowPhotoModal(false)}>
                    <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setShowPhotoModal(false)}
                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <img
                            src={selectedPhoto}
                            alt="Full size"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyInspections;