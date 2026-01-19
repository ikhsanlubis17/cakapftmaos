import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    MapPinIcon,
    UserIcon,
    ArrowPathIcon,
    PhotoIcon,
    CalendarDaysIcon,
    EyeIcon,
    ClockIcon,
    FunnelIcon
} from "@heroicons/react/24/outline";
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import ActionDialog from '../../../components/common/ActionDialog';
import ApprovalTimeline from '../../../components/common/ApprovalTimeline';

const InspectionReviewPage = () => {
    const navigate = useNavigate();
    const { apiClient, user } = useAuth();
    const { showSuccess, showError } = useToast();
    const queryClient = useQueryClient();

    const [filterStatus, setFilterStatus] = useState('all');
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

    // Determine pending count based on user role
    const pendingCount = inspections.filter(i => {
        if (user?.role === 'checker') return i.inspection_status === 'pending_checker';
        return ['approved_by_checker', 'pending_review'].includes(i.inspection_status);
    }).length;

    const filteredInspections = inspections.filter(inspection => {
        if (filterStatus === 'all') return true;
        return inspection.inspection_status === filterStatus;
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
            showSuccess(data.message || "Inspeksi ditolak");
            queryClient.invalidateQueries({ queryKey: ["inspections"] });
            setActionDialog({ isOpen: false, type: "reject", inspection: null });
        },
        onError: (error) => {
            showError(error.response?.data?.message || "Gagal menolak inspeksi");
        },
    });

    // Fetch teknisi list for assignment (optimistic loading)
    const { data: teknisiList = [] } = useQuery({
        queryKey: ["users", "teknisi", "active"],
        queryFn: async () => {
            if (user?.role === 'checker') return [];
            const res = await apiClient.get("/api/users?role=teknisi&is_active=true");
            return res.data || [];
        },
        staleTime: 1000 * 60 * 5,
        enabled: user?.role !== 'checker'
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

    const getStatusBadge = (status) => {
        const configs = {
            pending_checker: { label: "Menunggu Checker", classes: "bg-blue-100 text-blue-700 border-blue-200" },
            approved_by_checker: { label: "Disetujui Checker", classes: "bg-purple-100 text-purple-700 border-purple-200" },
            rejected_by_checker: { label: "Ditolak Checker", classes: "bg-red-100 text-red-700 border-red-200" },
            pending_review: { label: "Menunggu Supervisor", classes: "bg-amber-100 text-amber-700 border-amber-200" },
        };
        const config = configs[status] || { label: status, classes: "bg-gray-100 text-gray-700 border-gray-200" };
        
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.classes}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Review Inspeksi</h1>
                        <p className="text-gray-500 mt-1">
                            Kelola persetujuan hasil inspeksi APAR
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Menunggu Tindakan Anda</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{pendingCount}</p>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-amber-600">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            <span>Perlu segera direview</span>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Antrian</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{inspections.length}</p>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-blue-600">
                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                            <span>Total data masuk</span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-md p-6 text-white flex flex-col justify-between relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-blue-100 text-sm font-medium">Beban Kerja</p>
                            <p className="text-3xl font-bold mt-2">
                                {inspections.length > 0 ? "Normal" : "Kosong"}
                            </p>
                        </div>
                        <button 
                            onClick={() => refetch()}
                            className="mt-4 relative z-10 flex items-center text-sm bg-white/20 hover:bg-white/30 w-fit px-3 py-1.5 rounded-lg transition"
                        >
                            <ArrowPathIcon className="h-4 w-4 mr-2" />
                            Refresh Data
                        </button>
                        {/* Decor */}
                        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                            <CheckCircleIcon className="h-32 w-32" />
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <FunnelIcon className="h-5 w-5 text-gray-400" />
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="block w-full sm:w-48 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending_checker">Menunggu Checker</option>
                                <option value="approved_by_checker">Disetujui Checker</option>
                                <option value="pending_review">Menunggu Supervisor</option>
                            </select>
                        </div>
                        <span className="text-sm text-gray-500">
                            Menampilkan {filteredInspections.length} inspeksi
                        </span>
                    </div>

                    {/* List */}
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="mt-4 text-gray-500">Memuat data inspeksi...</p>
                        </div>
                    ) : filteredInspections.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircleIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Tidak ada data</h3>
                            <p className="text-gray-500 mt-1">Semua inspeksi telah direview atau tidak ada data baru.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredInspections.map((inspection) => (
                                <div 
                                    key={inspection.id} 
                                    className="p-6 hover:bg-gray-50 transition-colors group cursor-pointer"
                                    onClick={() => navigate({ to: `/inspections/${inspection.id}` })}
                                >
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        {/* Thumbnail */}
                                        <div className="w-full lg:w-32 flex-shrink-0">
                                            {inspection.photo_url ? (
                                                <div className="aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-100 relative group-hover:shadow transition">
                                                    <img 
                                                        src={inspection.photo_url} 
                                                        alt="APAR" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {inspection.requires_repair && (
                                                        <div className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-sm">
                                                            <ExclamationTriangleIcon className="h-3 w-3" />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="aspect-[4/3] rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-400">
                                                    <PhotoIcon className="h-8 w-8" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                                                            {inspection.apar?.serial_number || "NO SERIAL"}
                                                        </h3>
                                                        {getStatusBadge(inspection.inspection_status)}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                                        <div className="flex items-center">
                                                            <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                                                            {inspection.apar?.location_name || "-"}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                                                            {inspection.user?.name}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <CalendarDaysIcon className="h-4 w-4 mr-1 text-gray-400" />
                                                            {formatDate(inspection.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {inspection.requires_repair ? (
                                                <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3 inline-block">
                                                    <p className="text-sm font-medium text-red-800 flex items-center">
                                                        <ExclamationTriangleIcon className="h-4 w-4 mr-1.5" />
                                                        {inspection.inspection_damages?.length || 0} Kerusakan Dilaporkan
                                                    </p>
                                                    <div className="mt-1 flex gap-2">
                                                        {inspection.inspection_damages?.slice(0, 3).map((d, idx) => (
                                                            <span key={idx} className="text-xs bg-white bg-opacity-60 px-2 py-0.5 rounded text-red-700 border border-red-100">
                                                                {d.damage_category?.name}
                                                            </span>
                                                        ))}
                                                        {(inspection.inspection_damages?.length || 0) > 3 && (
                                                            <span className="text-xs text-red-600 pt-0.5">+{inspection.inspection_damages.length - 3} lainnya</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-lg bg-green-50 border border-green-100 text-green-700 text-sm">
                                                    <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                                                    Kondisi Baik
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 justify-center lg:w-48 lg:border-l lg:border-gray-100 lg:pl-6">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate({ to: `/inspections/${inspection.id}` });
                                                }}
                                                className="w-full inline-flex items-center justify-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                                            >
                                                <EyeIcon className="h-4 w-4 mr-2" />
                                                Lihat Detail
                                            </button>
                                            
                                            {/* Only show quick actions if appropriate status */}
                                            {((user?.role === 'checker' && inspection.inspection_status === 'pending_checker') || 
                                              (user?.role !== 'checker' && ['approved_by_checker', 'pending_review'].includes(inspection.inspection_status))) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleApprove(inspection);
                                                    }}
                                                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow-sm"
                                                >
                                                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                                                    Setujui
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

            {/* Action Dialogs */}
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
