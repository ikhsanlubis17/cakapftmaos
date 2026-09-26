import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
    ClipboardDocumentListIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    MapPinIcon,
    CalendarIcon,
    FireIcon,
    UserCircleIcon,
    ExclamationTriangleIcon,
    CameraIcon,
    XMarkIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';
import { formatStorageUrl } from '@/utils/imageUrl';
import { formatDateTime as formatDate } from '@/utils/dateUtils';
import InspectionDetailModal from '../components/InspectionDetailModal';

const InspectionPhotoThumbnail = ({ url, title, isDamage, onClick }) => {
    const [hasError, setHasError] = useState(false);

    if (!url) return null;

    if (hasError) {
        return (
            <button
                type="button"
                onClick={onClick}
                className="relative inline-flex items-center justify-center h-10 w-10 rounded-[6px] bg-slate-100 border border-slate-300 text-slate-600 hover:bg-slate-200 hover:text-[#041562] transition-all shadow-2xs ring-2 ring-white flex-shrink-0"
                title={`${title} (Klik pratinjau)`}
            >
                <CameraIcon className="h-4 w-4 text-slate-500" />
                {isDamage && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-[#DA1212] rounded-full ring-2 ring-white" />
                )}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="relative inline-block h-10 w-10 rounded-[6px] ring-2 ring-white cursor-pointer hover:z-10 transition-transform hover:scale-110 overflow-hidden bg-slate-100 shadow-2xs flex-shrink-0"
            title={title}
        >
            <img
                className="h-full w-full object-cover"
                src={formatStorageUrl(url)}
                alt={title}
                onError={() => setHasError(true)}
            />
            {isDamage && (
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-[#DA1212] rounded-full ring-2 ring-white" />
            )}
        </button>
    );
};

const InspectionsList = () => {
    const { apiClient } = useAuth();
    const [filters, setFilters] = useState({
        status: 'all',
        condition: 'all',
        location: 'all',
        timeRange: 'all',
        search: '',
    });

    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [selectedInspection, setSelectedInspection] = useState(null);

    // Fetch inspections data
    const {
        data: inspectionsData = [],
        isLoading: loading,
        isFetching,
        refetch,
        error,
    } = useQuery({
        queryKey: ['inspections-list'],
        queryFn: async () => {
            const res = await apiClient.get('/api/inspections');
            return res.data || [];
        },
        refetchOnWindowFocus: false,
        staleTime: 60000,
        keepPreviousData: true,
        throwOnError: false,
    });

    // Compute Executive Stats
    const stats = useMemo(() => {
        const total = inspectionsData.length;
        let good = 0;
        let damaged = 0;
        let expired = 0;

        inspectionsData.forEach(item => {
            if (item.condition === 'good') {
                good++;
            } else if (item.condition === 'damaged' || (item.inspection_damages && item.inspection_damages.length > 0)) {
                damaged++;
            } else if (item.condition === 'expired' || item.condition === 'needs_refill' || item.condition === 'needs_repair') {
                expired++;
            }
        });

        return { total, good, damaged, expired };
    }, [inspectionsData]);

    // Extract unique locations for filter
    const locations = useMemo(() => {
        const uniqueLocations = new Set();
        inspectionsData.forEach(inspection => {
            if (inspection.apar?.location_name) {
                uniqueLocations.add(inspection.apar.location_name);
            }
        });
        return Array.from(uniqueLocations).sort();
    }, [inspectionsData]);

    // Filter inspections
    const filteredInspections = useMemo(() => {
        const now = new Date();

        return inspectionsData.filter(inspection => {
            // Status filter
            if (filters.status !== 'all' && inspection.status !== filters.status) {
                return false;
            }

            // Condition filter
            if (filters.condition !== 'all') {
                if (filters.condition === 'damaged') {
                    const isDamaged = inspection.condition === 'damaged' || (inspection.inspection_damages && inspection.inspection_damages.length > 0);
                    if (!isDamaged) return false;
                } else if (filters.condition === 'expired') {
                    const isExpired = inspection.condition === 'expired' || inspection.condition === 'needs_refill' || inspection.condition === 'needs_repair';
                    if (!isExpired) return false;
                } else if (inspection.condition !== filters.condition) {
                    return false;
                }
            }

            // Location filter
            if (filters.location !== 'all' && inspection.apar?.location_name !== filters.location) {
                return false;
            }

            // Time Range filter
            if (filters.timeRange !== 'all' && inspection.created_at) {
                const itemDate = new Date(inspection.created_at);
                const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);

                if (filters.timeRange === 'today' && diffDays > 1) {
                    return false;
                } else if (filters.timeRange === '7days' && diffDays > 7) {
                    return false;
                } else if (filters.timeRange === '30days' && diffDays > 30) {
                    return false;
                }
            }

            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const serialNumber = inspection.apar?.serial_number?.toLowerCase() || '';
                const location = inspection.apar?.location_name?.toLowerCase() || '';
                const inspectorName = inspection.user?.name?.toLowerCase() || '';
                const notes = inspection.notes?.toLowerCase() || '';
                const damageNames = inspection.inspection_damages?.map(d => d.damage_category?.name?.toLowerCase() || '').join(' ') || '';

                const matches =
                    serialNumber.includes(searchLower) ||
                    location.includes(searchLower) ||
                    inspectorName.includes(searchLower) ||
                    notes.includes(searchLower) ||
                    damageNames.includes(searchLower);

                if (!matches) return false;
            }

            return true;
        });
    }, [inspectionsData, filters]);

    // Sort inspections: newest first
    const sortedInspections = useMemo(() => {
        return [...filteredInspections].sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB.getTime() - dateA.getTime();
        });
    }, [filteredInspections]);

    const isFilterActive =
        filters.status !== 'all' ||
        filters.condition !== 'all' ||
        filters.location !== 'all' ||
        filters.timeRange !== 'all' ||
        filters.search.trim() !== '';

    const resetFilters = () => {
        setFilters({
            status: 'all',
            condition: 'all',
            location: 'all',
            timeRange: 'all',
            search: '',
        });
    };

    const handleStatCardClick = (conditionKey) => {
        if (filters.condition === conditionKey) {
            setFilters(prev => ({ ...prev, condition: 'all' }));
        } else {
            setFilters(prev => ({ ...prev, condition: conditionKey }));
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                        <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-600" />
                        Selesai
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-300 shadow-2xs">
                        <XCircleIcon className="h-3.5 w-3.5 text-rose-600" />
                        Gagal
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                        <ClockIcon className="h-3.5 w-3.5 text-amber-600" />
                        Menunggu
                    </span>
                );
            case 'needs_reinspection':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-800 border border-orange-300 shadow-2xs">
                        <ExclamationTriangleIcon className="h-3.5 w-3.5 text-orange-600" />
                        Inspeksi Ulang
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {status || 'Unknown'}
                    </span>
                );
        }
    };

    const getConditionBadge = (condition, damages = []) => {
        if (condition === 'good') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                    <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-600" />
                    Normal / Siap
                </span>
            );
        }

        if (condition === 'damaged' || (damages && damages.length > 0)) {
            const firstDmg = damages[0];
            return (
                <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-black uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-300 shadow-2xs">
                        <ExclamationTriangleIcon className="h-3.5 w-3.5 text-[#DA1212]" />
                        Rusak
                    </span>
                    {firstDmg && (
                        <span className="text-[11px] font-semibold text-rose-700 truncate max-w-[170px]" title={firstDmg.damage_category?.name}>
                            {firstDmg.damage_category?.name || 'Kerusakan Fisik'}
                        </span>
                    )}
                </div>
            );
        }

        if (condition === 'expired') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
                    <ClockIcon className="h-3.5 w-3.5 text-slate-600" />
                    Kadaluarsa
                </span>
            );
        }

        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-[4px] text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                Perlu Refill
            </span>
        );
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handlePhotoClick = (url, title = 'Foto Inspeksi', inspection = null) => {
        setSelectedPhoto({
            url: formatStorageUrl(url),
            title,
            serial: inspection?.apar?.serial_number || 'N/A',
            location: inspection?.apar?.location_name || 'Lokasi tidak tersedia',
            inspector: inspection?.user?.name || 'Teknisi',
            date: inspection?.created_at,
        });
        setShowPhotoModal(true);
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center p-4">
                <div className="text-center p-8 bg-white border border-slate-200 rounded-lg shadow-xs">
                    <div className="w-12 h-12 border-3 border-[#11468F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Memuat Riwayat Inspeksi...</h4>
                    <p className="text-xs text-slate-500">Menghubungkan ke basis data APAR Fuel Terminal Maos</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[400px] flex items-center justify-center p-4">
                <div className="text-center max-w-md bg-white p-8 border border-slate-200 rounded-lg shadow-sm">
                    <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <ExclamationTriangleIcon className="h-8 w-8 text-[#DA1212]" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">
                        Terjadi Kesalahan
                    </h3>
                    <p className="text-xs text-slate-600 mb-6">
                        Gagal memuat data riwayat inspeksi dari server.
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="px-5 py-2.5 bg-[#11468F] hover:bg-[#0d3873] text-white font-bold text-xs uppercase tracking-wider rounded-[6px] transition-colors shadow-xs"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-lg shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#041562] text-white flex items-center justify-center font-black text-xl shadow-xs flex-shrink-0">
                        <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-[3px]">
                                Fuel Terminal Maos • HSSE Monitoring
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Daftar Riwayat Inspeksi APAR
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Monitoring dan audit hasil inspeksi fisik APAR, validasi geolokasi, dan temuan kerusakan
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 self-start md:self-auto">
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-300 rounded-[6px] hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition-colors shadow-2xs"
                    >
                        <ArrowPathIcon className={`h-4 w-4 text-[#11468F] ${isFetching ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Interactive KPI Stat Cards (Click to filter) */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Kondisi Hasil Inspeksi (Klik kartu untuk menyaring langsung)
                    </p>
                    {filters.condition !== 'all' && (
                        <button
                            onClick={() => handleFilterChange('condition', 'all')}
                            className="text-xs font-bold text-[#11468F] hover:underline"
                        >
                            Tampilkan Semua
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total */}
                    <button
                        onClick={() => handleFilterChange('condition', 'all')}
                        className={`text-left rounded-lg p-5 border transition-all cursor-pointer relative overflow-hidden group shadow-xs ${
                            filters.condition === 'all'
                                ? 'bg-slate-50 border-slate-400 ring-2 ring-slate-400/40'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                    Total Inspeksi
                                </p>
                                <p className="text-3xl font-mono font-black text-slate-900 tracking-tight">
                                    {stats.total}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-[6px] flex items-center justify-center">
                                <ClipboardDocumentListIcon className="h-5 w-5 text-slate-700" />
                            </div>
                        </div>
                        <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
                            <span>Seluruh rekaman</span>
                            {filters.condition === 'all' && (
                                <span className="font-bold text-slate-700 bg-slate-200/80 px-1.5 py-0.5 rounded-[3px]">
                                    Semua
                                </span>
                            )}
                        </div>
                    </button>

                    {/* Card 2: Normal */}
                    <button
                        onClick={() => handleStatCardClick('good')}
                        className={`text-left rounded-lg p-5 border transition-all cursor-pointer relative overflow-hidden group shadow-xs ${
                            filters.condition === 'good'
                                ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-400/50 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                        Kondisi Normal
                                    </p>
                                </div>
                                <p className="text-3xl font-mono font-black text-slate-900 tracking-tight">
                                    {stats.good}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-[6px] flex items-center justify-center">
                                <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                        <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
                            <span>Siap beroperasi</span>
                            {filters.condition === 'good' && (
                                <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-[3px]">
                                    Aktif
                                </span>
                            )}
                        </div>
                        {filters.condition === 'good' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
                        )}
                    </button>

                    {/* Card 3: Damaged */}
                    <button
                        onClick={() => handleStatCardClick('damaged')}
                        className={`text-left rounded-lg p-5 border transition-all cursor-pointer relative overflow-hidden group shadow-xs ${
                            filters.condition === 'damaged'
                                ? 'bg-rose-50/60 border-rose-400 ring-2 ring-rose-400/50 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-sm'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-[#DA1212]" />
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                        Temuan Rusak
                                    </p>
                                </div>
                                <p className="text-3xl font-mono font-black text-slate-900 tracking-tight">
                                    {stats.damaged}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-rose-50 border border-rose-200 rounded-[6px] flex items-center justify-center">
                                <ExclamationTriangleIcon className="h-5 w-5 text-[#DA1212]" />
                            </div>
                        </div>
                        <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
                            <span>Perlu tindakan perbaikan</span>
                            {filters.condition === 'damaged' && (
                                <span className="font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-[3px]">
                                    Aktif
                                </span>
                            )}
                        </div>
                        {filters.condition === 'damaged' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#DA1212]" />
                        )}
                    </button>

                    {/* Card 4: Expired */}
                    <button
                        onClick={() => handleStatCardClick('expired')}
                        className={`text-left rounded-lg p-5 border transition-all cursor-pointer relative overflow-hidden group shadow-xs ${
                            filters.condition === 'expired'
                                ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/50 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                        Kadaluarsa / Refill
                                    </p>
                                </div>
                                <p className="text-3xl font-mono font-black text-slate-900 tracking-tight">
                                    {stats.expired}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-[6px] flex items-center justify-center">
                                <ClockIcon className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
                            <span>Jadwal penggantian media</span>
                            {filters.condition === 'expired' && (
                                <span className="font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-[3px]">
                                    Aktif
                                </span>
                            )}
                        </div>
                        {filters.condition === 'expired' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
                        )}
                    </button>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white rounded-lg shadow-xs border border-slate-200 p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            placeholder="Cari serial number APAR, lokasi, teknisi, atau kerusakan..."
                            className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-[6px] text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-colors"
                        />
                        {filters.search && (
                            <button
                                onClick={() => handleFilterChange('search', '')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Select Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Condition Select */}
                        <select
                            value={filters.condition}
                            onChange={(e) => handleFilterChange('condition', e.target.value)}
                            className="border border-slate-300 rounded-[6px] px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#11468F]"
                        >
                            <option value="all">Semua Kondisi Fisik</option>
                            <option value="good">Normal / Siap</option>
                            <option value="damaged">Temuan Rusak</option>
                            <option value="expired">Kadaluarsa</option>
                            <option value="needs_refill">Perlu Isi Ulang</option>
                        </select>

                        {/* Status Select */}
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="border border-slate-300 rounded-[6px] px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#11468F]"
                        >
                            <option value="all">Semua Status Workflow</option>
                            <option value="pending">Menunggu (Pending)</option>
                            <option value="completed">Selesai (Completed)</option>
                            <option value="failed">Gagal (Failed)</option>
                            <option value="needs_reinspection">Perlu Inspeksi Ulang</option>
                        </select>

                        {/* Location Select */}
                        <select
                            value={filters.location}
                            onChange={(e) => handleFilterChange('location', e.target.value)}
                            className="border border-slate-300 rounded-[6px] px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#11468F] max-w-[180px] truncate"
                        >
                            <option value="all">Semua Lokasi</option>
                            {locations.map((loc) => (
                                <option key={loc} value={loc}>
                                    {loc}
                                </option>
                            ))}
                        </select>

                        {/* Time Range Select */}
                        <select
                            value={filters.timeRange}
                            onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                            className="border border-slate-300 rounded-[6px] px-3 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#11468F]"
                        >
                            <option value="all">Semua Waktu</option>
                            <option value="today">Hari Ini</option>
                            <option value="7days">7 Hari Terakhir</option>
                            <option value="30days">30 Hari Terakhir</option>
                        </select>

                        {/* Reset Filter Button */}
                        {isFilterActive && (
                            <button
                                onClick={resetFilters}
                                className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-[6px] transition-colors flex items-center gap-1"
                            >
                                <XMarkIcon className="h-3.5 w-3.5" />
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub-bar Meta Info */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div>
                        Menampilkan <span className="font-bold text-slate-900">{sortedInspections.length}</span> dari{' '}
                        <span className="font-bold text-slate-900">{inspectionsData.length}</span> kegiatan inspeksi
                        {filters.search && (
                            <span className="ml-1 text-slate-600">
                                untuk kata kunci &ldquo;<span className="font-semibold text-slate-900">{filters.search}</span>&rdquo;
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Inspections Content Area */}
            <div>
                {/* Mobile / Tablet Cards View */}
                <div className="md:hidden space-y-3">
                    {sortedInspections.length > 0 ? (
                        sortedInspections.map((inspection) => (
                            <div
                                key={inspection.id}
                                className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-[6px] bg-slate-100 flex items-center justify-center text-[#041562]">
                                            <FireIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-mono font-bold text-sm text-slate-900 tracking-wider">
                                                {inspection.apar?.serial_number || 'N/A'}
                                            </h4>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                <MapPinIcon className="h-3.5 w-3.5 text-blue-600" />
                                                {inspection.apar?.location_name || 'Lokasi tidak tersedia'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedInspection(inspection)}
                                        className="p-2 bg-[#041562] text-white rounded-[6px] text-xs font-bold"
                                    >
                                        <EyeIcon className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {getConditionBadge(inspection.condition, inspection.inspection_damages)}
                                    {getStatusBadge(inspection.status)}
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-1.5">
                                        <UserCircleIcon className="h-4 w-4 text-slate-400" />
                                        <span className="truncate">{inspection.user?.name || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 justify-end">
                                        <CalendarIcon className="h-4 w-4 text-slate-400" />
                                        <span>{formatDate(inspection.created_at)}</span>
                                    </div>
                                </div>

                                {/* Photos row */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bukti Foto</span>
                                    <div className="flex items-center gap-1.5">
                                        {inspection.photo_url && (
                                            <InspectionPhotoThumbnail
                                                url={inspection.photo_url}
                                                title="Foto Tabung APAR"
                                                onClick={() => handlePhotoClick(inspection.photo_url, 'Foto Tabung APAR', inspection)}
                                            />
                                        )}
                                        {inspection.selfie_url && (
                                            <InspectionPhotoThumbnail
                                                url={inspection.selfie_url}
                                                title="Foto Selfie Teknisi"
                                                onClick={() => handlePhotoClick(inspection.selfie_url, 'Foto Selfie Teknisi', inspection)}
                                            />
                                        )}
                                        {inspection.inspection_damages?.map((damage, idx) => (
                                            damage.damage_photo_url && (
                                                <InspectionPhotoThumbnail
                                                    key={idx}
                                                    url={damage.damage_photo_url}
                                                    title={`Kerusakan: ${damage.damage_category?.name || 'Temuan'}`}
                                                    isDamage={true}
                                                    onClick={() => handlePhotoClick(damage.damage_photo_url, `Temuan Kerusakan: ${damage.damage_category?.name || ''}`, inspection)}
                                                />
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
                            Tidak ada data inspeksi yang sesuai kriteria filter.
                        </div>
                    )}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:block bg-white rounded-lg shadow-xs border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-black text-slate-700 uppercase tracking-wider">
                                        APAR & Lokasi
                                    </th>
                                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-black text-slate-700 uppercase tracking-wider">
                                        Kondisi Fisik
                                    </th>
                                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-black text-slate-700 uppercase tracking-wider">
                                        Pemeriksa (Teknisi)
                                    </th>
                                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-black text-slate-700 uppercase tracking-wider">
                                        Waktu & Validasi
                                    </th>
                                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-black text-slate-700 uppercase tracking-wider">
                                        Bukti Foto
                                    </th>
                                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-black text-slate-700 uppercase tracking-wider">
                                        Status Workflow
                                    </th>
                                    <th scope="col" className="px-5 py-3.5 text-center text-xs font-black text-slate-700 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {sortedInspections.length > 0 ? (
                                    sortedInspections.map((inspection) => (
                                        <tr key={inspection.id} className="hover:bg-slate-50/80 transition-colors">
                                            {/* Column 1: APAR & Lokasi */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-[#041562]">
                                                        <FireIcon className="h-5 w-5" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-bold font-mono tracking-wider text-slate-900">
                                                            {inspection.apar?.serial_number || 'N/A'}
                                                        </div>
                                                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                            <MapPinIcon className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                                                            <span className="truncate max-w-[160px]">
                                                                {inspection.apar?.location_name || 'Lokasi tidak tersedia'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 2: Kondisi Fisik */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {getConditionBadge(inspection.condition, inspection.inspection_damages)}
                                            </td>

                                            {/* Column 3: Teknisi */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-7 w-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold">
                                                        {inspection.user?.name ? inspection.user.name.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    <div className="ml-2.5">
                                                        <div className="text-xs font-bold text-slate-900">
                                                            {inspection.user?.name || 'Teknisi N/A'}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 capitalize">
                                                            {inspection.user?.role || 'teknisi'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 4: Waktu & Validasi */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="text-xs font-semibold text-slate-800">
                                                    {formatDate(inspection.created_at)}
                                                </div>
                                                <div className="mt-1 flex items-center gap-1">
                                                    {inspection.location_valid ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-[3px] border border-emerald-200">
                                                            <MapPinIcon className="h-3 w-3" />
                                                            GPS Valid
                                                            {inspection.gps_accuracy_meters && (
                                                                <span className="font-mono">({Math.round(inspection.gps_accuracy_meters)}m)</span>
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-[3px] border border-amber-200">
                                                            <ExclamationTriangleIcon className="h-3 w-3" />
                                                            Di Luar Radius
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Column 5: Foto Dokumentasi */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    {inspection.photo_url && (
                                                        <InspectionPhotoThumbnail
                                                            url={inspection.photo_url}
                                                            title="Foto Tabung APAR"
                                                            onClick={() => handlePhotoClick(inspection.photo_url, 'Foto Tabung APAR', inspection)}
                                                        />
                                                    )}
                                                    {inspection.selfie_url && (
                                                        <InspectionPhotoThumbnail
                                                            url={inspection.selfie_url}
                                                            title="Foto Selfie Teknisi"
                                                            onClick={() => handlePhotoClick(inspection.selfie_url, 'Foto Selfie Teknisi', inspection)}
                                                        />
                                                    )}
                                                    {inspection.inspection_damages?.map((damage, idx) => (
                                                        damage.damage_photo_url && (
                                                            <InspectionPhotoThumbnail
                                                                key={idx}
                                                                url={damage.damage_photo_url}
                                                                title={`Kerusakan: ${damage.damage_category?.name || 'Temuan'}`}
                                                                isDamage={true}
                                                                onClick={() => handlePhotoClick(damage.damage_photo_url, `Temuan Kerusakan: ${damage.damage_category?.name || ''}`, inspection)}
                                                            />
                                                        )
                                                    ))}
                                                    {!inspection.photo_url && !inspection.selfie_url && (!inspection.inspection_damages || inspection.inspection_damages.length === 0) && (
                                                        <span className="text-xs text-slate-400 italic">Tanpa foto</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Column 6: Status Workflow */}
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {getStatusBadge(inspection.status)}
                                            </td>

                                            {/* Column 7: Aksi Detail */}
                                            <td className="px-5 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => setSelectedInspection(inspection)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#041562] hover:bg-[#11468F] text-white text-xs font-bold uppercase tracking-wider rounded-[6px] shadow-2xs transition-colors"
                                                    title="Lihat detail lengkap inspeksi"
                                                >
                                                    <EyeIcon className="h-3.5 w-3.5" />
                                                    Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-16 text-center">
                                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-lg bg-slate-100 mb-3 text-slate-400">
                                                <ClipboardDocumentListIcon className="h-6 w-6" />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900 mb-1">Tidak Ada Data Inspeksi Ditemukan</h3>
                                            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                                                {isFilterActive
                                                    ? 'Tidak ada inspeksi yang sesuai dengan kombinasi filter dan pencarian aktif.'
                                                    : 'Belum ada kegiatan inspeksi APAR yang tersimpan di sistem.'}
                                            </p>
                                            {isFilterActive && (
                                                <button
                                                    onClick={resetFilters}
                                                    className="px-4 py-2 bg-[#11468F] hover:bg-[#0d3873] text-white text-xs font-bold uppercase tracking-wider rounded-[6px] shadow-2xs transition-colors"
                                                >
                                                    Reset Semua Filter
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Inspection Full Detail Modal */}
            <InspectionDetailModal
                inspection={selectedInspection}
                onClose={() => setSelectedInspection(null)}
                getStatusBadge={getStatusBadge}
                getConditionBadge={getConditionBadge}
                onPhotoClick={handlePhotoClick}
            />

            {/* Photo Preview Lightbox Modal */}
            {showPhotoModal && selectedPhoto && (
                <div
                    className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                    onClick={() => setShowPhotoModal(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[#041562] text-white rounded-lg">
                                    <CameraIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        {selectedPhoto.title || 'Foto Dokumentasi Inspeksi'}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        <span className="font-mono font-bold text-slate-800">{selectedPhoto.serial}</span>
                                        {' • '}
                                        <span>{selectedPhoto.location}</span>
                                        {' • '}
                                        <span>Oleh {selectedPhoto.inspector}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPhotoModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-[6px] text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 flex justify-center items-center bg-slate-950 flex-1 overflow-auto min-h-[350px]">
                            <img
                                src={formatStorageUrl(selectedPhoto.url)}
                                alt="Foto dokumentasi inspeksi"
                                className="max-w-full max-h-[65vh] object-contain rounded-[4px] shadow-lg"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="100%" height="100%" fill="%230f172a"/><text x="50%" y="45%" fill="%23e2e8f0" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle">Foto Tersimpan di Storage Server</text><text x="50%" y="60%" fill="%2394a3b8" font-family="sans-serif" font-size="12" text-anchor="middle">Berkas dokumentasi terverifikasi oleh sistem</text></svg>';
                                }}
                            />
                        </div>
                        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                            <button
                                onClick={() => setShowPhotoModal(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-[6px]"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InspectionsList;