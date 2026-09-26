import React from 'react';
import { XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const AuditLogCleanupModal = ({
    isOpen,
    onClose,
    cleanupDays,
    setCleanupDays,
    cleanupStats,
    handleCleanup,
    loading,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="relative w-full max-w-md bg-white rounded-[6px] border border-slate-200 shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        Pembersihan Audit Log
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 rounded-[6px] p-1 transition-colors"
                    >
                        <XCircleIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-rose-50 border border-rose-200 rounded-[6px] p-4">
                        <div className="flex">
                            <ExclamationTriangleIcon className="h-5 w-5 text-rose-500 shrink-0" />
                            <div className="ml-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                                    Peringatan
                                </h4>
                                <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                                    Tindakan ini akan menghapus audit
                                    log secara permanen dari database dan tidak dapat
                                    dibatalkan.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Hapus log yang lebih dari
                        </label>
                        <select
                            value={cleanupDays}
                            onChange={(e) =>
                                setCleanupDays(parseInt(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-colors"
                        >
                            <option value={30}>30 hari</option>
                            <option value={60}>60 hari</option>
                            <option value={90}>90 hari</option>
                            <option value={180}>180 hari</option>
                            <option value={365}>1 tahun</option>
                        </select>
                    </div>

                    <div className="bg-slate-50 rounded-[6px] border border-slate-200 p-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                            Ringkasan
                        </h4>
                        <div className="text-xs text-slate-600 space-y-1">
                            <p>
                                • Log yang akan dihapus:{" "}
                                <span className="font-bold text-slate-900">
                                    {(cleanupStats && cleanupStats[
                                        `logs_older_than_${cleanupDays}_days`
                                    ]) || 0}{" "}
                                    entri
                                </span>
                            </p>
                            <p>
                                • Tanggal cutoff:{" "}
                                <span className="font-bold text-slate-900">
                                    {new Date(
                                        Date.now() -
                                            cleanupDays *
                                                24 *
                                                60 *
                                                60 *
                                                1000
                                    ).toLocaleDateString("id-ID")}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-2.5 p-6 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-300 rounded-[6px] text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleCleanup}
                        disabled={loading}
                        className="px-4 py-2 bg-[#DA1212] text-white rounded-[6px] text-xs font-bold uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex items-center"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2"></div>
                                Memproses...
                            </>
                        ) : (
                            "Hapus Data"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditLogCleanupModal;
