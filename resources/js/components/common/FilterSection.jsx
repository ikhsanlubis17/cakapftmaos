import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const FilterSection = ({ 
    searchTerm, 
    setSearchTerm, 
    roleFilter, 
    setRoleFilter, 
    statusFilter, 
    setStatusFilter 
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Field */}
                <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                        Cari Pengguna
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            id="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                            placeholder="Cari nama, email, atau telepon..."
                        />
                    </div>
                </div>
                
                {/* Role Filter */}
                <div>
                    <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-2">
                        Filter Role
                    </label>
                    <select
                        id="role-filter"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                    >
                        <option value="all">Semua Role</option>
                        <option value="admin">Administrator</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="teknisi">Teknisi</option>
                    </select>
                </div>
                
                {/* Status Filter */}
                <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                        Filter Status
                    </label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                    >
                        <option value="all">Semua Status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Tidak Aktif</option>
                    </select>
                </div>
            </div>
            
            {/* Active Filters Display */}
            {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-600">Filter aktif:</span>
                        {searchTerm && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Pencarian: "{searchTerm}"
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {roleFilter !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Role: {roleFilter === 'admin' ? 'Administrator' : roleFilter === 'supervisor' ? 'Supervisor' : 'Teknisi'}
                                <button
                                    onClick={() => setRoleFilter('all')}
                                    className="ml-1 text-green-600 hover:text-green-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {statusFilter !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Status: {statusFilter === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className="ml-1 text-purple-600 hover:text-purple-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setRoleFilter('all');
                                setStatusFilter('all');
                            }}
                            className="text-sm text-red-600 hover:text-red-800 underline"
                        >
                            Hapus Semua Filter
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterSection;
