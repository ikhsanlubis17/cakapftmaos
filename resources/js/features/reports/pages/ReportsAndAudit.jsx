import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
    DocumentChartBarIcon,
    ComputerDesktopIcon,
    CogIcon,
    DocumentTextIcon,
    FireIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import AuditLogDetailModal from "../components/AuditLogDetailModal";
import AuditLogCleanupModal from "../components/AuditLogCleanupModal";
import ReportsTab from "../components/tabs/ReportsTab";
import AuditLogTab from "../components/tabs/AuditLogTab";
import MaintenanceTab from "../components/tabs/MaintenanceTab";

const STORAGE_TAB_KEY = "cakap_reports_active_tab";
const STORAGE_PERIOD_KEY = "cakap_reports_period";
const STORAGE_FORMAT_KEY = "cakap_reports_format";

const VALID_TABS = ["reports", "audit", "maintenance"];
const VALID_PERIODS = ["today", "week", "month", "quarter", "year"];
const VALID_FORMATS = ["pdf", "excel"];

const getInitialValue = (paramKey, storageKey, validList, fallback) => {
    if (typeof window !== "undefined") {
        try {
            const params = new URLSearchParams(window.location.search);
            const fromUrl = params.get(paramKey);
            if (fromUrl && validList.includes(fromUrl)) {
                return fromUrl;
            }
            const fromStorage = localStorage.getItem(storageKey);
            if (fromStorage && validList.includes(fromStorage)) {
                return fromStorage;
            }
        } catch (e) {
            console.warn("Error reading stored reports preferences:", e);
        }
    }
    return fallback;
};

const ReportsAndAudit = () => {
    const { showSuccess, showError } = useToast();
    const { apiClient, user } = useAuth();
    const { isOpen, config, confirm, close } = useConfirmDialog();

    const [activeTab, setActiveTab] = useState(() =>
        getInitialValue("tab", STORAGE_TAB_KEY, VALID_TABS, "reports")
    );
    const [dateRange, setDateRange] = useState(() =>
        getInitialValue("period", STORAGE_PERIOD_KEY, VALID_PERIODS, "quarter")
    );
    const [reportFormat, setReportFormat] = useState(() =>
        getInitialValue("format", STORAGE_FORMAT_KEY, VALID_FORMATS, "pdf")
    );
    const [exportingReportId, setExportingReportId] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditStats, setAuditStats] = useState({
        total_logs: 0,
        successful_logs: 0,
        failed_logs: 0,
        unique_users: 0,
    });
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
    });

    // Persist user selection and sync to URL search params without page reload
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(STORAGE_TAB_KEY, activeTab);
                localStorage.setItem(STORAGE_PERIOD_KEY, dateRange);
                localStorage.setItem(STORAGE_FORMAT_KEY, reportFormat);

                const url = new URL(window.location.href);
                url.searchParams.set("tab", activeTab);
                url.searchParams.set("period", dateRange);
                url.searchParams.set("format", reportFormat);
                window.history.replaceState({}, "", url.toString());
            } catch (e) {
                console.warn("Error saving reports preferences:", e);
            }
        }
    }, [activeTab, dateRange, reportFormat]);

    // Safety fallback: ensure non-admin users don't get stuck on maintenance tab if previously stored
    useEffect(() => {
        if (user && user.role !== "admin" && activeTab === "maintenance") {
            setActiveTab("reports");
        }
    }, [user, activeTab]);

    // Queries
    const { data: auditStatsData } = useQuery({
        queryKey: ["auditStats"],
        queryFn: async () => {
            const res = await apiClient.get("/api/audit-logs/stats");
            return res.data;
        },
    });

    const { data: cleanupStatsData, refetch: refetchCleanupStats } = useQuery({
        queryKey: ["cleanupStats"],
        queryFn: async () => {
            const res = await apiClient.get("/api/audit-logs/cleanup-stats");
            return res.data;
        },
        enabled: user?.role === "admin",
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
                if (filters[key]) params.append(key, String(filters[key]));
            });
            const res = await apiClient.get(`/api/audit-logs?${params.toString()}`);
            const resData = res.data;
            return Array.isArray(resData) ? resData : (resData?.data || []);
        },
        keepPreviousData: true,
    });

    useEffect(() => {
        if (auditStatsData) setAuditStats(auditStatsData);
    }, [auditStatsData]);

    useEffect(() => {
        if (cleanupStatsData) setCleanupStats(cleanupStatsData);
    }, [cleanupStatsData]);

    useEffect(() => {
        if (auditLogsData) setAuditLogs(auditLogsData);
    }, [auditLogsData]);

    const reportTypes = [
        {
            id: "monthly",
            name: "Laporan Bulanan",
            description: "Ringkasan kesiapan operasional seluruh APAR dan mobil tangki per bulan",
            icon: DocumentTextIcon,
            color: "bg-blue-50 text-[#11468F] border border-blue-200",
        },
        {
            id: "damage",
            name: "Laporan Kerusakan",
            description: "Daftar kerusakan tabung, temuan inspeksi, dan riwayat perbaikan",
            icon: ExclamationTriangleIcon,
            color: "bg-rose-50 text-[#DA1212] border border-rose-200",
        },
        {
            id: "readiness",
            name: "Laporan Kesiapan",
            description: "Analisis kesiapan proteksi kebakaran objek vital nasional FT Maos",
            icon: FireIcon,
            color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        },
        {
            id: "audit",
            name: "Laporan Audit Log",
            description: "Jejak aktivitas digital teknisi lapangan dan riwayat operasional sistem",
            icon: ComputerDesktopIcon,
            color: "bg-slate-100 text-slate-700 border border-slate-200",
        },
    ];

    const handleExport = async (reportType) => {
        try {
            setExportingReportId(reportType);
            const params = new URLSearchParams({
                type: reportType,
                period: dateRange,
                format: reportFormat,
            });
            const response = await apiClient.get(
                `/api/reports/generate?${params.toString()}`,
                { responseType: "blob" }
            );

            const contentType = response.headers["content-type"];
            if (contentType && contentType.includes("application/json")) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result);
                        showError(errorData.message || "Gagal mengunduh laporan");
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
                `laporan-${reportType}-${dateRange}-${new Date().toISOString().split("T")[0]}.${extension}`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showSuccess(`Laporan berhasil diunduh (${reportFormat.toUpperCase()}).`);
        } catch (error) {
            console.error("Error exporting report:", error);
            showError("Gagal mengunduh laporan. Silakan coba lagi.");
        } finally {
            setExportingReportId(null);
        }
    };

    const handleExportAuditLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            Object.keys(filters).forEach((key) => {
                if (filters[key]) {
                    params.append(key, String(filters[key]));
                }
            });
            const response = await apiClient.get(
                `/api/audit-logs/export?${params.toString()}`
            );

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

            showSuccess("Data audit log berhasil diekspor.");
        } catch (error) {
            console.error("Error exporting audit logs:", error);
            showError("Gagal mengekspor data audit log.");
        } finally {
            setLoading(false);
        }
    };

    const handleCleanup = async () => {
        try {
            setLoading(true);
            const response = await apiClient.post("/api/audit-logs/cleanup", {
                days_to_keep: cleanupDays,
                days: cleanupDays,
            });

            showSuccess(response.data?.message || "Audit log berhasil dibersihkan.");
            refetchCleanupStats();
            setTimeout(() => {
                refetchAuditLogs();
            }, 300);
            setShowCleanupModal(false);
        } catch (error) {
            console.error("Error cleaning up audit logs:", error);
            showError(error.response?.data?.message || "Gagal membersihkan audit log.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center font-bold shadow-sm">
                        <DocumentChartBarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Laporan & Audit
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Pusat unduh laporan eksekutif berkala, pelacakan jejak digital audit log, dan pemeliharaan database
                        </p>
                    </div>
                </div>
                <div className="flex items-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-[4px] text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Sistem Siaga Operasional
                    </span>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border border-slate-200 rounded-[8px] shadow-sm px-4 overflow-x-auto">
                <nav className="flex space-x-6 min-w-max">
                    <button
                        type="button"
                        onClick={() => setActiveTab("reports")}
                        className={`py-3.5 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                            activeTab === "reports"
                                ? "border-[#11468F] text-[#11468F]"
                                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                        }`}
                    >
                        <DocumentChartBarIcon className="h-4 w-4 inline mr-2" />
                        Laporan Operasional
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("audit")}
                        className={`py-3.5 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                            activeTab === "audit"
                                ? "border-[#11468F] text-[#11468F]"
                                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                        }`}
                    >
                        <ComputerDesktopIcon className="h-4 w-4 inline mr-2" />
                        Jejak Audit Log
                    </button>
                    {user?.role === "admin" && (
                        <button
                            type="button"
                            onClick={() => setActiveTab("maintenance")}
                            className={`py-3.5 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                                activeTab === "maintenance"
                                    ? "border-[#11468F] text-[#11468F]"
                                    : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                            }`}
                        >
                            <CogIcon className="h-4 w-4 inline mr-2" />
                            Pemeliharaan DB
                        </button>
                    )}
                </nav>
            </div>

            {/* Tab Contents */}
            {activeTab === "reports" && (
                <ReportsTab
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    reportFormat={reportFormat}
                    setReportFormat={setReportFormat}
                    reportTypes={reportTypes}
                    handleExport={handleExport}
                    exportingReportId={exportingReportId}
                />
            )}

            {activeTab === "audit" && (
                <AuditLogTab
                    auditStats={auditStats}
                    filters={filters}
                    setFilters={setFilters}
                    auditLogs={auditLogs}
                    loading={loading}
                    handleExportAuditLogs={handleExportAuditLogs}
                    setSelectedLog={setSelectedLog}
                    setShowDetailModal={setShowDetailModal}
                />
            )}

            {activeTab === "maintenance" && user?.role === "admin" && (
                <MaintenanceTab
                    cleanupStats={cleanupStats}
                    cleanupDays={cleanupDays}
                    setCleanupDays={setCleanupDays}
                    setShowCleanupModal={setShowCleanupModal}
                    loading={loading}
                />
            )}

            {/* Modals */}
            <AuditLogDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                log={selectedLog}
            />

            <AuditLogCleanupModal
                isOpen={showCleanupModal}
                onClose={() => setShowCleanupModal(false)}
                cleanupDays={cleanupDays}
                setCleanupDays={setCleanupDays}
                cleanupStats={cleanupStats}
                handleCleanup={handleCleanup}
                loading={loading}
            />

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
