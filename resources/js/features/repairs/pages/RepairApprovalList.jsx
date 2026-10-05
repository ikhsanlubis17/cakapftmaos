import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import RepairActionModal from "../components/RepairActionModal";
import RepairApprovalCard from "../components/RepairApprovalCard";
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
    CalendarIcon,
    DocumentTextIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    ArrowsPointingOutIcon,
    CameraIcon,
    WrenchScrewdriverIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const RepairApprovalList = () => {
    const [filter, setFilter] = useState("all");
    const [severityFilter, setSeverityFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Lightbox modal state for instant photo inspection
    const [lightboxPhoto, setLightboxPhoto] = useState(null);

    const [actionModal, setActionModal] = useState({
        isOpen: false,
        type: 'approve',
        approval: null,
    });

    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { apiClient } = useAuth();
    const queryClient = useQueryClient();

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
        setIsInitialized(true);

        const intervalId = setInterval(() => {
            refetchApprovals();
            refetchStats();
        }, AUTO_REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (approvalsData && approvalsData.length) {
            setLastUpdate(new Date());
        }
    }, [approvalsData]);

    const handleManualRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        await refetchApprovals();
        await refetchStats();
        showSuccess("Data persetujuan berhasil diperbarui");
        setRefreshing(false);
    };

    const approveMutation = useMutation({
        mutationFn: ({ id, notes, assignedTeknisiId, scheduleDate, scheduleTime }) =>
            apiClient.post(`/api/repair-approvals/${id}/approve`, {
                supervisor_notes: notes,
                assigned_teknisi_id: assignedTeknisiId,
                schedule_date: scheduleDate,
                schedule_time: scheduleTime,
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
                        ? { ...item, status: "approved", admin_notes: notes, supervisor_notes: notes }
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
        onSuccess: (_data, { approval }) => {
            queryClient.invalidateQueries({
                queryKey: ["repair-approvals"],
            });
            queryClient.invalidateQueries({
                queryKey: ["repair-approvals-stats"],
            });
            showSuccess(
                `Persetujuan berhasil disetujui dan teknisi telah ditugaskan`
            );
            setActionModal({ isOpen: false, type: 'approve', approval: null });
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["repair-approvals", filter],
            });
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, notes, rejectionReason }) =>
            apiClient.post(`/api/repair-approvals/${id}/reject`, {
                supervisor_notes: notes,
                rejection_reason: rejectionReason,
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
        onSuccess: (_data, { approval }) => {
            queryClient.invalidateQueries({
                queryKey: ["repair-approvals"],
            });
            queryClient.invalidateQueries({
                queryKey: ["repair-approvals-stats"],
            });
            showSuccess(
                `Permintaan perbaikan berhasil ditolak`
            );
            setActionModal({ isOpen: false, type: 'reject', approval: null });
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["repair-approvals", filter],
            });
        },
    });

    const openApproveDialog = (approval) => {
        setActionModal({
            isOpen: true,
            type: 'approve',
            approval,
        });
    };

    const openRejectDialog = (approval) => {
        setActionModal({
            isOpen: true,
            type: 'reject',
            approval,
        });
    };

    const handleActionConfirm = async (formData) => {
        const { type, approval } = actionModal;
        if (!approval) return;

        if (type === 'approve') {
            return await approveMutation.mutateAsync({
                id: approval.id,
                notes: formData.notes,
                assignedTeknisiId: formData.assignedTeknisiId,
                scheduleDate: formData.scheduleDate,
                scheduleTime: formData.scheduleTime,
                approval,
            });
        } else {
            return await rejectMutation.mutateAsync({
                id: approval.id,
                notes: formData.notes,
                rejectionReason: formData.rejectionReason,
                approval,
            });
        }
    };

    // Filter and search computation
    const filteredApprovals = useMemo(() => {
        return approvalsData.filter((approval) => {
            // Severity filter
            if (severityFilter !== "all") {
                const hasSeverity = approval.inspection?.inspectionDamages?.some(
                    (d) => (d.severity || "").toLowerCase() === severityFilter.toLowerCase()
                );
                if (!hasSeverity) return false;
            }

            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const serial = approval.inspection?.apar?.serial_number?.toLowerCase() || "";
                const location = approval.inspection?.apar?.location_name?.toLowerCase() || "";
                const technician = approval.inspection?.user?.name?.toLowerCase() || "";
                const notes = approval.inspection?.notes?.toLowerCase() || "";
                const damageNames = approval.inspection?.inspectionDamages?.map(
                    (d) => d.damageCategory?.name?.toLowerCase() || ""
                ).join(" ") || "";

                const matches =
                    serial.includes(q) ||
                    location.includes(q) ||
                    technician.includes(q) ||
                    notes.includes(q) ||
                    damageNames.includes(q);

                if (!matches) return false;
            }

            return true;
        });
    }, [approvalsData, severityFilter, searchQuery]);

    const isFilterActive = filter !== "all" || severityFilter !== "all" || searchQuery.trim() !== "";

    const resetFilters = () => {
        setFilter("all");
        setSeverityFilter("all");
        setSearchQuery("");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center p-8 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#11468F] border-t-transparent mx-auto mb-4"></div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Memuat Data Persetujuan...</h4>
                    <p className="text-xs text-slate-500">
                        Menghubungkan ke basis data operasional Fuel Terminal Maos
                    </p>
                </div>
            </div>
        );
    }

    if (approvalsError) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
                    <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <ExclamationTriangleIcon className="h-7 w-7 text-[#DA1212]" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1.5">
                        Terjadi Kesalahan Memuat Data
                    </h3>
                    <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                        {approvalsError?.message || "Gagal memuat permohonan persetujuan perbaikan APAR"}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={refetchApprovals}
                            className="px-5 py-2.5 bg-[#11468F] hover:bg-[#0d3873] text-white text-xs font-bold uppercase tracking-wider rounded-[6px] shadow-sm transition-colors"
                        >
                            Coba Lagi
                        </button>
                        <button
                            onClick={() => navigate({ to: "/" })}
                            className="px-5 py-2.5 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider rounded-[6px] transition-colors"
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
            {/* Header Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-[#041562] text-white flex items-center justify-center font-black text-xl shadow-xs flex-shrink-0">
                        <FireIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded">
                                PT Pertamina Patra Niaga • FT Maos
                            </span>
                        </div>
                        <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                            Persetujuan Perbaikan APAR
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Disposisi, penugasan teknisi, dan penjadwalan perbaikan tabung APAR lapangan
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => navigate({ to: "/repair-reports/review" })}
                        className="h-10 px-3.5 text-xs font-bold uppercase tracking-wider text-white bg-[#041562] hover:bg-[#11468F] rounded-lg transition-all shadow-2xs flex items-center gap-1.5 active:scale-[0.98]"
                        title="Buka daftar laporan perbaikan yang telah dikerjakan teknisi"
                    >
                        <WrenchScrewdriverIcon className="h-4 w-4 text-emerald-400" />
                        <span>Tinjau Laporan Perbaikan</span>
                    </button>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-800">
                            {isFetchingApprovals ? "Menyinkronkan..." : "Sinkron (10s)"}
                        </span>
                    </div>
                    <button
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                        className="h-10 px-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition-all shadow-2xs flex items-center gap-1.5 active:scale-[0.98]"
                        title="Perbarui data sekarang"
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

            {/* Interactive Metric Cards (Click to Filter) */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Status Disposisi (Klik kartu untuk menyaring langsung)
                    </p>
                    {filter !== "all" && (
                        <button
                            onClick={() => setFilter("all")}
                            className="text-xs font-bold text-[#11468F] hover:underline"
                        >
                            Tampilkan Semua
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                    {/* Card 1: Menunggu */}
                    <button
                        onClick={() => setFilter(filter === "pending" ? "all" : "pending")}
                        className={`text-left rounded-lg p-3.5 sm:p-5 border transition-all cursor-pointer relative overflow-hidden group shadow-xs active:scale-[0.98] ${
                            filter === "pending"
                                ? "bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/50 shadow-sm"
                                : "bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm"
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600">
                                        Menunggu
                                    </p>
                                </div>
                                <p className="text-2xl sm:text-3xl font-mono font-black text-slate-900 tracking-tight">
                                    {statsData.pending || 0}
                                </p>
                            </div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                                <ClockIcon className="h-4 sm:h-5 w-4 sm:w-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="mt-2 sm:mt-3 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
                            <span className="truncate">Perlu tindakan</span>
                            {filter === "pending" && (
                                <span className="font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded text-[10px]">
                                    Aktif
                                </span>
                            )}
                        </div>
                        {filter === "pending" && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
                        )}
                    </button>

                    {/* Card 2: Disetujui */}
                    <button
                        onClick={() => setFilter(filter === "approved" ? "all" : "approved")}
                        className={`text-left rounded-lg p-3.5 sm:p-5 border transition-all cursor-pointer relative overflow-hidden group shadow-xs active:scale-[0.98] ${
                            filter === "approved"
                                ? "bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-400/50 shadow-sm"
                                : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm"
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600">
                                        Disetujui
                                    </p>
                                </div>
                                <p className="text-2xl sm:text-3xl font-mono font-black text-slate-900 tracking-tight">
                                    {statsData.approved || 0}
                                </p>
                            </div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                                <CheckCircleIcon className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600" />
                            </div>
                        </div>
                        <div className="mt-2 sm:mt-3 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
                            <span className="truncate">Jadwal teknisi</span>
                            {filter === "approved" && (
                                <span className="font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded text-[10px]">
                                    Aktif
                                </span>
                            )}
                        </div>
                        {filter === "approved" && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
                        )}
                    </button>

                    {/* Card 3: Ditolak */}
                    <button
                        onClick={() => setFilter(filter === "rejected" ? "all" : "rejected")}
                        className={`text-left rounded-lg p-3.5 sm:p-5 border transition-all cursor-pointer relative overflow-hidden group shadow-xs active:scale-[0.98] ${
                            filter === "rejected"
                                ? "bg-rose-50/60 border-rose-400 ring-2 ring-rose-400/50 shadow-sm"
                                : "bg-white border-slate-200 hover:border-rose-300 hover:shadow-sm"
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-[#DA1212]" />
                                    <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600">
                                        Ditolak
                                    </p>
                                </div>
                                <p className="text-2xl sm:text-3xl font-mono font-black text-slate-900 tracking-tight">
                                    {statsData.rejected || 0}
                                </p>
                            </div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                                <XCircleIcon className="h-4 sm:h-5 w-4 sm:w-5 text-[#DA1212]" />
                            </div>
                        </div>
                        <div className="mt-2 sm:mt-3 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
                            <span className="truncate">Dibatalkan</span>
                            {filter === "rejected" && (
                                <span className="font-bold text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded text-[10px]">
                                    Aktif
                                </span>
                            )}
                        </div>
                        {filter === "rejected" && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#DA1212]" />
                        )}
                    </button>

                    {/* Card 4: Selesai */}
                    <button
                        onClick={() => setFilter(filter === "completed" ? "all" : "completed")}
                        className={`text-left rounded-lg p-3.5 sm:p-5 border transition-all cursor-pointer relative overflow-hidden group shadow-xs active:scale-[0.98] ${
                            filter === "completed"
                                ? "bg-blue-50/60 border-blue-400 ring-2 ring-blue-400/50 shadow-sm"
                                : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600">
                                        Selesai
                                    </p>
                                </div>
                                <p className="text-2xl sm:text-3xl font-mono font-black text-slate-900 tracking-tight">
                                    {statsData.completed || 0}
                                </p>
                            </div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                                <ShieldCheckIcon className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-2 sm:mt-3 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
                            <span className="truncate">Siap operasi</span>
                            {filter === "completed" && (
                                <span className="font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded text-[10px]">
                                    Aktif
                                </span>
                            )}
                        </div>
                        {filter === "completed" && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
                        )}
                    </button>
                </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="bg-white rounded-lg border border-slate-200 p-3.5 sm:p-4 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center gap-2.5 sm:gap-3">
                    {/* Instant Search Bar */}
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nomor seri APAR, lokasi, nama teknisi..."
                            className="w-full pl-9 pr-9 h-11 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Controls */}
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                        {/* Status Select */}
                        <div className="flex items-center gap-1.5 col-span-1">
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg h-11 px-3 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#11468F]"
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending">Menunggu (Pending)</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                                <option value="completed">Selesai</option>
                            </select>
                        </div>

                        {/* Severity Select */}
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg h-11 px-3 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#11468F]"
                        >
                            <option value="all">Semua Severity</option>
                            <option value="critical">Kritis (Critical)</option>
                            <option value="high">Tinggi (High)</option>
                            <option value="medium">Sedang (Medium)</option>
                            <option value="low">Rendah (Low)</option>
                        </select>

                        {/* Reset Filter Button */}
                        {isFilterActive && (
                            <button
                                onClick={resetFilters}
                                className="col-span-2 sm:col-span-1 h-11 px-3.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center justify-center gap-1 active:scale-[0.98]"
                            >
                                <XMarkIcon className="h-4 w-4" />
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Meta Info Bar */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div>
                        Menampilkan <span className="font-bold text-slate-900">{filteredApprovals.length}</span> dari{" "}
                        <span className="font-bold text-slate-900">{approvalsData.length}</span> permohonan
                        {searchQuery && (
                            <span className="ml-1 text-slate-600">
                                untuk kata kunci &ldquo;<span className="font-semibold text-slate-900">{searchQuery}</span>&rdquo;
                            </span>
                        )}
                    </div>
                    {lastUpdate && (
                        <div className="hidden sm:block text-slate-400">
                            Sinkronisasi: {lastUpdate.toLocaleTimeString("id-ID")}
                        </div>
                    )}
                </div>
            </div>

            {/* Approvals List */}
            <div className="space-y-3">
                {filteredApprovals.length > 0 ? (
                    filteredApprovals.map((approval) => (
                        <RepairApprovalCard
                            key={approval.id}
                            approval={approval}
                            onOpenLightbox={setLightboxPhoto}
                            onOpenApprove={openApproveDialog}
                            onOpenReject={openRejectDialog}
                            onNavigate={(to) => navigate({ to })}
                        />
                    ))
                ) : (
                    /* Empty State */
                    <div className="text-center py-16 px-6 bg-white rounded-lg border border-slate-200 shadow-xs">
                        <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3 text-slate-400">
                            <FireIcon className="h-7 w-7 text-slate-400" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">
                            Tidak Ada Permohonan Ditemukan
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                            {isFilterActive
                                ? "Tidak ada permohonan perbaikan yang cocok dengan kriteria pencarian atau filter yang aktif."
                                : "Saat ini tidak ada permohonan perbaikan APAR yang tercatat di sistem."}
                        </p>
                        {isFilterActive && (
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 bg-[#11468F] hover:bg-[#0d3873] text-white text-xs font-bold uppercase tracking-wider rounded-[6px] shadow-xs transition-colors"
                            >
                                Reset Semua Filter
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Quick Guide Footer Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 shadow-2xs">
                <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-[6px] bg-[#041562] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        💡
                    </div>
                    <div className="flex-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                            Panduan Disposisi Perbaikan APAR:
                        </h4>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-600">
                            <div className="bg-white p-2.5 rounded-[4px] border border-slate-200">
                                <span className="font-bold text-amber-700 block mb-0.5">1. Menunggu:</span>
                                Permohonan baru dari hasil inspeksi lapangan. Perlu verifikasi dan penunjukan teknisi.
                            </div>
                            <div className="bg-white p-2.5 rounded-[4px] border border-slate-200">
                                <span className="font-bold text-emerald-700 block mb-0.5">2. Disetujui:</span>
                                Jadwal dan teknisi telah ditetapkan. Teknisi dapat segera melakukan perbaikan fisik.
                            </div>
                            <div className="bg-white p-2.5 rounded-[4px] border border-slate-200">
                                <span className="font-bold text-rose-700 block mb-0.5">3. Ditolak:</span>
                                Permohonan ditolak karena data tidak valid atau perlu inspeksi ulang darurat.
                            </div>
                            <div className="bg-white p-2.5 rounded-[4px] border border-slate-200">
                                <span className="font-bold text-blue-700 block mb-0.5">4. Selesai:</span>
                                Teknisi telah menyelesaikan perbaikan fisik dan diverifikasi siap operasional.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox Modal for Instant Photo Inspection */}
            {lightboxPhoto && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4"
                    onClick={() => setLightboxPhoto(null)}
                >
                    <div
                        className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">
                                    {lightboxPhoto.title}
                                </h4>
                                {lightboxPhoto.serial && (
                                    <p className="text-xs font-mono font-bold text-[#11468F]">
                                        APAR: {lightboxPhoto.serial}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setLightboxPhoto(null)}
                                className="p-1.5 rounded-[6px] hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-hidden">
                            <img
                                src={lightboxPhoto.url}
                                alt="Foto inspeksi"
                                className="max-w-full max-h-[70vh] object-contain rounded-[4px]"
                            />
                        </div>
                        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                            <button
                                onClick={() => setLightboxPhoto(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-[6px]"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Repair Action Modal */}
            <RepairActionModal
                isOpen={actionModal.isOpen}
                onClose={() => setActionModal({ ...actionModal, isOpen: false })}
                actionType={actionModal.type}
                approval={actionModal.approval}
                onConfirm={handleActionConfirm}
                isSubmitting={approveMutation.isPending || rejectMutation.isPending}
            />
        </div>
    );
};

export default RepairApprovalList;