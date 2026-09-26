import React from "react";
import {
    DocumentArrowDownIcon,
    TableCellsIcon,
    DocumentTextIcon,
    ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

export const ReportsTab = ({
    dateRange,
    setDateRange,
    reportFormat,
    setReportFormat,
    reportTypes,
    handleExport,
    exportingReportId,
}) => {
    return (
        <div className="space-y-6">
            {/* Filter & Format Controls */}
            <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 p-5 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                    {/* Period */}
                    <div className="flex-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Periode Laporan
                        </label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all font-medium"
                        >
                            <option value="today">Hari Ini</option>
                            <option value="week">Minggu Ini</option>
                            <option value="month">Bulan Ini</option>
                            <option value="quarter">Kuartal Ini (3 Bulan)</option>
                            <option value="year">Tahun Ini</option>
                        </select>
                    </div>

                    {/* Format selector */}
                    <div className="w-full sm:w-64">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Format Berkas Unduhan
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setReportFormat("pdf")}
                                className={`inline-flex items-center justify-center px-3 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider rounded-[6px] border transition-all ${
                                    reportFormat === "pdf"
                                        ? "bg-[#041562] text-white border-[#041562] shadow-sm ring-1 ring-[#041562]"
                                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                                }`}
                            >
                                <DocumentTextIcon className="w-4 h-4 mr-1.5" />
                                PDF
                            </button>
                            <button
                                type="button"
                                onClick={() => setReportFormat("excel")}
                                className={`inline-flex items-center justify-center px-3 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider rounded-[6px] border transition-all ${
                                    reportFormat === "excel"
                                        ? "bg-[#11468F] text-white border-[#11468F] shadow-sm ring-1 ring-[#11468F]"
                                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                                }`}
                            >
                                <TableCellsIcon className="w-4 h-4 mr-1.5" />
                                Excel
                            </button>
                        </div>
                    </div>

                    {/* Active Configuration Info */}
                    <div className="w-full lg:w-auto">
                        <div className="min-h-[44px] flex items-center text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-[6px]">
                            Periode: <span className="text-slate-900 font-bold uppercase ml-1 mr-2">{dateRange}</span> | Format:{" "}
                            <span className="text-slate-900 font-bold ml-1">{reportFormat.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Types Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                {reportTypes.map((report) => {
                    const Icon = report.icon;
                    const isCardExporting = exportingReportId === report.id;
                    const isAnyExporting = !!exportingReportId;

                    return (
                        <div
                            key={report.id}
                            className="bg-white rounded-[8px] shadow-sm border border-slate-200 p-5 sm:p-6 hover:shadow-md hover:border-[#11468F]/40 transition-all flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-[6px] shadow-xs ${report.color}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                                        {reportFormat.toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1.5 group-hover:text-[#11468F] transition-colors">
                                    {report.name}
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed mb-5">
                                    {report.description}
                                </p>
                            </div>

                            <div className="pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => handleExport(report.id)}
                                    disabled={isAnyExporting}
                                    className="w-full inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isCardExporting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2" />
                                            <span>Mengunduh...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                                            <span>Unduh {reportFormat === "excel" ? "Excel" : "PDF"}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ReportsTab;
