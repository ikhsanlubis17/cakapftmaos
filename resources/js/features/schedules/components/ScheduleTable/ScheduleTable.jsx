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
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="text-center py-12 sm:py-16">
                    <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-2 border-red-500 border-t-transparent mx-auto mb-3 sm:mb-4"></div>
                    <p className="text-gray-600 font-medium">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (schedules.length === 0) {
        return (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="text-center py-12 sm:py-16">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                        {pagination.total === 0
                            ? "Tidak ada jadwal"
                            : "Tidak ada hasil"}
                    </h3>
                    <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">
                        {pagination.total === 0
                            ? "Belum ada jadwal inspeksi yang dibuat"
                            : searchTerm ||
                              statusFilter !== "all" ||
                              activeFilter !== "all"
                            ? "Tidak ada jadwal yang sesuai dengan filter yang dipilih"
                            : "Tidak ada jadwal yang tersedia"}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                        {pagination.total === 0 ? (
                            <button
                                onClick={onCreateNew}
                                className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200"
                            >
                                <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                <span className="hidden sm:inline">
                                    Buat Jadwal Pertama
                                </span>
                                <span className="sm:hidden">Buat Jadwal</span>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={onResetFilters}
                                    className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-gray-200 transition-all duration-200"
                                >
                                    Reset Semua Filter
                                </button>
                                <button
                                    onClick={onCreateNew}
                                    className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200"
                                >
                                    <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                    Buat Jadwal Baru
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
                {schedules
                    .filter((schedule) => schedule && schedule.id)
                    .map((schedule) => {
                        const StatusIcon = getStatusIcon(schedule, icons);
                        return (
                            <div
                                key={schedule.id}
                                className="p-3 sm:p-4 lg:p-6 hover:bg-gray-50 transition-colors duration-200"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                                    <div className="flex gap-3 sm:gap-4 flex-1">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-100 to-red-200 rounded-lg sm:rounded-xl flex items-center justify-center">
                                                <FireIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                                <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                                                    {schedule.apar?.serial_number} -{" "}
                                                    {schedule.apar?.location_name}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    {/* Status Aktif/Nonaktif */}
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium ${
                                                            schedule.is_active
                                                                ? "bg-green-100 text-green-700 border border-green-200"
                                                                : "bg-gray-100 text-gray-700 border border-gray-200"
                                                        }`}
                                                    >
                                                        {schedule.is_active
                                                            ? "🟢 Aktif"
                                                            : "⚫ Nonaktif"}
                                                    </span>
                                                    {/* Status Jadwal */}
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium ${getStatusColor(
                                                            schedule
                                                        )}`}
                                                    >
                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                        {getStatusText(schedule)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 sm:space-y-1 text-xs sm:text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                                    <span className="truncate">
                                                        {schedule.assigned_user?.name ||
                                                            "Teknisi tidak ditugaskan"}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
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
                                                        <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                                        <span>
                                                            {schedule.start_time} -{" "}
                                                            {schedule.end_time}
                                                        </span>
                                                    </div>
                                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full w-fit">
                                                        {getFrequencyText(
                                                            schedule.frequency
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            {schedule.notes && (
                                                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                                                    <p className="text-xs sm:text-sm text-gray-700">
                                                        <span className="font-medium">
                                                            Catatan:
                                                        </span>{" "}
                                                        {schedule.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end sm:justify-start gap-1 sm:gap-2">
                                        <button
                                            onClick={() => onView(schedule)}
                                            className="p-1.5 sm:p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors duration-200"
                                            title="Lihat Detail"
                                        >
                                            <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                        <button
                                            onClick={() => onEdit(schedule)}
                                            className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                            title="Edit"
                                        >
                                            <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(schedule.id)}
                                            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                            title="Hapus"
                                        >
                                            <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>

            {/* Pagination */}
            {pagination.total > 0 && (
                <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
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
                                <span className="text-blue-600 font-medium">
                                    (Filtered)
                                </span>
                            )}
                        </div>
                        {(searchTerm ||
                            statusFilter !== "all" ||
                            activeFilter !== "all") && (
                            <div className="text-xs text-gray-500 mt-1">
                                Gunakan tombol "Reset Semua Filter" untuk melihat
                                semua jadwal
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <button
                            onClick={() =>
                                onPageChange(pagination.current_page - 1)
                            }
                            disabled={pagination.current_page === 1}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
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
                                            className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                                                pageNum === pagination.current_page
                                                    ? "bg-red-500 text-white"
                                                    : "text-gray-600 hover:bg-gray-100"
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
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleTable;
