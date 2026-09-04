import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import ActionDialog from "@/components/common/ActionDialog";
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    PhotoIcon,
    CalendarDaysIcon,
    WrenchScrewdriverIcon,
    UserIcon,
    MapPinIcon,
} from "@heroicons/react/24/outline";

const RepairReportReviewPage = () => {
    const navigate = useNavigate();
    const { apiClient } = useAuth();
    const { showSuccess, showError } = useToast();
    const queryClient = useQueryClient();

    const [selectedReport, setSelectedReport] = useState(null);
    const [actionDialog, setActionDialog] = useState({
        isOpen: false,
        type: "approve",
        report: null,
    });

    // Fetch pending repair reports
    const {
        data: reports = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["repair-reports", "pending-review"],
        queryFn: async () => {
            const res = await apiClient.get("/api/repair-reports/review/pending");
            return res.data?.data || [];
        },
        refetchOnWindowFocus: false,
        staleTime: 60000,
    });

    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: async ({ reportId, notes }) => {
            const res = await apiClient.post(`/api/repair-reports/${reportId}/approve`, { notes });
            return res.data;
        },
        onSuccess: (data) => {
            showSuccess(data.message || "Laporan perbaikan berhasil disetujui. APAR telah aktif kembali.");
            queryClient.invalidateQueries({ queryKey: ["repair-reports"] });
            setActionDialog({ isOpen: false, type: "approve", report: null });
        },
        onError: (error) => {
            showError(error.response?.data?.message || "Gagal menyetujui laporan perbaikan");
        },
    });

    // Rework mutation
    const reworkMutation = useMutation({
        mutationFn: async ({ reportId, notes, scheduleDate, scheduleTime }) => {
            const res = await apiClient.post(`/api/repair-reports/${reportId}/rework`, {
                notes,
                schedule_date: scheduleDate,
                schedule_time: scheduleTime,
            });
            return res.data;
        },
        onSuccess: (data) => {
            showSuccess(data.message || "Permintaan perbaikan ulang berhasil. Jadwal baru telah dibuat.");
            queryClient.invalidateQueries({ queryKey: ["repair-reports"] });
            setActionDialog({ isOpen: false, type: "rework", report: null });
        },
        onError: (error) => {
            showError(error.response?.data?.message || "Gagal meminta perbaikan ulang");
        },
    });

    // Reject mutation
    const rejectMutation = useMutation({
        mutationFn: async ({ reportId, notes }) => {
            const res = await apiClient.post(`/api/repair-reports/${reportId}/reject`, { notes });
            return res.data;
        },
        onSuccess: (data) => {
            showSuccess(data.message || "Laporan perbaikan ditolak. APAR ditandai tidak dapat diperbaiki.");
            queryClient.invalidateQueries({ queryKey: ["repair-reports"] });
            setActionDialog({ isOpen: false, type: "reject", report: null });
        },
        onError: (error) => {
            showError(error.response?.data?.message || "Gagal menolak laporan perbaikan");
        },
    });

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 pb-20">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Review Laporan Perbaikan</h1>
                        <p className="text-slate-500 text-xs mt-1">
                            Review hasil perbaikan yang dilakukan oleh teknisi
                        </p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-200 rounded-[6px] text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors shadow-sm self-start sm:self-auto"
                    >
                        <ArrowPathIcon className="h-4 w-4 mr-1.5 text-slate-500" />
                        Refresh
                    </button>
                </div>

                {/* Stats */}
                <div className="bg-[#041562] rounded-[6px] p-5 text-white border border-[#041562] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-300 text-xs uppercase font-bold tracking-wider mb-1">Menunggu Review</p>
                        <p className="text-3xl font-bold font-mono text-white">{reports.length}</p>
                    </div>
                    <div className="h-12 w-12 rounded-[6px] bg-white/10 flex items-center justify-center text-white">
                        <WrenchScrewdriverIcon className="h-6 w-6" />
                    </div>
                </div>

                {/* List */}
                {isLoading ? (
                    <div className="bg-white rounded-[6px] border border-slate-200 p-12 text-center shadow-sm">
                        <div className="animate-spin h-8 w-8 border-2 border-slate-200 border-t-[#11468F] rounded-full mx-auto"></div>
                        <p className="mt-3 text-xs text-slate-500 font-medium">Memuat data review...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white rounded-[6px] border border-slate-200 p-12 text-center shadow-sm">
                        <div className="h-12 w-12 rounded-[6px] bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                            <CheckCircleIcon className="h-7 w-7" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Semua Sudah Direview</h3>
                        <p className="text-slate-500 text-xs mt-1">Tidak ada laporan perbaikan yang menunggu review saat ini.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {reports.map((report) => {
                            const inspection = report.repair_approval?.inspection;
                            const apar = inspection?.apar;
                            
                            return (
                                <div
                                    key={report.id}
                                    className="bg-white rounded-[6px] border border-slate-200 p-4 sm:p-5 hover:border-slate-300 transition-colors shadow-sm"
                                >
                                    <div className="flex flex-col lg:flex-row gap-5">
                                        {/* Photos */}
                                        <div className="flex gap-3">
                                            <div className="text-center">
                                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sebelum</p>
                                                {report.before_photo_url ? (
                                                    <img
                                                        src={report.before_photo_url}
                                                        alt="Before"
                                                        className="w-24 h-24 object-cover rounded-[6px] border border-slate-200"
                                                    />
                                                ) : (
                                                    <div className="w-24 h-24 bg-slate-50 rounded-[6px] border border-slate-200 flex items-center justify-center">
                                                        <PhotoIcon className="h-7 w-7 text-slate-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sesudah</p>
                                                {report.after_photo_url ? (
                                                    <img
                                                        src={report.after_photo_url}
                                                        alt="After"
                                                        className="w-24 h-24 object-cover rounded-[6px] border border-slate-200"
                                                    />
                                                ) : (
                                                    <div className="w-24 h-24 bg-slate-50 rounded-[6px] border border-slate-200 flex items-center justify-center">
                                                        <PhotoIcon className="h-7 w-7 text-slate-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-bold text-slate-900 font-mono text-base">
                                                    {apar?.serial_number || "N/A"}
                                                </h3>
                                                <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                                    {apar?.apar_type?.name || "N/A"}
                                                </span>
                                            </div>

                                            <div className="space-y-1.5 text-xs text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="h-4 w-4 text-slate-400" />
                                                    <span>Teknisi: <strong className="text-slate-800">{report.reporter?.name || "N/A"}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPinIcon className="h-4 w-4 text-slate-400" />
                                                    <span>{apar?.location_name || "N/A"}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                                                    <span>Selesai: {formatDate(report.repair_completed_at)}</span>
                                                </div>
                                            </div>

                                            {report.repair_description && (
                                                <div className="mt-3 p-3 bg-slate-50 rounded-[6px] border border-slate-200">
                                                    <p className="text-xs text-slate-700 leading-relaxed">
                                                        <span className="font-bold text-slate-900">Deskripsi:</span>{" "}
                                                        {report.repair_description}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col justify-center gap-2 min-w-[170px]">
                                            <button
                                                onClick={() => setActionDialog({ isOpen: true, type: "approve", report })}
                                                className="inline-flex items-center justify-center px-3 py-2 bg-[#11468F] hover:bg-[#0d3873] text-white font-bold text-xs uppercase tracking-wider rounded-[6px] shadow-sm transition-colors"
                                            >
                                                <CheckCircleIcon className="h-4 w-4 mr-1.5 text-white" />
                                                Terima
                                            </button>
                                            <button
                                                onClick={() => setActionDialog({ isOpen: true, type: "rework", report })}
                                                className="inline-flex items-center justify-center px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs uppercase tracking-wider rounded-[6px] transition-colors"
                                            >
                                                <ArrowPathIcon className="h-4 w-4 mr-1.5 text-amber-700" />
                                                Perbaikan Ulang
                                            </button>
                                            <button
                                                onClick={() => setActionDialog({ isOpen: true, type: "reject", report })}
                                                className="inline-flex items-center justify-center px-3 py-2 bg-[#DA1212] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-[6px] transition-colors"
                                            >
                                                <XCircleIcon className="h-4 w-4 mr-1.5 text-white" />
                                                Tidak Dapat Diperbaiki
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Approve Dialog */}
            <ActionDialog
                isOpen={actionDialog.isOpen && actionDialog.type === "approve"}
                onClose={() => setActionDialog({ isOpen: false, type: "approve", report: null })}
                title="Terima Laporan Perbaikan"
                type="approve"
                message="Apakah Anda yakin ingin menerima laporan perbaikan ini? APAR akan kembali aktif."
                onConfirm={(formData) => {
                    approveMutation.mutate({
                        reportId: actionDialog.report?.id,
                        notes: formData.notes,
                    });
                }}
                isLoading={approveMutation.isPending}
            />

            {/* Rework Dialog */}
            <ActionDialog
                isOpen={actionDialog.isOpen && actionDialog.type === "rework"}
                onClose={() => setActionDialog({ isOpen: false, type: "rework", report: null })}
                title="Minta Perbaikan Ulang"
                type="rework"
                message="Teknisi yang sama akan ditugaskan untuk melakukan perbaikan ulang."
                onConfirm={(formData) => {
                    reworkMutation.mutate({
                        reportId: actionDialog.report?.id,
                        notes: formData.notes,
                        scheduleDate: formData.schedule_date,
                        scheduleTime: formData.schedule_time,
                    });
                }}
                isLoading={reworkMutation.isPending}
                requireNotes={true}
                requireSchedule={true}
                notesLabel="Catatan Perbaikan Ulang"
                notesPlaceholder="Jelaskan apa yang perlu diperbaiki lagi..."
            />

            {/* Reject Dialog */}
            <ActionDialog
                isOpen={actionDialog.isOpen && actionDialog.type === "reject"}
                onClose={() => setActionDialog({ isOpen: false, type: "reject", report: null })}
                title="APAR Tidak Dapat Diperbaiki"
                type="reject"
                message="APAR akan ditandai sebagai tidak dapat diperbaiki (not fixable) dan dinonaktifkan."
                onConfirm={(formData) => {
                    rejectMutation.mutate({
                        reportId: actionDialog.report?.id,
                        notes: formData.notes,
                    });
                }}
                isLoading={rejectMutation.isPending}
                requireNotes={true}
                notesLabel="Alasan"
                notesPlaceholder="Jelaskan mengapa APAR tidak dapat diperbaiki..."
            />
        </div>
    );
};

export default RepairReportReviewPage;

