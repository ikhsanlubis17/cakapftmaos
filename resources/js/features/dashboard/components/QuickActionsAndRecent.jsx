import React from "react";
import { Link } from "@tanstack/react-router";
import {
    FireIcon,
    WrenchScrewdriverIcon,
    DocumentTextIcon,
    EyeIcon,
    PlusIcon,
    ArrowRightIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ClipboardDocumentListIcon,
    CogIcon,
    QrCodeIcon,
} from "@heroicons/react/24/outline";
import { formatDateTime } from "@/utils/dateUtils";

/**
 * QuickActionsCard Component
 * Displays role-tailored operational shortcuts strictly aligned with role responsibilities.
 * "Laporan Perbaikan Saya" is ONLY available for teknisi role.
 */
export const QuickActionsCard = ({ userRole = "admin", isAdmin = false }) => {
    const role = userRole || (isAdmin ? "admin" : "supervisor");

    const getActions = () => {
        if (role === "admin") {
            return [
                {
                    title: "Jadwal Inspeksi Rutin",
                    description: "Kelola & buat jadwal penugasan teknisi",
                    to: "/schedules",
                    icon: CalendarDaysIcon,
                    iconBg: "bg-[#11468F]/10 text-[#11468F] ring-1 ring-[#11468F]/20",
                    hoverBorder: "hover:border-[#11468F]/30 hover:bg-blue-50/40",
                    hoverText: "group-hover:text-[#11468F]",
                },
                {
                    title: "Persetujuan Perbaikan",
                    description: "Verifikasi temuan kerusakan & disposisi",
                    to: "/repair-approvals",
                    icon: WrenchScrewdriverIcon,
                    iconBg: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20",
                    hoverBorder: "hover:border-amber-300 hover:bg-amber-50/40",
                    hoverText: "group-hover:text-amber-800",
                },
                {
                    title: "Data Tabung APAR",
                    description: "Inventaris barcode, tipe, & lokasi tabung",
                    to: "/apar",
                    icon: FireIcon,
                    iconBg: "bg-[#041562]/10 text-[#041562] ring-1 ring-[#041562]/20",
                    hoverBorder: "hover:border-[#041562]/30 hover:bg-slate-100/60",
                    hoverText: "group-hover:text-[#041562]",
                },
                {
                    title: "Kategori Kerusakan",
                    description: "Kelola parameter standar kerusakan APAR",
                    to: "/damage-categories",
                    icon: CogIcon,
                    iconBg: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
                    hoverBorder: "hover:border-slate-300 hover:bg-slate-50",
                    hoverText: "group-hover:text-slate-900",
                },
            ];
        }

        if (role === "supervisor") {
            return [
                {
                    title: "Inspeksi APAR Baru",
                    description: "Lakukan inspeksi tabung di lapangan",
                    to: "/inspections/new",
                    icon: FireIcon,
                    iconBg: "bg-[#DA1212]/10 text-[#DA1212] ring-1 ring-[#DA1212]/20",
                    hoverBorder: "hover:border-[#DA1212]/30 hover:bg-rose-50/40",
                    hoverText: "group-hover:text-[#DA1212]",
                },
                {
                    title: "Persetujuan Perbaikan",
                    description: "Disposisi teknisi untuk temuan rusak",
                    to: "/repair-approvals",
                    icon: WrenchScrewdriverIcon,
                    iconBg: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20",
                    hoverBorder: "hover:border-amber-300 hover:bg-amber-50/40",
                    hoverText: "group-hover:text-amber-800",
                },
                {
                    title: "Review Laporan Perbaikan",
                    description: "Verifikasi hasil perbaikan teknisi",
                    to: "/repair-reports/review",
                    icon: CheckCircleIcon,
                    iconBg: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20",
                    hoverBorder: "hover:border-emerald-300 hover:bg-emerald-50/40",
                    hoverText: "group-hover:text-emerald-800",
                },
                {
                    title: "Riwayat Semua Inspeksi",
                    description: "Audit seluruh hasil rekaman inspeksi",
                    to: "/inspections",
                    icon: ClipboardDocumentListIcon,
                    iconBg: "bg-[#11468F]/10 text-[#11468F] ring-1 ring-[#11468F]/20",
                    hoverBorder: "hover:border-[#11468F]/30 hover:bg-blue-50/40",
                    hoverText: "group-hover:text-[#11468F]",
                },
            ];
        }

        // Teknisi Role
        return [
            {
                title: "Scan QR & Inspeksi",
                description: "Mulai inspeksi APAR di lokasi",
                to: "/scan",
                icon: QrCodeIcon,
                iconBg: "bg-[#DA1212]/10 text-[#DA1212] ring-1 ring-[#DA1212]/20",
                hoverBorder: "hover:border-[#DA1212]/30 hover:bg-rose-50/40",
                hoverText: "group-hover:text-[#DA1212]",
            },
            {
                title: "Jadwal Tugas Saya",
                description: "Daftar penugasan inspeksi aktif",
                to: "/my-schedules",
                icon: CalendarDaysIcon,
                iconBg: "bg-[#11468F]/10 text-[#11468F] ring-1 ring-[#11468F]/20",
                hoverBorder: "hover:border-[#11468F]/30 hover:bg-blue-50/40",
                hoverText: "group-hover:text-[#11468F]",
            },
            {
                title: "Laporan Perbaikan Saya",
                description: "Tindak lanjut perbaikan tabung rusak",
                to: "/my-repairs",
                icon: WrenchScrewdriverIcon,
                iconBg: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20",
                hoverBorder: "hover:border-amber-300 hover:bg-amber-50/40",
                hoverText: "group-hover:text-amber-800",
            },
        ];
    };

    const actions = getActions();

    return (
        <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-sm transition-all duration-200">
            <div className="mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Aksi Cepat Operasional
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Pintasan menu kerja sesuai wewenang
                    </p>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {role === "admin" ? "Admin" : role === "supervisor" ? "Supervisor" : "Teknisi"}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {actions.map((action, index) => {
                    const IconComponent = action.icon;
                    return (
                        <Link
                            key={index}
                            to={action.to}
                            className={`group flex items-start gap-3 p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg transition-all duration-200 shadow-2xs ${action.hoverBorder}`}
                        >
                            <div className={`p-2 rounded-md ${action.iconBg} flex-shrink-0 transition-transform group-hover:scale-105`}>
                                <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`font-bold text-slate-900 text-xs transition-colors ${action.hoverText} leading-snug`}>
                                    {action.title}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-normal">
                                    {action.description}
                                </p>
                            </div>
                            <ArrowRightIcon className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0 mt-0.5" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * RecentInspectionsCard Component
 * Displays the 5 most recent inspections at the terminal with status badges and details.
 */
export const RecentInspectionsCard = ({ recentInspections = [] }) => {
    return (
        <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-sm transition-all duration-200">
            <div className="mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Inspeksi Terkini
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        5 rekaman inspeksi terakhir di terminal
                    </p>
                </div>
                <Link
                    to="/inspections"
                    className="text-xs font-bold text-[#11468F] hover:text-[#041562] transition-colors flex items-center gap-1"
                >
                    Semua
                    <ArrowRightIcon className="h-3 w-3" />
                </Link>
            </div>

            <div className="space-y-2">
                {recentInspections.length > 0 ? (
                    recentInspections.slice(0, 5).map((inspection) => {
                        const isGood = inspection.condition === "good" || inspection.condition === "baik";
                        return (
                            <div
                                key={inspection.id}
                                className="flex items-center justify-between gap-3 p-2.5 bg-slate-50/70 hover:bg-slate-50 rounded-lg border border-slate-200/80 hover:border-slate-300 transition-all duration-150"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="p-1.5 bg-white rounded-md border border-slate-200 text-[#041562] flex-shrink-0 shadow-2xs">
                                        <FireIcon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-slate-900 font-mono text-xs tracking-wider">
                                                {inspection.apar?.serial_number || "APAR"}
                                            </span>
                                            {inspection.apar?.location_name && (
                                                <span className="text-[10px] text-slate-500 truncate max-w-[110px] sm:max-w-[150px]">
                                                    • {inspection.apar?.location_name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-slate-600 font-medium truncate max-w-[90px]">
                                                {inspection.user?.name || "Teknisi"}
                                            </span>
                                            <span className="text-slate-300 text-[10px]">•</span>
                                            <span className="text-[10px] text-slate-400 font-mono">
                                                {formatDateTime(inspection.created_at, { year: undefined })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                            isGood
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : "bg-rose-50 text-rose-700 border border-rose-200"
                                        }`}
                                    >
                                        {isGood ? "Baik" : "Rusak"}
                                    </span>
                                    <Link
                                        to={`/apar/${inspection.apar?.id}`}
                                        className="inline-flex items-center text-slate-400 hover:text-[#11468F] p-1 rounded hover:bg-slate-200/60 transition-colors"
                                        title="Lihat Detail APAR"
                                    >
                                        <EyeIcon className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/40">
                        <DocumentTextIcon className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                        <p className="text-slate-700 font-semibold text-xs">
                            Belum ada riwayat inspeksi
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Rekaman inspeksi baru akan muncul di sini
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Default container for backwards compatibility
 */
const QuickActionsAndRecent = ({
    isAdmin = false,
    userRole,
    recentInspections = [],
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QuickActionsCard isAdmin={isAdmin} userRole={userRole} />
            <RecentInspectionsCard recentInspections={recentInspections} />
        </div>
    );
};

export default QuickActionsAndRecent;
