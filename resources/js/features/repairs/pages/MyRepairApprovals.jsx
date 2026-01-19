import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { usePusher, useRepairApprovalUpdates } from '@/hooks/usePusher';
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    FireIcon,
    MapPinIcon,
    UserIcon,
    WrenchScrewdriverIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    SignalIcon,
    FunnelIcon,
    CalendarIcon,
} from '@heroicons/react/24/outline';

const MyRepairApprovals = () => {
    const { user } = useAuth();
    const [filter, setFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const hasShownInitialAlertRef = useRef(false);
    const navigate = useNavigate();
    const { showError, showSuccess } = useToast();
    const { apiClient } = useAuth();
    const queryClient = useQueryClient();

    // Pusher connection for real-time updates
    const { isConnected: pusherConnected, error: pusherError } = usePusher({
        appKey: 'your-pusher-key', // Replace with your actual Pusher key
        cluster: 'ap1', // Replace with your actual cluster
        onMessage: useCallback((data) => {
            console.log('Real-time update received:', data);
            // Refresh data immediately when status changes
            queryClient.invalidateQueries({ queryKey: ['repair-approvals'] });
            showSuccess(`Status perbaikan APAR ${data.apar_serial} telah berubah: ${data.message}`);
        }, [queryClient, showSuccess])
    });

    // Listen for repair approval updates
    useRepairApprovalUpdates(useCallback((updateData) => {
        console.log('Repair approval update received:', updateData);
        // Refresh data immediately
        queryClient.invalidateQueries({ queryKey: ['repair-approvals'] });
    }, [queryClient]));

    // Auto-refresh interval (reduced to 15 seconds for better responsiveness)
    const AUTO_REFRESH_INTERVAL = 15000;

    // Use react-query to fetch approvals
    const { data: approvalsData = [], isLoading: loading, isFetching, refetch } = useQuery({
        queryKey: ['repair-approvals', filter, 'my'],
        queryFn: async () => {
            const url = filter === 'all' ? '/api/repair-approvals' : `/api/repair-approvals?status=${filter}`;
            const res = await apiClient.get(url);
            const all = res.data?.data || [];
            return all.filter(approval => {
                 // If assigned_technician_id exists, only show to that technician
                 if (approval.assigned_technician_id) {
                     return approval.assigned_technician_id === user?.id;
                 }
                 // Fallback for legacy data: show to inspector
                 return approval.inspection?.user?.id === user?.id;
             });
        },
        staleTime: 10000,
        refetchOnWindowFocus: false,
        keepPreviousData: true,
        throwOnError: false,
    });

    // Use ref to store refetch function to avoid dependency issues
    const refetchRef = useRef(refetch);
    useEffect(() => {
        refetchRef.current = refetch;
    }, [refetch]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            console.log('Auto-refreshing repair approvals...');
            refetchRef.current();
        }, AUTO_REFRESH_INTERVAL);
        return () => clearInterval(intervalId);
    }, []); // Empty dependency array - interval setup only once

    // Show initial message once
    useEffect(() => {
        if (!isFetching && approvalsData && approvalsData.length > 0 && !hasShownInitialAlertRef.current) {
            showSuccess(`Berhasil memuat ${approvalsData.length} data perbaikan`);
            hasShownInitialAlertRef.current = true;
        }
    }, [approvalsData, isFetching, showSuccess]);

    // Manual refresh function
    const handleManualRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        hasShownInitialAlertRef.current = false;
        await refetch();
        setRefreshing(false);
    };

    // Use query data directly
    const approvals = approvalsData || [];

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: ClockIcon, text: 'Menunggu' },
            approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircleIcon, text: 'Disetujui' },
            rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircleIcon, text: 'Ditolak' },
            completed: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircleIcon, text: 'Selesai' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                <Icon className="h-3 w-3 mr-1" />
                {config.text}
            </span>
        );
    };

    const filterOptions = [
        { id: 'all', label: 'Semua' },
        { id: 'pending', label: 'Menunggu' },
        { id: 'approved', label: 'Disetujui' },
        { id: 'rejected', label: 'Ditolak' },
        { id: 'completed', label: 'Selesai' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Section */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Perbaikan Saya</h1>
                            <p className="text-xs sm:text-sm text-gray-500">Kelola status perbaikan APAR Anda</p>
                        </div>
                        <button
                            onClick={handleManualRefresh}
                            disabled={refreshing}
                            className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${refreshing ? 'animate-spin text-red-600' : 'text-gray-600'}`}
                        >
                            <ArrowPathIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Filter Chips */}
                    <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                        {filterOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setFilter(option.id)}
                                className={`px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm rounded-full font-medium whitespace-nowrap transition-all ${
                                    filter === option.id
                                        ? 'bg-red-600 text-white shadow-md shadow-red-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                        <p className="text-gray-500">Memuat data...</p>
                    </div>
                ) : approvals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-gray-100 p-6 rounded-full mb-4">
                            <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Belum ada perbaikan</h3>
                        <p className="text-gray-500 mt-1 max-w-xs mx-auto">
                            {filter === 'all' 
                                ? 'Anda belum memiliki riwayat perbaikan APAR.' 
                                : `Tidak ada perbaikan dengan status "${filterOptions.find(f => f.id === filter)?.label}".`}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {approvals.map((approval) => (
                            <div 
                                key={approval.id} 
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
                            >
                                {/* Card Header */}
                                <div className="p-5 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center space-x-2">
                                            <div className="bg-red-100 p-2 rounded-lg">
                                                <FireIcon className="h-5 w-5 text-red-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{approval.inspection?.apar?.serial_number}</h3>
                                                <p className="text-xs text-gray-500">ID: #{approval.id}</p>
                                            </div>
                                        </div>
                                        {getStatusBadge(approval.status)}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-5 space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                                            <span className="truncate">{approval.inspection?.apar?.location_name}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                                            <span>{new Date(approval.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </div>
                                        {/* Show Schedule if available */}
                                        {approval.scheduled_at && (
                                            <div className="flex items-center text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                                                <CalendarIcon className="h-4 w-4 mr-2" />
                                                <span className="font-medium">Jadwal: {new Date(approval.scheduled_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Damage Tags */}
                                    {approval.inspection?.inspectionDamages?.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {approval.inspection.inspectionDamages.slice(0, 3).map((damage, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md font-medium border border-red-100">
                                                    {damage.damageCategory?.name}
                                                </span>
                                            ))}
                                            {approval.inspection.inspectionDamages.length > 3 && (
                                                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md font-medium border border-gray-200">
                                                    +{approval.inspection.inspectionDamages.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <div className="pt-2">
                                        {approval.status === 'approved' ? (
                                            approval.scheduled_at ? (
                                                <button
                                                    onClick={() => navigate({ to: `/repair-report/${approval.id}` })}
                                                    className="w-full flex items-center justify-center px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-sm shadow-green-200"
                                                >
                                                    <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
                                                    Lakukan Perbaikan
                                                </button>
                                            ) : (
                                                <div className="w-full flex items-center justify-center px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-medium">
                                                    <ClockIcon className="h-4 w-4 mr-2" />
                                                    Menunggu Penjadwalan
                                                </div>
                                            )
                                        ) : (
                                            <button
                                                onClick={() => navigate({ to: `/repair-approvals/${approval.id}` })}
                                                className="w-full flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                <EyeIcon className="h-4 w-4 mr-2" />
                                                Lihat Detail
                                            </button>
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

export default MyRepairApprovals;
