import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
    FireIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    CameraIcon,
    XMarkIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';
import ApprovalStats from '../components/ApprovalStats';
import ApprovalDetailModal from '../components/ApprovalDetailModal';
import ApprovalStatusBadge from '../components/ApprovalStatusBadge';

const AdminRepairApprovals = () => {
    const { apiClient } = useAuth();
    const [filters, setFilters] = useState({
        status: 'all',
        supervisor: 'all',
        teknisi: 'all',
        search: '',
    });
    const [selectedApproval, setSelectedApproval] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);

    // Fetch approvals data
    const {
        data: approvalsData = [],
        isLoading: loading,
        isFetching,
        refetch: refetchApprovals,
        error: approvalsError,
    } = useQuery({
        queryKey: ['admin-repair-approvals'],
        queryFn: async () => {
            const res = await apiClient.get('/api/repair-approvals');
            return res.data?.data || [];
        },
        refetchOnWindowFocus: false,
        staleTime: 60000,
        keepPreviousData: true,
        throwOnError: false,
    });

    // Fetch stats
    const { data: statsData = {} } = useQuery({
        queryKey: ['repair-approvals-stats'],
        queryFn: async () => {
            const res = await apiClient.get('/api/repair-approvals/stats');
            return res.data?.data || {};
        },
        refetchOnWindowFocus: false,
        staleTime: 60000,
        throwOnError: false,
    });

    // Extract unique supervisors and teknisis for filters
    const supervisors = useMemo(() => {
        const uniqueSupervisors = new Map();
        approvalsData.forEach(approval => {
            if (approval.approver && approval.approver.role === 'supervisor') {
                uniqueSupervisors.set(approval.approver.id, {
                    id: approval.approver.id,
                    name: approval.approver.name,
                });
            }
        });
        return Array.from(uniqueSupervisors.values());
    }, [approvalsData]);

    const teknisis = useMemo(() => {
        const uniqueTeknisis = new Map();
        approvalsData.forEach(approval => {
            if (approval.inspection?.user) {
                uniqueTeknisis.set(approval.inspection.user.id, {
                    id: approval.inspection.user.id,
                    name: approval.inspection.user.name,
                });
            }
        });
        return Array.from(uniqueTeknisis.values());
    }, [approvalsData]);

    // Filter approvals based on filters
    const filteredApprovals = useMemo(() => {
        return approvalsData.filter(approval => {
            // Status filter
            if (filters.status !== 'all' && approval.status !== filters.status) {
                return false;
            }

            // Supervisor filter
            if (filters.supervisor !== 'all' && approval.approver?.id != filters.supervisor) {
                return false;
            }

            // Teknisi filter
            if (filters.teknisi !== 'all' && approval.inspection?.user?.id != filters.teknisi) {
                return false;
            }

            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const serialNumber = approval.inspection?.apar?.serial_number?.toLowerCase() || '';
                const location = approval.inspection?.apar?.location_name?.toLowerCase() || '';
                const teknisiName = approval.inspection?.user?.name?.toLowerCase() || '';
                const supervisorName = approval.approver?.name?.toLowerCase() || '';

                return (
                    serialNumber.includes(searchLower) ||
                    location.includes(searchLower) ||
                    teknisiName.includes(searchLower) ||
                    supervisorName.includes(searchLower)
                );
            }

            return true;
        });
    }, [approvalsData, filters]);

    // Sort approvals: pending first, then by date
    const sortedApprovals = useMemo(() => {
        return [...filteredApprovals].sort((a, b) => {
            // Pending items first
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;

            // Then sort by created date (newest first)
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB - dateA;
        });
    }, [filteredApprovals]);

    const handleViewDetail = (approval) => {
        setSelectedApproval(approval);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedApproval(null);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleRefresh = async () => {
        await refetchApprovals();
    };

    const handlePhotoClick = (url) => {
        setSelectedPhoto(url);
        setShowPhotoModal(true);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Memuat data persetujuan...</p>
                </div>
            </div>
        );
    }

    if (approvalsError) {
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
                        Gagal memuat data persetujuan perbaikan
                    </p>
                    <button
                        onClick={handleRefresh}
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
                                <FireIcon className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Persetujuan Perbaikan APAR
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Monitoring lengkap proses persetujuan perbaikan
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRefresh}
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

                {/* Statistics */}
                <ApprovalStats stats={statsData} />

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari..."
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
                                <option value="pending">Menunggu</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                                <option value="completed">Selesai</option>
                            </select>
                        </div>

                        {/* Supervisor Filter */}
                        <div className="relative">
                            <select
                                value={filters.supervisor}
                                onChange={(e) => handleFilterChange('supervisor', e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm transition duration-150 ease-in-out appearance-none"
                            >
                                <option value="all">Semua Supervisor</option>
                                {supervisors.map((sup) => (
                                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Teknisi Filter */}
                        <div className="relative">
                            <select
                                value={filters.teknisi}
                                onChange={(e) => handleFilterChange('teknisi', e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm transition duration-150 ease-in-out appearance-none"
                            >
                                <option value="all">Semua Teknisi</option>
                                {teknisis.map((tech) => (
                                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Info */}
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-gray-600">
                        Menampilkan <span className="font-semibold text-gray-900">{sortedApprovals.length}</span> dari{' '}
                        <span className="font-semibold text-gray-900">{approvalsData.length}</span> persetujuan
                    </p>
                </div>

                {/* Table View */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        APAR / Lokasi
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Teknisi
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Supervisor
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Foto
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedApprovals.length > 0 ? (
                                    sortedApprovals.map((approval) => (
                                        <tr key={approval.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center">
                                                        <FireIcon className="h-6 w-6 text-red-600" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {approval.inspection?.apar?.serial_number || 'N/A'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {approval.inspection?.apar?.location_name || 'Lokasi N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{approval.inspection?.user?.name || '-'}</div>
                                                <div className="text-xs text-gray-500">{formatDate(approval.inspection?.created_at)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{approval.approver?.name || '-'}</div>
                                                {approval.approver && (
                                                    <div className="text-xs text-gray-500">
                                                        {approval.approver.role ? approval.approver.role.charAt(0).toUpperCase() + approval.approver.role.slice(1) : 'Approver'}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <ApprovalStatusBadge status={approval.status} size="sm" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex -space-x-2 overflow-hidden">
                                                    {approval.inspection?.photo_url && (
                                                        <img
                                                            className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover cursor-pointer hover:scale-110 transition-transform"
                                                            src={approval.inspection.photo_url}
                                                            alt="APAR"
                                                            onClick={() => handlePhotoClick(approval.inspection.photo_url)}
                                                            title="Foto APAR"
                                                        />
                                                    )}
                                                    {approval.inspection?.selfie_url && (
                                                        <img
                                                            className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover cursor-pointer hover:scale-110 transition-transform"
                                                            src={approval.inspection.selfie_url}
                                                            alt="Selfie"
                                                            onClick={() => handlePhotoClick(approval.inspection.selfie_url)}
                                                            title="Foto Selfie"
                                                        />
                                                    )}
                                                    {approval.inspection?.inspection_damages?.map((damage, idx) => (
                                                        damage.damage_photo_url && (
                                                            <img
                                                                key={idx}
                                                                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover cursor-pointer hover:scale-110 transition-transform border-2 border-red-500"
                                                                src={damage.damage_photo_url}
                                                                alt="Kerusakan"
                                                                onClick={() => handlePhotoClick(damage.damage_photo_url)}
                                                                title={`Kerusakan: ${damage.damage_category?.name || 'Unknown'}`}
                                                            />
                                                        )
                                                    ))}
                                                    {(!approval.inspection?.photo_url && !approval.inspection?.selfie_url && (!approval.inspection?.inspection_damages || approval.inspection.inspection_damages.length === 0)) && (
                                                        <span className="text-xs text-gray-400 italic">No photos</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleViewDetail(approval)}
                                                    className="text-blue-600 hover:text-blue-900 flex items-center justify-end gap-1 ml-auto"
                                                >
                                                    <EyeIcon className="h-4 w-4" />
                                                    Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <div className="mx-auto flex flex-col items-center justify-center">
                                                <FireIcon className="h-12 w-12 text-gray-300 mb-3" />
                                                <p className="text-gray-500 text-sm">Tidak ada data persetujuan yang ditemukan.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            <ApprovalDetailModal
                approval={selectedApproval}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />

            {/* Photo Modal */}
            {showPhotoModal && selectedPhoto && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowPhotoModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
                            <div className="flex items-center">
                                <CameraIcon className="h-6 w-6 text-red-600 mr-3" />
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Foto Bukti Inspeksi</h3>
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

export default AdminRepairApprovals;
