import React, { useState, useEffect, Fragment } from 'react';
import { Apar } from '../types/api';
import { Link } from '@tanstack/react-router';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import {
    FireIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    MapPinIcon,
    TruckIcon,
    QrCodeIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    CheckIcon,
    XMarkIcon,
    ClipboardDocumentCheckIcon,
    DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


// Local types for confirm dialog (hook is implemented in plain JS)
interface ConfirmConfig {
    onConfirm?: () => void;
    onCancel?: () => void;
    title?: string;
    message?: string;
    type?: 'warning' | 'info' | 'danger' | string;
    confirmText?: string;
    cancelText?: string;
    confirmButtonColor?: string;
}

type ConfirmOptions = Omit<ConfirmConfig, 'onConfirm' | 'onCancel'>;

const AparList = () => {
    const { user, apiClient } = useAuth();
    const { showSuccess, showError } = useToast();
    const { isOpen, config, confirm, close } = useConfirmDialog() as {
        isOpen: boolean;
        config: ConfirmConfig;
        confirm: (options: ConfirmOptions) => Promise<boolean>;
        close: () => void;
    };
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [locationFilter, setLocationFilter] = useState<string>('all');
    const [selectedApars, setSelectedApars] = useState<number[]>([]);
    const [bulkDeleteMode, setBulkDeleteMode] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [showQrDownloadModal, setShowQrDownloadModal] = useState<boolean>(false);
    const [downloadingQr, setDownloadingQr] = useState<boolean>(false);
    const [qrDownloadApars, setQrDownloadApars] = useState<Apar[]>([]);

    const queryClient = useQueryClient();

    const {
        data: apars = [],
        isLoading,
        isError
    } = useQuery<Apar[], Error>({
        queryKey: ['apars'],
        queryFn: async () => {
            const response = await apiClient.get('/api/apar');
            // API sometimes returns { data: [...] } or directly the array
            return response.data.data ?? response.data;
        },
        staleTime: 1 * 60 * 1000,
    });

    const filteredApars = apars.filter(apar => {
        const matchesSearch = apar.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apar.location_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || apar.status === statusFilter;
        const matchesLocation = locationFilter === 'all' || apar.location_type === locationFilter;

        return matchesSearch && matchesStatus && matchesLocation;
    });

    const getStatusColor = (status?: string): string => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'needs_repair':
                return 'bg-yellow-100 text-yellow-800';
            case 'inactive':
                return 'bg-red-100 text-red-800';
            case 'under_repair':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status?: string): string => {
        switch (status) {
            case 'active':
                return 'Aktif';
            case 'needs_repair':
                return 'Perlu Perbaikan';
            case 'inactive':
                return 'Nonaktif';
            case 'under_repair':
                return 'Sedang Perbaikan';
            default:
                return status ?? 'Unknown';
        }
    };

    const getLocationTypeText = (type: Apar['location_type']): string => {
        return type === 'statis' ? 'Statis' : 'Mobil';
    };

    const getLocationTypeIcon = (type: Apar['location_type']): React.ComponentType<any> => {
        return type === 'statis' ? MapPinIcon : TruckIcon;
    };

    const getLocationTypeColor = (type: Apar['location_type']): string => {
        return type === 'statis' ? 'text-blue-600' : 'text-purple-600';
    };

    const handleQrDownload = () => {
        setQrDownloadApars(filteredApars);
        setShowQrDownloadModal(true);
    };

    const downloadQrPdf = async (selectedApars: Apar[]) => {
        setDownloadingQr(true);
        try {
            // Create PDF content
            const pdfContent = {
                title: 'QR Code APAR - CAKAP FT MAOS',
                apars: selectedApars,
                generatedAt: new Date().toLocaleString('id-ID'),
                totalApars: selectedApars.length
            };

            // For now, we'll use a simple approach
            // In a real implementation, you might want to use a library like jsPDF or make an API call
            const response = await apiClient.post('/api/apar/download-qr-pdf', pdfContent, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `qr-code-apar-${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showSuccess('QR Code APAR berhasil diunduh!');
            setShowQrDownloadModal(false);
        } catch (error) {
            console.error('Error downloading QR PDF:', error);
            showError('Gagal mengunduh QR Code APAR');
        } finally {
            setDownloadingQr(false);
        }
    };

    const deleteMutation = useMutation<void, unknown, number>({
        mutationFn: async (aparId: number) => {
            await apiClient.delete(`/api/apar/${aparId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['apars'] });
        }
    });

    const handleDelete = async (aparId: number, serialNumber: string): Promise<void> => {
        const confirmed = await confirm({
            title: 'Konfirmasi Hapus APAR',
            message: `Apakah Anda yakin ingin menghapus APAR ${serialNumber}? Tindakan ini tidak dapat dibatalkan.`,
            type: 'warning',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            confirmButtonColor: 'red'
        });

        if (confirmed) {
            try {
                await deleteMutation.mutateAsync(aparId);
                showSuccess('APAR berhasil dihapus');
            } catch (error: any) {
                console.error('Gagal menghapus APAR:', error);
                showError(error?.response?.data?.message || 'Gagal menghapus APAR. Silakan coba lagi.');
            }
        }
    };

    const handleBulkDelete = async (): Promise<void> => {
        if (selectedApars.length === 0) {
            showError('Pilih APAR yang akan dihapus terlebih dahulu');
            return;
        }

        const aparList = selectedApars.map(id => {
            const apar = apars.find(a => a.id === id);
            return apar?.serial_number || 'Unknown';
        }).join(', ');

        const confirmed = await confirm({
            title: 'Konfirmasi Hapus Massal',
            message: `Apakah Anda yakin ingin menghapus ${selectedApars.length} APAR sekaligus?\n\nAPAR yang akan dihapus:\n${aparList}`,
            type: 'warning',
            confirmText: 'Ya, Hapus Semua',
            cancelText: 'Batal',
            confirmButtonColor: 'red'
        });

        if (confirmed) {
            setDeleting(true);
            try {
                // Use deleteMutation.mutateAsync for each and collect results
                const results = await Promise.all(selectedApars.map(async (aparId) => {
                    try {
                        await deleteMutation.mutateAsync(aparId);
                        return { success: true, id: aparId };
                    } catch (error: any) {
                        console.error(`Error deleting APAR ${aparId}:`, error);
                        return { success: false, id: aparId, error: error.response?.data?.message || 'Unknown error' };
                    }
                }));

                const successful = results.filter(r => r.success);
                const failed = results.filter(r => !r.success);

                if (successful.length > 0) {
                    showSuccess(`${successful.length} APAR berhasil dihapus${failed.length > 0 ? `, ${failed.length} gagal` : ''}`);
                } else {
                    showError('Gagal menghapus semua APAR yang dipilih');
                }

                setSelectedApars([]);
                setBulkDeleteMode(false);
                // invalidate once (already invalidated by individual successes but ensure)
                queryClient.invalidateQueries({ queryKey: ['apars'] });
            } catch (error) {
                console.error('Gagal dalam bulk delete:', error);
                showError('Gagal menghapus APAR yang dipilih. Silakan coba lagi.');
            } finally {
                setDeleting(false);
            }
        }
    };

    const toggleBulkDeleteMode = () => {
        setBulkDeleteMode(!bulkDeleteMode);
        setSelectedApars([]);
    };

    const handleSelectApar = (aparId: number) => {
        setSelectedApars(prev =>
            prev.includes(aparId)
                ? prev.filter(id => id !== aparId)
                : [...prev, aparId]
        );
    };

    const handleSelectAll = () => {
        if (selectedApars.length === filteredApars.length) {
            setSelectedApars([]);
        } else {
            setSelectedApars(filteredApars.map(apar => apar.id));
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <Fragment>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl">
                                <FireIcon className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Manajemen APAR</h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Kelola dan pantau semua APAR dalam sistem
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Download QR Button */}
                            {(user?.role === "admin" || user?.role === "supervisor") && (
                                <button
                                    onClick={handleQrDownload}
                                    className="inline-flex items-center px-4 py-2.5 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all duration-200"
                                >
                                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                    Unduh QR Code APAR
                                </button>
                            )}

                            {/* Bulk Delete Toggle */}
                            {user?.role === "admin" && (
                                <button
                                    onClick={() => setBulkDeleteMode(!bulkDeleteMode)}
                                    className={`inline-flex items-center px-4 py-2.5 border text-sm font-medium rounded-lg transition-all duration-200 ${bulkDeleteMode
                                            ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                                            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    {bulkDeleteMode ? (
                                        <>
                                            <XMarkIcon className="h-4 w-4 mr-2" />
                                            Keluar Mode Hapus Massal
                                        </>
                                    ) : (
                                        <>
                                            <TrashIcon className="h-4 w-4 mr-2" />
                                            Hapus Massal
                                        </>
                                    )}
                                </button>
                            )}

                            {/* QR Scan Button - Teknisi only */}
                            {user?.role === "teknisi" && (
                                <Link
                                    to="/scan"
                                    className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-sm"
                                >
                                    <QrCodeIcon className="h-4 w-4 mr-2" />
                                    Scan QR & Inspeksi
                                </Link>
                            )}

                            {/* Add New APAR Button */}
                            {(user?.role === "admin" || user?.role === "supervisor") && (
                                <Link
                                    to="/apar/create"
                                    className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Tambah APAR
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
                    <div className="flex flex-col lg:flex-row lg:items-end gap-6">
                        {/* Search */}
                        <div className="flex-1">
                            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                                Cari APAR
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="search"
                                    id="search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                                    placeholder="Nomor seri atau lokasi..."
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="w-full lg:w-48">
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                            >
                                <option value="all">Semua Status</option>
                                <option value="active">Aktif</option>
                                <option value="needs_repair">Perlu Perbaikan</option>
                                <option value="inactive">Nonaktif</option>
                                <option value="under_repair">Sedang Perbaikan</option>
                            </select>
                        </div>

                        {/* Location Type Filter */}
                        <div className="w-full lg:w-48">
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                                Tipe Lokasi
                            </label>
                            <select
                                id="location"
                                name="location"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                            >
                                <option value="all">Semua Lokasi</option>
                                <option value="statis">Statis</option>
                                <option value="mobile">Mobil</option>
                            </select>
                        </div>

                        {/* Clear Filters Button */}
                        {(searchTerm || statusFilter !== "all" || locationFilter !== "all") && (
                            <div className="w-full lg:w-auto">
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('all');
                                        setLocationFilter('all');
                                    }}
                                    className="w-full lg:w-auto px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
                                >
                                    Bersihkan Filter
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* APAR List */}
                <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                    {/* List Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <FireIcon className="h-5 w-5 text-red-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Daftar APAR ({filteredApars.length})
                                    </h3>
                                </div>
                                {bulkDeleteMode && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                        Mode Hapus Massal
                                    </span>
                                )}
                            </div>

                            {bulkDeleteMode && (
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600">
                                        {selectedApars.length} dari {filteredApars.length} dipilih
                                    </span>
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={selectedApars.length === 0 || deleting}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        {deleting ? 'Menghapus...' : `Hapus ${selectedApars.length} APAR`}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bulk Delete Header */}
                    {bulkDeleteMode && (
                        <div className="px-6 py-3 border-b border-gray-200 bg-red-50">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedApars.length === filteredApars.length && filteredApars.length > 0}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-900">
                                        Pilih Semua ({filteredApars.length})
                                    </span>
                                </label>
                                <button
                                    onClick={() => setBulkDeleteMode(false)}
                                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    Keluar dari Mode Hapus Massal
                                </button>
                            </div>
                        </div>
                    )}

                    {/* APAR Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {bulkDeleteMode && (
                                        <th scope="col" className="px-6 py-3 text-left">
                                            <span className="sr-only">Pilih</span>
                                        </th>
                                    )}
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        APAR
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lokasi
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kapasitas
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Kadaluarsa
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredApars.map((apar) => {
                                    const LocationIcon = getLocationTypeIcon(apar.location_type);
                                    const isExpired = apar.expired_at && new Date(apar.expired_at) < new Date();

                                    return (
                                        <tr key={apar.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            {bulkDeleteMode && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedApars.includes(apar.id)}
                                                        onChange={() => handleSelectApar(apar.id)}
                                                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                    />
                                                </td>
                                            )}

                                            {/* APAR Info */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                                                            <FireIcon className="h-5 w-5 text-red-600" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {apar.serial_number}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <LocationIcon className={`h-4 w-4 ${getLocationTypeColor(apar.location_type)}`} />
                                                            <span className={`text-xs font-medium ${getLocationTypeColor(apar.location_type)}`}>
                                                                {getLocationTypeText(apar.location_type)}
                                                            </span>
                                                        </div>
                                                        {apar.apar_type?.name && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {apar.apar_type.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Location */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {apar.location_name}
                                                </div>
                                                {apar.tank_truck && (
                                                    <div className="mt-1">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {apar.tank_truck.plate_number}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Capacity */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 font-medium">
                                                    {apar.capacity} kg
                                                </div>
                                            </td>

                                            {/* Expiry Date */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {apar.expired_at
                                                        ? new Date(apar.expired_at).toLocaleDateString("id-ID")
                                                        : "Tidak ada"}
                                                </div>
                                                {isExpired && (
                                                    <div className="text-xs text-red-500 mt-1">
                                                        Sudah kadaluarsa
                                                    </div>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apar.status)}`}>
                                                    {getStatusText(apar.status)}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {!bulkDeleteMode && (
                                                    <div className="flex items-center gap-2">
                                                        {/* Inspection Button - Teknisi only */}
                                                        {user?.role === "teknisi" && (
                                                            <Link
                                                                to={`/inspection/${apar.qr_code || apar.id}`}
                                                                className="inline-flex items-center p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                                                title="Mulai Inspeksi"
                                                            >
                                                                <ClipboardDocumentCheckIcon className="h-4 w-4" />
                                                            </Link>
                                                        )}

                                                        {/* View Button */}
                                                        <Link
                                                            to={`/apar/$id`}
                                                            params={{ id: apar.id }}
                                                            className="inline-flex items-center p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                                            title="Lihat Detail"
                                                        >
                                                            <EyeIcon className="h-4 w-4" />
                                                        </Link>

                                                        {/* Edit Button - Admin & Supervisor only */}
                                                        {(user?.role === "admin" || user?.role === "supervisor") && (
                                                            <Link
                                                                to={`/apar/${apar.id}/edit`}
                                                                className="inline-flex items-center p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                                                                title="Edit APAR"
                                                            >
                                                                <PencilIcon className="h-4 w-4" />
                                                            </Link>
                                                        )}

                                                        {/* Delete Button - Admin only */}
                                                        {user?.role === "admin" && (
                                                            <button
                                                                onClick={() => handleDelete(apar.id, apar.serial_number)}
                                                                className="inline-flex items-center p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                                title="Hapus APAR"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {filteredApars.length === 0 && !isLoading && (
                        <div className="text-center py-16 px-6">
                            <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                                <FireIcon className="h-16 w-16" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Tidak ada APAR ditemukan
                            </h3>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                {searchTerm || statusFilter !== "all" || locationFilter !== "all"
                                    ? "Coba ubah filter pencarian Anda atau hapus filter yang ada."
                                    : "Mulai dengan menambahkan APAR pertama ke dalam sistem."}
                            </p>
                            {!searchTerm && statusFilter === "all" && locationFilter === "all" && (
                                <div className="mt-6">
                                    <Link
                                        to="/apar/create"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                    >
                                        <PlusIcon className="h-4 w-4 mr-2" />
                                        Tambah APAR Pertama
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* QR Download Modal */}
            {showQrDownloadModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Unduh QR Code APAR</h3>
                                <button
                                    onClick={() => setShowQrDownloadModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-3">
                                    Pilih APAR yang QR Code-nya ingin diunduh:
                                </p>

                                {/* Select All */}
                                <div className="mb-3">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={qrDownloadApars.length === filteredApars.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setQrDownloadApars(filteredApars);
                                                } else {
                                                    setQrDownloadApars([]);
                                                }
                                            }}
                                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        />
                                        <span className="ml-2 text-sm font-medium text-gray-700">
                                            Pilih Semua ({filteredApars.length} APAR)
                                        </span>
                                    </label>
                                </div>

                                {/* APAR List */}
                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                    {filteredApars.map((apar) => (
                                        <label key={apar.id} className="flex items-center py-2 hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={qrDownloadApars.some(a => a.id === apar.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setQrDownloadApars(prev => [...prev, apar]);
                                                    } else {
                                                        setQrDownloadApars(prev => prev.filter(a => a.id !== apar.id));
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">
                                                {apar.serial_number} - {apar.location_name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowQrDownloadModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => downloadQrPdf(qrDownloadApars)}
                                    disabled={qrDownloadApars.length === 0 || downloadingQr}
                                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {downloadingQr ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Mengunduh...
                                        </>
                                    ) : (
                                        <>
                                            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                                            Unduh PDF ({qrDownloadApars.length} APAR)
                                        </>
                                    )}
                                </button>
                            </div>
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
        </Fragment>
    );
};

export default AparList; 