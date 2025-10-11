import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePusher } from '../hooks/usePusher';
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    FireIcon,
    ExclamationTriangleIcon,
    MapPinIcon,
    UserIcon,
    ArrowPathIcon,
    SignalIcon,
} from '@heroicons/react/24/outline';

const RepairApprovalList = () => {
    const [approvals, setApprovals] = useState([]);
    const [filter, setFilter] = useState('all');
    const [stats, setStats] = useState({});
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [hasShownInitialAlert, setHasShownInitialAlert] = useState(false);
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    const { apiClient } = useAuth();
    const queryClient = useQueryClient();

    // Pusher connection for real-time updates
    const { isConnected: pusherConnected, error: pusherError } = usePusher({
        appKey: 'your-pusher-key', // Replace with your actual Pusher key
        cluster: 'ap1', // Replace with your actual cluster
        onMessage: (data) => {
            console.log('Real-time update received:', data);
            // Refresh data immediately when status changes
            fetchApprovals(true);
            fetchStats();
            showSuccess(`Status perbaikan APAR ${data.apar_serial} telah berubah: ${data.message}`);
        }
    });

    // Auto-refresh interval (reduced to 10 seconds for admin)
    const AUTO_REFRESH_INTERVAL = 10000;

    // Use react-query for approvals list
    const {
        data: approvalsData = [],
        isLoading: loading,
        isFetching: isFetchingApprovals,
        refetch: refetchApprovals,
        error: approvalsError,
    } = useQuery({
        queryKey: ['repair-approvals', filter],
        queryFn: async () => {
            const url = filter === 'all' ? '/api/repair-approvals' : `/api/repair-approvals?status=${filter}`;
            const res = await apiClient.get(url);
            return res.data?.data || [];
        },
        keepPreviousData: true,
        throwOnError: false,
    });

    const {
        data: statsData = {},
        refetch: refetchStats,
    } = useQuery({
        queryKey: ['repair-approvals-stats'],
        queryFn: async () => {
            const res = await apiClient.get('/api/repair-approvals/stats');
            return res.data?.data || {};
        },
        throwOnError: false,
    });

    // initialize and auto-refresh
    useEffect(() => {
        console.log('RepairApprovalList component mounted');
        setIsInitialized(true);

        const intervalId = setInterval(() => {
            console.log('Auto-refreshing admin repair approvals...');
            refetchApprovals();
            refetchStats();
        }, AUTO_REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    }, [refetchApprovals, refetchStats]);

    // Separate effect for filter changes - but only after initial load
    // when filter changes, react-query will refetch automatically due to queryKey

    // Sync local approvals & stats from query data
    useEffect(() => {
        setApprovals(approvalsData || []);
        setStats(statsData || {});
        if (approvalsData && approvalsData.length) {
            setLastUpdate(new Date());
        }
    }, [approvalsData, statsData]);

    // Show initial success message once
    const prevApprovalsRef = useRef([]);
    useEffect(() => {
        if (!isInitialized) return;
        const prev = prevApprovalsRef.current || [];
        if (!isFetchingApprovals && approvalsData && approvalsData.length >= 0) {
            if (!hasShownInitialAlert && approvalsData.length > 0) {
                showSuccess(`Berhasil memuat ${approvalsData.length} data persetujuan`);
                setHasShownInitialAlert(true);
            }
        }
        prevApprovalsRef.current = approvalsData;
    }, [approvalsData, isFetchingApprovals, isInitialized]);

    // Manual refresh function
    const handleManualRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        setHasShownInitialAlert(false);
        await refetchApprovals();
        await refetchStats();
        setRefreshing(false);
    };

    // stats handled by react-query via statsData

    const approveMutation = useMutation({
        mutationFn: ({ id, notes }) => apiClient.post(`/api/repair-approvals/${id}/approve`, { admin_notes: notes }),
        onMutate: async ({ id, notes }) => {
            await queryClient.cancelQueries({ queryKey: ['repair-approvals', filter] });
            const previous = queryClient.getQueryData(['repair-approvals', filter]);
            queryClient.setQueryData(['repair-approvals', filter], (old = []) =>
                old.map(item => item.id === id ? { ...item, status: 'approved', admin_notes: notes } : item)
            );
            return { previous };
        },
        onError: (err, vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['repair-approvals', filter], context.previous);
            }
            console.error('Error approving approval:', err);
            showError(err?.response?.data?.message || 'Gagal menyetujui perbaikan');
        },
        onSuccess: (_data, { id, notes, approval }) => {
            queryClient.invalidateQueries({ queryKey: ['repair-approvals-stats'] });
            showSuccess(`Persetujuan berhasil disetujui dan notifikasi telah dikirim ke teknisi ${approval?.inspection?.user?.name || 'teknisi'}`);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['repair-approvals', filter] });
        }
    });

    const handleApprove = (approval, notes = '') => {
        approveMutation.mutate({ id: approval.id, notes, approval });
    };

    const rejectMutation = useMutation({
        mutationFn: ({ id, notes }) => apiClient.post(`/api/repair-approvals/${id}/reject`, { admin_notes: notes }),
        onMutate: async ({ id, notes }) => {
            await queryClient.cancelQueries({ queryKey: ['repair-approvals', filter] });
            const previous = queryClient.getQueryData(['repair-approvals', filter]);
            queryClient.setQueryData(['repair-approvals', filter], (old = []) =>
                old.map(item => item.id === id ? { ...item, status: 'rejected', admin_notes: notes } : item)
            );
            return { previous };
        },
        onError: (err, vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['repair-approvals', filter], context.previous);
            }
            console.error('Error rejecting approval:', err);
            showError(err?.response?.data?.message || 'Gagal menolak perbaikan');
        },
        onSuccess: (_data, { id, notes, approval }) => {
            queryClient.invalidateQueries({ queryKey: ['repair-approvals-stats'] });
            showSuccess(`Persetujuan berhasil ditolak dan notifikasi penolakan telah dikirim ke teknisi ${approval?.inspection?.user?.name || 'teknisi'}`);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['repair-approvals', filter] });
        }
    });

    const handleReject = (approval, notes = '') => {
        if (!notes.trim()) {
            showError('Alasan penolakan wajib diisi');
            return;
        }
        rejectMutation.mutate({ id: approval.id, notes, approval });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'Menunggu' },
            approved: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Disetujui' },
            rejected: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, text: 'Ditolak' },
            completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircleIcon, text: 'Selesai' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="h-3 w-3 mr-1" />
                {config.text}
            </span>
        );
    };

    const getConditionBadge = (condition) => {
        const conditionConfig = {
            good: { color: 'bg-green-100 text-green-800', text: 'Baik' },
            needs_repair: { color: 'bg-yellow-100 text-yellow-800', text: 'Perlu Perbaikan' }
        };

        const config = conditionConfig[condition] || conditionConfig.good;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.text}
            </span>
        );
    };

    // Debug information
    console.log('Component state:', { loading, error, approvals: approvals.length, stats });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md mx-auto">
                    <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-red-600 mx-auto mb-6"></div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-3">Memuat Data...</h2>
                    <p className="text-gray-600 text-lg">Sedang memuat daftar persetujuan perbaikan</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md mx-auto">
                    <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-red-100 mb-6">
                        <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-3">Terjadi Kesalahan</h3>
                    <p className="text-gray-600 mb-6 text-lg">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={fetchApprovals}
                            className="w-full bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium text-lg"
                        >
                            Coba Lagi
                        </button>
                        <button
                            onClick={() => navigate({ to: '/dashboard' })}
                            className="w-full bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors font-medium text-lg"
                        >
                            Kembali ke Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
                {/* Header */}
                <div className="bg-white shadow-xl rounded-2xl p-6 lg:p-8 border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
                        <div className="flex-shrink-0">
                            <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                                <FireIcon className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
                            </div>
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Persetujuan Perbaikan APAR</h1>
                            <p className="text-gray-600 text-lg">Kelola persetujuan perbaikan dan perawatan APAR</p>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center">
                            <div className="p-3 bg-yellow-100 rounded-xl">
                                <ClockIcon className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-600" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-sm lg:text-base font-medium text-gray-600">Menunggu</p>
                                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.pending || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <CheckCircleIcon className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-sm lg:text-base font-medium text-gray-600">Disetujui</p>
                                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.approved || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center">
                            <div className="p-3 bg-red-100 rounded-xl">
                                <XCircleIcon className="h-6 w-6 lg:h-8 lg:w-8 text-red-600" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-sm lg:text-base font-medium text-gray-600">Ditolak</p>
                                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.rejected || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <CheckCircleIcon className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-sm lg:text-base font-medium text-gray-600">Selesai</p>
                                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.completed || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter */}
                <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
                        <label className="text-sm lg:text-base font-medium text-gray-700">Filter Status:</label>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="flex-1 sm:flex-none border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base lg:text-lg transition-colors duration-200"
                        >
                            <option value="all">Semua Status</option>
                            <option value="pending">Menunggu</option>
                            <option value="approved">Disetujui</option>
                            <option value="rejected">Ditolak</option>
                            <option value="completed">Selesai</option>
                        </select>
                    </div>
                </div>

                {/* Approvals List */}
                <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 lg:py-6 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg lg:text-xl font-semibold text-gray-900">
                                Daftar Persetujuan ({approvals.length})
                            </h3>
                            <div className="flex items-center space-x-3">
                                {/* Pusher Status Indicator */}
                                <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${pusherConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className="text-xs text-gray-600">
                                        {pusherConnected ? 'Real-time Aktif' : 'Real-time Offline'}
                                    </span>
                                </div>
                                
                                <button
                                    onClick={handleManualRefresh}
                                    disabled={refreshing}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                    {refreshing ? 'Memperbarui...' : 'Perbarui'}
                                </button>
                                {lastUpdate && (
                                    <div className="text-xs text-gray-500 text-center">
                                        <div>Terakhir diperbarui:</div>
                                        <div className="font-medium">{lastUpdate.toLocaleTimeString('id-ID')}</div>
                                    </div>
                                )}
                                <div className="text-xs text-gray-500 text-center">
                                    <div>Auto-refresh setiap</div>
                                    <div className="font-medium">{AUTO_REFRESH_INTERVAL / 1000}s</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {approvals.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {approvals.map((approval) => (
                                <div key={approval.id} className="p-6 lg:p-8 hover:bg-gray-50 transition-colors duration-200">
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                                        <div className="flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 mb-4">
                                                <h4 className="text-lg lg:text-xl font-semibold text-gray-900">
                                                    APAR {approval.inspection?.apar?.serial_number || 'N/A'}
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {getStatusBadge(approval.status)}
                                                    {getConditionBadge(approval.inspection?.condition)}
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                                <div className="space-y-3">
                                                    <div className="flex items-center space-x-3 text-sm lg:text-base text-gray-600">
                                                        <MapPinIcon className="h-5 w-5 flex-shrink-0" />
                                                        <span>{approval.inspection?.apar?.location_name || 'Lokasi tidak tersedia'}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-3 text-sm lg:text-base text-gray-600">
                                                        <UserIcon className="h-5 w-5 flex-shrink-0" />
                                                        <span>{approval.inspection?.user?.name || 'User tidak tersedia'}</span>
                                                    </div>
                                                    <div className="text-sm lg:text-base text-gray-600">
                                                        <span className="font-medium">Tanggal Inspeksi:</span>{' '}
                                                        {approval.inspection?.created_at 
                                                            ? new Date(approval.inspection.created_at).toLocaleDateString('id-ID')
                                                            : 'Tanggal tidak tersedia'
                                                        }
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    {approval.inspection?.notes && (
                                                        <div className="text-sm lg:text-base text-gray-600">
                                                            <span className="font-medium">Catatan:</span>{' '}
                                                            {approval.inspection.notes}
                                                        </div>
                                                    )}
                                                    {approval.admin_notes && (
                                                        <div className="text-sm lg:text-base text-gray-600">
                                                            <span className="font-medium">Catatan Admin:</span>{' '}
                                                            {approval.admin_notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Damage Categories */}
                                            {approval.inspection?.inspectionDamages && approval.inspection.inspectionDamages.length > 0 && (
                                                <div className="mb-6">
                                                    <h5 className="text-sm lg:text-base font-medium text-gray-700 mb-3">Kategori Kerusakan:</h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        {approval.inspection.inspectionDamages.map((damage, index) => (
                                                            <span key={index} className="bg-red-100 text-red-800 px-3 py-2 rounded-full text-sm font-medium">
                                                                {damage.damageCategory?.name || 'Kategori tidak tersedia'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            {approval.status === 'pending' && (
                                                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                                                    <button
                                                        onClick={() => {
                                                            const notes = prompt('Tambahkan catatan (opsional):');
                                                            handleApprove(approval, notes);
                                                        }}
                                                        className="flex-1 sm:flex-none bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                                                    >
                                                        <CheckCircleIcon className="h-5 w-5" />
                                                        <span>Setujui</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const notes = prompt('Alasan penolakan (wajib):');
                                                            if (notes) {
                                                                handleReject(approval, notes);
                                                            }
                                                        }}
                                                        className="flex-1 sm:flex-none bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2"
                                                    >
                                                        <XCircleIcon className="h-5 w-5" />
                                                        <span>Tolak</span>
                                                    </button>
                                                </div>
                                            )}

                                            {approval.status === 'approved' && (
                                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                                    <div className="flex items-center space-x-3 text-green-800">
                                                        <CheckCircleIcon className="h-6 w-6" />
                                                        <span className="font-medium text-lg">Perbaikan disetujui</span>
                                                    </div>
                                                    <p className="text-green-700 mt-2 text-base">
                                                        Teknisi dapat melakukan perbaikan sesuai persetujuan
                                                    </p>
                                                </div>
                                            )}

                                            {approval.status === 'rejected' && (
                                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                                    <div className="flex items-center space-x-3 text-red-800">
                                                        <XCircleIcon className="h-6 w-6" />
                                                        <span className="font-medium text-lg">Perbaikan ditolak</span>
                                                    </div>
                                                    <p className="text-red-700 mt-2 text-base">
                                                        {approval.admin_notes}
                                                    </p>
                                                </div>
                                            )}

                                            {approval.status === 'completed' && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                                    <div className="flex items-center space-x-3 text-blue-800">
                                                        <CheckCircleIcon className="h-6 w-6" />
                                                        <span className="font-medium text-lg">Perbaikan selesai</span>
                                                    </div>
                                                    <p className="text-blue-700 mt-2 text-base">
                                                        APAR telah diperbaiki dan siap digunakan
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-shrink-0 lg:ml-6">
                                            <button
                                                onClick={() => {
                                                    console.log('Navigating to:', `/repair-approvals/${approval.id}`);
                                                    console.log('Approval ID:', approval.id);
                                                    navigate(`/repair-approvals/${approval.id}`);
                                                }}
                                                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                                                title="Lihat Detail"
                                            >
                                                <EyeIcon className="h-5 w-5" />
                                                <span>Detail</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 lg:py-24 px-6">
                            <div className="max-w-md mx-auto">
                                <div className="mx-auto h-24 w-24 lg:h-32 lg:w-32 flex items-center justify-center rounded-full bg-gray-100 mb-6">
                                    <FireIcon className="h-12 w-12 lg:h-16 lg:w-16 text-gray-400" />
                                </div>
                                <h3 className="text-xl lg:text-2xl font-medium text-gray-900 mb-3">
                                    Tidak ada persetujuan
                                </h3>
                                <p className="text-gray-500 text-lg leading-relaxed">
                                    {filter === 'all' 
                                        ? 'Belum ada permintaan perbaikan APAR yang perlu ditinjau. Sistem akan menampilkan data secara otomatis ketika ada permintaan baru.'
                                        : `Tidak ada persetujuan dengan status "${filter}" saat ini.`
                                    }
                                </p>
                                {filter !== 'all' && (
                                    <button
                                        onClick={() => setFilter('all')}
                                        className="mt-6 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium"
                                    >
                                        Lihat Semua Status
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 lg:p-8">
                    <div className="flex items-start space-x-4">
                        <div className="text-blue-600 text-2xl lg:text-3xl flex-shrink-0">💡</div>
                        <div className="flex-1">
                            <div className="font-medium text-lg lg:text-xl text-blue-800 mb-4">Panduan Persetujuan Perbaikan:</div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <ul className="space-y-3 text-blue-800">
                                    <li className="flex items-start space-x-3">
                                        <span className="text-blue-600 font-bold">•</span>
                                        <div>
                                            <span className="font-semibold">Menunggu:</span> Perlu ditinjau dan disetujui/ditolak
                                        </div>
                                    </li>
                                    <li className="flex items-start space-x-3">
                                        <span className="text-blue-600 font-bold">•</span>
                                        <div>
                                            <span className="font-semibold">Disetujui:</span> Teknisi dapat melakukan perbaikan
                                        </div>
                                    </li>
                                </ul>
                                <ul className="space-y-3 text-blue-800">
                                    <li className="flex items-start space-x-3">
                                        <span className="text-blue-600 font-bold">•</span>
                                        <div>
                                            <span className="font-semibold">Ditolak:</span> Perbaikan tidak disetujui dengan alasan tertentu
                                        </div>
                                    </li>
                                    <li className="flex items-start space-x-3">
                                        <span className="text-blue-600 font-bold">•</span>
                                        <div>
                                            <span className="font-semibold">Selesai:</span> Perbaikan telah selesai dan dilaporkan
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Debug Info (Development Only) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="bg-gray-100 border border-gray-300 rounded-xl p-4">
                        <h4 className="font-medium text-gray-700 mb-3">Debug Info:</h4>
                        <div className="text-xs text-gray-600 space-y-2">
                            <div>Filter: {filter}</div>
                            <div>Approvals Count: {approvals.length}</div>
                            <div>Stats: {JSON.stringify(stats)}</div>
                            <div>Error: {error || 'None'}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RepairApprovalList;



