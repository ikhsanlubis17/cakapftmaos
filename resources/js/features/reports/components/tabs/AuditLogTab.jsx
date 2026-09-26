import React from "react";
import {
    DocumentTextIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserIcon,
    EyeIcon,
    DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";

export const AuditLogTab = ({
    auditStats,
    filters,
    setFilters,
    auditLogs,
    loading,
    handleExportAuditLogs,
    setSelectedLog,
    setShowDetailModal,
}) => {
    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center">
                        <div className="p-3 rounded-[6px] bg-[#041562]/10 text-[#041562] border border-[#041562]/20">
                            <DocumentTextIcon className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Total Logs
                            </p>
                            <p className="text-2xl font-black text-slate-900 font-mono">
                                {auditStats.total_logs}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center">
                        <div className="p-3 rounded-[6px] bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <CheckCircleIcon className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Berhasil
                            </p>
                            <p className="text-2xl font-black text-emerald-700 font-mono">
                                {auditStats.successful_logs}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center">
                        <div className="p-3 rounded-[6px] bg-rose-50 text-rose-600 border border-rose-200">
                            <XCircleIcon className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Gagal / Dicegah
                            </p>
                            <p className="text-2xl font-black text-rose-700 font-mono">
                                {auditStats.failed_logs}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center">
                        <div className="p-3 rounded-[6px] bg-slate-100 text-slate-700 border border-slate-200">
                            <UserIcon className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Teknisi Aktif
                            </p>
                            <p className="text-2xl font-black text-slate-900 font-mono">
                                {auditStats.unique_users}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        Pencarian Jejak Audit Aktivitas
                    </h3>
                    <button
                        type="button"
                        onClick={handleExportAuditLogs}
                        disabled={loading}
                        className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] border border-transparent text-xs font-bold uppercase tracking-wider rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] shadow-sm disabled:opacity-50 transition-colors"
                    >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-1.5" />
                        Ekspor Audit Log (JSON)
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Nama Teknisi..."
                        value={filters.user_name}
                        onChange={(e) =>
                            setFilters({ ...filters, user_name: e.target.value })
                        }
                        className="px-3.5 py-2.5 min-h-[44px] border border-slate-300 rounded-[6px] text-sm focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                    />
                    <input
                        type="text"
                        placeholder="Nomor Seri APAR..."
                        value={filters.apar_serial}
                        onChange={(e) =>
                            setFilters({ ...filters, apar_serial: e.target.value })
                        }
                        className="px-3.5 py-2.5 min-h-[44px] border border-slate-300 rounded-[6px] text-sm font-mono focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                    />
                    <select
                        value={filters.action}
                        onChange={(e) =>
                            setFilters({ ...filters, action: e.target.value })
                        }
                        className="px-3.5 py-2.5 min-h-[44px] border border-slate-300 rounded-[6px] text-sm focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                    >
                        <option value="">Semua Aksi</option>
                        <option value="scan_qr">Scan QR</option>
                        <option value="start_inspection">Mulai Inspeksi</option>
                        <option value="submit_inspection">Submit Inspeksi</option>
                        <option value="validation_failed">Validasi Gagal</option>
                    </select>
                    <input
                        type="text"
                        placeholder="IP Address..."
                        value={filters.ip_address}
                        onChange={(e) =>
                            setFilters({ ...filters, ip_address: e.target.value })
                        }
                        className="px-3.5 py-2.5 min-h-[44px] border border-slate-300 rounded-[6px] text-sm font-mono focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                    />
                    <select
                        value={filters.is_successful}
                        onChange={(e) =>
                            setFilters({ ...filters, is_successful: e.target.value })
                        }
                        className="px-3.5 py-2.5 min-h-[44px] border border-slate-300 rounded-[6px] text-sm focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                    >
                        <option value="">Semua Status Operasi</option>
                        <option value="1">Berhasil</option>
                        <option value="0">Gagal / Ditolak</option>
                    </select>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                        Catatan Aktivitas Sistem ({auditLogs.length})
                    </h3>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-10 h-10 border-2 border-slate-200 border-t-[#11468F] rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Memuat data jejak audit...
                        </p>
                    </div>
                ) : auditLogs.length === 0 ? (
                    <div className="p-12 text-center">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                        <h3 className="text-sm font-bold text-slate-900">
                            Tidak ada audit log ditemukan
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Sesuaikan filter pencarian Anda di atas.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                            <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3.5">Waktu Kejadian</th>
                                    <th className="px-6 py-3.5">Teknisi</th>
                                    <th className="px-6 py-3.5">Tabung APAR</th>
                                    <th className="px-6 py-3.5">Aksi</th>
                                    <th className="px-6 py-3.5">IP Address</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5 text-right">Detail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {auditLogs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-slate-50/80 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-semibold text-slate-800">
                                            {new Date(log.created_at).toLocaleString("id-ID")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-900">
                                            {log.user?.name || log.user_name || "Sistem"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-slate-700">
                                            {log.apar?.serial_number || log.apar_serial || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-700">
                                            {log.action}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-600">
                                            {log.ip_address || "127.0.0.1"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider border ${
                                                    log.is_successful
                                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                        : "bg-rose-50 text-rose-800 border-rose-200"
                                                }`}
                                            >
                                                {log.is_successful ? "Berhasil" : "Gagal"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedLog(log);
                                                    setShowDetailModal(true);
                                                }}
                                                className="p-1.5 rounded-[4px] text-slate-600 hover:text-[#11468F] hover:bg-slate-100 border border-slate-200 transition-colors"
                                                title="Lihat Detail Log"
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogTab;
