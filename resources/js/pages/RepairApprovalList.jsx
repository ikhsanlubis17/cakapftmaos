import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { usePusher } from "../hooks/usePusher";
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
    const [approvals, setApprovals] = useState([]);
    const [filter, setFilter] = useState("all");
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

    const { isConnected: pusherConnected, error: pusherError } = usePusher({
        appKey: "your-pusher-key",
        cluster: "ap1",
        onMessage: (data) => {
            console.log("Real-time update received:", data);
            fetchApprovals(true);
            fetchStats();
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
    }, [refetchApprovals, refetchStats]);

    useEffect(() => {
        setApprovals(approvalsData || []);
        setStats(statsData || {});
        if (approvalsData && approvalsData.length) {
            setLastUpdate(new Date());
        }
    }, [approvalsData, statsData]);

    const prevApprovalsRef = useRef([]);
    useEffect(() => {
        if (!isInitialized) return;
        const prev = prevApprovalsRef.current || [];
        if (
            !isFetchingApprovals &&
            approvalsData &&
            approvalsData.length >= 0
        ) {
            if (!hasShownInitialAlert && approvalsData.length > 0) {
                showSuccess(
                    `Berhasil memuat ${approvalsData.length} data persetujuan`
                );
                setHasShownInitialAlert(true);
            }
        }
        prevApprovalsRef.current = approvalsData;
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
                admin_notes: notes,
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
                admin_notes: notes,
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
        if (!notes.trim()) {
            showError("Alasan penolakan wajib diisi");
            return;
        }
        rejectMutation.mutate({ id: approval.id, notes, approval });
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
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${config.color}`}
            >
                <Icon className="h-3.5 w-3.5" />
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
                className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${config.color}`}
            >
                {config.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">
                        Memuat data persetujuan...
                    </p>
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
                    <p className="text-sm text-gray-600 mb-6">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={fetchApprovals}
                            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Coba Lagi
                        </button>
                        <button
                            onClick={() => navigate({ to: "/dashboard" })}
                            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Kembali
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FireIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-semibold text-gray-900">
                                Persetujuan Perbaikan APAR
                            </h1>
                            <p className="text-sm text-gray-600 mt-0.5">
                                Kelola dan monitoring persetujuan perbaikan
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-2 h-2 rounded-full ${
                                        pusherConnected
                                            ? "bg-emerald-500"
                                            : "bg-gray-400"
                                    }`}
                                ></div>
                                <span className="text-xs text-gray-600 hidden sm:inline">
                                    {pusherConnected ? "Real-time" : "Offline"}
                                </span>
                            </div>
                            <button
                                onClick={handleManualRefresh}
                                disabled={refreshing}
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                <ArrowPathIcon
                                    className={`h-4 w-4 ${
                                        refreshing ? "animate-spin" : ""
                                    }`}
                                />
                                <span className="hidden sm:inline">
                                    Refresh
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <ClockIcon className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {stats.pending || 0}
                                </p>
                                <p className="text-xs text-gray-600">
                                    Menunggu
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {stats.approved || 0}
                                </p>
                                <p className="text-xs text-gray-600">
                                    Disetujui
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <XCircleIcon className="h-5 w-5 text-rose-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {stats.rejected || 0}
                                </p>
                                <p className="text-xs text-gray-600">Ditolak</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {stats.completed || 0}
                                </p>
                                <p className="text-xs text-gray-600">Selesai</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <FunnelIcon className="h-5 w-5 text-gray-400" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                            <option value="all">Semua Status</option>
                            <option value="pending">Menunggu</option>
                            <option value="approved">Disetujui</option>
                            <option value="rejected">Ditolak</option>
                            <option value="completed">Selesai</option>
                        </select>
                        {lastUpdate && (
                            <span className="text-xs text-gray-500 ml-auto hidden sm:inline">
                                Update: {lastUpdate.toLocaleTimeString("id-ID")}
                            </span>
                        )}
                    </div>
                </div>

                {/* Approvals List */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-900">
                            Daftar Persetujuan{" "}
                            <span className="text-gray-500">
                                ({approvals.length})
                            </span>
                        </h3>
                    </div>

                    {approvals.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {approvals.map((approval) => (
                                <div
                                    key={approval.id}
                                    className="p-6 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                        <div className="flex-1 space-y-4">
                                            {/* Header */}
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h4 className="text-base font-semibold text-gray-900">
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
                                            <div className="grid sm:grid-cols-2 gap-3 text-sm">
                                                <div className="flex items-start gap-2 text-gray-600">
                                                    <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    <span>
                                                        {approval.inspection
                                                            ?.apar
                                                            ?.location_name ||
                                                            "Lokasi tidak tersedia"}
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-2 text-gray-600">
                                                    <UserIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    <span>
                                                        {approval.inspection
                                                            ?.user?.name ||
                                                            "User tidak tersedia"}
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-2 text-gray-600">
                                                    <CalendarIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    <span>
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
                                                    <div className="flex items-start gap-2 text-gray-600">
                                                        <DocumentTextIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                        <span className="line-clamp-1">
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
                                                        <p className="text-xs font-medium text-gray-700 mb-2">
                                                            Kategori Kerusakan:
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {approval.inspection.inspectionDamages.map(
                                                                (
                                                                    damage,
                                                                    index
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="bg-red-50 text-red-700 px-2.5 py-1 rounded-md text-xs font-medium border border-red-200"
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
                                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                    <p className="text-xs font-medium text-gray-700 mb-1">
                                                        Catatan Admin:
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {approval.admin_notes}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            {approval.status === "pending" && (
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    <button
                                                        onClick={() => {
                                                            const notes =
                                                                prompt(
                                                                    "Tambahkan catatan (opsional):"
                                                                );
                                                            handleApprove(
                                                                approval,
                                                                notes
                                                            );
                                                        }}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                                                    >
                                                        <CheckCircleIcon className="h-4 w-4" />
                                                        Setujui
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const notes =
                                                                prompt(
                                                                    "Alasan penolakan (wajib):"
                                                                );
                                                            if (notes) {
                                                                handleReject(
                                                                    approval,
                                                                    notes
                                                                );
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors"
                                                    >
                                                        <XCircleIcon className="h-4 w-4" />
                                                        Tolak
                                                    </button>
                                                </div>
                                            )}

                                            {approval.status === "approved" && (
                                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 text-emerald-800 text-sm font-medium">
                                                        <CheckCircleIcon className="h-4 w-4" />
                                                        Perbaikan disetujui -
                                                        Teknisi dapat melakukan
                                                        perbaikan
                                                    </div>
                                                </div>
                                            )}

                                            {approval.status === "rejected" && (
                                                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 text-rose-800 text-sm font-medium mb-1">
                                                        <XCircleIcon className="h-4 w-4" />
                                                        Perbaikan ditolak
                                                    </div>
                                                    <p className="text-sm text-rose-700">
                                                        {approval.admin_notes}
                                                    </p>
                                                </div>
                                            )}

                                            {approval.status ===
                                                "completed" && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
                                                        <CheckCircleIcon className="h-4 w-4" />
                                                        Perbaikan selesai - APAR
                                                        siap digunakan
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/repair-approvals/${approval.id}`
                                                )
                                            }
                                            className="lg:self-start inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                            Detail
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 px-6">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FireIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-base font-medium text-gray-900 mb-2">
                                Tidak ada persetujuan
                            </h3>
                            <p className="text-sm text-gray-600 max-w-md mx-auto">
                                {filter === "all"
                                    ? "Belum ada permintaan perbaikan yang perlu ditinjau."
                                    : `Tidak ada persetujuan dengan status "${filter}".`}
                            </p>
                            {filter !== "all" && (
                                <button
                                    onClick={() => setFilter("all")}
                                    className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Lihat Semua Status
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex gap-4">
                        <div className="text-2xl flex-shrink-0">💡</div>
                        <div>
                            <h4 className="text-sm font-semibold text-blue-900 mb-3">
                                Panduan Persetujuan:
                            </h4>
                            <div className="grid sm:grid-cols-2 gap-3 text-sm text-blue-800">
                                <div className="flex gap-2">
                                    <span className="text-blue-600">•</span>
                                    <div>
                                        <span className="font-medium">
                                            Menunggu:
                                        </span>{" "}
                                        Perlu ditinjau
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-blue-600">•</span>
                                    <div>
                                        <span className="font-medium">
                                            Disetujui:
                                        </span>{" "}
                                        Dapat diperbaiki
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-blue-600">•</span>
                                    <div>
                                        <span className="font-medium">
                                            Ditolak:
                                        </span>{" "}
                                        Tidak disetujui
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-blue-600">•</span>
                                    <div>
                                        <span className="font-medium">
                                            Selesai:
                                        </span>{" "}
                                        Perbaikan selesai
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RepairApprovalList;