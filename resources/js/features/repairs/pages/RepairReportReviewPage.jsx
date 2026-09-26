import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import ActionDialog from "@/components/common/ActionDialog";
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    PhotoIcon,
    CalendarDaysIcon,
    WrenchScrewdriverIcon,
    UserIcon,
    MapPinIcon,
    ArrowLeftIcon,
    XMarkIcon,
    ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";
import { formatStorageUrl } from "@/utils/imageUrl";
import { formatDateTime as formatDate } from "@/utils/dateUtils";

const RepairReportReviewPage = () => {
    const navigate = useNavigate();
    const { apiClient } = useAuth();
    const { showSuccess, showError } = useToast();
    const queryClient = useQueryClient();

    // Lightbox modal state for full-screen photo viewing
    const [lightbox, setLightbox] = useState({ isOpen: false, url: null, title: "" });

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
        isFetching,
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
            queryClient.invalidateQueries({ queryKey: ["repair-approvals"] });
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
            queryClient.invalidateQueries({ queryKey: ["repair-approvals"] });
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
            queryClient.invalidateQueries({ queryKey: ["repair-approvals"] });
            setActionDialog({ isOpen: false, type: "reject", report: null });
        },
        onError: (error) => {
            showError(error.response?.data?.message || "Gagal menolak laporan perbaikan");
        },
    });

    const openPhotoLightbox = (url, title) => {
        if (!url) return;
        setLightbox({ isOpen: true, url: formatStorageUrl(url), title });
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 pb-20">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Navigation Back Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <button
                            onClick={() => navigate({ to: "/repair-approvals" })}
                            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#11468F] hover:text-[#041562] mb-1.5 transition-colors group"
                        >
                            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                            <span>Kembali ke Persetujuan Perbaikan</span>
                        </button>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Review Laporan Perbaikan
                        </h1>
                        <p className="text-slate-500 text-xs mt-0.5">
                            Verifikasi bukti fisik, foto sebelum & sesudah, serta foto perbaikan komponen temuan kerusakan
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-all shadow-2xs active:scale-[0.98] disabled:opacity-50"
                        >
                            <ArrowPathIcon className={`h-4 w-4 mr-1.5 text-[#11468F] ${isFetching ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* KPI Banner */}
                <div className="bg-[#041562] rounded-xl p-5 text-white border border-[#041562] shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-white/10 rounded text-slate-200">
                            Meja Verifikasi HSSE
                        </span>
                        <p className="text-slate-300 text-xs uppercase font-bold tracking-wider mt-2 mb-0.5">
                            Laporan Menunggu Review
                        </p>
                        <p className="text-3xl font-bold font-mono text-white">{reports.length}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/10">
                        <WrenchScrewdriverIcon className="h-6 w-6 text-emerald-400" />
                    </div>
                </div>

                {/* List of Reports */}
                {isLoading ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                        <div className="animate-spin h-10 w-10 border-3 border-slate-200 border-t-[#11468F] rounded-full mx-auto"></div>
                        <p className="mt-3 text-xs text-slate-500 font-semibold">Memuat berkas laporan perbaikan...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                        <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                            <CheckCircleIcon className="h-8 w-8" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Semua Laporan Selesai Ditinjau</h3>
                        <p className="text-slate-500 text-xs max-w-sm mx-auto mt-1">
                            Tidak ada laporan perbaikan yang tertunda. Semua tabung telah diproses atau menunggu tindakan teknisi di lapangan.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {reports.map((report) => {
                            const inspection = report.repair_approval?.inspection;
                            const apar = inspection?.apar;
                            const damages = inspection?.inspection_damages || inspection?.inspectionDamages || [];

                            return (
                                <div
                                    key={report.id}
                                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:border-[#11468F] transition-all"
                                >
                                    {/* Card Header */}
                                    <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#041562] text-white flex items-center justify-center font-mono font-black text-sm">
                                                APAR
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-mono font-black text-slate-900 text-base tracking-wider">
                                                        {apar?.serial_number || "N/A"}
                                                    </h3>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                                                        {apar?.apar_type?.name || "N/A"}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                                                        Ref: #{report.repair_approval_id}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <MapPinIcon className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>{apar?.location_name || "Lokasi tidak tercatat"}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Review Decisions Buttons */}
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => setActionDialog({ isOpen: true, type: "approve", report })}
                                                className="flex-1 sm:flex-none h-10 px-4 inline-flex items-center justify-center bg-[#11468F] hover:bg-[#0d3873] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs active:scale-[0.98] transition-all"
                                                title="Setujui perbaikan & aktifkan kembali tabung APAR"
                                            >
                                                <CheckCircleIcon className="h-4 w-4 mr-1.5 text-emerald-400" />
                                                Setujui
                                            </button>
                                            <button
                                                onClick={() => setActionDialog({ isOpen: true, type: "rework", report })}
                                                className="flex-1 sm:flex-none h-10 px-3.5 inline-flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs uppercase tracking-wider rounded-lg active:scale-[0.98] transition-all"
                                                title="Minta teknisi memperbaiki ulang dengan catatan"
                                            >
                                                <ArrowPathIcon className="h-4 w-4 mr-1.5 text-amber-700" />
                                                Perbaikan Ulang
                                            </button>
                                            <button
                                                onClick={() => setActionDialog({ isOpen: true, type: "reject", report })}
                                                className="flex-1 sm:flex-none h-10 px-3.5 inline-flex items-center justify-center bg-white hover:bg-rose-50 text-[#DA1212] border border-rose-200 hover:border-rose-300 font-bold text-xs uppercase tracking-wider rounded-lg active:scale-[0.98] transition-all"
                                                title="Tolak & tandai tabung rusak permanen"
                                            >
                                                <XCircleIcon className="h-4 w-4 mr-1.5 text-[#DA1212]" />
                                                Afkir
                                            </button>
                                        </div>
                                    </div>

                                    {/* Card Content: Side-by-side Documentation */}
                                    <div className="p-4 sm:p-5 space-y-5">
                                        {/* Metadata Strip */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="h-4 w-4 text-[#11468F] shrink-0" />
                                                <span className="truncate">
                                                    Teknisi: <strong className="text-slate-800">{report.reporter?.name || "N/A"}</strong>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CalendarDaysIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                                                <span className="truncate">
                                                    Selesai: <strong className="text-slate-800">{formatDate(report.repair_completed_at)}</strong>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPinIcon className="h-4 w-4 text-slate-500 shrink-0" />
                                                <span className="truncate">
                                                    GPS: <strong className="font-mono text-slate-800">{report.repair_lat ? `${report.repair_lat}, ${report.repair_lng}` : "Tidak tercatat"}</strong>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Catatan Tindakan Perbaikan */}
                                        {report.repair_description && (
                                            <div className="p-3.5 bg-blue-50/40 rounded-lg border border-blue-100">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#041562] block mb-1">
                                                    Catatan Tindakan Lapangan Teknisi:
                                                </span>
                                                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                                                    {report.repair_description}
                                                </p>
                                            </div>
                                        )}

                                        {/* SECTION 1: FOTO KONDISI UMUM TABUNG (SEBELUM VS SESUDAH) */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                                    <PhotoIcon className="h-4 w-4 text-[#11468F]" />
                                                    <span>1. Foto Kondisi Fisik Tabung Utuh (Sebelum vs Sesudah)</span>
                                                </h4>
                                                <span className="text-[11px] text-slate-400 italic">Klik foto untuk memperbesar</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* Before Photo */}
                                                <div
                                                    className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-black cursor-pointer group shadow-2xs"
                                                    onClick={() => openPhotoLightbox(report.before_photo_url, "Foto Tabung Sebelum Perbaikan")}
                                                >
                                                    {report.before_photo_url ? (
                                                        <>
                                                            <img
                                                                src={formatStorageUrl(report.before_photo_url)}
                                                                alt="Sebelum Perbaikan"
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                                onError={(e) => {
                                                                    e.currentTarget.onerror = null;
                                                                    e.currentTarget.src = "/storage/placeholder.jpg";
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                                                                <ArrowsPointingOutIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                            <div className="absolute top-2 left-2 bg-amber-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                                                                SEBELUM PERBAIKAN
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                                                            Foto tidak tersedia
                                                        </div>
                                                    )}
                                                </div>

                                                {/* After Photo */}
                                                <div
                                                    className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-black cursor-pointer group shadow-2xs"
                                                    onClick={() => openPhotoLightbox(report.after_photo_url, "Foto Tabung Selesai Perbaikan")}
                                                >
                                                    {report.after_photo_url ? (
                                                        <>
                                                            <img
                                                                src={formatStorageUrl(report.after_photo_url)}
                                                                alt="Selesai Perbaikan"
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                                onError={(e) => {
                                                                    e.currentTarget.onerror = null;
                                                                    e.currentTarget.src = "/storage/placeholder.jpg";
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                                                                <ArrowsPointingOutIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                            <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                                                                SELESAI PERBAIKAN
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                                                            Foto tidak tersedia
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* SECTION 2: FOTO BUKTI PERBAIKAN KERUSAKAN KOMPONEN SPESIFIK */}
                                        {damages.length > 0 && (
                                            <div className="pt-3 border-t border-slate-100">
                                                <div className="flex items-center justify-between mb-2.5">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                                        <WrenchScrewdriverIcon className="h-4 w-4 text-emerald-600" />
                                                        <span>2. Bukti Perbaikan Kerusakan Komponen ({damages.length} Temuan)</span>
                                                    </h4>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {damages.map((dmg, idx) => (
                                                        <div
                                                            key={dmg.id || idx}
                                                            className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-xs text-slate-900">
                                                                    {dmg.damage_category?.name || dmg.damageCategory?.name || "Komponen Tabung"}
                                                                </span>
                                                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-rose-100 text-rose-800 rounded border border-rose-200">
                                                                    Severity: {dmg.severity || "medium"}
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2.5">
                                                                {/* Foto Kerusakan Awal */}
                                                                <div
                                                                    className="relative aspect-square rounded overflow-hidden bg-black cursor-pointer group border border-slate-200"
                                                                    onClick={() => openPhotoLightbox(dmg.damage_photo_url, `Temuan: ${dmg.damage_category?.name || "Kerusakan"}`)}
                                                                >
                                                                    {dmg.damage_photo_url ? (
                                                                        <>
                                                                            <img
                                                                                src={formatStorageUrl(dmg.damage_photo_url)}
                                                                                alt="Temuan Kerusakan"
                                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                            />
                                                                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-center">
                                                                                <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                                                                                    Saat Ditemukan
                                                                                </span>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <div className="h-full flex items-center justify-center text-slate-500 text-[10px]">
                                                                            Tanpa Foto
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Foto Bukti Perbaikan */}
                                                                <div
                                                                    className="relative aspect-square rounded overflow-hidden bg-black cursor-pointer group border border-slate-200"
                                                                    onClick={() => openPhotoLightbox(dmg.repair_photo_url, `Bukti Perbaikan: ${dmg.damage_category?.name || "Komponen"}`)}
                                                                >
                                                                    {dmg.repair_photo_url ? (
                                                                        <>
                                                                            <img
                                                                                src={formatStorageUrl(dmg.repair_photo_url)}
                                                                                alt="Bukti Perbaikan"
                                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                            />
                                                                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-emerald-950/90 to-transparent p-1.5 text-center">
                                                                                <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
                                                                                    Bukti Perbaikan
                                                                                </span>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <div className="h-full flex items-center justify-center text-slate-400 text-[10px] text-center p-2">
                                                                            Foto perbaikan belum ada
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            {lightbox.isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
                    onClick={() => setLightbox({ isOpen: false, url: null, title: "" })}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between text-white pb-3">
                            <span className="text-sm font-bold truncate">{lightbox.title}</span>
                            <button
                                onClick={() => setLightbox({ isOpen: false, url: null, title: "" })}
                                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <img
                            src={lightbox.url}
                            alt={lightbox.title}
                            className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl border border-white/20"
                        />
                    </div>
                </div>
            )}

            {/* Approve Dialog */}
            <ActionDialog
                isOpen={actionDialog.isOpen && actionDialog.type === "approve"}
                onClose={() => setActionDialog({ isOpen: false, type: "approve", report: null })}
                title="Setujui Laporan Perbaikan"
                type="approve"
                message="Apakah Anda yakin ingin menyetujui laporan perbaikan ini? Tabung APAR akan resmi diaktifkan kembali (status: active)."
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
                message="Teknisi yang sama akan menerima notifikasi dan jadwal baru untuk melakukan pengerjaan ulang."
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
                notesLabel="Catatan Instruksi Perbaikan Ulang"
                notesPlaceholder="Tulis instruksi bagian apa saja yang wajib diperbaiki kembali..."
            />

            {/* Reject Dialog */}
            <ActionDialog
                isOpen={actionDialog.isOpen && actionDialog.type === "reject"}
                onClose={() => setActionDialog({ isOpen: false, type: "reject", report: null })}
                title="Tandai Tabung Rusak Permanen (Afkir)"
                type="reject"
                message="Tabung APAR akan dinyatakan tidak dapat diperbaiki (not fixable) dan dikeluarkan dari sistem kesiapsiagaan operasional."
                onConfirm={(formData) => {
                    rejectMutation.mutate({
                        reportId: actionDialog.report?.id,
                        notes: formData.notes,
                    });
                }}
                isLoading={rejectMutation.isPending}
                requireNotes={true}
                notesLabel="Alasan Pengafkiran"
                notesPlaceholder="Jelaskan alasan teknis mengapa tabung tidak dapat diperbaiki..."
            />
        </div>
    );
};

export default RepairReportReviewPage;
