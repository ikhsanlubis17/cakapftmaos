import React from 'react';
import { FireIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { Apar } from '@/types/inspection.types';

interface AparSelectorProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    aparList: Apar[];
    onAparSelect: (apar: Apar) => void;
    isLoading: boolean;
}

export const AparSelector: React.FC<AparSelectorProps> = ({
    searchTerm,
    onSearchChange,
    aparList,
    onAparSelect,
    isLoading,
}) => {
    return (
        <div className="min-h-screen bg-gray-50/50 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Header */}
                <div className="pt-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                Inspeksi APAR
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Pilih unit APAR untuk memulai inspeksi baru
                            </p>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="w-full md:w-96">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder="Cari serial number, lokasi..."
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 sm:text-sm shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* APAR List */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mb-4"></div>
                        <p className="text-gray-500 text-sm animate-pulse">Memuat data APAR...</p>
                    </div>
                ) : aparList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {aparList.map((apar) => (
                            <div
                                key={apar.id}
                                onClick={() => onAparSelect(apar)}
                                className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-200 transition-all duration-200 cursor-pointer overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-red-50 text-red-600 p-1.5 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-red-50 transition-colors duration-200">
                                                <FireIcon className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors duration-200" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                                                    {apar.serial_number}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {apar.apar_type?.name || 'Tanpa Jenis'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-500">Lokasi</span>
                                            <span className="font-medium text-gray-900 truncate max-w-[60%] text-right" title={apar.location_name}>
                                                {apar.location_name || '-'}
                                            </span>
                                        </div>
                                        
                                        <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                                apar.status === 'active'
                                                    ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                                                    : apar.status === 'needs_repair'
                                                    ? 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
                                                    : apar.status === 'under_repair'
                                                    ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
                                                    : apar.status === 'inactive'
                                                    ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                                                    : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                    apar.status === 'active' ? 'bg-green-600' :
                                                    apar.status === 'needs_repair' ? 'bg-yellow-600' :
                                                    apar.status === 'under_repair' ? 'bg-blue-600' :
                                                    apar.status === 'inactive' ? 'bg-red-600' : 'bg-gray-500'
                                                }`}></span>
                                                {apar.status === 'active' ? 'Aktif' :
                                                 apar.status === 'needs_repair' ? 'Perlu Perbaikan' :
                                                 apar.status === 'under_repair' ? 'Sedang Perbaikan' :
                                                 apar.status === 'inactive' ? 'Nonaktif' : 'Lainnya'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                            <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">Tidak ada data ditemukan</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm ? `Hasil pencarian untuk "${searchTerm}" tidak ditemukan` : 'Belum ada data APAR tersedia'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
