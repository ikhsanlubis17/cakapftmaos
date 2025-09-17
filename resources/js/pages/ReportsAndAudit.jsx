import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';
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
} from '@heroicons/react/24/outline';

const ReportsAndAudit = () => {
    const { showSuccess, showError } = useToast();
    const { isOpen, config, confirm, close } = useConfirmDialog();
    const [activeTab, setActiveTab] = useState('reports');
    const [dateRange, setDateRange] = useState('quarter');
    const [reportFormat, setReportFormat] = useState('pdf');
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
        user_name: '',
        apar_serial: '',
        action: '',
        ip_address: '',
        is_successful: '',
        show_anomalies_only: false,
    });

    useEffect(() => {
        fetchReports();
    }, [dateRange]);

    useEffect(() => {
        fetchAuditLogs();
        fetchAuditStats();
        fetchAnomalies();
        fetchCleanupStats();
    }, [filters]);

    const fetchReports = async () => {
        // Placeholder for reports data
        console.log('Fetching reports for period:', dateRange);
    };

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    params.append(key, filters[key]);
                }
            });
            
            const response = await axios.get(`/api/audit-logs?${params.toString()}`);
            setAuditLogs(response.data.data || []);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            setAuditLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditStats = async () => {
        try {
            const response = await axios.get('/api/audit-logs/stats');
            setAuditStats(response.data);
        } catch (error) {
            console.error('Error fetching audit stats:', error);
            setAuditStats({
                total_logs: 0,
                successful_logs: 0,
                failed_logs: 0,
                unique_users: 0,
            });
        }
    };

    const fetchAnomalies = async () => {
        try {
            const response = await axios.get('/api/audit-logs/anomalies');
            setAnomalies(response.data);
        } catch (error) {
            console.error('Error fetching anomalies:', error);
            setAnomalies([]);
        }
    };

    const fetchCleanupStats = async () => {
        try {
            const response = await axios.get('/api/audit-logs/cleanup-stats');
            setCleanupStats(response.data);
        } catch (error) {
            console.error('Error fetching cleanup stats:', error);
            setCleanupStats({});
        }
    };

    const handleCleanup = async () => {
        const confirmed = await confirm({
            title: 'Konfirmasi Hapus Audit Log',
            message: `Apakah Anda yakin ingin menghapus audit log yang lebih dari ${cleanupDays} hari? Tindakan ini tidak dapat dibatalkan.`,
            type: 'warning',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            confirmButtonColor: 'red'
        });

        if (!confirmed) return;

        try {
            setLoading(true);
            const response = await axios.post('/api/audit-logs/cleanup', {
                days: cleanupDays
            });
            
            showSuccess(response.data.message);
            fetchCleanupStats();
            fetchAuditStats();
            fetchAuditLogs();
            setShowCleanupModal(false);
        } catch (error) {
            console.error('Error cleaning up audit logs:', error);
            showError('Gagal membersihkan audit log. Silakan coba lagi.');
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
            
            const response = await axios.get(`/api/reports/generate?${params.toString()}`, {
                responseType: 'blob',
            });
            
            // Check if response is actually a blob (success) or error JSON
            const contentType = response.headers['content-type'];
            if (contentType && contentType.includes('application/json')) {
                // This is an error response
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result);
                        showError(errorData.message || 'Gagal mengunduh laporan');
                    } catch (e) {
                        showError('Gagal mengunduh laporan');
                    }
                };
                reader.readAsText(response.data);
                return;
            }
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const extension = reportFormat === 'excel' ? 'xlsx' : reportFormat;
            link.setAttribute('download', `${reportType}_${dateRange}_${new Date().toISOString().split('T')[0]}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            showSuccess(`Laporan ${reportType} berhasil diunduh`);
        } catch (error) {
            console.error('Error exporting report:', error);
            if (error.response?.data) {
                // Try to read error message from blob
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result);
                        showError(errorData.message || 'Gagal mengunduh laporan');
                    } catch (e) {
                        showError('Gagal mengunduh laporan. Silakan coba lagi.');
                    }
                };
                reader.readAsText(error.response.data);
            } else {
                showError('Gagal mengunduh laporan. Silakan coba lagi.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExportAuditLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    params.append(key, filters[key]);
                }
            });
            
            const response = await axios.get(`/api/audit-logs/export?${params.toString()}`);
            
            // Create formatted JSON with proper indentation
            const formattedData = JSON.stringify(response.data, null, 2);
            const blob = new Blob([formattedData], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting audit logs:', error);
            showError('Gagal mengunduh audit logs. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const getAnomalyIcon = (type) => {
        switch (type) {
            case 'fast_inspection':
                return <ClockIcon className="h-5 w-5 text-red-600" />;
            case 'off_hours':
                return <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />;
            case 'duplicate_photo':
                return <CameraIcon className="h-5 w-5 text-purple-600" />;
            default:
                return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'medium':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'low':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getActionLabel = (action) => {
        switch (action) {
            case 'scan_qr':
                return 'Scan QR Code';
            case 'start_inspection':
                return 'Mulai Inspeksi';
            case 'submit_inspection':
                return 'Submit Inspeksi';
            case 'validation_failed':
                return 'Validasi Gagal';
            default:
                return action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    };

    const reportTypes = [
        {
            id: 'inspection',
            name: 'Laporan Inspeksi',
            description: 'Laporan detail semua inspeksi APAR yang telah dilakukan',
            icon: FireIcon,
            color: 'bg-red-100 text-red-600',
        },
        {
            id: 'summary',
            name: 'Laporan Ringkasan',
            description: 'Ringkasan status dan kondisi APAR secara keseluruhan',
            icon: ChartBarIcon,
            color: 'bg-blue-100 text-blue-600',
        },
        {
            id: 'overdue',
            name: 'Laporan Terlambat',
            description: 'Daftar jadwal inspeksi yang belum dilaksanakan',
            icon: ExclamationTriangleIcon,
            color: 'bg-yellow-100 text-yellow-600',
        },
        {
            id: 'audit',
            name: 'Laporan Audit Log',
            description: 'Laporan lengkap aktivitas teknisi dengan deteksi anomali',
            icon: ComputerDesktopIcon,
            color: 'bg-purple-100 text-purple-600',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Laporan & Audit
                                </h1>
                                <p className="mt-2 text-gray-600">
                                    Generate laporan dan monitoring audit log
                                    dengan deteksi anomali - CAKAP FT MAOS
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                    Sistem Aktif
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab("reports")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                activeTab === "reports"
                                    ? "border-red-500 text-red-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            <DocumentChartBarIcon className="h-5 w-5 inline mr-2" />
                            Laporan
                        </button>
                        <button
                            onClick={() => setActiveTab("audit")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                activeTab === "audit"
                                    ? "border-red-500 text-red-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            <ComputerDesktopIcon className="h-5 w-5 inline mr-2" />
                            Audit Log
                        </button>
                        <button
                            onClick={() => setActiveTab("anomalies")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                activeTab === "anomalies"
                                    ? "border-red-500 text-red-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            <ShieldExclamationIcon className="h-5 w-5 inline mr-2" />
                            Deteksi Anomali
                            {anomalies.length > 0 && (
                                <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                                    {anomalies.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("maintenance")}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                activeTab === "maintenance"
                                    ? "border-red-500 text-red-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            <CogIcon className="h-5 w-5 inline mr-2" />
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Periode Laporan
                                    </label>
                                    <select
                                        value={dateRange}
                                        onChange={(e) =>
                                            setDateRange(e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Format File
                                    </label>
                                    <select
                                        value={reportFormat}
                                        onChange={(e) =>
                                            setReportFormat(e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                                    >
                                        <option value="pdf">PDF</option>
                                        <option value="excel">Excel</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg w-full">
                                        Periode: {dateRange} | Format:{" "}
                                        {reportFormat.toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Report Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {reportTypes.map((report) => (
                                <div
                                    key={report.id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div
                                            className={`p-3 rounded-lg ${report.color}`}
                                        >
                                            <report.icon className="h-6 w-6" />
                                        </div>
                                        <button
                                            onClick={() =>
                                                handleExport(report.id)
                                            }
                                            disabled={loading}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        >
                                            {loading ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            ) : (
                                                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                                            )}
                                            Download
                                        </button>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {report.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {report.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "audit" && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                                        <DocumentTextIcon className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">
                                            Total Logs
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {auditStats.total_logs}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-lg bg-green-100 text-green-600">
                                        <CheckCircleIcon className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">
                                            Berhasil
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {auditStats.successful_logs}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-lg bg-red-100 text-red-600">
                                        <XCircleIcon className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">
                                            Gagal
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {auditStats.failed_logs}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                                        <UserIcon className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">
                                            Teknisi Aktif
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {auditStats.unique_users}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Filter Audit Log
                                </h3>
                                <button
                                    onClick={handleExportAuditLogs}
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
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
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                                />
                                <select
                                    value={filters.action}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            action: e.target.value,
                                        })
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
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
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                                />
                                <select
                                    value={filters.is_successful}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            is_successful: e.target.value,
                                        })
                                    }
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
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
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                        Tampilkan Anomali Saja
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Audit Logs Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Audit Log
                                </h3>
                            </div>
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                                    <p className="mt-2 text-gray-600">
                                        Memuat data...
                                    </p>
                                </div>
                            ) : auditLogs.length === 0 ? (
                                <div className="p-8 text-center">
                                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        Tidak ada data
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Tidak ada audit log yang ditemukan.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Waktu
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Teknisi
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    APAR
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Aksi
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    IP Address
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Detail
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {auditLogs.map((log) => (
                                                <tr
                                                    key={log.id}
                                                    className="hover:bg-gray-50 transition-colors duration-150"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(
                                                            log.created_at
                                                        ).toLocaleString(
                                                            "id-ID"
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {log.user?.name ||
                                                            "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {log.apar
                                                            ?.serial_number ||
                                                            "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {getActionLabel(
                                                                log.action
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {log.ip_address ||
                                                            "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                log.is_successful
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-red-100 text-red-800"
                                                            }`}
                                                        >
                                                            {log.is_successful
                                                                ? "Berhasil"
                                                                : "Gagal"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedLog(
                                                                    log
                                                                );
                                                                setShowDetailModal(
                                                                    true
                                                                );
                                                            }}
                                                            className="text-red-600 hover:text-red-900 transition-colors duration-150"
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Deteksi Anomali
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Sistem mendeteksi aktivitas mencurigakan
                                        dalam inspeksi APAR
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">
                                            Total Anomali
                                        </p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {anomalies.length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Anomalies List */}
                        <div className="space-y-4">
                            {anomalies.length === 0 ? (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                                    <ShieldExclamationIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        Tidak ada anomali
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Tidak ada anomali yang terdeteksi dalam
                                        sistem.
                                    </p>
                                </div>
                            ) : (
                                anomalies.map((anomaly, index) => (
                                    <div
                                        key={index}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-4">
                                                <div className="flex-shrink-0">
                                                    {getAnomalyIcon(
                                                        anomaly.type
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <h4 className="text-sm font-semibold text-gray-900">
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
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(
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
                                                    <p className="text-sm text-gray-600 mb-3">
                                                        {anomaly.description}
                                                    </p>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-500">
                                                                Teknisi:
                                                            </span>
                                                            <span className="ml-1 font-medium text-gray-900">
                                                                {
                                                                    anomaly.user_name
                                                                }
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">
                                                                APAR:
                                                            </span>
                                                            <span className="ml-1 font-medium text-gray-900">
                                                                {
                                                                    anomaly.apar_serial
                                                                }
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500">
                                                                Waktu:
                                                            </span>
                                                            <span className="ml-1 font-medium text-gray-900">
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Maintenance & Cleanup
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Kelola penyimpanan data dan bersihkan
                                        audit log lama
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Cleanup Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                                        <DocumentTextIcon className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">
                                            Total Logs
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {cleanupStats.total_logs || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                                        <ClockIcon className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">
                                            &gt; 30 Hari
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {cleanupStats.logs_older_than_30_days ||
                                                0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                                        <ExclamationTriangleIcon className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">
                                            &gt; 90 Hari
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {cleanupStats.logs_older_than_90_days ||
                                                0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-lg bg-red-100 text-red-600">
                                        <TrashIcon className="h-6 w-6" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">
                                            &gt; 180 Hari
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {cleanupStats.logs_older_than_180_days ||
                                                0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cleanup Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Pembersihan Audit Log
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Hapus audit log lama untuk menghemat
                                        penyimpanan
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCleanupModal(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                >
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    Bersihkan Data
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-2">
                                        Informasi Penyimpanan
                                    </h4>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p>
                                            • Log tertua:{" "}
                                            {cleanupStats.oldest_log
                                                ? new Date(
                                                      cleanupStats.oldest_log
                                                  ).toLocaleDateString("id-ID")
                                                : "N/A"}
                                        </p>
                                        <p>
                                            • Log terbaru:{" "}
                                            {cleanupStats.newest_log
                                                ? new Date(
                                                      cleanupStats.newest_log
                                                  ).toLocaleDateString("id-ID")
                                                : "N/A"}
                                        </p>
                                        <p>
                                            • Log &gt; 90 hari:{" "}
                                            {cleanupStats.logs_older_than_90_days ||
                                                0}{" "}
                                            entri
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-2">
                                        Rekomendasi
                                    </h4>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p>
                                            • Hapus log &gt; 90 hari untuk
                                            menghemat ruang
                                        </p>
                                        <p>
                                            • Backup data penting sebelum
                                            pembersihan
                                        </p>
                                        <p>
                                            • Lakukan pembersihan secara berkala
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
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-xl bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Detail Audit Log
                            </h3>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                            >
                                <XCircleIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Waktu
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {new Date(
                                            selectedLog.created_at
                                        ).toLocaleString("id-ID")}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Teknisi
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedLog.user?.name || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        APAR
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedLog.apar?.serial_number ||
                                            "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Aksi
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {getActionLabel(selectedLog.action)}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        IP Address
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedLog.ip_address || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Status
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                selectedLog.is_successful
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {selectedLog.is_successful
                                                ? "Berhasil"
                                                : "Gagal"}
                                        </span>
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Lokasi
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedLog.lat && selectedLog.lng
                                            ? `${selectedLog.lat}, ${selectedLog.lng}`
                                            : "Tidak tersedia"}
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Device Info
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {selectedLog.device_info
                                            ? JSON.stringify(
                                                  selectedLog.device_info
                                              )
                                            : "Tidak diketahui"}
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Detail
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900">
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
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-xl bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Pembersihan Audit Log
                            </h3>
                            <button
                                onClick={() => setShowCleanupModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                            >
                                <XCircleIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-red-800">
                                            Peringatan
                                        </h4>
                                        <p className="text-sm text-red-700 mt-1">
                                            Tindakan ini akan menghapus audit
                                            log secara permanen dan tidak dapat
                                            dibatalkan.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Hapus log yang lebih dari (hari)
                                </label>
                                <select
                                    value={cleanupDays}
                                    onChange={(e) =>
                                        setCleanupDays(parseInt(e.target.value))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                                >
                                    <option value={30}>30 hari</option>
                                    <option value={60}>60 hari</option>
                                    <option value={90}>90 hari</option>
                                    <option value={180}>180 hari</option>
                                    <option value={365}>1 tahun</option>
                                </select>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-2">
                                    Ringkasan
                                </h4>
                                <div className="text-sm text-gray-600">
                                    <p>
                                        • Log yang akan dihapus:{" "}
                                        {cleanupStats[
                                            `logs_older_than_${cleanupDays}_days`
                                        ] || 0}{" "}
                                        entri
                                    </p>
                                    <p>
                                        • Tanggal cutoff:{" "}
                                        {new Date(
                                            Date.now() -
                                                cleanupDays *
                                                    24 *
                                                    60 *
                                                    60 *
                                                    1000
                                        ).toLocaleDateString("id-ID")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowCleanupModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCleanup}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Memproses...
                                    </div>
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