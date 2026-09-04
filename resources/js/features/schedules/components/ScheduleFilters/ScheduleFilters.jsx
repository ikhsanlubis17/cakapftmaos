import React from "react";
import {
    MagnifyingGlassIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";

/**
 * ScheduleFilters Component
 * Handles search and filter controls for schedules
 */
const ScheduleFilters = ({
    searchTerm,
    statusFilter,
    activeFilter,
    searchLoading,
    onSearchChange,
    onStatusChange,
    onActiveChange,
    onReset,
    onClearSearch,
}) => {
    return (
        <div className="mb-4 sm:mb-6">
            <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                            Cari Jadwal
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                {searchLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#11468F] border-t-transparent"></div>
                                ) : (
                                    <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                                )}
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="Cari APAR, lokasi, atau teknisi..."
                                className="block w-full pl-9 pr-10 py-2 border border-slate-300 rounded-[6px] text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all duration-200"
                            />
                            {searchTerm && (
                                <button
                                    onClick={onClearSearch}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors duration-200"
                                    title="Clear search"
                                >
                                    <XCircleIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                            Filter Status Jadwal
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => onStatusChange(e.target.value)}
                            className="block w-full px-3 py-2 border border-slate-300 rounded-[6px] text-sm text-slate-900 focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all duration-200"
                        >
                            <option value="all">Semua Status</option>
                            <option value="overdue">Terlambat</option>
                            <option value="today">Hari ini</option>
                            <option value="upcoming">Akan Datang</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                            Filter Status Aktif
                        </label>
                        <select
                            value={activeFilter}
                            onChange={(e) => onActiveChange(e.target.value)}
                            className="block w-full px-3 py-2 border border-slate-300 rounded-[6px] text-sm text-slate-900 focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all duration-200"
                        >
                            <option value="all">Semua Status</option>
                            <option value="active">Aktif</option>
                            <option value="inactive">Nonaktif</option>
                        </select>
                    </div>
                </div>

                {/* Filter Actions */}
                {(searchTerm || statusFilter !== "all" || activeFilter !== "all") && (
                    <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600">
                            <span className="font-medium">Filter aktif:</span>
                            {searchTerm && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-[3px] text-xs font-medium">
                                    Pencarian: "{searchTerm}"
                                    <button
                                        onClick={onClearSearch}
                                        className="ml-1 text-blue-500 hover:text-blue-700"
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                            {statusFilter !== "all" && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-[3px] text-xs font-medium">
                                    Status:{" "}
                                    {statusFilter === "overdue"
                                        ? "Terlambat"
                                        : statusFilter === "today"
                                        ? "Hari ini"
                                        : "Akan Datang"}
                                </span>
                            )}
                            {activeFilter !== "all" && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-[3px] text-xs font-medium">
                                    Aktif:{" "}
                                    {activeFilter === "active" ? "Aktif" : "Nonaktif"}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={onReset}
                            className="inline-flex items-center self-start sm:self-auto px-3 py-1.5 bg-slate-100 text-slate-700 rounded-[6px] text-xs font-semibold hover:bg-slate-200 transition-colors duration-200"
                        >
                            Reset Semua Filter
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScheduleFilters;
