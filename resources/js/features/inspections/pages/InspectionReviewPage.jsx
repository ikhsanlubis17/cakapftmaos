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
    MapPinIcon,
    UserIcon,
    ArrowPathIcon,
    PhotoIcon,
    CalendarDaysIcon,
} from "@heroicons/react/24/outline";

const InspectionReviewPage = () => {
    const navigate = useNavigate();
    const { apiClient, user } = useAuth();
    const { showSuccess, showError } = useToast();
    const queryClient = useQueryClient();

    const [selectedInspection, setSelectedInspection] = useState(null);
    const [actionDialog, setActionDialog] = useState({
        isOpen: false,
        type: "approve",
        inspection: null,
    });

    // Fetch pending inspections
    const {
        data: inspections = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["inspections", "pending-review"],
        queryFn: async () => {
            const res = await apiClient.get("/api/inspections/review/pending");
            return res.data?.data || [];
        },
        refetchOnWindowFocus: false,
        staleTime: 60000,
    });

    // Fetch teknisi list for assignment
    const { data: teknisiList = [] } = useQuery({
        queryKey: ["users", "teknisi", "active"],
        queryFn: async () => {
            const res = await apiClient.get("/api/users?role=teknisi&is_active=true");
            return res.data || [];
        },
        staleTime: 1000 * 60 * 5,
    });

    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: async ({ inspectionId, notes, assignedTeknisiId, scheduleDate, scheduleTime }) => {
            const payload = { notes };
            if (assignedTeknisiId) {
                payload.assigned_teknisi_id = assignedTeknisiId;
                payload.schedule_date = scheduleDate;
                payload.schedule_time = scheduleTime;
            }
            const res = await apiClient.post(`/api/inspections/${inspectionId}/approve`, payload);
            return res.data;
        },
        onSuccess: (data) => {
            showSuccess(data.message || "Inspeksi berhasil disetujui");
            queryClient.invalidateQueries({ queryKey: ["inspections"] });
            setActionDialog({ isOpen: false, type: "approve", inspection: null });
        },
        onError: (error) => {
            showError(error.response?.data?.message || "Gagal menyetujui inspeksi");
        },
    });

    // Reject mutation
    const rejectMutation = useMutation({
        mutationFn: async ({ inspectionId, notes }) => {
            const res = await apiClient.post(`/api/inspections/${inspectionId}/reject`, { notes });
            return res.data;
        },
        onSuccess: (data) => {
            showSuccess(data.message || "Inspeksi ditolak. Jadwal inspeksi ulang telah dibuat.");
            queryClient.invalidateQueries({ queryKey: ["inspections"] });
            setActionDialog({ isOpen: false, type: "reject", inspection: null });
        },
        onError: (error) => {
            showError(error.response?.data?.message || "Gagal menolak inspeksi");
        },
    });

    const handleApprove = (inspection) => {
        setActionDialog({
            isOpen: true,
            type: "approve",
            inspection,
        });
    };

    const handleReject = (inspection) => {
        setActionDialog({
            isOpen: true,
            type: "reject",
            inspection,
        });
    };

    const getConditionBadge = (condition) => {
        const conditions = {
            good: { label: "Baik", className: "bg-emerald-50 text-emerald-800 border border-emerald-200" },
            needs_refill: { label: "Perlu Isi Ulang", className: "bg-amber-50 text-amber-800 border border-amber-200" },
            expired: { label: "Kadaluarsa", className: "bg-orange-50 text-orange-800 border border-orange-200" },
            damaged: { label: "Rusak", className: "bg-red-50 text-red-800 border border-red-200" },
        };
        const config = conditions[condition] || { label: condition, className: "bg-slate-100 text-slate-800 border border-slate-200" };
        return (
            <span className={`px-2.5 py-0.5 rounded-[3px] text-xs font-semibold ${config.className}`}>
                {config.label}
            </span>
        );
    };

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
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Review Inspeksi</h1>
                            <p className="text-slate-600 mt-1">
                                Review hasil inspeksi yang dilakukan oleh teknisi
                            </p>
                        </div>
                        <button
                            onClick={() => refetch()}
                            className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-[6px] text-slate-700 hover:bg-slate-50 transition shadow-sm font-medium"
                        >
                            <ArrowPathIcon className="h-5 w-5 mr-2 text-slate-500" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-[#041562] border-l-4 border-[#11468F] rounded-[6px] p-6 mb-6 text-white shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-300 text-sm font-medium">Menunggu Review</p>
                            <p className="text-3xl font-bold text-white mt-1">{inspections.length}</p>
                        </div>
                        <ClockIcon className="h-12 w-12 text-blue-200" />
                    </div>
                </div>

                {/* List */}
                {isLoading ? (
                    <div className="bg-white rounded-[6px] border border-slate-200 p-12 text-center shadow-sm">
                        <div className="animate-spin h-8 w-8 border-4 border-[#11468F] border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-4 text-slate-600 font-medium">Memuat data...</p>
                    </div>
                ) : inspections.length === 0 ? (
                    <div className="bg-white rounded-[6px] border border-slate-200 p-12 text-center shadow-sm">
                        <CheckCircleIcon className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">Semua Sudah Direview</h3>
                        <p className="text-slate-500 mt-2">Tidak ada inspeksi yang menunggu review</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {inspections.map((inspection) => (
                            <div
                                key={inspection.id}
                                className="bg-white rounded-[6px] border border-slate-200 p-4 sm:p-6 hover:shadow-md transition shadow-sm"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    {/* Left: Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            {/* Photo thumbnail */}
                                            {inspection.photo_url ? (
                                                <img
                                                    src={inspection.photo_url}
                                                    alt="APAR"
                                                    className="w-20 h-20 object-cover rounded-[6px] border border-slate-200 shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 bg-slate-100 rounded-[6px] flex items-center justify-center text-slate-400">
                                                    <PhotoIcon className="h-8 w-8" />
                                                </div>
                                            )}
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-bold text-slate-900">
                                                        {inspection.apar?.serial_number || "N/A"}
                                                    </h3>
                                                    {getConditionBadge(inspection.condition)}
                                                </div>
                                                
                                                <div className="space-y-1 text-sm text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="h-4 w-4 text-slate-400" />
                                                        <span>Teknisi: {inspection.user?.name || "N/A"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPinIcon className="h-4 w-4 text-slate-400" />
                                                        <span>{inspection.apar?.location_name || "N/A"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                                                        <span>{formatDate(inspection.created_at)}</span>
                                                    </div>
                                                </div>

                                                {inspection.notes && (
                                                    <p className="mt-2 text-sm text-slate-500 italic bg-slate-50 p-2 rounded-[3px] border border-slate-200">
                                                        "{inspection.notes}"
                                                    </p>
                                                )}

                                                {/* Damage info */}
                                                {inspection.requires_repair && (
                                                    <div className="mt-2 flex items-center gap-2 text-[#DA1212]">
                                                        <ExclamationTriangleIcon className="h-4 w-4" />
                                                        <span className="text-sm font-bold">
                                                            {inspection.inspection_damages?.length || 0} kerusakan ditemukan
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button
                                            onClick={() => navigate({ to: `/inspections/${inspection.id}` })}
                                            className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-[6px] hover:bg-slate-50 transition font-medium shadow-sm"
                                        >
                                            <EyeIcon className="h-5 w-5 mr-2 text-slate-500" />
                                            Detail
                                        </button>
                                        <button
                                            onClick={() => handleApprove(inspection)}
                                            className="inline-flex items-center justify-center px-4 py-2 bg-[#11468F] hover:bg-[#0d3873] text-white font-semibold rounded-[6px] transition shadow-sm"
                                        >
                                            <CheckCircleIcon className="h-5 w-5 mr-2 text-white" />
                                            Setujui
                                        </button>
                                        <button
                                            onClick={() => handleReject(inspection)}
                                            className="inline-flex items-center justify-center px-4 py-2 bg-white border border-rose-200 text-[#DA1212] hover:bg-rose-50 rounded-[6px] transition font-bold shadow-sm"
                                        >
                                            <XCircleIcon className="h-5 w-5 mr-2 text-[#DA1212]" />
                                            Tolak
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Approve Dialog */}
            <ActionDialog
                isOpen={actionDialog.isOpen && actionDialog.type === "approve"}
                onClose={() => setActionDialog({ isOpen: false, type: "approve", inspection: null })}
                title="Setujui Inspeksi"
                type="approve"
                onConfirm={(formData) => {
                    approveMutation.mutate({
                        inspectionId: actionDialog.inspection?.id,
                        notes: formData.notes,
                        assignedTeknisiId: formData.assigned_teknisi_id,
                        scheduleDate: formData.schedule_date,
                        scheduleTime: formData.schedule_time,
                    });
                }}
                isLoading={approveMutation.isPending}
                requiresRepair={actionDialog.inspection?.requires_repair}
                teknisiList={teknisiList}
            />

            {/* Reject Dialog */}
            <ActionDialog
                isOpen={actionDialog.isOpen && actionDialog.type === "reject"}
                onClose={() => setActionDialog({ isOpen: false, type: "reject", inspection: null })}
                title="Tolak Inspeksi"
                type="reject"
                onConfirm={(formData) => {
                    rejectMutation.mutate({
                        inspectionId: actionDialog.inspection?.id,
                        notes: formData.notes,
                    });
                }}
                isLoading={rejectMutation.isPending}
                requireNotes={true}
                notesLabel="Alasan Penolakan"
                notesPlaceholder="Jelaskan alasan mengapa inspeksi ini ditolak..."
            />
        </div>
    );
};

export default InspectionReviewPage;

