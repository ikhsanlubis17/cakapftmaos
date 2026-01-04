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
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Review Laporan Perbaikan</h1>
                            <p className="text-gray-600 mt-1">
                                Review hasil perbaikan yang dilakukan oleh teknisi
                            </p>
                        </div>
                        <button
                            onClick={() => refetch()}
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            <ArrowPathIcon className="h-5 w-5 mr-2" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-6 mb-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Menunggu Review</p>
                            <p className="text-3xl font-bold">{reports.length}</p>
                        </div>
                        <WrenchScrewdriverIcon className="h-12 w-12 text-blue-200" />
                    </div>
                </div>

                {/* List */}
                {isLoading ? (
                    <div className="bg-white rounded-xl p-12 text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-4 text-gray-500">Memuat data...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center">
                        <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Semua Sudah Direview</h3>
                        <p className="text-gray-500 mt-2">Tidak ada laporan perbaikan yang menunggu review</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {reports.map((report) => {
                            const inspection = report.repair_approval?.inspection;
                            const apar = inspection?.apar;
                            
                            return (
                                <div
                                    key={report.id}
                                    className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-md transition"
                                >
                                    <div className="flex flex-col lg:flex-row gap-4">
                                        {/* Photos */}
                                        <div className="flex gap-4">
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500 mb-1">Sebelum</p>
                                                {report.before_photo_url ? (
                                                    <img
                                                        src={report.before_photo_url}
                                                        alt="Before"
                                                        className="w-24 h-24 object-cover rounded-lg border"
                                                    />
                                                ) : (
                                                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500 mb-1">Sesudah</p>
                                                {report.after_photo_url ? (
                                                    <img
                                                        src={report.after_photo_url}
                                                        alt="After"
                                                        className="w-24 h-24 object-cover rounded-lg border"
                                                    />
                                                ) : (
                                                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-gray-900">
                                                    {apar?.serial_number || "N/A"}
                                                </h3>
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {apar?.apar_type?.name || "N/A"}
                                                </span>
                                            </div>

                                            <div className="space-y-1 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="h-4 w-4" />
                                                    <span>Teknisi: {report.reporter?.name || "N/A"}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPinIcon className="h-4 w-4" />
                                                    <span>{apar?.location_name || "N/A"}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CalendarDaysIcon className="h-4 w-4" />
                                                    <span>Selesai: {formatDate(report.repair_completed_at)}</span>
                                                </div>
                                            </div>

                                            {report.repair_description && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-700">
                                                        <span className="font-medium">Deskripsi Perbaikan:</span>{" "}
                                                        {report.repair_description}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => setActionDialog({ isOpen: true, type: "approve", report })}
                                                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                            >
                                                <CheckCircleIcon className="h-5 w-5 mr-2" />
                                                Terima
                                            </button>
                                            <button
                                                onClick={() => setActionDialog({ isOpen: true, type: "rework", report })}
                                                className="inline-flex items-center justify-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                                            >
                                                <ArrowPathIcon className="h-5 w-5 mr-2" />
                                                Perbaikan Ulang
                                            </button>
                                            <button
                                                onClick={() => setActionDialog({ isOpen: true, type: "reject", report })}
                                                className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                            >
                                                <XCircleIcon className="h-5 w-5 mr-2" />
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

