import React from "react";
import {
    DocumentTextIcon,
    TrashIcon,
    CalendarDaysIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export const MaintenanceTab = ({
    cleanupStats,
    cleanupDays,
    setCleanupDays,
    setShowCleanupModal,
    loading,
}) => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 p-5 sm:p-6">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Pemeliharaan & Pembersihan Jejak Audit
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                    Kelola kapasitas penyimpanan database dan hapus data log lawas yang telah melewati masa retensi
                </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center">
                        <div className="p-3 rounded-[6px] bg-[#041562]/10 text-[#041562] border border-[#041562]/20">
                            <DocumentTextIcon className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Total Data Log
                            </p>
                            <p className="text-2xl font-black text-slate-900 font-mono">
                                {cleanupStats.total_logs || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center">
                        <div className="p-3 rounded-[6px] bg-amber-50 text-amber-600 border border-amber-200">
                            <CalendarDaysIcon className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                &gt; 90 Hari
                            </p>
                            <p className="text-2xl font-black text-amber-700 font-mono">
                                {cleanupStats.logs_older_than_90_days || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center">
                        <div className="p-3 rounded-[6px] bg-rose-50 text-rose-600 border border-rose-200">
                            <TrashIcon className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                &gt; 180 Hari
                            </p>
                            <p className="text-2xl font-black text-rose-700 font-mono">
                                {cleanupStats.logs_older_than_180_days || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center">
                        <div className="p-3 rounded-[6px] bg-slate-100 text-slate-700 border border-slate-200">
                            <ExclamationTriangleIcon className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                &gt; 365 Hari
                            </p>
                            <p className="text-2xl font-black text-slate-900 font-mono">
                                {cleanupStats.logs_older_than_365_days || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 p-5 sm:p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Pembersihan Data Terjadwal
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Pilih batas retensi hari dan bersihkan catatan log yang sudah usang
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="w-full sm:w-64">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Batas Retensi Usia Log
                        </label>
                        <select
                            value={cleanupDays}
                            onChange={(e) => setCleanupDays(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                        >
                            <option value={30}>Lebih dari 30 Hari</option>
                            <option value={60}>Lebih dari 60 Hari</option>
                            <option value={90}>Lebih dari 90 Hari (Rekomendasi)</option>
                            <option value={180}>Lebih dari 180 Hari</option>
                            <option value={365}>Lebih dari 365 Hari (1 Tahun)</option>
                        </select>
                    </div>

                    <div className="sm:self-end">
                        <button
                            type="button"
                            onClick={() => setShowCleanupModal(true)}
                            disabled={loading}
                            className="inline-flex items-center justify-center px-5 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-[6px] shadow-sm transition-colors"
                        >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Bersihkan Log Sekarang
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceTab;
