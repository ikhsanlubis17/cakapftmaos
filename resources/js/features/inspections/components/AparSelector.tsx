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
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
            <div className="max-w-4xl mx-auto p-4 space-y-6">
                {/* Header */}
                <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                            <FireIcon className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Pilih APAR untuk Inspeksi
                            </h1>
                            <p className="text-gray-600">
                                Pilih APAR yang akan diinspeksi atau scan QR Code
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Cari berdasarkan nomor seri, lokasi, atau jenis APAR..."
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg"
                        />
                    </div>
                </div>

                {/* APAR List */}
                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Memuat daftar APAR...</p>
                    </div>
                ) : aparList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {aparList.map((apar) => (
                            <div
                                key={apar.id}
                                onClick={() => onAparSelect(apar)}
                                className="p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                            >
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                                        <FireIcon className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            APAR {apar.serial_number}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {apar.aparType?.name || 'Tidak ada jenis'}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <p>
                                        <strong>Lokasi:</strong> {apar.location_name || 'Tidak ada lokasi'}
                                    </p>
                                    <p>
                                        <strong>Status:</strong>
                                        <span
                                            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                                apar.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : apar.status === 'needs_repair'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : apar.status === 'inactive'
                                                    ? 'bg-red-100 text-red-800'
                                                    : apar.status === 'under_repair'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {apar.status === 'active'
                                                ? 'Aktif'
                                                : apar.status === 'needs_repair'
                                                ? 'Perlu Perbaikan'
                                                : apar.status === 'inactive'
                                                ? 'Nonaktif'
                                                : apar.status === 'under_repair'
                                                ? 'Sedang Perbaikan'
                                                : 'Tidak Diketahui'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <FireIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">
                            {searchTerm
                                ? 'Tidak ada APAR yang sesuai dengan pencarian'
                                : 'Belum ada APAR tersedia'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
