import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    DocumentArrowDownIcon,
    EyeIcon,
    ComputerDesktopIcon,
    MapPinIcon,
    ClockIcon,
    UserIcon,
    FireIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

const AuditLogs = () => {
    const { showSuccess, showError } = useToast();
    const { apiClient } = useAuth();
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    // Filter states
    const [filters, setFilters] = useState({
        user_name: '',
        apar_serial: '',
        action: '',
        start_date: '',
        end_date: '',
        is_successful: '',
        ip_address: '',
    });

    // Use react-query for logs and stats
    const paramsString = React.useMemo(() => {
        const params = new URLSearchParams();
        Object.keys(filters).forEach((key) => {
            if (filters[key]) params.append(key, filters[key]);
        });
        return params.toString();
    }, [filters]);

    const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
        queryKey: ['auditLogs', paramsString],
        queryFn: async () => {
            const res = await apiClient.get(`/api/audit-logs?${paramsString}`);
            return res.data.data || [];
        },
        keepPreviousData: true,
        throwOnError: false,
    });

    const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
        queryKey: ['auditStats'],
        queryFn: async () => {
            const res = await apiClient.get('/api/audit-logs/stats');
            return res.data;
        },
        throwOnError: false,
    });

    useEffect(() => {
        setLoading(logsLoading || statsLoading);
    }, [logsLoading, statsLoading]);

    useEffect(() => {
        if (logsData) setLogs(logsData);
    }, [logsData]);

    useEffect(() => {
        if (statsData) setStats(statsData);
    }, [statsData]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            user_name: '',
            apar_serial: '',
            action: '',
            start_date: '',
            end_date: '',
            is_successful: '',
            ip_address: '',
        });
    };

    const viewLogDetail = async (logId) => {
        try {
            const response = await apiClient.get(`/api/audit-logs/${logId}`);
            setSelectedLog(response.data);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Error fetching log detail:', error);
            showError('Gagal memuat detail log. Silakan coba lagi.');
        }
    };

    const exportLogs = async () => {
        try {
            const response = await apiClient.get(`/api/audit-logs/export?${paramsString}`);

            // Create and download file
            const dataStr = JSON.stringify(response.data.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = response.data.filename;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting logs:', error);
            showError('Gagal mengexport data. Silakan coba lagi.');
        }
    };

    const getActionLabel = (action) => {
        const labels = {
            'scan_qr': 'Scan QR Code',
            'start_inspection': 'Mulai Inspeksi',
            'submit_inspection': 'Submit Inspeksi',
            'validation_failed': 'Validasi Gagal',
        };
        return labels[action] || action;
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'scan_qr':
                return <FireIcon className="h-5 w-5 text-blue-600" />;
            case 'start_inspection':
                return <ClockIcon className="h-5 w-5 text-yellow-600" />;
            case 'submit_inspection':
                return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
            case 'validation_failed':
                return <XCircleIcon className="h-5 w-5 text-red-600" />;
            default:
                return <FireIcon className="h-5 w-5 text-gray-600" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Audit Log Detail</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Melihat IP, waktu, lokasi, dan device teknisi
                    </p>
                </div>
                <button
                    onClick={exportLogs}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Export
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ComputerDesktopIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Logs
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {stats.total_logs || 0}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CheckCircleIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Berhasil
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {stats.successful_logs || 0}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <XCircleIcon className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Gagal
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {stats.failed_logs || 0}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <UserIcon className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Teknisi Aktif
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {stats.unique_users || 0}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Filter</h3>
                        <button
                            onClick={clearFilters}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear All
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Teknisi
                            </label>
                            <input
                                type="text"
                                value={filters.user_name}
                                onChange={(e) => handleFilterChange('user_name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                                placeholder="Cari teknisi..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Serial APAR
                            </label>
                            <input
                                type="text"
                                value={filters.apar_serial}
                                onChange={(e) => handleFilterChange('apar_serial', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                                placeholder="Cari APAR..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Aksi
                            </label>
                            <select
                                value={filters.action}
                                onChange={(e) => handleFilterChange('action', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="">Semua Aksi</option>
                                <option value="scan_qr">Scan QR Code</option>
                                <option value="start_inspection">Mulai Inspeksi</option>
                                <option value="submit_inspection">Submit Inspeksi</option>
                                <option value="validation_failed">Validasi Gagal</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={filters.is_successful}
                                onChange={(e) => handleFilterChange('is_successful', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="">Semua Status</option>
                                <option value="1">Berhasil</option>
                                <option value="0">Gagal</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                IP Address
                            </label>
                            <input
                                type="text"
                                value={filters.ip_address}
                                onChange={(e) => handleFilterChange('ip_address', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                                placeholder="Cari IP..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Akhir
                            </label>
                            <input
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Logs</h3>
                    
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
                                        Lokasi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(log.created_at).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                                                <span className="text-sm text-gray-900">
                                                    {log.user?.name || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <FireIcon className="h-4 w-4 text-red-400 mr-2" />
                                                <span className="text-sm text-gray-900">
                                                    {log.apar?.serial_number || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {getActionIcon(log.action)}
                                                <span className="ml-2 text-sm text-gray-900">
                                                    {getActionLabel(log.action)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                                {log.ip_address}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                                                <span className="text-sm text-gray-900">
                                                    {log.lat && log.lng ? `${log.lat}, ${log.lng}` : 'Tidak tersedia'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                log.is_successful 
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {log.is_successful ? 'Berhasil' : 'Gagal'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => viewLogDetail(log.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {logs.length === 0 && (
                        <div className="text-center py-8">
                            <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada log</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Tidak ada audit log yang ditemukan dengan filter yang diberikan.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedLog && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Detail Audit Log
                                </h3>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircleIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">ID Log</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedLog.log.id}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Waktu</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {new Date(selectedLog.log.created_at).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Teknisi</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {selectedLog.log.user?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">APAR</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {selectedLog.log.apar?.serial_number || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Aksi</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {getActionLabel(selectedLog.log.action)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            selectedLog.log.is_successful 
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {selectedLog.log.is_successful ? 'Berhasil' : 'Gagal'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">IP Address</label>
                                    <p className="mt-1 text-sm text-gray-900 font-mono">
                                        {selectedLog.log.ip_address}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Latitude</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {selectedLog.log.lat || 'Tidak tersedia'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Longitude</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {selectedLog.log.lng || 'Tidak tersedia'}
                                        </p>
                                    </div>
                                </div>

                                {selectedLog.location_name && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Lokasi</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {selectedLog.location_name}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Device Info</label>
                                    <div className="mt-1 bg-gray-50 p-3 rounded-md">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium">Browser:</span> {selectedLog.device_details.browser || 'Tidak diketahui'}
                                            </div>
                                            <div>
                                                <span className="font-medium">OS:</span> {selectedLog.device_details.os || 'Tidak diketahui'}
                                            </div>
                                            <div>
                                                <span className="font-medium">Device Type:</span> {selectedLog.device_details.device_type || 'Tidak diketahui'}
                                            </div>
                                            <div>
                                                <span className="font-medium">Platform:</span> {selectedLog.device_details.platform || 'Tidak diketahui'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedLog.log.details && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Detail</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {selectedLog.log.details}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogs; 