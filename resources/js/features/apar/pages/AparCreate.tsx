import React, { useState, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import axios from 'axios';
import {
    FireIcon,
    ArrowLeftIcon,
    MapPinIcon,
    CalendarIcon,
    ShieldCheckIcon,
    BuildingOffice2Icon,
    TruckIcon,
    InformationCircleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AparType } from '@/types/api';

const DEFAULT_FT_MAOS_LAT = '-7.604500';
const DEFAULT_FT_MAOS_LNG = '109.153400';

const AparCreate = () => {
    const { apiClient } = useAuth();
    const { showSuccess, showError } = useToast();
    const [gettingLocation, setGettingLocation] = useState(false);
    const [formData, setFormData] = useState({
        serial_number: '',
        location_type: 'statis',
        location_name: '',
        latitude: '',
        longitude: '',
        valid_radius: '50',
        apar_type_id: '',
        capacity: '',
        manufactured_date: '',
        expired_at: '',
        status: 'active',
        notes: ''
    });

    // Fetch active APAR types with safe normalization
    const {
        data: rawAparTypes = [],
        isLoading: isAparTypesLoading,
    } = useQuery({
        queryKey: ['apar-types'],
        queryFn: async () => {
            const response = await apiClient.get('/api/apar-types');
            const raw = response?.data;
            const items: AparType[] = Array.isArray(raw?.data)
                ? raw.data
                : (Array.isArray(raw) ? raw : []);
            return items;
        },
    });

    // Safely normalize aparTypes so it is 100% guaranteed to be an array of active types
    const aparTypes = useMemo<AparType[]>(() => {
        const list: AparType[] = Array.isArray(rawAparTypes)
            ? rawAparTypes
            : Array.isArray((rawAparTypes as any)?.data)
                ? (rawAparTypes as any).data
                : [];
        return list.filter((type: AparType) => Boolean(type && type.is_active));
    }, [rawAparTypes]);

    const getCurrentLocation = (highAccuracy = true) => {
        if (!navigator.geolocation) {
            showError('Geolocation tidak didukung oleh peramban ini.');
            return;
        }

        setGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({
                    ...prev,
                    latitude: latitude.toFixed(6),
                    longitude: longitude.toFixed(6)
                }));
                showSuccess(
                    highAccuracy 
                        ? 'Koordinat GPS akurat berhasil diperoleh!' 
                        : 'Koordinat GPS berhasil diperoleh (mode perkiraan jaringan).'
                );
                setGettingLocation(false);
            },
            (error) => {
                if (highAccuracy && error.code !== error.PERMISSION_DENIED) {
                    setTimeout(() => {
                        getCurrentLocation(false);
                    }, 800);
                    return;
                }

                setGettingLocation(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        showError('Izin lokasi ditolak. Aktifkan GPS atau izinkan akses lokasi di browser.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        showError('Sinyal GPS tidak terdeteksi. Silakan masukkan koordinat manual atau gunakan tombol FT Maos.');
                        break;
                    case error.TIMEOUT:
                        showError('Waktu permintaan koordinat habis. Silakan coba kembali.');
                        break;
                    default:
                        showError('Gagal memperoleh koordinat otomatis.');
                        break;
                }
            },
            {
                enableHighAccuracy: highAccuracy,
                timeout: 20000,
                maximumAge: highAccuracy ? 0 : Infinity
            }
        );
    };

    const setFtMaosCoordinates = () => {
        setFormData(prev => ({
            ...prev,
            latitude: DEFAULT_FT_MAOS_LAT,
            longitude: DEFAULT_FT_MAOS_LNG
        }));
        showSuccess('Koordinat dipasang pada Titik Pusat Fuel Terminal Maos.');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'location_type') {
            setFormData(prev => ({
                ...prev,
                location_type: value,
                // Terisi otomatis "Mobil Tangki" tanpa perlu input pengguna saat opsi mobil tangki dipilih
                location_name: value === 'mobile' ? 'Mobil Tangki' : (prev.location_name === 'Mobil Tangki' ? '' : prev.location_name),
                // Koordinat dinonaktifkan/dikosongkan saat penempatan bergerak
                latitude: value === 'mobile' ? '' : prev.latitude,
                longitude: value === 'mobile' ? '' : prev.longitude,
                valid_radius: value === 'mobile' ? '50' : prev.valid_radius,
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const setQuickCapacity = (cap: number) => {
        setFormData(prev => ({
            ...prev,
            capacity: cap.toString()
        }));
    };

    const setQuickExpiry = (yearsToAdd: number) => {
        const base = formData.manufactured_date ? new Date(formData.manufactured_date) : new Date();
        const future = new Date(base);
        future.setFullYear(future.getFullYear() + yearsToAdd);
        const yyyy = future.getFullYear();
        const mm = String(future.getMonth() + 1).padStart(2, '0');
        const dd = String(future.getDate()).padStart(2, '0');
        setFormData(prev => ({
            ...prev,
            expired_at: `${yyyy}-${mm}-${dd}`
        }));
    };

    const {
        mutate: createApar,
        isPending: isCreatingApar,
    } = useMutation({
        mutationFn: (data: typeof formData) => {
            const isMobile = data.location_type === 'mobile';
            const dataToSend = {
                ...data,
                location_name: isMobile ? 'Mobil Tangki' : data.location_name,
                capacity: parseInt(data.capacity) || 0,
                valid_radius: isMobile ? 50 : (parseInt(data.valid_radius) || 50),
                latitude: isMobile ? null : (data.latitude ? parseFloat(data.latitude) : null),
                longitude: isMobile ? null : (data.longitude ? parseFloat(data.longitude) : null),
            };
            return apiClient.post('/api/apar', dataToSend);
        },
        onSuccess: () => {
            showSuccess('APAR berhasil didaftarkan ke sistem!');
            window.location.href = '/apar';
        },
        onError: (error: any) => {
            console.error('Error creating APAR:', error);
            if (axios.isAxiosError(error) && error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat();
                showError(errorMessages.join(', '), 'Gagal Menambah APAR');
            } else {
                showError(error?.response?.data?.message || 'Gagal menyimpan data APAR. Silakan periksa kembali.');
            }
        }
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        createApar(formData);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Header Banner */}
            <div className="bg-white border border-slate-200 rounded-[8px] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center font-black text-xl shadow-sm flex-shrink-0">
                        <FireIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                Tambah APAR Baru
                            </h1>
                            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-[3px] text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-[#11468F] border border-blue-200">
                                Master Data
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Pendaftaran aset tabung proteksi kebakaran lengkap dengan validasi geofence FT Maos
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/apar"
                        className="inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 rounded-[6px] shadow-xs text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 hover:text-[#041562] transition-colors min-h-[44px]"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2 text-slate-500" />
                        Kembali
                    </Link>
                </div>
            </div>

            {/* Info Hint */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-[8px] p-4 text-xs text-[#041562] flex items-start gap-3 shadow-2xs">
                <InformationCircleIcon className="w-5 h-5 text-[#11468F] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-semibold">
                        Panduan Pengisian Formulir Registrasi APAR
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                        Pastikan <strong>Nomor Seri</strong> sesuai dengan label fisik pada tabung. Titik <strong>Latitude &amp; Longitude</strong> akan digunakan sebagai referensi toleransi radius (anti-fraud) saat teknisi memindai QR Code di lapangan.
                    </p>
                </div>
            </div>

            {/* Form Container */}
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Section 1: Identifikasi & Spesifikasi Teknis */}
                <div className="bg-white border border-slate-200 rounded-[8px] p-5 sm:p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-[4px] bg-[#11468F]/10 text-[#11468F] flex items-center justify-center font-bold text-xs">
                                1
                            </span>
                            <h2 className="text-base font-bold text-slate-900">
                                Identifikasi &amp; Spesifikasi Tabung
                            </h2>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                            * Wajib diisi
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Serial Number */}
                        <div className="space-y-1.5 sm:col-span-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="serial_number" className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                                    Nomor Seri Tabung <span className="text-[#DA1212]">*</span>
                                </label>
                                <span className="text-[11px] text-slate-400">Kode unik QR Code</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="serial_number"
                                    id="serial_number"
                                    data-testid="serial-number-input"
                                    required
                                    value={formData.serial_number}
                                    onChange={handleChange}
                                    placeholder="Contoh: APAR-POS-01, A-092-2026, dll."
                                    className="block w-full border border-slate-300 rounded-[6px] px-3.5 py-2.5 text-sm font-mono tracking-wider font-bold text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 shadow-2xs focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] min-h-[44px]"
                                />
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Nomor seri tidak boleh duplikat dan akan dicetak pada label QR inspeksi.
                            </p>
                        </div>

                        {/* APAR Type */}
                        <div className="space-y-1.5">
                            <label htmlFor="apar_type_id" className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                                Jenis Media APAR <span className="text-[#DA1212]">*</span>
                            </label>
                            <select
                                name="apar_type_id"
                                id="apar_type_id"
                                data-testid="apar-type-select"
                                required
                                value={formData.apar_type_id}
                                onChange={handleChange}
                                className="block w-full border border-slate-300 rounded-[6px] px-3.5 py-2.5 text-sm text-slate-900 bg-white shadow-2xs focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] min-h-[44px]"
                            >
                                <option value="">Pilih Jenis Media APAR</option>
                                {(Array.isArray(aparTypes) ? aparTypes : []).map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name.charAt(0).toUpperCase() + type.name.slice(1)} ({type.description || 'Standar'})
                                    </option>
                                ))}
                            </select>
                            {isAparTypesLoading && (
                                <p className="text-[11px] text-slate-400 animate-pulse">Memuat jenis APAR...</p>
                            )}
                        </div>

                        {/* Capacity */}
                        <div className="space-y-1.5">
                            <label htmlFor="capacity" className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                                Kapasitas (Kg) <span className="text-[#DA1212]">*</span>
                            </label>
                            <div className="relative rounded-[6px] shadow-2xs">
                                <input
                                    type="number"
                                    min="1"
                                    max="150"
                                    name="capacity"
                                    id="capacity"
                                    data-testid="capacity-input"
                                    required
                                    value={formData.capacity}
                                    onChange={handleChange}
                                    placeholder="6"
                                    className="block w-full border border-slate-300 rounded-[6px] pr-10 pl-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] min-h-[44px]"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                                    kg
                                </div>
                            </div>
                            {/* Quick capacity buttons */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[11px] text-slate-400 mr-1">Cepat:</span>
                                {[3, 6, 9, 12, 50].map((kg) => (
                                    <button
                                        key={kg}
                                        type="button"
                                        onClick={() => setQuickCapacity(kg)}
                                        className={`px-2 py-0.5 rounded-[4px] text-[11px] font-bold border transition-colors ${
                                            formData.capacity === kg.toString()
                                                ? 'bg-[#11468F] text-white border-[#11468F]'
                                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                        }`}
                                    >
                                        {kg} kg
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5 sm:col-span-2">
                            <label htmlFor="status" className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                                Status Operasional Awal <span className="text-[#DA1212]">*</span>
                            </label>
                            <select
                                name="status"
                                id="status"
                                required
                                value={formData.status}
                                onChange={handleChange}
                                className="block w-full border border-slate-300 rounded-[6px] px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white shadow-2xs focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] min-h-[44px]"
                            >
                                <option value="active">Aktif (Siap Pakai &amp; Layak Operasional)</option>
                                <option value="needs_repair">Perlu Perbaikan (Ada Kerusakan / Masalah Fisik)</option>
                                <option value="under_repair">Sedang Perbaikan (Dalam Tindakan Bengkel)</option>
                                <option value="inactive">Non-Aktif (Diarsipkan / Ditarik)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section 2: Penempatan & Titik Koordinat GPS */}
                <div className="bg-white border border-slate-200 rounded-[8px] p-5 sm:p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-[4px] bg-[#11468F]/10 text-[#11468F] flex items-center justify-center font-bold text-xs">
                                2
                            </span>
                            <h2 className="text-base font-bold text-slate-900">
                                Penempatan &amp; Geolocation Geofence
                            </h2>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[3px] border border-emerald-200">
                            <ShieldCheckIcon className="w-3.5 h-3.5" /> Anti-Fraud
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Location Type */}
                        <div className="space-y-1.5">
                            <label htmlFor="location_type" className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                                Jenis Penempatan <span className="text-[#DA1212]">*</span>
                            </label>
                            <select
                                name="location_type"
                                id="location_type"
                                data-testid="location-type-select"
                                required
                                value={formData.location_type}
                                onChange={handleChange}
                                className="block w-full border border-slate-300 rounded-[6px] px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white shadow-2xs focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] min-h-[44px]"
                            >
                                <option value="statis">Statis (Gedung, Pos Jaga, Tangki Timbun)</option>
                                <option value="mobile">Mobil Tangki / Armada Operasional</option>
                            </select>
                        </div>

                        {/* Location Name */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label htmlFor="location_name" className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                                    Nama Lokasi / Area Penempatan <span className="text-[#DA1212]">*</span>
                                </label>
                                {formData.location_type === 'mobile' && (
                                    <span className="text-[10px] font-bold text-[#11468F] bg-blue-50 px-2 py-0.5 rounded-[4px] border border-blue-200">
                                        Terisi Otomatis
                                    </span>
                                )}
                            </div>
                            <input
                                type="text"
                                name="location_name"
                                id="location_name"
                                data-testid="location-name-input"
                                required
                                readOnly={formData.location_type === 'mobile'}
                                value={formData.location_name}
                                onChange={handleChange}
                                placeholder={formData.location_type === 'mobile' ? 'Mobil Tangki' : 'Contoh: Pos Jaga Gate 1, Dermaga 2, Ruang Panel'}
                                className={`block w-full border rounded-[6px] px-3.5 py-2.5 text-sm font-medium shadow-2xs min-h-[44px] transition-colors ${
                                    formData.location_type === 'mobile'
                                        ? 'bg-slate-100 border-slate-300 text-slate-700 cursor-not-allowed font-semibold'
                                        : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F]'
                                }`}
                            />
                            {formData.location_type === 'mobile' && (
                                <p className="text-[11px] text-[#11468F] flex items-center gap-1 font-medium">
                                    <CheckCircleIcon className="w-3.5 h-3.5 text-[#11468F] flex-shrink-0" />
                                    Penamaan area otomatis diset ke &quot;Mobil Tangki&quot; untuk armada operasional.
                                </p>
                            )}
                        </div>

                        {/* GPS Action Panel & Radius Toleransi (Hanya ditampilkan untuk penempatan Statis) */}
                        {formData.location_type === 'mobile' ? (
                            <div className="sm:col-span-2 bg-blue-50/70 border border-blue-200 rounded-[8px] p-4 flex items-start gap-3.5 shadow-2xs">
                                <div className="w-10 h-10 rounded-[6px] bg-[#11468F]/10 text-[#11468F] flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <TruckIcon className="w-5 h-5 text-[#11468F]" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-bold text-[#041562] uppercase tracking-wider">
                                            Armada Bergerak (Mobil Tangki)
                                        </h3>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-blue-100 text-[#11468F] border border-blue-200">
                                            Bebas Geofence Statis
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Titik koordinat geografis dan radius toleransi inspeksi dinonaktifkan secara otomatis karena APAR ditempatkan pada armada mobil tangki yang bersifat bergerak (mobile).
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* GPS Action Panel */}
                                <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-[6px] p-4 space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                        <div className="flex items-center gap-2">
                                            <MapPinIcon className="w-5 h-5 text-[#11468F]" />
                                            <div>
                                                <span className="text-xs font-bold text-slate-900">Titik Koordinat Geografis</span>
                                                <p className="text-[11px] text-slate-500">
                                                    {formData.latitude && formData.longitude
                                                        ? `Terekam: ${formData.latitude}, ${formData.longitude}`
                                                        : 'Belum ada koordinat terpasang'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => getCurrentLocation()}
                                                disabled={gettingLocation}
                                                className="inline-flex items-center px-3.5 py-2 border border-[#11468F] rounded-[5px] text-xs font-bold text-[#11468F] bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#11468F] transition-colors shadow-2xs disabled:opacity-50 min-h-[38px]"
                                            >
                                                <MapPinIcon className={`h-4 w-4 mr-1.5 ${gettingLocation ? 'animate-bounce' : ''}`} />
                                                {gettingLocation ? 'Mendeteksi GPS...' : 'Dapatkan Lokasi Saat Ini'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={setFtMaosCoordinates}
                                                className="inline-flex items-center px-3.5 py-2 border border-slate-300 rounded-[5px] text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 transition-colors shadow-2xs min-h-[38px]"
                                            >
                                                <BuildingOffice2Icon className="h-4 w-4 mr-1.5 text-slate-500" />
                                                Pasang Koordinat FT Maos
                                            </button>
                                        </div>
                                    </div>

                                    {/* Latitude & Longitude Inputs */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                        <div>
                                            <label htmlFor="latitude" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                                Latitude
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                min="-90"
                                                max="90"
                                                name="latitude"
                                                id="latitude"
                                                value={formData.latitude}
                                                onChange={handleChange}
                                                placeholder="-7.604500"
                                                className="block w-full border border-slate-300 rounded-[5px] px-3 py-2 text-xs font-mono font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F]"
                                            />
                                            <span className="text-[10px] text-slate-400">Rentang: -90.000000 sampai 90.000000</span>
                                        </div>
                                        <div>
                                            <label htmlFor="longitude" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                                Longitude
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                min="-180"
                                                max="180"
                                                name="longitude"
                                                id="longitude"
                                                value={formData.longitude}
                                                onChange={handleChange}
                                                placeholder="109.153400"
                                                className="block w-full border border-slate-300 rounded-[5px] px-3 py-2 text-xs font-mono font-medium text-slate-900 bg-white focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F]"
                                            />
                                            <span className="text-[10px] text-slate-400">Rentang: -180.000000 sampai 180.000000</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Valid Radius */}
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label htmlFor="valid_radius" className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                                        Radius Toleransi Inspeksi (Meter)
                                    </label>
                                    <div className="relative rounded-[6px] shadow-2xs max-w-sm">
                                        <input
                                            type="number"
                                            min="5"
                                            max="500"
                                            name="valid_radius"
                                            id="valid_radius"
                                            value={formData.valid_radius}
                                            onChange={handleChange}
                                            className="block w-full border border-slate-300 rounded-[6px] pr-12 pl-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] min-h-[44px]"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                                            meter
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                        Standar terminal adalah 50 meter. Teknisi di luar radius ini tidak dapat memvalidasi inspeksi tanpa persetujuan khusus.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Section 3: Siklus Hidup & Catatan */}
                <div className="bg-white border border-slate-200 rounded-[8px] p-5 sm:p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-[4px] bg-[#11468F]/10 text-[#11468F] flex items-center justify-center font-bold text-xs">
                                3
                            </span>
                            <h2 className="text-base font-bold text-slate-900">
                                Tanggal Masa Berlaku &amp; Catatan
                            </h2>
                        </div>
                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Manufactured Date */}
                        <div className="space-y-1.5">
                            <label htmlFor="manufactured_date" className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                                Tanggal Produksi / Pembelian
                            </label>
                            <input
                                type="date"
                                name="manufactured_date"
                                id="manufactured_date"
                                value={formData.manufactured_date}
                                onChange={handleChange}
                                className="block w-full border border-slate-300 rounded-[6px] px-3.5 py-2.5 text-sm text-slate-900 bg-white shadow-2xs focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] min-h-[44px]"
                            />
                        </div>

                        {/* Expired Date */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label htmlFor="expired_at" className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                                    Tanggal Kadaluarsa Media
                                </label>
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setQuickExpiry(1)}
                                        className="text-[10px] font-bold text-[#11468F] bg-blue-50 px-1.5 py-0.5 rounded-[3px] hover:bg-blue-100"
                                    >
                                        +1 Thn
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuickExpiry(5)}
                                        className="text-[10px] font-bold text-[#11468F] bg-blue-50 px-1.5 py-0.5 rounded-[3px] hover:bg-blue-100"
                                    >
                                        +5 Thn
                                    </button>
                                </div>
                            </div>
                            <input
                                type="date"
                                name="expired_at"
                                id="expired_at"
                                value={formData.expired_at}
                                onChange={handleChange}
                                className="block w-full border border-slate-300 rounded-[6px] px-3.5 py-2.5 text-sm text-slate-900 bg-white shadow-2xs focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] min-h-[44px]"
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5 sm:col-span-2">
                            <label htmlFor="notes" className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                                Catatan Khusus Tabung
                            </label>
                            <textarea
                                name="notes"
                                id="notes"
                                rows={3}
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Tambahkan catatan khusus, nomor sertifikat hidrostatik, atau instruksi penanganan..."
                                className="block w-full border border-slate-300 rounded-[6px] p-3 text-sm text-slate-900 shadow-2xs focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F]"
                            />
                        </div>
                    </div>
                </div>

                {/* Form Action Footer */}
                <div className="bg-white border border-slate-200 rounded-[8px] p-4 sm:p-5 shadow-xs flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-xs text-slate-500 hidden sm:block">
                        Periksa kembali kesesuaian nomor seri sebelum menyimpan data.
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link
                            to="/apar"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center px-5 py-2.5 border border-slate-300 rounded-[6px] shadow-xs text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 transition-colors min-h-[46px]"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            data-testid="submit-apar-btn"
                            disabled={isCreatingApar}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-2.5 border border-transparent rounded-[6px] shadow-sm text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] hover:bg-[#0d3873] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#11468F] disabled:opacity-50 transition-all min-h-[46px]"
                        >
                            {isCreatingApar ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                                    <span>Simpan APAR</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
};

export default AparCreate;
