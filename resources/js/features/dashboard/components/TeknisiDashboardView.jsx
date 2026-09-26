import React from "react";
import { Link } from "@tanstack/react-router";
import {
    CalendarDaysIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    FireIcon,
    EyeIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
    formatScheduleDate,
    formatScheduleTime,
} from "@/utils/scheduleTime";

const TeknisiDashboardView = ({
    teknisiStats = {
        totalAssignedSchedules: 0,
        completedInspections: 0,
        pendingInspections: 0,
        overdueInspections: 0,
    },
    mySchedules = [],
    getStatusIcon,
    getStatusColor,
    getStatusText,
}) => {
    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Teknisi Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {/* Total Jadwal */}
                <div className="group relative overflow-hidden bg-white rounded-lg p-5 lg:p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 shadow-sm">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#041562]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 leading-tight">
                                Total Jadwal
                            </p>
                            <p className="text-2xl lg:text-3xl xl:text-4xl font-black font-mono text-[#041562] leading-tight">
                                {teknisiStats.totalAssignedSchedules}
                            </p>
                        </div>
                        <div className="p-3 bg-[#041562] rounded-lg text-white flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200">
                            <CalendarDaysIcon className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Inspeksi Selesai */}
                <div className="group relative overflow-hidden bg-white rounded-lg p-5 lg:p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 shadow-sm">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 leading-tight">
                                Inspeksi Selesai
                            </p>
                            <p className="text-2xl lg:text-3xl xl:text-4xl font-black font-mono text-emerald-700 leading-tight">
                                {teknisiStats.completedInspections}
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-700 flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200">
                            <CheckCircleIcon className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Inspeksi Pending */}
                <div className="group relative overflow-hidden bg-white rounded-lg p-5 lg:p-6 border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all duration-200 shadow-sm">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 leading-tight">
                                Inspeksi Pending
                            </p>
                            <p className="text-2xl lg:text-3xl xl:text-4xl font-black font-mono text-amber-700 leading-tight">
                                {teknisiStats.pendingInspections}
                            </p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-700 flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200">
                            <ClockIcon className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Inspeksi Terlambat */}
                <div className="group relative overflow-hidden bg-white rounded-lg p-5 lg:p-6 border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all duration-200 shadow-sm">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 leading-tight">
                                Inspeksi Terlambat
                            </p>
                            <p className="text-2xl lg:text-3xl xl:text-4xl font-black font-mono text-[#DA1212] leading-tight">
                                {teknisiStats.overdueInspections}
                            </p>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-[#DA1212] flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200">
                            <ExclamationTriangleIcon className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* My Schedules Section */}
            <div className="bg-white rounded-[6px] p-5 lg:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="mb-5 lg:mb-6">
                    <h3 className="text-base lg:text-lg font-bold text-slate-900 mb-1 leading-tight tracking-tight">
                        Jadwal Inspeksi Saya
                    </h3>
                    <p className="text-xs text-slate-500 leading-tight">
                        Jadwal inspeksi yang ditugaskan kepada Anda
                    </p>
                </div>
                <div className="space-y-3">
                    {mySchedules.length > 0 ? (
                        mySchedules.slice(0, 3).map((schedule) => {
                            const StatusIcon = getStatusIcon(schedule);
                            return (
                                <div
                                    key={schedule.id}
                                    className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-gradient-to-r from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                                                <FireIcon className="h-6 w-6 text-red-600" />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                                <h4 className="font-semibold text-gray-900 truncate">
                                                    {schedule.apar?.serial_number} - {schedule.apar?.location_name}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold ${getStatusColor(
                                                            schedule
                                                        )}`}
                                                    >
                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                        {getStatusText(schedule)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 text-sm text-gray-600">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                                                        <span>
                                                            {formatScheduleDate(schedule, "id-ID", {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <ClockIcon className="w-4 h-4 text-gray-400" />
                                                        <span>
                                                            {formatScheduleTime(schedule)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link
                                                to="/my-schedules"
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all duration-200"
                                            >
                                                <EyeIcon className="h-3 w-3" />
                                                Lihat Detail
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <CalendarDaysIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium mb-2">
                                Belum ada jadwal inspeksi
                            </p>
                            <p className="text-sm text-gray-400 mb-4">
                                Jadwal inspeksi akan muncul di sini setelah ditugaskan
                            </p>
                        </div>
                    )}

                    {mySchedules.length > 3 && (
                        <div className="text-center pt-4">
                            <Link
                                to="/my-schedules"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                            >
                                Lihat Semua Jadwal
                                <ArrowPathIcon className="h-3 w-3 rotate-90" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeknisiDashboardView;
