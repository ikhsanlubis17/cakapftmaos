import React from 'react';
import { MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface ScheduleFiltersProps {
    searchTerm: string;
    statusFilter: string;
    activeFilter: string;
    searchLoading: boolean;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onActiveChange: (value: string) => void;
    onReset: () => void;
    onClearSearch: () => void;
}

const ScheduleFilters: React.FC<ScheduleFiltersProps> = ({
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
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Cari Jadwal
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                {searchLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-red-500 border-t-transparent"></div>
                                ) : (
                                    <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                )}
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="Cari berdasarkan APAR, lokasi, atau teknisi..."
                                className="block w-full pl-9 sm:pl-10 pr-12 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200"
                            />
                            {searchTerm && (
                                <button
                                    onClick={onClearSearch}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                    title="Clear search"
                                >
                                    <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Filter Status Jadwal
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => onStatusChange(e.target.value)}
                            className="block w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200"
                        >
                            <option value="all">Semua Status</option>
                            <option value="overdue">Terlambat</option>
                            <option value="today">Hari ini</option>
                            <option value="upcoming">Akan Datang</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Filter Status Aktif
                        </label>
                        <select
                            value={activeFilter}
                            onChange={(e) => onActiveChange(e.target.value)}
                            className="block w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200"
                        >
                            <option value="all">Semua Status</option>
                            <option value="active">Aktif</option>
                            <option value="inactive">Nonaktif</option>
                        </select>
                    </div>
                </div>

                {/* Filter Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span>Filter aktif:</span>
                        {searchTerm && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                Pencarian: "{searchTerm}"
                                <button
                                    onClick={onClearSearch}
                                    className="ml-1 text-blue-500 hover:text-blue-700"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {statusFilter !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                                Status:{' '}
                                {statusFilter === 'overdue'
                                    ? 'Terlambat'
                                    : statusFilter === 'today'
                                    ? 'Hari ini'
                                    : 'Akan Datang'}
                            </span>
                        )}
                        {activeFilter !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                Aktif: {activeFilter === 'active' ? 'Aktif' : 'Nonaktif'}
                            </span>
                        )}
                    </div>

                    {(searchTerm || statusFilter !== 'all' || activeFilter !== 'all') && (
                        <button
                            onClick={onReset}
                            className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
                        >
                            Reset Semua Filter
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleFilters;
