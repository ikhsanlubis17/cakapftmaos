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
            return all.filter(approval => approval.inspection?.user?.id === user?.id);
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
            pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: ClockIcon, text: 'Menunggu' },
            approved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircleIcon, text: 'Disetujui' },
            rejected: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircleIcon, text: 'Ditolak' },
            completed: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircleIcon, text: 'Selesai' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-bold uppercase tracking-wider border ${config.color}`}>
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
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white border border-slate-200 rounded-[6px] p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center font-black text-xl shadow-sm">
                        <WrenchScrewdriverIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Perbaikan Saya</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Status dan disposisi perbaikan APAR yang Anda tangani</p>
                    </div>
                </div>
                <button
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-300 rounded-[6px] hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs self-start md:self-auto"
                >
                    <ArrowPathIcon className={`h-4 w-4 text-[#11468F] ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Filter Chips */}
            <div className="bg-white border border-slate-200 rounded-[6px] p-4 shadow-sm">
                <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                    {filterOptions.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => setFilter(option.id)}
                            className={`px-3.5 py-1.5 text-xs rounded-[6px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                                filter === option.id
                                    ? 'bg-[#041562] text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11468F] mb-4"></div>
                        <p className="text-sm font-semibold text-slate-500">Memuat data perbaikan...</p>
                    </div>
                ) : approvals.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-[6px] p-12 text-center shadow-sm">
                        <div className="w-12 h-12 bg-slate-100 rounded-[6px] flex items-center justify-center mx-auto mb-3">
                            <WrenchScrewdriverIcon className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">Belum Ada Perbaikan</h3>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                            {filter === 'all' 
                                ? 'Anda belum memiliki riwayat perbaikan APAR yang tercatat.' 
                                : `Tidak ada perbaikan dengan status "${filterOptions.find(f => f.id === filter)?.label}".`}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {approvals.map((approval) => (
                            <div 
                                key={approval.id} 
                                className="bg-white rounded-[6px] shadow-sm border border-slate-200 overflow-hidden hover:border-[#11468F] transition-colors"
                            >
                                {/* Card Header */}
                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-[6px] bg-[#041562] text-white flex items-center justify-center font-bold">
                                            <FireIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">{approval.inspection?.apar?.serial_number}</h3>
                                            <p className="text-[11px] text-slate-500 font-medium">ID Ref: #{approval.id}</p>
                                        </div>
                                    </div>
                                    {getStatusBadge(approval.status)}
                                </div>

                                {/* Card Body */}
                                <div className="p-4 space-y-4">
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center text-slate-600">
                                            <MapPinIcon className="h-4 w-4 mr-2 text-[#11468F] flex-shrink-0" />
                                            <span className="truncate font-medium">{approval.inspection?.apar?.location_name || 'Lokasi N/A'}</span>
                                        </div>
                                        <div className="flex items-center text-slate-600">
                                            <ClockIcon className="h-4 w-4 mr-2 text-[#11468F] flex-shrink-0" />
                                            <span className="font-medium">{new Date(approval.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </div>

                                    {/* Damage Tags */}
                                    {approval.inspection?.inspectionDamages?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {approval.inspection.inspectionDamages.slice(0, 3).map((damage, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-rose-50 text-rose-800 text-xs rounded-[3px] font-bold uppercase tracking-wider border border-rose-200">
                                                    {damage.damageCategory?.name}
                                                </span>
                                            ))}
                                            {approval.inspection.inspectionDamages.length > 3 && (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-[3px] font-bold border border-slate-200">
                                                    +{approval.inspection.inspectionDamages.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <div className="pt-2 border-t border-slate-100">
                                        {approval.status === 'approved' ? (
                                            <button
                                                onClick={() => navigate({ to: `/repair-report/${approval.id}` })}
                                                className="w-full flex items-center justify-center px-4 py-2 bg-[#11468F] hover:bg-[#0d3873] text-white rounded-[6px] font-bold text-xs uppercase tracking-wider shadow-xs transition-colors"
                                            >
                                                <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
                                                Lakukan Perbaikan
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => navigate({ to: `/view/${approval.id}` })}
                                                className="w-full flex items-center justify-center px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-[6px] font-bold text-xs uppercase tracking-wider transition-colors"
                                            >
                                                <EyeIcon className="h-4 w-4 mr-2 text-[#11468F]" />
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

