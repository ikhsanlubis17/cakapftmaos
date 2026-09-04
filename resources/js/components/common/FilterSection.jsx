import React from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

const FilterSection = ({ 
    searchTerm, 
    setSearchTerm, 
    roleFilter, 
    setRoleFilter, 
    statusFilter, 
    setStatusFilter 
}) => {
    return (
        <div className="bg-white rounded-[6px] shadow-sm border border-[#EEEEEE] p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Field */}
                <div>
                    <label htmlFor="search" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Cari Pengguna
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            id="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-colors"
                            placeholder="Cari nama, email, atau telepon..."
                        />
                    </div>
                </div>
                
                {/* Role Filter */}
                <div>
                    <label htmlFor="role-filter" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Filter Role
                    </label>
                    <select
                        id="role-filter"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-colors"
                    >
                        <option value="all">Semua Role</option>
                        <option value="admin">Administrator</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="teknisi">Teknisi</option>
                    </select>
                </div>
                
                {/* Status Filter */}
                <div>
                    <label htmlFor="status-filter" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Filter Status
                    </label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-colors"
                    >
                        <option value="all">Semua Status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Tidak Aktif</option>
                    </select>
                </div>
            </div>
            
            {/* Active Filters Display */}
            {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
                <div className="mt-4 pt-4 border-t border-[#EEEEEE]">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Filter aktif:</span>
                        {searchTerm && (
                            <span className="inline-flex items-center px-2 py-1 rounded-[3px] text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                Cari: "{searchTerm}"
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="ml-1.5 text-slate-500 hover:text-slate-800"
                                >
                                    <XMarkIcon className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        )}
                        {roleFilter !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-[3px] text-xs font-medium bg-blue-50 text-[#11468F] border border-blue-200">
                                Role: {roleFilter === 'admin' ? 'Administrator' : roleFilter === 'supervisor' ? 'Supervisor' : 'Teknisi'}
                                <button
                                    onClick={() => setRoleFilter('all')}
                                    className="ml-1.5 text-[#11468F] hover:text-[#0d3873]"
                                >
                                    <XMarkIcon className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        )}
                        {statusFilter !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-[3px] text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Status: {statusFilter === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className="ml-1.5 text-emerald-600 hover:text-emerald-800"
                                >
                                    <XMarkIcon className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        )}
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setRoleFilter('all');
                                setStatusFilter('all');
                            }}
                            className="text-xs font-semibold text-[#DA1212] hover:text-[#b00f0f] uppercase tracking-wider ml-2"
                        >
                            Hapus Semua
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterSection;
