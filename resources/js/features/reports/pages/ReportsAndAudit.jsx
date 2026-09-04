import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
    DocumentArrowDownIcon,
    CalendarIcon,
    ChartBarIcon,
    FireIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    DocumentTextIcon,
    TableCellsIcon,
    ComputerDesktopIcon,
    EyeIcon,
    ClockIcon,
    UserIcon,
    MapPinIcon,
    CheckCircleIcon,
    XCircleIcon,
    CameraIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    InformationCircleIcon,
    ShieldExclamationIcon,
    DocumentChartBarIcon,
    CalendarDaysIcon,
    TrashIcon,
    CogIcon,
} from "@heroicons/react/24/outline";

const ReportsAndAudit = () => {
    const { showSuccess, showError } = useToast();
    const { apiClient } = useAuth();
    const { isOpen, config, confirm, close } = useConfirmDialog();
    const [activeTab, setActiveTab] = useState("reports");
    const [dateRange, setDateRange] = useState("quarter");
    const [reportFormat, setReportFormat] = useState("pdf");
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditStats, setAuditStats] = useState({
        total_logs: 0,
        successful_logs: 0,
        failed_logs: 0,
        unique_users: 0,
    });
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [cleanupStats, setCleanupStats] = useState({});
    const [showCleanupModal, setShowCleanupModal] = useState(false);
    const [cleanupDays, setCleanupDays] = useState(90);
    const [filters, setFilters] = useState({
        user_name: "",
        apar_serial: "",
        action: "",
        ip_address: "",
        is_successful: "",
        show_anomalies_only: false,
    });

    // Queries
    const { data: auditStatsData } = useQuery({
        queryKey: ["auditStats"],
        queryFn: async () => {
            const res = await apiClient.get("/api/audit-logs/stats");
            return res.data;
        },
    });

    const { data: anomaliesData } = useQuery({
        queryKey: ["anomalies"],
        queryFn: async () => {
            const res = await apiClient.get("/api/audit-logs/anomalies");
            return res.data;
        },
    });

    const { data: cleanupStatsData, refetch: refetchCleanupStats } = useQuery({
        queryKey: ["cleanupStats"],
        queryFn: async () => {
            const res = await apiClient.get("/api/audit-logs/cleanup-stats");
            return res.data;
        },
    });

    const {
        data: auditLogsData,
        isLoading: auditLogsLoading,
        refetch: refetchAuditLogs,
    } = useQuery({
        queryKey: ["auditLogs", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.keys(filters).forEach((key) => {
                if (filters[key]) params.append(key, filters[key]);
            });
            const res = await apiClient.get(
                `/api/audit-logs?${params.toString()}`
            );
            return res.data.data || [];
        },
        keepPreviousData: true,
    });

    useEffect(() => {
        if (auditStatsData) setAuditStats(auditStatsData);
    }, [auditStatsData]);

    useEffect(() => {
        if (anomaliesData) setAnomalies(anomaliesData);
    }, [anomaliesData]);

    useEffect(() => {
        if (cleanupStatsData) setCleanupStats(cleanupStatsData);
    }, [cleanupStatsData]);

    useEffect(() => {
        setLoading(auditLogsLoading);
    }, [auditLogsLoading]);

    useEffect(() => {
        if (auditLogsData) setAuditLogs(auditLogsData);
    }, [auditLogsData]);

    const handleCleanup = async () => {
        const confirmed = await confirm({
            title: "Konfirmasi Hapus Audit Log",
            message: `Apakah Anda yakin ingin menghapus audit log yang lebih dari ${cleanupDays} hari? Tindakan ini tidak dapat dibatalkan.`,
            type: "warning",
            confirmText: "Ya, Hapus",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (!confirmed) return;

        try {
            setLoading(true);
            const response = await apiClient.post("/api/audit-logs/cleanup", {
                days: cleanupDays,
            });

            showSuccess(response.data.message);
            // refetch queries
            refetchCleanupStats();
            // small delay to ensure backend updates before refetching logs/stats
            setTimeout(() => {
                refetchAuditLogs();
            }, 300);
            setShowCleanupModal(false);
        } catch (error) {
            console.error("Error cleaning up audit logs:", error);
            showError("Gagal membersihkan audit log. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (reportType) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                type: reportType,
                period: dateRange,
                format: reportFormat,
            });
            const response = await apiClient.get(
                `/api/reports/generate?${params.toString()}`,
                {
                    responseType: "blob",
                }
            );

            // Check if response is actually a blob (success) or error JSON
            const contentType = response.headers["content-type"];
            if (contentType && contentType.includes("application/json")) {
                // This is an error response
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result);
                        showError(
                            errorData.message || "Gagal mengunduh laporan"
                        );
                    } catch (e) {
                        showError("Gagal mengunduh laporan");
                    }
                };
                reader.readAsText(response.data);
                return;
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            const extension = reportFormat === "excel" ? "xlsx" : reportFormat;
            link.setAttribute(
                "download",
                `${reportType}_${dateRange}_${
                    new Date().toISOString().split("T")[0]
                }.${extension}`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showSuccess(`Laporan ${reportType} berhasil diunduh`);
        } catch (error) {
            console.error("Error exporting report:", error);
            if (error.response?.data) {
                // Try to read error message from blob
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result);
                        showError(
                            errorData.message || "Gagal mengunduh laporan"
                        );
                    } catch (e) {
                        showError(
                            "Gagal mengunduh laporan. Silakan coba lagi."
                        );
                    }
                };
                reader.readAsText(error.response.data);
            } else {
                showError("Gagal mengunduh laporan. Silakan coba lagi.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExportAuditLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            Object.keys(filters).forEach((key) => {
                if (filters[key]) {
                    params.append(key, filters[key]);
                }
            });
            const response = await apiClient.get(
                `/api/audit-logs/export?${params.toString()}`
            );

            // Create formatted JSON with proper indentation
            const formattedData = JSON.stringify(response.data, null, 2);
            const blob = new Blob([formattedData], {
                type: "application/json",
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
                "download",
                `audit_logs_${new Date().toISOString().split("T")[0]}.json`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting audit logs:", error);
            showError("Gagal mengunduh audit logs. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    const getAnomalyIcon = (type) => {
        switch (type) {
            case "fast_inspection":
                return <ClockIcon className="h-5 w-5 text-red-600" />;
            case "off_hours":
                return (
                    <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
                );
            case "duplicate_photo":
                return <CameraIcon className="h-5 w-5 text-purple-600" />;
            default:
                return (
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                );
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case "high":
                return "bg-red-100 text-red-800 border-red-200";
            case "medium":
                return "bg-orange-100 text-orange-800 border-orange-200";
            case "low":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getActionLabel = (action) => {
        switch (action) {
            case "scan_qr":
                return "Scan QR Code";
            case "start_inspection":
                return "Mulai Inspeksi";
            case "submit_inspection":
                return "Submit Inspeksi";
            case "validation_failed":
                return "Validasi Gagal";
            default:
                return action
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase());
        }
    };

    const reportTypes = [
        {
            id: "inspection",
            name: "Laporan Inspeksi",
            description:
                "Laporan detail semua inspeksi APAR yang telah dilakukan",
            icon: FireIcon,
            color: "bg-[#041562] text-white",
        },
        {
            id: "summary",
            name: "Laporan Ringkasan",
            description: "Ringkasan status dan kondisi APAR secara keseluruhan",
            icon: ChartBarIcon,
            color: "bg-slate-100 text-[#041562]",
        },
        {
            id: "overdue",
            name: "Laporan Terlambat",
            description: "Daftar jadwal inspeksi yang belum dilaksanakan",
            icon: ExclamationTriangleIcon,
            color: "bg-amber-50 text-amber-700 border border-amber-200",
        },
        {
            id: "audit",
            name: "Laporan Audit Log",
            description:
                "Laporan lengkap aktivitas teknisi dengan deteksi anomali",
            icon: ComputerDesktopIcon,
            color: "bg-blue-50 text-[#11468F] border border-blue-200",
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#041562] text-white rounded-[6px] shadow-sm">
                                    <DocumentChartBarIcon className="w-8 h-8" />
                                </div>
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                                        Laporan & Audit
                                    </h1>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Generate laporan dan monitoring audit log
                                        dengan deteksi anomali - CAKAP FT MAOS
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-[3px] text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Sistem Aktif
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab("reports")}
                            className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors duration-200 ${
                                activeTab === "reports"
                                    ? "border-[#11468F] text-[#11468F]"
                                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                            }`}
                        >
                            <DocumentChartBarIcon className="h-4 w-4 inline mr-2" />
                            Laporan
                        </button>
                        <button
                            onClick={() => setActiveTab("audit")}
                            className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors duration-200 ${
                                activeTab === "audit"
                                    ? "border-[#11468F] text-[#11468F]"
                                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                            }`}
                        >
                            <ComputerDesktopIcon className="h-4 w-4 inline mr-2" />
                            Audit Log
                        </button>
                        <button
                            onClick={() => setActiveTab("anomalies")}
                            className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors duration-200 ${
                                activeTab === "anomalies"
                                    ? "border-[#11468F] text-[#11468F]"
                                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                            }`}
                        >
                            <ShieldExclamationIcon className="h-4 w-4 inline mr-2" />
                            Deteksi Anomali
                            {anomalies.length > 0 && (
                                <span className="ml-2 bg-[#11468F]/10 text-[#11468F] border border-[#11468F]/20 text-[10px] px-2 py-0.5 rounded-[3px] font-bold">
                                    {anomalies.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("maintenance")}
                            className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors duration-200 ${
                                activeTab === "maintenance"
                                    ? "border-[#11468F] text-[#11468F]"
                                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                            }`}
                        >
                            <CogIcon className="h-4 w-4 inline mr-2" />
                            Maintenance
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === "reports" && (
                    <div className="space-y-6">
                        {/* Report Filters */}
                        <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Periode Laporan
                                    </label>
                                    <select
                                        value={dateRange}
                                        onChange={(e) =>
                                            setDateRange(e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-slate-300 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-colors"
                                    >
                                        <option value="today">Hari Ini</option>
                                        <option value="week">Minggu Ini</option>
                                        <option value="month">Bulan Ini</option>
                                        <option value="quarter">
                                            Kuartal Ini
                                        </option>
                                        <option value="year">Tahun Ini</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Format File
                                    </label>
                                    <select
                                        value={reportFormat}
                                        onChange={(e) =>
                                            setReportFormat(e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-slate-300 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-colors"
                                    >
                                        <option value="pdf">PDF</option>
                                        <option value="excel">Excel</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <div className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-[6px] w-full">
                                        Periode: <span className="text-slate-900 font-bold uppercase">{dateRange}</span> | Format:{" "}
                                        <span className="text-slate-900 font-bold">{reportFormat.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Report Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {reportTypes.map((report) => (
                                <div
                                    key={report.id}
                                    className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div
                                                className={`p-3 rounded-[6px] shadow-sm ${report.color}`}
                                            >
                                                <report.icon className="h-6 w-6" />
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handleExport(report.id)
                                                }
                                                disabled={loading}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-bold uppercase tracking-wider rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                {loading ? (
                                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5"></div>
                                                ) : (
                                                    <DocumentArrowDownIcon className="h-3.5 w-3.5 mr-1" />
                                                )}
                                                Download
                                            </button>
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900 tracking-tight mb-2">
                                            {report.name}
                                        </h3>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            {report.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "audit" && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-5">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-[6px] bg-[#041562]/10 text-[#041562] border border-[#041562]/20">
                                        <DocumentTextIcon className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Total Logs
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {auditStats.total_logs}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-5">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-[6px] bg-emerald-50 text-emerald-600 border border-emerald-200">
                                        <CheckCircleIcon className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Berhasil
                                        </p>
                                        <p className="text-2xl font-bold text-emerald-700">
                                            {auditStats.successful_logs}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-5">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-[6px] bg-rose-50 text-rose-600 border border-rose-200">
                                        <XCircleIcon className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Gagal
                                        </p>
                                        <p className="text-2xl font-bold text-rose-700">
                                            {auditStats.failed_logs}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-5">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-[6px] bg-slate-100 text-slate-700 border border-slate-300">
                                        <UserIcon className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Teknisi Aktif
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {auditStats.unique_users}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                    Filter Audit Log
                                </h3>
                                <button
                                    onClick={handleExportAuditLogs}
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold uppercase tracking-wider rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2"></div>
                                    ) : (
                                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                    )}
                                    Export
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <input
                                    type="text"
                                    placeholder="Nama Teknisi"
                                    value={filters.user_name}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            user_name: e.target.value,
                                        })
                                    }
                                    className="px-3 py-2 border border-slate-300 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-colors"
                                />
                                <input
                                    type="text"
                                    placeholder="Serial APAR"
                                    value={filters.apar_serial}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            apar_serial: e.target.value,
                                        })
                                    }
                                    className="px-3 py-2 border border-slate-300 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-colors"
                                />
                                <select
                                    value={filters.action}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            action: e.target.value,
                                        })
                                    }
                                    className="px-3 py-2 border border-slate-300 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-colors"
                                >
                                    <option value="">Semua Aksi</option>
                                    <option value="scan_qr">Scan QR</option>
                                    <option value="start_inspection">
                                        Mulai Inspeksi
                                    </option>
                                    <option value="submit_inspection">
                                        Submit Inspeksi
                                    </option>
                                    <option value="validation_failed">
                                        Validasi Gagal
                                    </option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="IP Address"
                                    value={filters.ip_address}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            ip_address: e.target.value,
                                        })
                                    }
                                    className="px-3 py-2 border border-slate-300 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-colors"
                                />
                                <select
                                    value={filters.is_successful}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            is_successful: e.target.value,
                                        })
                                    }
                                    className="px-3 py-2 border border-slate-300 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-colors"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="1">Berhasil</option>
                                    <option value="0">Gagal</option>
                                </select>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={filters.show_anomalies_only}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                show_anomalies_only:
                                                    e.target.checked,
                                            })
                                        }
                                        className="rounded-[3px] border-slate-300 text-[#11468F] focus:ring-[#11468F]"
                                    />
                                    <span className="text-xs font-semibold text-slate-700">
                                        Tampilkan Anomali Saja
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Audit Logs Table */}
                        <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200">
                                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                    Audit Log
                                </h3>
                            </div>
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="w-10 h-10 border-4 border-slate-200 border-t-[#11468F] rounded-full animate-spin mx-auto"></div>
                                    <p className="mt-3 text-xs font-semibold text-slate-600">
                                        Memuat data...
                                    </p>
                                </div>
                            ) : auditLogs.length === 0 ? (
                                <div className="p-12 text-center">
                                    <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-400" />
                                    <h3 className="mt-2 text-sm font-bold text-slate-900">
                                        Tidak ada data
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Tidak ada audit log yang ditemukan.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    Waktu
                                                </th>
                                                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    Teknisi
                                                </th>
                                                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    APAR
                                                </th>
                                                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    Aksi
                                                </th>
                                                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    IP Address
                                                </th>
                                                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    Detail
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {auditLogs.map((log) => (
                                                <tr
                                                    key={log.id}
                                                    className="hover:bg-slate-50/80 transition-colors duration-150"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                        {new Date(
                                                            log.created_at
                                                        ).toLocaleString(
                                                            "id-ID"
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                                                        {log.user?.name ||
                                                            "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                        {log.apar
                                                            ?.serial_number ||
                                                            "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold bg-[#11468F]/10 text-[#11468F] border border-[#11468F]/20">
                                                            {getActionLabel(
                                                                log.action
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                                                        {log.ip_address ||
                                                            "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold ${
                                                                log.is_successful
                                                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                                    : "bg-rose-50 text-rose-800 border border-rose-200"
                                                            }`}
                                                        >
                                                            {log.is_successful
                                                                ? "Berhasil"
                                                                : "Gagal"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedLog(
                                                                    log
                                                                );
                                                                setShowDetailModal(
                                                                    true
                                                                );
                                                            }}
                                                            className="p-1.5 rounded-[6px] text-slate-600 hover:text-[#11468F] hover:bg-slate-100 border border-slate-200 transition-colors"
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
                )}

                {activeTab === "anomalies" && (
                    <div className="space-y-6">
                        {/* Anomalies Header */}
                        <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                        Deteksi Anomali
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Sistem mendeteksi aktivitas mencurigakan
                                        dalam inspeksi APAR
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Total Anomali
                                        </p>
                                        <p className="text-2xl font-bold text-rose-600">
                                            {anomalies.length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Anomalies List */}
                        <div className="space-y-4">
                            {anomalies.length === 0 ? (
                                <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-12 text-center">
                                    <ShieldExclamationIcon className="mx-auto h-12 w-12 text-slate-400" />
                                    <h3 className="mt-2 text-sm font-bold text-slate-900">
                                        Tidak ada anomali
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Tidak ada anomali yang terdeteksi dalam
                                        sistem saat ini.
                                    </p>
                                </div>
                            ) : (
                                anomalies.map((anomaly, index) => (
                                    <div
                                        key={index}
                                        className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-4">
                                                <div className="flex-shrink-0 p-2.5 bg-slate-100 rounded-[6px] border border-slate-200">
                                                    {getAnomalyIcon(
                                                        anomaly.type
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <h4 className="text-sm font-bold text-slate-900">
                                                            {anomaly.type ===
                                                                "fast_inspection" &&
                                                                "Inspeksi Terlalu Cepat"}
                                                            {anomaly.type ===
                                                                "off_hours" &&
                                                                "Inspeksi Di Luar Jam Kerja"}
                                                            {anomaly.type ===
                                                                "duplicate_photo" &&
                                                                "Foto Duplikat"}
                                                        </h4>
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold uppercase tracking-wider border ${getSeverityColor(
                                                                anomaly.severity
                                                            )}`}
                                                        >
                                                            {anomaly.severity ===
                                                                "high" &&
                                                                "Tinggi"}
                                                            {anomaly.severity ===
                                                                "medium" &&
                                                                "Sedang"}
                                                            {anomaly.severity ===
                                                                "low" &&
                                                                "Rendah"}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 mb-3">
                                                        {anomaly.description}
                                                    </p>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                                        <div>
                                                            <span className="text-slate-500 font-semibold">
                                                                Teknisi:
                                                            </span>
                                                            <span className="ml-1 font-bold text-slate-900">
                                                                {
                                                                    anomaly.user_name
                                                                }
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 font-semibold">
                                                                APAR:
                                                            </span>
                                                            <span className="ml-1 font-bold text-slate-900">
                                                                {
                                                                    anomaly.apar_serial
                                                                }
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 font-semibold">
                                                                Waktu:
                                                            </span>
                                                            <span className="ml-1 font-bold text-slate-900">
                                                                {new Date(
                                                                    anomaly.created_at
                                                                ).toLocaleString(
                                                                    "id-ID"
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "maintenance" && (
                    <div className="space-y-6">
                        {/* Maintenance Header */}
                        <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                        Maintenance & Cleanup
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Kelola penyimpanan data dan bersihkan
                                        audit log lama
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Cleanup Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-5">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-[6px] bg-[#041562]/10 text-[#041562] border border-[#041562]/20">
                                        <DocumentTextIcon className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Total Logs
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {cleanupStats.total_logs || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-5">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-[6px] bg-amber-50 text-amber-600 border border-amber-200">
                                        <ClockIcon className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            &gt; 30 Hari
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {cleanupStats.logs_older_than_30_days ||
                                                0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-5">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-[6px] bg-orange-50 text-orange-600 border border-orange-200">
                                        <ExclamationTriangleIcon className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            &gt; 90 Hari
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {cleanupStats.logs_older_than_90_days ||
                                                0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-5">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-[6px] bg-rose-50 text-rose-600 border border-rose-200">
                                        <TrashIcon className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            &gt; 180 Hari
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            {cleanupStats.logs_older_than_180_days ||
                                                0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cleanup Actions */}
                        <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                        Pembersihan Audit Log
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Hapus audit log lama untuk menghemat
                                        penyimpanan
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCleanupModal(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold uppercase tracking-wider rounded-[6px] text-white bg-[#DA1212] hover:bg-red-700 shadow-sm transition-all"
                                >
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    Bersihkan Data
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-5">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                                        Informasi Penyimpanan
                                    </h4>
                                    <div className="space-y-2 text-xs text-slate-600">
                                        <p>
                                            • Log tertua:{" "}
                                            <span className="font-semibold text-slate-900">
                                                {cleanupStats.oldest_log
                                                    ? new Date(
                                                          cleanupStats.oldest_log
                                                      ).toLocaleDateString("id-ID")
                                                    : "N/A"}
                                            </span>
                                        </p>
                                        <p>
                                            • Log terbaru:{" "}
                                            <span className="font-semibold text-slate-900">
                                                {cleanupStats.newest_log
                                                    ? new Date(
                                                          cleanupStats.newest_log
                                                      ).toLocaleDateString("id-ID")
                                                    : "N/A"}
                                            </span>
                                        </p>
                                        <p>
                                            • Log &gt; 90 hari:{" "}
                                            <span className="font-semibold text-slate-900">
                                                {cleanupStats.logs_older_than_90_days ||
                                                    0}{" "}
                                                entri
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-blue-50/70 border border-blue-200 rounded-[6px] p-5">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#041562] mb-3">
                                        Rekomendasi Pemeliharaan
                                    </h4>
                                    <div className="space-y-2 text-xs text-slate-600">
                                        <p>
                                            • Hapus log &gt; 90 hari untuk
                                            menghemat ruang penyimpanan database
                                        </p>
                                        <p>
                                            • Ekspor dan backup data audit sebelum
                                            melakukan pembersihan
                                        </p>
                                        <p>
                                            • Lakukan pembersihan secara berkala setiap kuartal
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedLog && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="relative w-full max-w-2xl bg-white rounded-[6px] border border-slate-200 shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                Detail Audit Log
                            </h3>
                            <button
                                onClick={() => setShowDetailModal(false)}
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
                                        {new Date(
                                            selectedLog.created_at
                                        ).toLocaleString("id-ID")}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                        Teknisi
                                    </label>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {selectedLog.user?.name || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                        APAR
                                    </label>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {selectedLog.apar?.serial_number ||
                                            "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                        Aksi
                                    </label>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {getActionLabel(selectedLog.action)}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                        IP Address
                                    </label>
                                    <p className="text-sm font-mono text-slate-700">
                                        {selectedLog.ip_address || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                        Status
                                    </label>
                                    <p className="text-sm">
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold ${
                                                selectedLog.is_successful
                                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                    : "bg-rose-50 text-rose-800 border border-rose-200"
                                            }`}
                                        >
                                            {selectedLog.is_successful
                                                ? "Berhasil"
                                                : "Gagal"}
                                        </span>
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                        Lokasi
                                    </label>
                                    <p className="text-sm text-slate-700">
                                        {selectedLog.lat && selectedLog.lng
                                            ? `${selectedLog.lat}, ${selectedLog.lng}`
                                            : "Tidak tersedia"}
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                        Device Info
                                    </label>
                                    <p className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded-[6px] border border-slate-200">
                                        {selectedLog.device_info
                                            ? JSON.stringify(
                                                  selectedLog.device_info
                                              )
                                            : "Tidak diketahui"}
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                        Detail
                                    </label>
                                    <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded-[6px] border border-slate-200">
                                        {selectedLog.details || "-"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cleanup Modal */}
            {showCleanupModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="relative w-full max-w-md bg-white rounded-[6px] border border-slate-200 shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                Pembersihan Audit Log
                            </h3>
                            <button
                                onClick={() => setShowCleanupModal(false)}
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
                                            {cleanupStats[
                                                `logs_older_than_${cleanupDays}_days`
                                            ] || 0}{" "}
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
                                onClick={() => setShowCleanupModal(false)}
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
            )}
            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={isOpen}
                onClose={close}
                onConfirm={config.onConfirm}
                title={config.title}
                message={config.message}
                type={config.type}
                confirmText={config.confirmText}
                cancelText={config.cancelText}
                confirmButtonColor={config.confirmButtonColor}
            />
        </div>
    );
};

export default ReportsAndAudit;
