import React from 'react';
import { XCircleIcon } from '@heroicons/react/24/outline';

const AuditLogDetailModal = ({ isOpen, log, onClose, getActionLabel }) => {
    if (!isOpen || !log) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="relative w-full max-w-2xl bg-white rounded-[6px] border border-slate-200 shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        Detail Audit Log
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 rounded-[6px] p-1 transition-colors"
                    >
                        <XCircleIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Waktu
                            </label>
                            <p className="text-sm font-semibold text-slate-900">
                                {new Date(log.created_at).toLocaleString("id-ID")}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Teknisi
                            </label>
                            <p className="text-sm font-semibold text-slate-900">
                                {log.user?.name || "N/A"}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                APAR
                            </label>
                            <p className="text-sm font-semibold text-slate-900">
                                {log.apar?.serial_number || "N/A"}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Aksi
                            </label>
                            <p className="text-sm font-semibold text-slate-900">
                                {getActionLabel ? getActionLabel(log.action) : log.action}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                IP Address
                            </label>
                            <p className="text-sm font-mono text-slate-700">
                                {log.ip_address || "N/A"}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Status
                            </label>
                            <p className="text-sm">
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold ${
                                        log.is_successful
                                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                            : "bg-rose-50 text-rose-800 border border-rose-200"
                                    }`}
                                >
                                    {log.is_successful ? "Berhasil" : "Gagal"}
                                </span>
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Lokasi
                            </label>
                            <p className="text-sm text-slate-700">
                                {log.lat && log.lng
                                    ? `${log.lat}, ${log.lng}`
                                    : "Tidak tersedia"}
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Device Info
                            </label>
                            <p className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded-[6px] border border-slate-200">
                                {log.device_info
                                    ? JSON.stringify(log.device_info)
                                    : "Tidak diketahui"}
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                Detail
                            </label>
                            <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded-[6px] border border-slate-200">
                                {log.details || "-"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLogDetailModal;
