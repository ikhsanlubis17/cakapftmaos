import React from "react";
import { formatStorageUrl } from "@/utils/imageUrl";
import { formatDate } from "@/utils/dateUtils";
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    ExclamationTriangleIcon,
    MapPinIcon,
    UserIcon,
    CalendarIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    ArrowsPointingOutIcon,
    CameraIcon,
    WrenchScrewdriverIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export const getStatusBadge = (status) => {
    const statusConfig = {
        pending: {
            color: "bg-amber-50 text-amber-800 border-amber-300",
            dot: "bg-amber-500",
            icon: ClockIcon,
            text: "Menunggu",
        },
        approved: {
            color: "bg-emerald-50 text-emerald-800 border-emerald-300",
            dot: "bg-emerald-500",
            icon: CheckCircleIcon,
            text: "Disetujui",
        },
        rejected: {
            color: "bg-rose-50 text-rose-800 border-rose-300",
            dot: "bg-rose-500",
            icon: XCircleIcon,
            text: "Ditolak",
        },
        completed: {
            color: "bg-blue-50 text-blue-800 border-blue-300",
            dot: "bg-blue-500",
            icon: CheckCircleIcon,
            text: "Selesai",
        },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-[11px] font-extrabold uppercase tracking-wider border shadow-xs ${config.color}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            <Icon className="h-3.5 w-3.5" />
            {config.text}
        </span>
    );
};

export const getConditionBadge = (condition) => {
    const conditionConfig = {
        damaged: {
            color: "bg-rose-50 text-rose-700 border-rose-200",
            text: "Rusak",
        },
        needs_repair: {
            color: "bg-amber-50 text-amber-700 border-amber-200",
            text: "Perlu Perbaikan",
        },
        needs_refill: {
            color: "bg-amber-50 text-amber-700 border-amber-200",
            text: "Perlu Isi Ulang",
        },
        expired: {
            color: "bg-slate-100 text-slate-700 border-slate-200",
            text: "Kadaluarsa",
        },
        good: {
            color: "bg-emerald-50 text-emerald-700 border-emerald-200",
            text: "Normal",
        },
    };

    const config = conditionConfig[condition];
    if (!config) return null;

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-bold uppercase tracking-wider border ${config.color}`}
        >
            {config.text}
        </span>
    );
};

export const getHighestSeverityBadge = (damages = []) => {
    if (!damages || damages.length === 0) return null;

    const severityOrder = ["critical", "high", "medium", "low"];
    let highest = null;

    for (const s of severityOrder) {
        if (damages.some((d) => (d.severity || "").toLowerCase() === s)) {
            highest = s;
            break;
        }
    }

    if (!highest) return null;

    const map = {
        critical: { label: "Kritis", cls: "bg-rose-100 text-rose-800 border-rose-300 animate-pulse" },
        high: { label: "Tinggi", cls: "bg-orange-100 text-orange-800 border-orange-300" },
        medium: { label: "Sedang", cls: "bg-amber-100 text-amber-800 border-amber-300" },
        low: { label: "Rendah", cls: "bg-slate-100 text-slate-700 border-slate-300" },
    };

    const conf = map[highest];

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-wider border shadow-2xs ${conf.cls}`}>
            <ExclamationTriangleIcon className="h-3 w-3" />
            Severity: {conf.label}
        </span>
    );
};

export const RepairApprovalCard = ({
    approval,
    onOpenLightbox,
    onOpenApprove,
    onOpenReject,
    onNavigate,
}) => {
    const damages = approval.inspection?.inspectionDamages || [];
    const firstDamage = damages.find((d) => d.damage_photo_url);
    const displayThumbnailUrl = firstDamage?.damage_photo_url || approval.inspection?.photo_url;

    return (
        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-5">
                {/* Mobile-first top header: Serial + Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 lg:hidden pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">APAR</span>
                        <h3 className="font-mono text-base font-black text-slate-900 tracking-wider">
                            {approval.inspection?.apar?.serial_number || "N/A"}
                        </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {getStatusBadge(approval.status)}
                        {getHighestSeverityBadge(damages)}
                    </div>
                </div>

                {/* Main Row: Thumbnail + Content */}
                <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
                    {/* Thumbnail Preview */}
                    <div className="flex-shrink-0">
                        {displayThumbnailUrl ? (
                            <div
                                onClick={() =>
                                    onOpenLightbox({
                                        url: formatStorageUrl(displayThumbnailUrl),
                                        title: firstDamage
                                            ? `Kerusakan: ${firstDamage.damageCategory?.name || "Temuan Kerusakan"}`
                                            : "Kondisi Fisik APAR",
                                        serial: approval.inspection?.apar?.serial_number,
                                    })
                                }
                                className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs active:scale-95 transition-transform"
                                title="Klik untuk memperbesar foto bukti"
                            >
                                <img
                                    src={formatStorageUrl(displayThumbnailUrl)}
                                    alt="Thumbnail Kerusakan"
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ArrowsPointingOutIcon className="h-5 w-5 text-white drop-shadow-md" />
                                </div>
                                {damages.length > 1 && (
                                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-slate-900/80 text-white text-[10px] font-mono font-bold rounded-[3px]">
                                        +{damages.length - 1}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                                <CameraIcon className="h-6 w-6 mb-1 text-slate-300" />
                                <span className="text-[10px] font-semibold text-slate-400">Tanpa Foto</span>
                            </div>
                        )}
                    </div>

                    {/* Content Information */}
                    <div className="flex-1 min-w-0 space-y-2.5">
                        {/* Desktop Title & Badges (hidden on mobile, shown on lg+) */}
                        <div className="hidden lg:flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">APAR</span>
                            <h3 className="font-mono text-lg font-black text-slate-900 tracking-wider">
                                {approval.inspection?.apar?.serial_number || "N/A"}
                            </h3>

                            <div className="flex flex-wrap items-center gap-1.5 ml-1">
                                {getStatusBadge(approval.status)}
                                {getConditionBadge(approval.inspection?.condition)}
                                {getHighestSeverityBadge(damages)}
                            </div>
                        </div>

                        {/* Metadata: Location, Reporter, Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1.5 gap-x-3 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5">
                                <MapPinIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <span className="truncate font-semibold text-slate-900">
                                    {approval.inspection?.apar?.location_name || "Lokasi tidak tersedia"}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <UserIcon className="h-4 w-4 text-slate-500 flex-shrink-0" />
                                <span className="truncate">
                                    Pelapor: <span className="font-semibold text-slate-800">{approval.inspection?.user?.name || "N/A"}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CalendarIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                <span className="truncate">
                                    {approval.inspection?.created_at
                                        ? formatDate(approval.inspection.created_at, {
                                              weekday: "short",
                                              day: "numeric",
                                              month: "short",
                                              year: "numeric",
                                          })
                                        : "Tanggal tidak ada"}
                                </span>
                            </div>
                        </div>

                        {/* Damage Tags */}
                        {damages.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mr-0.5">
                                    <WrenchScrewdriverIcon className="h-3.5 w-3.5 text-slate-400" />
                                    Temuan:
                                </span>
                                {damages.map((dmg, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 text-[11px] px-2 py-0.5 rounded font-bold"
                                    >
                                        {dmg.damageCategory?.name || "Kerusakan"}
                                        {dmg.severity && (
                                            <span className="text-[10px] text-rose-600 font-mono font-normal">
                                                ({dmg.severity})
                                            </span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Notes / Reasons */}
                        {approval.inspection?.notes && (
                            <div className="text-xs text-slate-600 bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-200 flex items-start gap-2">
                                <DocumentTextIcon className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <span className="line-clamp-2">
                                    <strong className="text-slate-800">Catatan Teknisi:</strong> {approval.inspection.notes}
                                </span>
                            </div>
                        )}

                        {/* Status Context Alerts */}
                        {approval.status === "rejected" && approval.admin_notes && (
                            <div className="text-xs text-rose-700 bg-rose-50/70 p-2 sm:p-2.5 rounded-lg border border-rose-200 flex items-start gap-2">
                                <XCircleIcon className="h-4 w-4 text-[#DA1212] flex-shrink-0 mt-0.5" />
                                <span>
                                    <strong className="text-rose-900">Alasan Penolakan:</strong> {approval.admin_notes}
                                </span>
                            </div>
                        )}

                        {(() => {
                            const report = approval.repair_report || approval.repairReport;
                            if (report) {
                                if (report.status === "pending_review") {
                                    return (
                                        <div className="text-xs text-blue-900 bg-blue-50 p-2.5 rounded-lg border border-blue-200 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <ClockIcon className="h-4 w-4 text-blue-600 shrink-0 animate-pulse" />
                                                <span><strong>Laporan Masuk:</strong> Teknisi telah selesai & menunggu review Anda.</span>
                                            </div>
                                            <button
                                                onClick={() => onNavigate("/repair-reports/review")}
                                                className="px-2.5 py-1 bg-[#11468F] hover:bg-[#0d3873] text-white text-[11px] font-bold uppercase rounded shadow-2xs shrink-0"
                                            >
                                                Tinjau Sekarang
                                            </button>
                                        </div>
                                    );
                                }
                                if (report.status === "needs_rework") {
                                    return (
                                        <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-2">
                                            <ArrowPathIcon className="h-4 w-4 text-amber-600 shrink-0" />
                                            <span>Dalam proses perbaikan ulang oleh teknisi.</span>
                                        </div>
                                    );
                                }
                                if (report.status === "approved" || approval.status === "completed") {
                                    return (
                                        <div className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center gap-2">
                                            <CheckCircleIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                                            <span>Perbaikan tuntas & disetujui. APAR aktif kembali.</span>
                                        </div>
                                    );
                                }
                            }

                            if (approval.status === "approved") {
                                return (
                                    <div className="text-xs text-indigo-800 bg-indigo-50/70 p-2 rounded-lg border border-indigo-200 flex items-center gap-2">
                                        <CheckCircleIcon className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                                        <span>Disetujui. Siap dieksekusi teknisi sesuai jadwal.</span>
                                    </div>
                                );
                            }

                            return null;
                        })()}
                    </div>
                </div>

                {/* Action Panel */}
                <div className="pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex-shrink-0">
                    {approval.status === "pending" ? (
                        <div className="flex flex-row lg:flex-col items-stretch gap-2 w-full lg:w-44">
                            <button
                                onClick={() => onOpenApprove(approval)}
                                className="flex-1 lg:w-full h-11 inline-flex items-center justify-center gap-1.5 px-3.5 bg-[#11468F] hover:bg-[#0d3873] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                            >
                                <CheckCircleIcon className="h-4 w-4" />
                                Setujui
                            </button>
                            <button
                                onClick={() => onOpenReject(approval)}
                                className="h-11 px-3.5 inline-flex items-center justify-center gap-1 bg-white hover:bg-rose-50 text-[#DA1212] border border-rose-200 hover:border-rose-300 text-xs font-bold uppercase tracking-wider rounded-lg active:scale-[0.98] transition-all cursor-pointer"
                            >
                                <XCircleIcon className="h-4 w-4" />
                                Tolak
                            </button>
                            <button
                                onClick={() => onNavigate(`/repair-approval/${approval.id}`)}
                                className="h-11 px-3.5 inline-flex items-center justify-center gap-1 text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-bold uppercase tracking-wider rounded-lg active:scale-[0.98] transition-all cursor-pointer"
                                title="Lihat detail lengkap"
                            >
                                <EyeIcon className="h-4 w-4 text-slate-600" />
                                Detail
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => onNavigate(`/repair-approval/${approval.id}`)}
                            className="w-full lg:w-auto h-11 inline-flex items-center justify-center gap-2 px-5 bg-[#041562] hover:bg-[#11468F] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <EyeIcon className="h-4 w-4" />
                            Lihat Detail
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RepairApprovalCard;
