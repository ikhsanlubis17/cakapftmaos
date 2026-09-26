import React from "react";
import { Link } from "@tanstack/react-router";
import {
    ArrowPathIcon,
    PlusIcon,
    CalendarDaysIcon,
    UserIcon,
    ArrowRightIcon,
} from "@heroicons/react/24/outline";
import {
    formatScheduleDate,
    formatScheduleTime,
} from "@/utils/scheduleTime";

const UpcomingInspectionsCard = ({
    upcomingInspections = [],
    isLoading = false,
    onRefresh,
    getStatusIcon,
    getStatusColor,
    getStatusText,
    getFrequencyText,
    isAdmin = false,
}) => {
    return (
        <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-sm transition-all duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Jadwal Terdekat
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Agenda inspeksi teknisi yang akan datang
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onRefresh}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#11468F] hover:text-[#041562] transition-colors p-1 rounded hover:bg-blue-50"
                        title="Segarkan Jadwal"
                    >
                        <ArrowPathIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    {isAdmin && (
                        <Link
                            to="/schedules"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors p-1 rounded hover:bg-slate-100"
                        >
                            <span>Semua</span>
                            <ArrowRightIcon className="h-3 w-3" />
                        </Link>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#11468F]"></div>
                    <span className="ml-2.5 text-xs text-slate-500 font-semibold">
                        Memuat agenda...
                    </span>
                </div>
            ) : upcomingInspections.length > 0 ? (
                <div className="space-y-2.5">
                    {upcomingInspections.slice(0, 4).map((schedule) => {
                        const StatusIcon = getStatusIcon ? getStatusIcon(schedule) : CalendarDaysIcon;
                        return (
                            <div
                                key={schedule.id}
                                className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-lg border border-slate-200/80 hover:border-slate-300 transition-all duration-150"
                            >
                                <div className="flex items-start justify-between gap-2.5">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-bold text-slate-900 font-mono text-xs tracking-wider">
                                                {schedule.apar?.serial_number || "APAR"}
                                            </span>
                                            {schedule.apar?.location_name && (
                                                <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                                                    • {schedule.apar?.location_name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600 flex-wrap">
                                            <div className="flex items-center gap-1">
                                                <UserIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                <span className="truncate max-w-[120px] font-medium text-slate-700">
                                                    {schedule.assigned_user?.name || "Belum ditugaskan"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-slate-500 font-mono">
                                                <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                <span>
                                                    {formatScheduleDate(schedule, "id-ID", {
                                                        day: "numeric",
                                                        month: "short",
                                                    })}
                                                </span>
                                                <span>•</span>
                                                <span>{formatScheduleTime(schedule)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        {getStatusText && getStatusColor && (
                                            <span
                                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${getStatusColor(
                                                    schedule
                                                )}`}
                                            >
                                                <StatusIcon className="w-3 h-3 mr-0.5" />
                                                {getStatusText(schedule)}
                                            </span>
                                        )}
                                        {getFrequencyText && schedule.frequency && (
                                            <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.2 bg-white rounded border border-slate-200">
                                                {getFrequencyText(schedule.frequency)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {upcomingInspections.length > 4 && (
                        <div className="text-center pt-1">
                            <Link
                                to="/schedules"
                                className="text-[11px] font-bold text-[#11468F] hover:text-[#041562] transition-colors"
                            >
                                + {upcomingInspections.length - 4} jadwal lainnya &rarr;
                            </Link>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/40">
                    <CalendarDaysIcon className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                    <p className="text-slate-700 font-semibold text-xs">
                        Tidak ada jadwal terdekat
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        Semua tugas telah selesai atau belum dijadwalkan
                    </p>
                    {isAdmin && (
                        <Link
                            to="/schedules"
                            className="inline-flex items-center gap-1 mt-2.5 text-xs font-bold text-[#11468F] hover:text-[#041562] transition-colors"
                        >
                            <PlusIcon className="h-3.5 w-3.5" />
                            Buat Jadwal Baru
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default UpcomingInspectionsCard;
