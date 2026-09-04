import React from "react";
import {
    CalendarIcon,
    ClockIcon,
    UserIcon,
    FireIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    PlusIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { getFrequencyText, getStatusColor, getStatusText, getStatusIcon } from "../../utils/scheduleUtils";

/**
 * ScheduleTable Component
 * Displays schedules in a list/table format with pagination
 */
const ScheduleTable = ({
    schedules,
    pagination,
    loading,
    onEdit,
    onDelete,
    onView,
    onPageChange,
    onCreateNew,
    searchTerm,
    statusFilter,
    activeFilter,
    onResetFilters,
    bulkDeleteMode = false,
    selectedSchedules = [],
    onSelectSchedule,
    onSelectAll,
}) => {
    // Icon mapping for getStatusIcon utility
    const icons = {
        XCircleIcon,
        ClockIcon,
        CalendarIcon,
        ExclamationTriangleIcon,
        CheckCircleIcon,
    };

    if (loading) {
        return (
            <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 overflow-hidden">
                <div className="text-center py-12 sm:py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#11468F] border-t-transparent mx-auto mb-3 sm:mb-4"></div>
                    <p className="text-slate-600 font-medium text-sm">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (schedules.length === 0) {
        return (
            <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 overflow-hidden">
                <div className="text-center py-12 sm:py-16">
                    <div className="w-12 h-12 bg-slate-100 rounded-[6px] flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <CalendarIcon className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                        {pagination.total === 0
                            ? "Tidak ada jadwal"
                            : "Tidak ada jadwal yang cocok"}
                    </h3>
                    <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto mb-6 px-4">
                        {pagination.total === 0
                            ? "Belum ada jadwal inspeksi yang dibuat. Klik tombol di atas untuk membuat jadwal baru."
                            : "Coba ubah filter pencarian untuk menemukan jadwal yang Anda cari."}
                    </p>
                    {pagination.total === 0 && (
                        <button
                            onClick={onCreateNew}
                            className="inline-flex items-center px-4 py-2 border border-transparent bg-[#11468F] hover:bg-[#0d3873] text-white rounded-[6px] text-sm font-semibold shadow-sm focus:ring-2 focus:ring-[#11468F] transition-all duration-200"
                        >
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Buat Jadwal Pertama
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 overflow-hidden">
            {/* Bulk Delete Header */}
            {bulkDeleteMode && (
                <div className="px-4 sm:px-6 py-3 border-b border-red-200 bg-red-50">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={
                                    selectedSchedules.length === schedules.length &&
                                    schedules.length > 0
                                }
                                onChange={onSelectAll}
                                className="h-4 w-4 text-[#DA1212] focus:ring-[#DA1212] border-slate-300 rounded-[3px]"
                            />
                            <span className="text-sm font-medium text-slate-900">
                                Pilih Semua ({schedules.length})
                            </span>
                        </label>
                        <span className="text-sm text-slate-500">
                            {selectedSchedules.length} dari {schedules.length} dipilih
                        </span>
                    </div>
                </div>
            )}
            <div className="divide-y divide-slate-100">
                {schedules
                    .filter((schedule) => schedule && schedule.id)
                    .map((schedule) => {
                        const StatusIcon =
                            statusIcons[getStatusIcon(schedule)] ||
                            CalendarIcon;
                        return (
                            <div
                                key={schedule.id}
                                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors duration-200"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                    <div className="flex gap-3 sm:gap-4 flex-1">
                                        {bulkDeleteMode && (
                                            <div className="flex-shrink-0 flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSchedules.includes(schedule.id)}
                                                    onChange={() => onSelectSchedule(schedule.id)}
                                                    className="h-4 w-4 text-[#DA1212] focus:ring-[#DA1212] border-slate-300 rounded-[3px]"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 bg-[#11468F]/10 text-[#11468F] rounded-[6px] flex items-center justify-center">
                                                <FireIcon className="w-5 h-5" />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                                                    {schedule.apar?.serial_number} -{" "}
                                                    {schedule.apar?.location_name}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    {/* Status Aktif/Nonaktif */}
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold ${
                                                            schedule.is_active
                                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                : "bg-slate-100 text-slate-700 border border-slate-200"
                                                        }`}
                                                    >
                                                        {schedule.is_active
                                                            ? "Aktif"
                                                            : "Nonaktif"}
                                                    </span>
                                                    {/* Status Jadwal */}
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

                                            <div className="space-y-1.5 sm:space-y-1 text-xs sm:text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="truncate font-medium text-slate-800">
                                                        {schedule.assigned_user?.name ||
                                                            "Teknisi tidak ditugaskan"}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>
                                                            {schedule.scheduled_date
                                                                ? new Date(
                                                                      schedule.scheduled_date
                                                                  ).toLocaleDateString(
                                                                      "id-ID",
                                                                      {
                                                                          day: "numeric",
                                                                          month: "short",
                                                                          year: "numeric",
                                                                      }
                                                                  )
                                                                : "Tanggal tidak valid"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>
                                                            {schedule.start_time} -{" "}
                                                            {schedule.end_time}
                                                        </span>
                                                    </div>
                                                    <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-[3px] font-medium border border-slate-200 w-fit">
                                                        {getFrequencyText(
                                                            schedule.frequency
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            {schedule.notes && (
                                                <div className="mt-2.5 p-2.5 bg-slate-50 rounded-[6px] border-l-4 border-[#11468F]">
                                                    <p className="text-xs sm:text-sm text-slate-700">
                                                        <span className="font-semibold text-slate-900">
                                                            Catatan:
                                                        </span>{" "}
                                                        {schedule.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end sm:justify-start gap-1">
                                        <button
                                            onClick={() => onView(schedule)}
                                            className="p-1.5 text-slate-500 hover:text-[#11468F] hover:bg-[#11468F]/10 rounded-[6px] transition-colors duration-200"
                                            title="Lihat Detail"
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onEdit(schedule)}
                                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-[6px] transition-colors duration-200"
                                            title="Edit"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(schedule.id)}
                                            className="p-1.5 text-[#DA1212] hover:bg-red-50 rounded-[6px] transition-colors duration-200"
                                            title="Hapus"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>

            {/* Pagination */}
            {pagination.total > 0 && (
                <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="text-xs sm:text-sm text-slate-700 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                            <span>
                                Menampilkan{" "}
                                {(pagination.current_page - 1) *
                                    pagination.per_page +
                                    1}{" "}
                                sampai{" "}
                                {Math.min(
                                    pagination.current_page * pagination.per_page,
                                    pagination.total
                                )}{" "}
                                dari {pagination.total} hasil
                            </span>
                            {(searchTerm ||
                                statusFilter !== "all" ||
                                activeFilter !== "all") && (
                                <span className="text-[#11468F] font-semibold">
                                    (Filtered)
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                        <button
                            onClick={() =>
                                onPageChange(pagination.current_page - 1)
                            }
                            disabled={pagination.current_page === 1}
                            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-[6px] hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                        </button>

                        <div className="flex gap-1">
                            {Array.from(
                                {
                                    length: Math.min(5, pagination.last_page),
                                },
                                (_, i) => {
                                    let pageNum;
                                    if (pagination.last_page <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.current_page <= 3) {
                                        pageNum = i + 1;
                                    } else if (
                                        pagination.current_page >=
                                        pagination.last_page - 2
                                    ) {
                                        pageNum =
                                            pagination.last_page - 4 + i;
                                    } else {
                                        pageNum =
                                            pagination.current_page - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => onPageChange(pageNum)}
                                            className={`px-2.5 py-1 text-xs font-semibold rounded-[6px] transition-all duration-200 ${
                                                pageNum === pagination.current_page
                                                    ? "bg-[#11468F] text-white"
                                                    : "text-slate-700 hover:bg-slate-200"
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                }
                            )}
                        </div>

                        <button
                            onClick={() =>
                                onPageChange(pagination.current_page + 1)
                            }
                            disabled={
                                pagination.current_page === pagination.last_page
                            }
                            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-[6px] hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleTable;
