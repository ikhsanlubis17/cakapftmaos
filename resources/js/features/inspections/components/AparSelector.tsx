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
        <div className="min-h-screen bg-slate-50 py-6 pb-20">
            <div className="max-w-4xl mx-auto px-4 space-y-6">
                {/* Header */}
                <div className="bg-white rounded-[6px] p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center shadow-sm">
                            <FireIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                Pilih APAR untuk Inspeksi
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Pilih APAR yang akan diinspeksi atau gunakan scan QR Code
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-[6px] p-4 border border-slate-200 shadow-sm">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Cari berdasarkan nomor seri, lokasi, atau jenis APAR..."
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] text-sm"
                        />
                    </div>
                </div>

                {/* APAR List */}
                {isLoading ? (
                    <div className="text-center py-12 bg-white rounded-[6px] border border-slate-200 shadow-sm">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#11468F] mx-auto mb-3"></div>
                        <p className="text-xs text-slate-500 font-medium">Memuat daftar APAR...</p>
                    </div>
                ) : aparList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {aparList.map((apar) => (
                            <div
                                key={apar.id}
                                onClick={() => onAparSelect(apar)}
                                className="p-4 bg-white border border-slate-200 rounded-[6px] hover:border-slate-400 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                            >
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="p-2 bg-slate-100 rounded-[6px] text-[#041562] group-hover:bg-[#041562] group-hover:text-white transition-colors">
                                        <FireIcon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 font-mono text-sm">
                                            {apar.serial_number}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {apar.aparType?.name || 'Tidak ada jenis'}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1.5 text-xs text-slate-600">
                                    <p>
                                        <strong className="text-slate-700">Lokasi:</strong> {apar.location_name || 'Tidak ada lokasi'}
                                    </p>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                        <span className="text-slate-500 font-medium">Status:</span>
                                        <span
                                            className={`px-2 py-0.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider border ${
                                                apar.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                    : apar.status === 'needs_repair'
                                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                    : apar.status === 'inactive'
                                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                                    : apar.status === 'under_repair'
                                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                                    : 'bg-slate-100 text-slate-800 border-slate-200'
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
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-[6px] border border-slate-200 shadow-sm">
                        <FireIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600 text-sm font-semibold">
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
