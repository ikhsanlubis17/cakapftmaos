import React, { useState, useMemo } from 'react';
import {
    FireIcon,
    MagnifyingGlassIcon,
    QrCodeIcon,
    TruckIcon,
    MapPinIcon,
    CalendarDaysIcon,
    ScaleIcon,
    ArrowRightIcon,
    XMarkIcon,
    FunnelIcon,
    ShieldCheckIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import type { Apar } from '@/types/inspection.types';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

interface AparSelectorProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    aparList: Apar[];
    onAparSelect: (apar: Apar) => void;
    isLoading: boolean;
}

export const AparSelector: React.FC<AparSelectorProps> = ({
    searchTerm,
    onSearchChange,
    aparList,
    onAparSelect,
    isLoading,
}) => {
    // Local filter states
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedLocationType, setSelectedLocationType] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // Extract dynamic APAR types from list
    const availableTypes = useMemo(() => {
        const set = new Set<string>();
        aparList.forEach((apar) => {
            const typeName = apar.apar_type?.name || apar.aparType?.name;
            if (typeName) {
                set.add(typeName.toLowerCase().trim());
            }
        });
        return Array.from(set);
    }, [aparList]);

    // Metrics counters
    const metrics = useMemo(() => {
        const total = aparList.length;
        const active = aparList.filter((a) => a.status === 'active').length;
        const needsAttention = aparList.filter(
            (a) => a.status === 'needs_repair' || a.status === 'under_repair' || a.status === 'inactive'
        ).length;
        const mobileTrucks = aparList.filter((a) => a.location_type === 'mobile').length;
        return { total, active, needsAttention, mobileTrucks };
    }, [aparList]);

    // Filtered APAR list
    const filteredAparList = useMemo(() => {
        return aparList.filter((apar) => {
            // Type filter
            if (selectedType !== 'all') {
                const typeName = (apar.apar_type?.name || apar.aparType?.name || '').toLowerCase();
                if (!typeName.includes(selectedType)) return false;
            }

            // Location type filter
            if (selectedLocationType !== 'all') {
                if (apar.location_type !== selectedLocationType) return false;
            }

            // Status filter
            if (selectedStatus !== 'all') {
                if (selectedStatus === 'needs_repair') {
                    if (apar.status !== 'needs_repair' && apar.status !== 'under_repair') return false;
                } else if (apar.status !== selectedStatus) {
                    return false;
                }
            }

            // Search term filter (serial number, location, type, license plate)
            if (searchTerm.trim() !== '') {
                const term = searchTerm.toLowerCase();
                const serial = (apar.serial_number || '').toLowerCase();
                const location = (apar.location_name || '').toLowerCase();
                const type = (apar.apar_type?.name || apar.aparType?.name || '').toLowerCase();
                const plate = (
                    apar.tank_truck?.license_plate ||
                    apar.tankTruck?.license_plate ||
                    ''
                ).toLowerCase();

                if (
                    !serial.includes(term) &&
                    !location.includes(term) &&
                    !type.includes(term) &&
                    !plate.includes(term)
                ) {
                    return false;
                }
            }

            return true;
        });
    }, [aparList, selectedType, selectedLocationType, selectedStatus, searchTerm]);

    const handleResetFilters = () => {
        onSearchChange('');
        setSelectedType('all');
        setSelectedLocationType('all');
        setSelectedStatus('all');
    };

    const hasActiveFilters =
        searchTerm.trim() !== '' ||
        selectedType !== 'all' ||
        selectedLocationType !== 'all' ||
        selectedStatus !== 'all';

    // Helper to format type display name
    const formatTypeName = (apar: Apar): string => {
        const raw = apar.apar_type?.name || apar.aparType?.name || '';
        if (!raw) return 'Jenis Standar';
        const lower = raw.toLowerCase();
        if (lower.includes('co2')) return 'Carbon Dioxide (CO2)';
        if (lower.includes('dcp') || lower.includes('powder')) return 'Dry Chemical Powder';
        if (lower.includes('foam') || lower.includes('afff')) return 'Foam AFFF';
        return raw.charAt(0).toUpperCase() + raw.slice(1);
    };

    // Helper to format short type tag
    const formatShortTypeTag = (apar: Apar): string => {
        const raw = apar.apar_type?.name || apar.aparType?.name || '';
        if (!raw) return 'TABUNG';
        const lower = raw.toLowerCase();
        if (lower.includes('co2')) return 'CO2';
        if (lower.includes('dcp') || lower.includes('powder')) return 'POWDER';
        if (lower.includes('foam')) return 'FOAM';
        return raw.toUpperCase();
    };

    // Helper for status badge
    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return (
                    <Badge variant="active" size="sm" dot pulse>
                        Aktif
                    </Badge>
                );
            case 'needs_repair':
                return (
                    <Badge variant="repair" size="sm" dot>
                        Perlu Perbaikan
                    </Badge>
                );
            case 'under_repair':
                return (
                    <Badge variant="blue" size="sm" dot>
                        Sedang Perbaikan
                    </Badge>
                );
            case 'inactive':
                return (
                    <Badge variant="destructive" size="sm" dot>
                        Nonaktif
                    </Badge>
                );
            default:
                return (
                    <Badge variant="neutral" size="sm">
                        {status}
                    </Badge>
                );
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* HERO COMMAND CARD */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#041562] via-[#08207f] to-[#11468F] text-white shadow-md border border-[#11468F]/30 p-6 sm:p-8">
                {/* Background decorative mesh pattern */}
                <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
                <div className="absolute right-1/3 -bottom-16 h-48 w-48 rounded-full bg-sky-400/10 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="max-w-2xl space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold tracking-wider text-sky-200 uppercase">
                            <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                            <span>Fuel Terminal Maos &bull; HSSE Operasional Siaga</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
                            Pilih APAR untuk Inspeksi Lapangan
                        </h1>
                        <p className="text-sm text-slate-200 leading-relaxed">
                            Pilih unit tabung dari daftar terminal atau gunakan pemindai kamera untuk identifikasi
                            langsung melalui QR Code tabung.
                        </p>
                    </div>

                    {/* Prominent Glove-Friendly QR Scan CTA */}
                    <div className="flex-shrink-0 flex items-center">
                        <button
                            type="button"
                            onClick={() => {
                                window.location.href = '/scan';
                            }}
                            className="group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto h-12 px-6 bg-white hover:bg-slate-100 text-[#041562] font-bold text-sm rounded-lg shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-150 border-2 border-transparent hover:border-white/40 focus:outline-none focus:ring-4 focus:ring-white/20 select-none cursor-pointer"
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#11468F] text-white transition-transform group-hover:scale-105">
                                <QrCodeIcon className="h-5 w-5" />
                            </span>
                            <div className="text-left">
                                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold leading-tight">
                                    Metode Cepat
                                </div>
                                <div className="text-sm font-bold text-[#041562] leading-tight">
                                    Pindai QR Code
                                </div>
                            </div>
                            <ArrowRightIcon className="h-4 w-4 ml-1 text-slate-400 group-hover:text-[#11468F] group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>
                </div>

                {/* Live Terminal Summary Bar */}
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10">
                    <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
                        <div className="text-[11px] font-medium text-slate-300">Total Populasi</div>
                        <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white mt-0.5">
                            {isLoading ? '-' : metrics.total}
                            <span className="text-xs font-normal text-slate-300 ml-1 font-sans">Unit</span>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
                        <div className="text-[11px] font-medium text-emerald-300">Siap Operasi</div>
                        <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-300 mt-0.5">
                            {isLoading ? '-' : metrics.active}
                            <span className="text-xs font-normal text-slate-300 ml-1 font-sans">Aktif</span>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
                        <div className="text-[11px] font-medium text-amber-300">Perlu Tindakan</div>
                        <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-300 mt-0.5">
                            {isLoading ? '-' : metrics.needsAttention}
                            <span className="text-xs font-normal text-slate-300 ml-1 font-sans">Unit</span>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xs rounded-lg p-3 border border-white/10">
                        <div className="text-[11px] font-medium text-sky-300">Mobil Tangki</div>
                        <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-sky-200 mt-0.5">
                            {isLoading ? '-' : metrics.mobileTrucks}
                            <span className="text-xs font-normal text-slate-300 ml-1 font-sans">Unit</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEARCH & FILTERS CONTROL BAR */}
            <div className="bg-white rounded-lg p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
                {/* Search Input Row */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Cari nomor seri tabung (misal: R9238IH...), nama lokasi, plat tangki, atau tipe APAR..."
                        className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Filter Chips Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                            <FunnelIcon className="h-3.5 w-3.5" />
                            Filter:
                        </span>

                        {/* Location Type Chips */}
                        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setSelectedLocationType('all')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                                    selectedLocationType === 'all'
                                        ? 'bg-white text-[#11468F] shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Semua Lokasi
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedLocationType('mobile')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                                    selectedLocationType === 'mobile'
                                        ? 'bg-white text-[#11468F] shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <TruckIcon className="h-3.5 w-3.5" />
                                Mobil Tangki
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedLocationType('statis')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                                    selectedLocationType === 'statis'
                                        ? 'bg-white text-[#11468F] shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <MapPinIcon className="h-3.5 w-3.5" />
                                Bangunan / Pos
                            </button>
                        </div>

                        {/* Status Filter Chips */}
                        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setSelectedStatus('all')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                                    selectedStatus === 'all'
                                        ? 'bg-white text-[#11468F] shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Semua Status
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedStatus('active')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                                    selectedStatus === 'active'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Aktif
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedStatus('needs_repair')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                                    selectedStatus === 'needs_repair'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Perlu Perbaikan
                            </button>
                        </div>

                        {/* Type Filter Chips (if available) */}
                        {availableTypes.length > 0 && (
                            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setSelectedType('all')}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                                        selectedType === 'all'
                                            ? 'bg-white text-[#11468F] shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Semua Jenis
                                </button>
                                {availableTypes.slice(0, 3).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setSelectedType(type)}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors uppercase ${
                                            selectedType === type
                                                ? 'bg-white text-[#11468F] shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Clear Filter Button & Counter */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-500">
                            Menampilkan <strong className="text-slate-900 font-mono">{filteredAparList.length}</strong>{' '}
                            dari <span className="font-mono">{aparList.length}</span> APAR
                        </span>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 rounded-md transition-colors"
                            >
                                <ArrowPathIcon className="h-3.5 w-3.5" />
                                Reset Filter
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* APAR BENTO CARDS GRID */}
            {isLoading ? (
                /* Shimmer Skeleton Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-16 w-full rounded-lg" />
                            <div className="flex items-center justify-between pt-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-24 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredAparList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                    {filteredAparList.map((apar) => {
                        const isMobile = apar.location_type === 'mobile';
                        const typeTag = formatShortTypeTag(apar);
                        const typeFullName = formatTypeName(apar);
                        const truckPlate =
                            apar.tank_truck?.license_plate ||
                            apar.tankTruck?.license_plate ||
                            (apar.location_name && apar.location_name.includes('R')
                                ? apar.location_name.split(' ')[0]
                                : null);

                        return (
                            <div
                                key={apar.id}
                                onClick={() => onAparSelect(apar)}
                                className="group relative flex flex-col justify-between bg-white border border-slate-200 hover:border-[#11468F]/50 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99] select-none"
                            >
                                {/* Card Top: Type, Serial, & Status */}
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg shadow-xs transition-transform duration-200 group-hover:scale-105 ${
                                                    typeTag === 'CO2'
                                                        ? 'bg-slate-900 text-white'
                                                        : typeTag === 'POWDER'
                                                        ? 'bg-[#041562] text-white'
                                                        : 'bg-[#11468F] text-white'
                                                }`}
                                            >
                                                <FireIcon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-sm tracking-wider text-slate-900 group-hover:text-[#11468F] transition-colors">
                                                        {apar.serial_number}
                                                    </span>
                                                </div>
                                                <div className="text-xs font-semibold text-slate-500 mt-0.5">
                                                    {typeFullName}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="shrink-0">{renderStatusBadge(apar.status)}</div>
                                    </div>

                                    {/* Location Info Box */}
                                    <div
                                        className={`rounded-lg p-3 border text-xs transition-colors ${
                                            isMobile
                                                ? 'bg-sky-50/70 border-sky-200/80 text-sky-950'
                                                : 'bg-slate-50 border-slate-200/70 text-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                                            {isMobile ? (
                                                <>
                                                    <TruckIcon className="h-3.5 w-3.5 text-[#11468F]" />
                                                    <span className="text-[#11468F] font-bold">Unit Mobil Tangki</span>
                                                </>
                                            ) : (
                                                <>
                                                    <MapPinIcon className="h-3.5 w-3.5 text-slate-600" />
                                                    <span>Area Terminal Statis</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="font-semibold text-slate-900 truncate">
                                            {apar.location_name || 'Lokasi belum dispesifikasikan'}
                                        </div>
                                        {truckPlate && (
                                            <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded bg-white border border-sky-300/80 text-[11px] font-mono font-bold text-[#041562]">
                                                {truckPlate}
                                            </div>
                                        )}
                                    </div>

                                    {/* Technical Specification Chips */}
                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 pt-1">
                                        {apar.capacity && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-medium">
                                                <ScaleIcon className="h-3.5 w-3.5 text-slate-500" />
                                                {apar.capacity} kg
                                            </span>
                                        )}
                                        {apar.expired_at && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-medium font-mono text-[10px]">
                                                <CalendarDaysIcon className="h-3.5 w-3.5 text-slate-500" />
                                                Exp: {apar.expired_at.slice(0, 10)}
                                            </span>
                                        )}
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                                            {typeTag}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Footer: Tactile Action CTA Button */}
                                <div className="mt-4 pt-3.5 border-t border-slate-100">
                                    <div className="w-full h-10 px-4 rounded-lg bg-slate-50 group-hover:bg-[#11468F] text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-[#11468F] font-bold text-xs uppercase tracking-wider flex items-center justify-between shadow-2xs transition-all duration-150">
                                        <span>Mulai Inspeksi</span>
                                        <ArrowRightIcon className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Empty State */
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-xs max-w-lg mx-auto space-y-4">
                    <div className="h-16 w-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <FireIcon className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900">
                            Tidak Ada Tabung APAR yang Ditemukan
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Tidak ditemukan data tabung yang sesuai dengan filter atau kata kunci{' '}
                            {searchTerm ? (
                                <strong className="text-slate-800">"{searchTerm}"</strong>
                            ) : (
                                'yang aktif'
                            )}
                            .
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-[#11468F] hover:bg-[#0d3873] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                    >
                        <ArrowPathIcon className="h-4 w-4" />
                        Reset Pencarian & Filter
                    </button>
                </div>
            )}
        </div>
    );
};
