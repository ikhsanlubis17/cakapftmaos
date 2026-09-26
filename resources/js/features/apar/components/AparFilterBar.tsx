import React from "react";
import {
    MagnifyingGlassIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

interface AparFilterBarProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    locationFilter: string;
    setLocationFilter: (value: string) => void;
    onResetFilters: () => void;
    hasActiveFilters: boolean;
    totalResults: number;
}

export const AparFilterBar: React.FC<AparFilterBarProps> = ({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    locationFilter,
    setLocationFilter,
    onResetFilters,
    hasActiveFilters,
    totalResults,
}) => {
    return (
        <div className="bg-white shadow-sm border border-slate-200 rounded-[8px] p-4 sm:p-5 transition-all">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                {/* Search Input */}
                <div className="flex-1">
                    <label
                        htmlFor="apar-search"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                        Cari Nomor Seri / Lokasi
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <MagnifyingGlassIcon className="h-5 w-5" />
                        </div>
                        <input
                            type="text"
                            name="search"
                            id="apar-search"
                            data-testid="apar-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-4 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all placeholder:text-slate-400"
                            placeholder="Ketik nomor seri (misal: APAR-MS-001) atau nama lokasi..."
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Status Filter */}
                <div className="w-full sm:w-1/2 lg:w-52">
                    <label
                        htmlFor="status-filter"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                        Status Tabung
                    </label>
                    <select
                        id="status-filter"
                        name="status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                    >
                        <option value="all">Semua Status</option>
                        <option value="active">Aktif (Siap Pakai)</option>
                        <option value="needs_repair">Perlu Perbaikan</option>
                        <option value="under_repair">Sedang Perbaikan</option>
                        <option value="inactive">Nonaktif</option>
                    </select>
                </div>

                {/* Location Type Filter */}
                <div className="w-full sm:w-1/2 lg:w-48">
                    <label
                        htmlFor="location-filter"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                    >
                        Tipe Penempatan
                    </label>
                    <select
                        id="location-filter"
                        name="location"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                    >
                        <option value="all">Semua Penempatan</option>
                        <option value="statis">Statis (Gedung/Area)</option>
                        <option value="mobile">Mobil (Mobil Tangki)</option>
                    </select>
                </div>

                {/* Clear Filter Button */}
                {hasActiveFilters && (
                    <div className="w-full lg:w-auto flex items-center">
                        <button
                            type="button"
                            onClick={onResetFilters}
                            className="w-full lg:w-auto inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors shadow-xs"
                        >
                            <XMarkIcon className="h-4 w-4 mr-1.5 text-slate-500" />
                            Bersihkan Filter
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AparFilterBar;
