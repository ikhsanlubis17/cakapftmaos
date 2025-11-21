import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
    FireIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import ApprovalStats from '../components/ApprovalStats';
import ApprovalFilters from '../components/ApprovalFilters';
import ApprovalCard from '../components/ApprovalCard';
import ApprovalDetailModal from '../components/ApprovalDetailModal';

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

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleSearch = (searchTerm) => {
        setFilters(prev => ({ ...prev, search: searchTerm }));
    };

    const handleRefresh = async () => {
        await refetchApprovals();
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
                <ApprovalFilters
                    onFilterChange={handleFilterChange}
                    onSearch={handleSearch}
                    supervisors={supervisors}
                    teknisis={teknisis}
                />

                {/* Results Info */}
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-gray-600">
                        Menampilkan <span className="font-semibold text-gray-900">{sortedApprovals.length}</span> dari{' '}
                        <span className="font-semibold text-gray-900">{approvalsData.length}</span> persetujuan
                    </p>
                    {filters.search && (
                        <p className="text-sm text-gray-500">
                            Hasil pencarian: "{filters.search}"
                        </p>
                    )}
                </div>

                {/* Approvals Grid */}
                {sortedApprovals.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {sortedApprovals.map((approval) => (
                            <ApprovalCard
                                key={approval.id}
                                approval={approval}
                                onViewDetail={handleViewDetail}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FireIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Tidak ada data
                        </h3>
                        <p className="text-sm text-gray-600 max-w-md mx-auto">
                            {filters.status !== 'all' || filters.supervisor !== 'all' || filters.teknisi !== 'all' || filters.search
                                ? 'Tidak ada persetujuan yang sesuai dengan filter yang dipilih.'
                                : 'Belum ada permintaan perbaikan yang perlu ditinjau.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <ApprovalDetailModal
                approval={selectedApproval}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </div>
    );
};

export default AdminRepairApprovals;
