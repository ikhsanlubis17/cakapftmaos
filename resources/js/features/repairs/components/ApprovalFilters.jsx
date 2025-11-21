import React, { useState } from 'react';
import {
    FunnelIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

const ApprovalFilters = ({ onFilterChange, onSearch, supervisors = [], teknisis = [] }) => {
    const [filters, setFilters] = useState({
        status: 'all',
        supervisor: 'all',
        teknisi: 'all',
        search: '',
    });

    const [showFilters, setShowFilters] = useState(false);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setFilters({ ...filters, search: value });
        if (onSearch) {
            onSearch(value);
        }
    };

    const handleReset = () => {
        const resetFilters = {
            status: 'all',
            supervisor: 'all',
            teknisi: 'all',
            search: '',
        };
        setFilters(resetFilters);
        if (onFilterChange) {
            onFilterChange(resetFilters);
        }
        if (onSearch) {
            onSearch('');
        }
    };

    const hasActiveFilters = 
        filters.status !== 'all' || 
        filters.supervisor !== 'all' || 
        filters.teknisi !== 'all' || 
        filters.search !== '';

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Search Bar - Always Visible */}
            <div className="p-4">
                <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Cari APAR, lokasi, teknisi..."
                        value={filters.search}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Filter Toggle Button */}
            <div className="px-4 pb-4">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <FunnelIcon className="h-4 w-4" />
                    Filter Lanjutan
                    {hasActiveFilters && (
                        <span className="ml-1 px-2 py-0.5 text-xs font-semibold text-white bg-red-600 rounded-full">
                            {[filters.status, filters.supervisor, filters.teknisi].filter(f => f !== 'all').length}
                        </span>
                    )}
                </button>
            </div>

            {/* Advanced Filters - Collapsible */}
            {showFilters && (
                <div className="px-4 pb-4 border-t border-gray-200 pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending">Menunggu</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                                <option value="completed">Selesai</option>
                            </select>
                        </div>

                        {/* Supervisor Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Supervisor
                            </label>
                            <select
                                value={filters.supervisor}
                                onChange={(e) => handleFilterChange('supervisor', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            >
                                <option value="all">Semua Supervisor</option>
                                {supervisors.map((supervisor) => (
                                    <option key={supervisor.id} value={supervisor.id}>
                                        {supervisor.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Teknisi Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Teknisi
                            </label>
                            <select
                                value={filters.teknisi}
                                onChange={(e) => handleFilterChange('teknisi', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            >
                                <option value="all">Semua Teknisi</option>
                                {teknisis.map((teknisi) => (
                                    <option key={teknisi.id} value={teknisi.id}>
                                        {teknisi.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Reset Button */}
                    {hasActiveFilters && (
                        <div className="flex justify-end">
                            <button
                                onClick={handleReset}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <XMarkIcon className="h-4 w-4" />
                                Reset Filter
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ApprovalFilters;
