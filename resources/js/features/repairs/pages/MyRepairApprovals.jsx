import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    FireIcon,
    MapPinIcon,
    WrenchScrewdriverIcon,
    ArrowPathIcon,
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

    // Auto-refresh interval (reduced to 15 seconds for better responsiveness)
    const AUTO_REFRESH_INTERVAL = 15000;

    // Use react-query to fetch approvals
    const { data: approvalsData = [], isLoading: loading, isFetching, refetch } = useQuery({
        queryKey: ['repair-approvals', filter, 'my'],
        queryFn: async () => {
            const baseUrl = filter === 'all' ? '/api/repair-approvals' : `/api/repair-approvals?status=${filter}`;
            const separator = baseUrl.includes('?') ? '&' : '?';
            const res = await apiClient.get(`${baseUrl}${separator}assigned_to_me=1`);
            const all = res.data?.data || [];
            return all.filter(approval => 
                approval.assigned_user_id === user?.id || 
                approval.inspection?.user?.id === user?.id
            );
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

    const getApprovalStatusBadge = (approval) => {
        const report = approval.repair_report || approval.repairReport;
        
        // If technician already submitted a repair report
        if (report) {
            if (report.status === 'pending_review') {
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-bold uppercase tracking-wider border bg-blue-50 text-blue-800 border-blue-200">
                        <ClockIcon className="h-3 w-3 mr-1 text-blue-600 animate-pulse" />
                        Menunggu Review SPV
                    </span>
                );
            }
            if (report.status === 'needs_rework') {
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-bold uppercase tracking-wider border bg-rose-50 text-rose-800 border-rose-200">
                        <XCircleIcon className="h-3 w-3 mr-1 text-rose-600" />
                        Perlu Perbaikan Ulang
                    </span>
                );
            }
            if (report.status === 'approved' || approval.status === 'completed') {
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-800 border-emerald-200">
                        <CheckCircleIcon className="h-3 w-3 mr-1 text-emerald-600" />
                        Selesai (Aktif)
                    </span>
                );
            }
        }

        const statusConfig = {
            pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: ClockIcon, text: 'Menunggu Disposisi' },
            approved: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: WrenchScrewdriverIcon, text: 'Siap Dikerjakan' },
            rejected: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircleIcon, text: 'Ditolak' },
            completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircleIcon, text: 'Selesai' }
        };

        const config = statusConfig[approval.status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-bold uppercase tracking-wider border ${config.color}`}>
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
            <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-sm">
                <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
                    {filterOptions.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => setFilter(option.id)}
                            className={`h-10 px-4 text-xs rounded-lg font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-center active:scale-[0.98] ${
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
                    <div className="bg-white border border-slate-200 rounded-lg p-10 sm:p-12 text-center shadow-sm">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {approvals.map((approval) => (
                            <div 
                                key={approval.id} 
                                className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:border-[#11468F] transition-colors"
                            >
                                {/* Card Header */}
                                <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                                    <div className="flex items-center gap-2.5 sm:gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-[#041562] text-white flex items-center justify-center font-bold">
                                            <FireIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-mono font-black text-slate-900 text-sm tracking-wider">{approval.inspection?.apar?.serial_number}</h3>
                                            <p className="text-[11px] text-slate-500 font-medium">ID Ref: #{approval.id}</p>
                                        </div>
                                    </div>
                                    {getApprovalStatusBadge(approval)}
                                </div>

                                {/* Card Body */}
                                <div className="p-3.5 sm:p-4 space-y-3.5">
                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex items-center text-slate-600">
                                            <MapPinIcon className="h-4 w-4 mr-2 text-[#11468F] flex-shrink-0" />
                                            <span className="truncate font-semibold text-slate-800">{approval.inspection?.apar?.location_name || 'Lokasi N/A'}</span>
                                        </div>
                                        <div className="flex items-center text-slate-600">
                                            <ClockIcon className="h-4 w-4 mr-2 text-[#11468F] flex-shrink-0" />
                                            <span className="font-medium text-slate-600">{new Date(approval.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </div>

                                    {/* Damage Tags */}
                                    {approval.inspection?.inspectionDamages?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {approval.inspection.inspectionDamages.slice(0, 3).map((damage, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-rose-50 text-rose-800 text-xs rounded font-bold uppercase tracking-wider border border-rose-200">
                                                    {damage.damageCategory?.name}
                                                </span>
                                            ))}
                                            {approval.inspection.inspectionDamages.length > 3 && (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded font-bold border border-slate-200">
                                                    +{approval.inspection.inspectionDamages.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Supervisor Instruction Note */}
                                    {approval.supervisor_notes && (
                                        <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px] text-slate-700">
                                            <span className="font-bold text-[#041562] block mb-0.5">Instruksi Supervisor:</span>
                                            <p className="line-clamp-2 italic text-slate-600">"{approval.supervisor_notes}"</p>
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <div className="pt-2 border-t border-slate-100">
                                        {(() => {
                                            const report = approval.repair_report || approval.repairReport;
                                            if (report) {
                                                if (report.status === 'needs_rework') {
                                                    return (
                                                        <button
                                                            onClick={() => navigate({ to: `/repair-report/${approval.id}` })}
                                                            className="w-full flex items-center justify-center h-11 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-xs transition-all active:scale-[0.98]"
                                                        >
                                                            <ArrowPathIcon className="h-4 w-4 mr-2" />
                                                            Perbaiki Ulang
                                                        </button>
                                                    );
                                                }
                                                return (
                                                    <button
                                                        onClick={() => navigate({ to: `/repair-approval/${approval.id}` })}
                                                        className="w-full flex items-center justify-center h-11 bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 rounded-lg font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98]"
                                                    >
                                                        <CheckCircleIcon className="h-4 w-4 mr-2 text-blue-600" />
                                                        Laporan Terkirim (Lihat Detail)
                                                    </button>
                                                );
                                            }

                                            if (approval.status === 'approved') {
                                                return (
                                                    <button
                                                        onClick={() => navigate({ to: `/repair-report/${approval.id}` })}
                                                        className="w-full flex items-center justify-center h-11 bg-[#11468F] hover:bg-[#0d3873] text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-xs transition-all active:scale-[0.98]"
                                                    >
                                                        <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
                                                        Lakukan Perbaikan
                                                    </button>
                                                );
                                            }

                                            return (
                                                <button
                                                    onClick={() => navigate({ to: `/repair-approval/${approval.id}` })}
                                                    className="w-full flex items-center justify-center h-11 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98]"
                                                >
                                                    <EyeIcon className="h-4 w-4 mr-2 text-[#11468F]" />
                                                    Lihat Detail
                                                </button>
                                            );
                                        })()}
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

