import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { usePusher } from "@/hooks/usePusher";
import ActionDialog from "@/components/common/ActionDialog";
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
    FunnelIcon,
    CalendarIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";

const RepairApprovalList = () => {
    const [filter, setFilter] = useState("all");
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [actionDialog, setActionDialog] = useState({
        isOpen: false,
        type: 'approve',
        approval: null,
    });

    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    const { apiClient } = useAuth();
    const queryClient = useQueryClient();

    const { isConnected: pusherConnected, error: pusherError } = usePusher({
        appKey: "your-pusher-key",
        cluster: "ap1",
        onMessage: (data) => {
            console.log("Real-time update received:", data);
            refetchApprovals();
            refetchStats();
            showSuccess(
                `Status perbaikan APAR ${data.apar_serial} telah berubah: ${data.message}`
            );
        },
    });

    const AUTO_REFRESH_INTERVAL = 10000;

    const {
        data: approvalsData = [],
        isLoading: loading,
        isFetching: isFetchingApprovals,
        refetch: refetchApprovals,
        error: approvalsError,
    } = useQuery({
        queryKey: ["repair-approvals", filter],
        queryFn: async () => {
            const url =
                filter === "all"
                    ? "/api/repair-approvals"
                    : `/api/repair-approvals?status=${filter}`;
            const res = await apiClient.get(url);
            return res.data?.data || [];
        },
        refetchOnWindowFocus: false,
        staleTime: 60000,
        keepPreviousData: true,
        throwOnError: false,
    });

    const { data: statsData = {}, refetch: refetchStats } = useQuery({
        queryKey: ["repair-approvals-stats"],
        queryFn: async () => {
            const res = await apiClient.get("/api/repair-approvals/stats");
            return res.data?.data || {};
        },
        refetchOnWindowFocus: false,
        staleTime: 60000,
        throwOnError: false,
    });

    useEffect(() => {
        console.log("RepairApprovalList component mounted");
        setIsInitialized(true);

        const intervalId = setInterval(() => {
            console.log("Auto-refreshing admin repair approvals...");
            refetchApprovals();
            refetchStats();
        }, AUTO_REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    useEffect(() => {
        if (approvalsData && approvalsData.length) {
            setLastUpdate(new Date());
        }
    }, [approvalsData]);

    const prevApprovalsRef = useRef([]);
    const hasShownInitialAlertRef = useRef(false);
    useEffect(() => {
        if (!isInitialized) return;
        if (
            !isFetchingApprovals &&
            approvalsData &&
            approvalsData.length >= 0
        ) {
            if (!hasShownInitialAlertRef.current && approvalsData.length > 0) {
                showSuccess(
                    `Berhasil memuat ${approvalsData.length} data persetujuan`
                );
                hasShownInitialAlertRef.current = true;
            }
        }
        prevApprovalsRef.current = approvalsData;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [approvalsData, isFetchingApprovals, isInitialized]);

    const handleManualRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        setHasShownInitialAlert(false);
        await refetchApprovals();
        await refetchStats();
        setRefreshing(false);
    };

    const approveMutation = useMutation({
        mutationFn: ({ id, notes }) =>
            apiClient.post(`/api/repair-approvals/${id}/approve`, {
                supervisor_notes: notes,
            }),
        onMutate: async ({ id, notes }) => {
            await queryClient.cancelQueries({
                queryKey: ["repair-approvals", filter],
            });
            const previous = queryClient.getQueryData([
                "repair-approvals",
                filter,
            ]);
            queryClient.setQueryData(["repair-approvals", filter], (old = []) =>
                old.map((item) =>
                    item.id === id
                        ? { ...item, status: "approved", admin_notes: notes }
                        : item
                )
            );
            return { previous };
        },
        onError: (err, vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(
                    ["repair-approvals", filter],
                    context.previous
                );
            }
            console.error("Error approving approval:", err);
            showError(
                err?.response?.data?.message || "Gagal menyetujui perbaikan"
            );
        },
        onSuccess: (_data, { id, notes, approval }) => {
            queryClient.invalidateQueries({
                queryKey: ["repair-approvals-stats"],
            });
            showSuccess(
                `Persetujuan berhasil disetujui dan notifikasi telah dikirim ke teknisi ${
                    approval?.inspection?.user?.name || "teknisi"
                }`
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["repair-approvals", filter],
            });
        },
    });

    const handleApprove = (approval, notes = "") => {
        approveMutation.mutate({ id: approval.id, notes, approval });
    };

    const rejectMutation = useMutation({
        mutationFn: ({ id, notes }) =>
            apiClient.post(`/api/repair-approvals/${id}/reject`, {
                supervisor_notes: notes,
                rejection_reason: "Other", // Default reason since UI doesn't have selector yet
            }),
        onMutate: async ({ id, notes }) => {
            await queryClient.cancelQueries({
                queryKey: ["repair-approvals", filter],
            });
            const previous = queryClient.getQueryData([
                "repair-approvals",
                filter,
            ]);
            queryClient.setQueryData(["repair-approvals", filter], (old = []) =>
                old.map((item) =>
                    item.id === id
                        ? { ...item, status: "rejected", admin_notes: notes }
                        : item
                )
            );
            return { previous };
        },
        onError: (err, vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(
                    ["repair-approvals", filter],
                    context.previous
                );
            }
            console.error("Error rejecting approval:", err);
            showError(
                err?.response?.data?.message || "Gagal menolak perbaikan"
            );
        },
        onSuccess: (_data, { id, notes, approval }) => {
            queryClient.invalidateQueries({
                queryKey: ["repair-approvals-stats"],
            });
            showSuccess(
                `Persetujuan berhasil ditolak dan notifikasi penolakan telah dikirim ke teknisi ${
                    approval?.inspection?.user?.name || "teknisi"
                }`
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["repair-approvals", filter],
            });
        },
    });

    const handleReject = (approval, notes = "") => {
        rejectMutation.mutate({ id: approval.id, notes, approval });
    };

    const openApproveDialog = (approval) => {
        setActionDialog({
            isOpen: true,
            type: 'approve',
            approval,
        });
    };

    const openRejectDialog = (approval) => {
        setActionDialog({
            isOpen: true,
            type: 'reject',
            approval,
        });
    };

    const handleDialogConfirm = (formData) => {
        const { type, approval } = actionDialog;
        const notes = formData.notes || formData;
        if (type === 'approve') {
            handleApprove(approval, notes);
        } else {
            handleReject(approval, notes);
        }
        setActionDialog({ ...actionDialog, isOpen: false });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: {
                color: "bg-amber-50 text-amber-700 border-amber-200",
                icon: ClockIcon,
                text: "Menunggu",
            },
            approved: {
                color: "bg-emerald-50 text-emerald-700 border-emerald-200",
                icon: CheckCircleIcon,
                text: "Disetujui",
            },
            rejected: {
                color: "bg-rose-50 text-rose-700 border-rose-200",
                icon: XCircleIcon,
                text: "Ditolak",
            },
            completed: {
                color: "bg-blue-50 text-blue-700 border-blue-200",
                icon: CheckCircleIcon,
                text: "Selesai",
            },
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-xs font-bold uppercase tracking-wider border ${config.color}`}
            >
                <Icon className="h-3 w-3" />
                {config.text}
            </span>
        );
    };

    const getConditionBadge = (condition) => {
        const conditionConfig = {
            good: {
                color: "bg-emerald-50 text-emerald-700 border-emerald-200",
                text: "Baik",
            },
            needs_repair: {
                color: "bg-amber-50 text-amber-700 border-amber-200",
                text: "Perlu Perbaikan",
            },
        };

        const config = conditionConfig[condition] || conditionConfig.good;

        return (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-[3px] text-xs font-bold uppercase tracking-wider border ${config.color}`}
            >
                {config.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11468F] mx-auto mb-4"></div>
                    <p className="text-sm font-semibold text-slate-500">
                        Memuat data persetujuan perbaikan...
                    </p>
                </div>
            </div>
        );
    }

    if (approvalsError) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center max-w-md bg-white border border-slate-200 rounded-[6px] p-6 shadow-sm">
                    <div className="w-12 h-12 bg-rose-100 rounded-[6px] flex items-center justify-center mx-auto mb-4">
                        <ExclamationTriangleIcon className="h-6 w-6 text-rose-600" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                        Terjadi Kesalahan
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">{approvalsError?.message || 'Gagal memuat data'}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={refetchApprovals}
                            className="px-4 py-2 bg-[#11468F] hover:bg-[#0d3873] text-white border border-transparent text-xs font-bold uppercase tracking-wider rounded-[6px] shadow-sm transition-colors"
                        >
                            Coba Lagi
                        </button>
                        <button
                            onClick={() => navigate({ to: "/" })}
                            className="px-4 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider rounded-[6px] transition-colors"
                        >
                            Kembali ke Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-[6px] p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center font-black text-xl shadow-sm">
                        <FireIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Persetujuan Perbaikan APAR
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Kelola dan validasi disposisi permohonan tindakan perbaikan APAR
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="inline-flex items-center px-3 py-1 bg-slate-100 border border-slate-200 rounded-[3px]">
                        <span className={`text-xs font-bold ${pusherConnected ? "text-emerald-700" : "text-slate-500"}`}>
                            {pusherConnected ? "Live Link" : "Offline"}
                        </span>
                    </div>
                    <button
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-300 rounded-[6px] hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs"
                    >
                        <ArrowPathIcon
                            className={`h-4 w-4 text-[#11468F] ${
                                refreshing ? "animate-spin" : ""
                            }`}
                        />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-[6px] border border-slate-200 p-5 shadow-sm hover:border-[#11468F] transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Menunggu
                            </p>
                            <p className="text-3xl font-black text-slate-900 tracking-tight">
                                {statsData.pending || 0}
                            </p>
                        </div>
                        <div className="w-11 h-11 bg-amber-50 border border-amber-200 rounded-[6px] flex items-center justify-center">
                            <ClockIcon className="h-5 w-5 text-amber-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[6px] border border-slate-200 p-5 shadow-sm hover:border-[#11468F] transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Disetujui
                            </p>
                            <p className="text-3xl font-black text-slate-900 tracking-tight">
                                {statsData.approved || 0}
                            </p>
                        </div>
                        <div className="w-11 h-11 bg-emerald-50 border border-emerald-200 rounded-[6px] flex items-center justify-center">
                            <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[6px] border border-slate-200 p-5 shadow-sm hover:border-[#11468F] transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Ditolak
                            </p>
                            <p className="text-3xl font-black text-slate-900 tracking-tight">
                                {statsData.rejected || 0}
                            </p>
                        </div>
                        <div className="w-11 h-11 bg-rose-50 border border-rose-200 rounded-[6px] flex items-center justify-center">
                            <XCircleIcon className="h-5 w-5 text-rose-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[6px] border border-slate-200 p-5 shadow-sm hover:border-[#11468F] transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Selesai
                            </p>
                            <p className="text-3xl font-black text-slate-900 tracking-tight">
                                {statsData.completed || 0}
                            </p>
                        </div>
                        <div className="w-11 h-11 bg-blue-50 border border-blue-200 rounded-[6px] flex items-center justify-center">
                            <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-[6px] border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <FunnelIcon className="h-4 w-4 text-slate-400" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="flex-1 sm:flex-none border border-slate-300 rounded-[6px] px-3 py-2 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F]"
                    >
                        <option value="all">Semua Status</option>
                        <option value="pending">Menunggu</option>
                        <option value="approved">Disetujui</option>
                        <option value="rejected">Ditolak</option>
                        <option value="completed">Selesai</option>
                    </select>
                    {lastUpdate && (
                        <span className="text-xs text-slate-500 ml-auto hidden sm:inline font-medium">
                            Sinkron: {lastUpdate.toLocaleTimeString("id-ID")}
                        </span>
                    )}
                </div>
            </div>

            {/* Approvals List */}
            <div className="bg-white rounded-[6px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Daftar Permohonan Perbaikan{" "}
                        <span className="text-slate-500 font-medium">
                            ({approvalsData.length})
                        </span>
                    </h3>
                </div>

                {approvalsData.length > 0 ? (
                    <div className="divide-y divide-slate-200">
                        {approvalsData.map((approval) => (
                            <div
                                key={approval.id}
                                className="p-6 hover:bg-slate-50/80 transition-colors"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                    <div className="flex-1 space-y-3.5">
                                        {/* Header */}
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h4 className="text-base font-black text-slate-900">
                                                APAR{" "}
                                                {approval.inspection?.apar
                                                    ?.serial_number ||
                                                    "N/A"}
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {getStatusBadge(
                                                    approval.status
                                                )}
                                                {getConditionBadge(
                                                    approval.inspection
                                                        ?.condition
                                                )}
                                            </div>
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid sm:grid-cols-2 gap-3 text-xs">
                                            <div className="flex items-start gap-2 text-slate-600">
                                                <MapPinIcon className="h-4 w-4 text-[#041562] flex-shrink-0" />
                                                <span className="font-medium">
                                                    {approval.inspection
                                                        ?.apar
                                                        ?.location_name ||
                                                        "Lokasi tidak tersedia"}
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-2 text-slate-600">
                                                <UserIcon className="h-4 w-4 text-[#041562] flex-shrink-0" />
                                                <span className="font-medium">
                                                    {approval.inspection
                                                        ?.user?.name ||
                                                        "User tidak tersedia"}
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-2 text-slate-600">
                                                <CalendarIcon className="h-4 w-4 text-[#041562] flex-shrink-0" />
                                                <span className="font-medium">
                                                    {approval.inspection
                                                        ?.created_at
                                                        ? new Date(
                                                              approval.inspection.created_at
                                                          ).toLocaleDateString(
                                                              "id-ID"
                                                          )
                                                        : "Tanggal tidak tersedia"}
                                                </span>
                                            </div>
                                            {approval.inspection?.notes && (
                                                <div className="flex items-start gap-2 text-slate-600">
                                                    <DocumentTextIcon className="h-4 w-4 text-[#041562] flex-shrink-0" />
                                                    <span className="line-clamp-1 font-medium">
                                                        {
                                                            approval
                                                                .inspection
                                                                .notes
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Damage Categories */}
                                        {approval.inspection
                                            ?.inspectionDamages &&
                                            approval.inspection
                                                .inspectionDamages.length >
                                                0 && (
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                                        Kategori Kerusakan:
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {approval.inspection.inspectionDamages.map(
                                                            (
                                                                damage,
                                                                index
                                                            ) => (
                                                                <span
                                                                    key={
                                                                        index
                                                                    }
                                                                    className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded-[3px] text-xs font-bold uppercase tracking-wider border border-rose-200"
                                                                >
                                                                    {damage
                                                                        .damageCategory
                                                                        ?.name ||
                                                                        "Kategori tidak tersedia"}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                        {/* Admin Notes */}
                                        {approval.admin_notes && (
                                            <div className="bg-slate-50 rounded-[6px] p-3 border border-slate-200">
                                                <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                                    Catatan Disposisi:
                                                </p>
                                                <p className="text-xs text-slate-600">
                                                    {approval.admin_notes}
                                                </p>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        {approval.status === "pending" && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                <button
                                                    onClick={() => openApproveDialog(approval)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#11468F] hover:bg-[#0d3873] text-white border border-transparent text-xs font-bold uppercase tracking-wider rounded-[6px] shadow-xs transition-colors"
                                                >
                                                    <CheckCircleIcon className="h-4 w-4" />
                                                    Setujui
                                                </button>
                                                <button
                                                    onClick={() => openRejectDialog(approval)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#DA1212] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider border border-transparent rounded-[6px] transition-colors"
                                                >
                                                    <XCircleIcon className="h-4 w-4" />
                                                    Tolak
                                                </button>
                                            </div>
                                        )}

                                        {approval.status === "approved" && (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-[6px] p-3">
                                                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                                                    <CheckCircleIcon className="h-4 w-4" />
                                                    Perbaikan disetujui - Teknisi dapat melakukan perbaikan fisik
                                                </div>
                                            </div>
                                        )}

                                        {approval.status === "rejected" && (
                                            <div className="bg-rose-50 border border-rose-200 rounded-[6px] p-3">
                                                <div className="flex items-center gap-2 text-rose-800 text-xs font-bold uppercase tracking-wider mb-1">
                                                    <XCircleIcon className="h-4 w-4" />
                                                    Perbaikan ditolak
                                                </div>
                                                <p className="text-xs text-rose-700">
                                                    {approval.admin_notes}
                                                </p>
                                            </div>
                                        )}

                                        {approval.status ===
                                            "completed" && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-[6px] p-3">
                                                <div className="flex items-center gap-2 text-blue-800 text-xs font-bold uppercase tracking-wider">
                                                    <CheckCircleIcon className="h-4 w-4" />
                                                    Perbaikan selesai - APAR siap beroperasi normal
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() =>
                                            navigate({
                                                to: `/view/${approval.id}`,
                                            })
                                        }
                                        className="lg:self-start inline-flex items-center gap-1.5 px-4 py-2 bg-[#041562] hover:bg-[#11468F] text-white text-xs font-bold uppercase tracking-wider rounded-[6px] shadow-sm transition-colors whitespace-nowrap"
                                    >
                                        <EyeIcon className="h-4 w-4 text-white" />
                                        Detail
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-6">
                        <div className="w-12 h-12 bg-slate-100 rounded-[6px] flex items-center justify-center mx-auto mb-3">
                            <FireIcon className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">
                            Tidak Ada Data Persetujuan
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                            {filter === "all"
                                ? "Belum ada permintaan perbaikan yang perlu ditinjau."
                                : `Tidak ada persetujuan dengan status "${filter}".`}
                        </p>
                        {filter !== "all" && (
                            <button
                                onClick={() => setFilter("all")}
                                className="mt-4 px-4 py-2 bg-[#11468F] hover:bg-[#0d3873] text-white border border-transparent text-xs font-bold uppercase tracking-wider rounded-[6px] shadow-sm transition-colors"
                            >
                                Lihat Semua Status
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Info Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-5 shadow-xs">
                <div className="flex gap-4">
                    <div className="text-xl flex-shrink-0">💡</div>
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                            Panduan Alur Status Perbaikan:
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-600">
                            <div className="flex gap-2">
                                <span className="text-[#11468F] font-bold">•</span>
                                <div>
                                    <span className="font-bold text-slate-900">
                                        Menunggu:
                                    </span>{" "}
                                    Permohonan baru, perlu verifikasi supervisor
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-[#11468F] font-bold">•</span>
                                <div>
                                    <span className="font-bold text-slate-900">
                                        Disetujui:
                                    </span>{" "}
                                    Disposisi siap dikerjakan oleh teknisi
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-[#11468F] font-bold">•</span>
                                <div>
                                    <span className="font-bold text-slate-900">
                                        Ditolak:
                                    </span>{" "}
                                    Tindakan tidak disetujui atau perlu inspeksi ulang
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-[#11468F] font-bold">•</span>
                                <div>
                                    <span className="font-bold text-slate-900">
                                        Selesai:
                                    </span>{" "}
                                    Laporan perbaikan telah dituntaskan teknisi
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ActionDialog
                isOpen={actionDialog.isOpen}
                onClose={() => setActionDialog({ ...actionDialog, isOpen: false })}
                onConfirm={handleDialogConfirm}
                title={actionDialog.type === 'approve' ? 'Setujui Perbaikan' : 'Tolak Perbaikan'}
                message={actionDialog.type === 'approve' ? 'Apakah Anda yakin ingin menyetujui perbaikan ini?' : 'Apakah Anda yakin ingin menolak perbaikan ini?'}
                type={actionDialog.type === 'approve' ? 'success' : 'error'}
                confirmText={actionDialog.type === 'approve' ? 'Setujui' : 'Tolak'}
                confirmButtonColor={actionDialog.type === 'approve' ? 'green' : 'red'}
                requireInput={true}
                minInputLength={10}
                inputLabel={actionDialog.type === 'approve' ? 'Catatan Persetujuan' : 'Alasan Penolakan'}
                inputPlaceholder={actionDialog.type === 'approve' ? 'Jelaskan instruksi perbaikan atau catatan persetujuan (min. 10 karakter)...' : 'Masukkan alasan penolakan (min. 10 karakter)...'}
            />
        </div>
    );
};

export default RepairApprovalList;