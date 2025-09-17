import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
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
} from '@heroicons/react/24/outline';

const Reports = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('week');
    const [generating, setGenerating] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState('pdf');

    useEffect(() => {
        fetchReports();
    }, [dateRange]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/reports?range=${dateRange}`);
            setReports(response.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
            showError('Gagal memuat data laporan');
        } finally {
            setLoading(false);
        }
    };

    const generateReport = async (type) => {
        setGenerating(true);
        
        try {
            const response = await axios.get(`/api/reports/generate/${type}/${selectedFormat}?range=${dateRange}`, {
                responseType: 'blob',
            });
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            // Set filename based on type and format
            const filename = `laporan-${type}-${dateRange}-${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
            link.setAttribute('download', filename);
            
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            // Show success message
            showSuccess(`Laporan ${getReportTypeName(type)} berhasil diunduh dalam format ${selectedFormat.toUpperCase()}`);
        } catch (error) {
            console.error('Error generating report:', error);
            showError(`Gagal generate laporan: ${error.response?.data?.message || 'Terjadi kesalahan'}`);
        } finally {
            setGenerating(false);
        }
    };

    const getReportTypeName = (type) => {
        switch (type) {
            case 'inspection':
                return 'Inspeksi';
            case 'summary':
                return 'Ringkasan';
            case 'overdue':
                return 'Terlambat';
            default:
                return type;
        }
    };

    const getDateRangeText = (range) => {
        switch (range) {
            case 'week':
                return 'Minggu Ini';
            case 'month':
                return 'Bulan Ini';
            case 'quarter':
                return 'Kuartal Ini';
            case 'year':
                return 'Tahun Ini';
            case 'custom':
                return '30 Hari Terakhir';
            default:
                return range;
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
    ];

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
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Laporan Inspeksi
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Generate dan download laporan inspeksi APAR - CAKAP FT
                        MAOS
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Date Range Filter */}
                    <div>
                        <label
                            htmlFor="dateRange"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Periode Laporan
                        </label>
                        <select
                            id="dateRange"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="week">Minggu Ini</option>
                            <option value="month">Bulan Ini</option>
                            <option value="quarter">Kuartal Ini</option>
                            <option value="year">Tahun Ini</option>
                            <option value="custom">30 Hari Terakhir</option>
                        </select>
                    </div>

                    {/* Format Selection */}
                    <div>
                        <label
                            htmlFor="format"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Format File
                        </label>
                        <select
                            id="format"
                            value={selectedFormat}
                            onChange={(e) => setSelectedFormat(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="pdf">PDF</option>
                            <option value="excel">Excel</option>
                        </select>
                    </div>

                    {/* Current Selection Display */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Pilihan Saat Ini
                        </label>
                        <div className="mt-1 text-sm text-gray-600">
                            {getDateRangeText(dateRange)} •{" "}
                            {selectedFormat.toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Types */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {reportTypes.map((reportType) => (
                    <div
                        key={reportType.id}
                        className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-center mb-4">
                            <div className="flex-shrink-0">
                                <div
                                    className={`h-12 w-12 rounded-full ${reportType.color} flex items-center justify-center`}
                                >
                                    <reportType.icon className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {reportType.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {reportType.description}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {/* Format Buttons */}
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => {
                                        setSelectedFormat("pdf");
                                        generateReport(reportType.id);
                                    }}
                                    disabled={generating}
                                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {generating ? (
                                        <>
                                            <svg
                                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <DocumentTextIcon className="h-4 w-4 mr-2" />
                                            PDF
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedFormat("excel");
                                        generateReport(reportType.id);
                                    }}
                                    disabled={generating}
                                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {generating ? (
                                        <>
                                            <svg
                                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <TableCellsIcon className="h-4 w-4 mr-2" />
                                            Excel
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Quick Generate with Current Format */}
                            <button
                                onClick={() => generateReport(reportType.id)}
                                disabled={generating}
                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {generating ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                        Download {selectedFormat.toUpperCase()}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Information Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <DocumentArrowDownIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                            Informasi Laporan
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc list-inside space-y-1">
                                <li>
                                    <strong>Laporan Inspeksi:</strong> Berisi
                                    detail lengkap semua inspeksi APAR dalam
                                    periode yang dipilih
                                </li>
                                <li>
                                    <strong>Laporan Ringkasan:</strong>{" "}
                                    Menampilkan statistik dan kondisi APAR
                                    secara keseluruhan
                                </li>
                                <li>
                                    <strong>Laporan Terlambat:</strong> Daftar
                                    jadwal inspeksi yang belum dilaksanakan
                                    sesuai jadwal
                                </li>
                                <li>
                                    <strong>Format PDF:</strong> Cocok untuk
                                    laporan resmi dan presentasi
                                </li>
                                <li>
                                    <strong>Format Excel:</strong> Cocok untuk
                                    analisis data dan pengolahan lanjutan
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Laporan Terbaru
                    </h3>
                    {reports.length > 0 ? (
                        <div className="flow-root">
                            <ul className="-my-5 divide-y divide-gray-200">
                                {reports.map((report) => (
                                    <li key={report.id} className="py-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0">
                                                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                                    <DocumentArrowDownIcon className="h-4 w-4 text-red-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {report.name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Generated on{" "}
                                                    {new Date(
                                                        report.created_at
                                                    ).toLocaleString("id-ID")}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <button
                                                    onClick={() =>
                                                        window.open(
                                                            report.download_url,
                                                            "_blank"
                                                        )
                                                    }
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                                                >
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <DocumentArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                Belum ada laporan
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Generate laporan pertama Anda dengan memilih
                                jenis laporan di atas.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports; 