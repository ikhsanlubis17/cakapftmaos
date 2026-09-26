import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, getRouteApi, Link } from "@tanstack/react-router";
import axios, { AxiosResponse } from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AparType } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
    FireIcon,
    ArrowLeftIcon,
    MapPinIcon,
    CalendarIcon,
    ScaleIcon,
    BuildingOffice2Icon,
    TruckIcon,
    CheckCircleIcon,
    SparklesIcon,
} from "@heroicons/react/24/outline";

const DEFAULT_FT_MAOS_LAT = "-7.604500";
const DEFAULT_FT_MAOS_LNG = "109.153400";

const AparEdit: React.FC = () => {
    const route = getRouteApi("/authenticated/apar/$id/edit");
    const { id } = route.useParams();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { apiClient } = useAuth();
    const queryClient = useQueryClient();

    const [gettingLocation, setGettingLocation] = useState(false);
    const [formData, setFormData] = useState({
        serial_number: "",
        location_type: "statis",
        location_name: "",
        latitude: "",
        longitude: "",
        valid_radius: "50",
        apar_type_id: "",
        capacity: "",
        manufactured_date: "",
        expired_at: "",
        status: "active",
        notes: "",
    });

    // Query: fetch apar detail
    const {
        data: aparData,
        isLoading: isAparLoading,
        isError: isAparError,
    } = useQuery<any, Error>({
        queryKey: ["apar", id],
        queryFn: async () => {
            const res = await apiClient.get(`/api/apar/${id}`);
            return res.data?.data ?? res.data;
        },
        enabled: Boolean(id),
    });

    // Populate form data when APAR loads
    useEffect(() => {
        if (aparData) {
            setFormData({
                serial_number: aparData.serial_number || "",
                location_type: aparData.location_type || "statis",
                location_name: aparData.location_name || "",
                latitude: aparData.latitude != null ? String(aparData.latitude) : "",
                longitude: aparData.longitude != null ? String(aparData.longitude) : "",
                valid_radius: aparData.valid_radius != null ? String(aparData.valid_radius) : "50",
                apar_type_id: aparData.apar_type_id != null ? String(aparData.apar_type_id) : "",
                capacity: aparData.capacity != null ? String(aparData.capacity) : "",
                manufactured_date: aparData.manufactured_date
                    ? aparData.manufactured_date.split("T")[0]
                    : "",
                expired_at: aparData.expired_at
                    ? aparData.expired_at.split("T")[0]
                    : "",
                status: aparData.status || "active",
                notes: aparData.notes || "",
            });
        }
    }, [aparData]);

    useEffect(() => {
        if (isAparError) {
            showError("Gagal memuat data APAR. Silakan coba lagi.");
            (navigate as any)({ to: "/apar" });
        }
    }, [isAparError]);

    // Query: active APAR types with safe normalization
    const { data: rawAparTypes = [], isLoading: isAparTypesLoading } = useQuery<
        AparType[],
        Error
    >({
        queryKey: ["apar-types"],
        queryFn: async () => {
            const res = await apiClient.get("/api/apar-types");
            const raw = res?.data;
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
        return list.filter((t: AparType) => Boolean(t && t.is_active));
    }, [rawAparTypes]);

    const getCurrentLocation = (highAccuracy = true) => {
        if (!navigator.geolocation) {
            showError("Geolocation tidak didukung oleh browser ini.");
            return;
        }

        setGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData((prev) => ({
                    ...prev,
                    latitude: latitude.toFixed(6),
                    longitude: longitude.toFixed(6),
                }));
                showSuccess(
                    highAccuracy
                        ? "Koordinat GPS akurat berhasil diperoleh!"
                        : "Koordinat GPS berhasil diperoleh (mode perkiraan jaringan)."
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
                        showError("Izin lokasi ditolak. Aktifkan GPS atau izinkan akses lokasi di browser.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        showError("Sinyal GPS tidak terdeteksi. Silakan masukkan koordinat manual.");
                        break;
                    case error.TIMEOUT:
                        showError("Waktu permintaan koordinat habis. Silakan coba lagi.");
                        break;
                    default:
                        showError("Gagal mendapatkan koordinat otomatis.");
                        break;
                }
            },
            {
                enableHighAccuracy: highAccuracy,
                timeout: 20000,
                maximumAge: highAccuracy ? 0 : Infinity,
            }
        );
    };

    const setFtMaosCoordinates = () => {
        setFormData((prev) => ({
            ...prev,
            latitude: DEFAULT_FT_MAOS_LAT,
            longitude: DEFAULT_FT_MAOS_LNG,
        }));
        showSuccess("Koordinat dipasang pada Titik Pusat Fuel Terminal Maos.");
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        if (name === "location_type") {
            setFormData((prev) => ({
                ...prev,
                location_type: value,
                // Terisi otomatis "Mobil Tangki" tanpa perlu input pengguna saat opsi mobil tangki dipilih
                location_name:
                    value === "mobile"
                        ? "Mobil Tangki"
                        : prev.location_name === "Mobil Tangki"
                        ? ""
                        : prev.location_name,
                // Koordinat dinonaktifkan/dikosongkan saat penempatan bergerak
                latitude: value === "mobile" ? "" : prev.latitude,
                longitude: value === "mobile" ? "" : prev.longitude,
                valid_radius: value === "mobile" ? "50" : prev.valid_radius,
            }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const setQuickCapacity = (cap: number) => {
        setFormData((prev) => ({
            ...prev,
            capacity: String(cap),
        }));
    };

    const setQuickExpiry = (yearsToAdd: number) => {
        const base = formData.manufactured_date
            ? new Date(formData.manufactured_date)
            : new Date();
        const future = new Date(base);
        future.setFullYear(future.getFullYear() + yearsToAdd);
        const yyyy = future.getFullYear();
        const mm = String(future.getMonth() + 1).padStart(2, "0");
        const dd = String(future.getDate()).padStart(2, "0");
        setFormData((prev) => ({
            ...prev,
            expired_at: `${yyyy}-${mm}-${dd}`,
        }));
    };

    const updateMutation = useMutation<AxiosResponse, any, typeof formData>({
        mutationFn: (data: typeof formData) => {
            const isMobile = data.location_type === "mobile";
            const dataToSend = {
                ...data,
                location_name: isMobile ? "Mobil Tangki" : data.location_name,
                capacity: parseInt(data.capacity) || 0,
                valid_radius: isMobile ? 50 : (parseInt(data.valid_radius) || 50),
                latitude: isMobile ? null : (data.latitude ? parseFloat(data.latitude) : null),
                longitude: isMobile ? null : (data.longitude ? parseFloat(data.longitude) : null),
            };
            return apiClient.put(`/api/apar/${id}`, dataToSend);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["apars"] });
            queryClient.invalidateQueries({ queryKey: ["apar", id] });
            showSuccess("Data APAR berhasil diperbarui!");
            (navigate as any)({ to: "/apar" });
        },
        onError: (error: any) => {
            console.error("Error updating APAR:", error);
            if (axios.isAxiosError(error) && error.response?.data?.errors) {
                const errorMessages = Object.values(error.response.data.errors).flat();
                showError(errorMessages.join(", "), "Gagal Memperbarui APAR");
            } else {
                showError(
                    error?.response?.data?.message ||
                        "Gagal memperbarui APAR. Silakan coba lagi."
                );
            }
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    if (isAparLoading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#11468F] mx-auto mb-3" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Memuat data APAR...
                    </p>
                </div>
            </div>
        );
    }

    if (!aparData) {
        return (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-[8px] p-8">
                <FireIcon className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                <h3 className="text-base font-bold text-slate-800">
                    APAR Tidak Ditemukan
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                    Data APAR dengan ID {id} tidak ditemukan dalam sistem.
                </p>
                <Link
                    to="/apar"
                    className="inline-flex items-center px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] rounded-[6px]"
                >
                    Kembali ke Daftar APAR
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center font-bold shadow-sm">
                        <FireIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                Edit Data APAR
                            </h1>
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-700 border border-slate-200">
                                {formData.serial_number}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Perbarui spesifikasi tabung, koordinat toleransi GPS, dan masa berlaku
                        </p>
                    </div>
                </div>
                <div>
                    <Link
                        to="/apar"
                        className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-[6px] shadow-xs transition-colors"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Kembali ke Daftar
                    </Link>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* CARD 1: Spesifikasi & Identitas Teknis */}
                <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                        <div className="flex items-center space-x-2">
                            <ScaleIcon className="w-5 h-5 text-[#11468F]" />
                            <h2 className="text-base font-bold text-slate-900">
                                1. Spesifikasi & Identitas Tabung
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Informasi identitas fisik, jenis media pemadam, dan lokasi penempatan
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Serial Number */}
                        <div>
                            <label
                                htmlFor="serial_number"
                                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                            >
                                Nomor Seri Tabung *
                            </label>
                            <input
                                type="text"
                                id="serial_number"
                                name="serial_number"
                                value={formData.serial_number}
                                onChange={handleChange}
                                required
                                className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Jenis APAR */}
                        <div>
                            <label
                                htmlFor="apar_type_id"
                                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                            >
                                Jenis APAR / Media Pemadam *
                            </label>
                            <select
                                id="apar_type_id"
                                name="apar_type_id"
                                value={formData.apar_type_id}
                                onChange={handleChange}
                                required
                                className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                            >
                                <option value="">-- Pilih Jenis APAR --</option>
                                {(Array.isArray(aparTypes) ? aparTypes : []).map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name} ({type.description || "Standar"})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Kapasitas */}
                        <div className="md:col-span-2">
                            <label
                                htmlFor="capacity"
                                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                            >
                                Kapasitas Berat (kg) *
                            </label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <input
                                    type="number"
                                    id="capacity"
                                    name="capacity"
                                    value={formData.capacity}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    step="0.5"
                                    placeholder="Contoh: 6"
                                    className="w-full sm:w-48 px-3.5 py-2.5 min-h-[44px] text-sm font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                                />
                                {/* Quick capacity presets */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[11px] font-semibold text-slate-500 mr-1">
                                        Preset:
                                    </span>
                                    {[3, 4.5, 6, 9, 12, 25, 50, 68].map((cap) => (
                                        <button
                                            key={cap}
                                            type="button"
                                            onClick={() => setQuickCapacity(cap)}
                                            className={`px-2.5 py-1 text-xs font-semibold rounded-[4px] border transition-colors ${
                                                formData.capacity === String(cap)
                                                    ? "bg-[#11468F] text-white border-[#11468F]"
                                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                            }`}
                                        >
                                            {cap} kg
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Tipe Lokasi */}
                        <div>
                            <label
                                htmlFor="location_type"
                                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                            >
                                Tipe Lokasi Penempatan *
                            </label>
                            <select
                                id="location_type"
                                name="location_type"
                                value={formData.location_type}
                                onChange={handleChange}
                                required
                                className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                            >
                                <option value="statis">Statis (Gedung / Area Terminal)</option>
                                <option value="mobile">Mobil (Mobil Tangki BBM)</option>
                            </select>
                        </div>

                        {/* Nama Lokasi */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label
                                    htmlFor="location_name"
                                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                                >
                                    Nama / Deskripsi Titik Lokasi *
                                </label>
                                {formData.location_type === "mobile" && (
                                    <span className="text-[10px] font-bold text-[#11468F] bg-blue-50 px-2 py-0.5 rounded-[4px] border border-blue-200">
                                        Terisi Otomatis
                                    </span>
                                )}
                            </div>
                            <input
                                type="text"
                                id="location_name"
                                name="location_name"
                                value={formData.location_name}
                                onChange={handleChange}
                                required
                                readOnly={formData.location_type === "mobile"}
                                placeholder={
                                    formData.location_type === "mobile"
                                        ? "Mobil Tangki"
                                        : "Contoh: Gedung Admin Lt. 1 / Ruang Pompa"
                                }
                                className={`block w-full px-3.5 py-2.5 min-h-[44px] text-sm rounded-[6px] border transition-all ${
                                    formData.location_type === "mobile"
                                        ? "bg-slate-100 border-slate-300 text-slate-700 cursor-not-allowed font-semibold"
                                        : "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-[#11468F] focus:border-transparent"
                                }`}
                            />
                            {formData.location_type === "mobile" && (
                                <p className="text-[11px] text-[#11468F] flex items-center gap-1 font-medium mt-1">
                                    <CheckCircleIcon className="w-3.5 h-3.5 text-[#11468F] flex-shrink-0" />
                                    Penamaan area otomatis diset ke &quot;Mobil Tangki&quot; untuk armada operasional.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* CARD 2: Titik Koordinat & Validasi Geofence */}
                {formData.location_type === "mobile" ? (
                    <div className="bg-blue-50/70 border border-blue-200 rounded-[8px] p-6 shadow-sm flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-[6px] bg-[#11468F]/10 text-[#11468F] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <TruckIcon className="w-5 h-5 text-[#11468F]" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-[#041562] uppercase tracking-wider">
                                    2. Penempatan Bergerak (Mobil Tangki / Armada)
                                </h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-blue-100 text-[#11468F] border border-blue-200">
                                    Bebas Geofence Statis
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Titik koordinat geografis dan toleransi radius GPS dinonaktifkan secara otomatis karena APAR ditempatkan pada armada mobil tangki yang bersifat bergerak (mobile).
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <MapPinIcon className="w-5 h-5 text-[#11468F]" />
                                    <h2 className="text-base font-bold text-slate-900">
                                        2. Titik Koordinat & Toleransi Radius Geofence
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Digunakan sistem anti-fraud untuk validasi lokasi saat teknisi melakukan inspeksi lapangan
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => getCurrentLocation(true)}
                                    disabled={gettingLocation}
                                    className="inline-flex items-center px-3 py-1.5 min-h-[40px] text-xs font-bold text-[#11468F] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-[6px] transition-colors"
                                >
                                    <SparklesIcon className="w-4 h-4 mr-1.5" />
                                    {gettingLocation ? "Mendeteksi GPS..." : "Deteksi GPS Saya"}
                                </button>
                                <button
                                    type="button"
                                    onClick={setFtMaosCoordinates}
                                    className="inline-flex items-center px-3 py-1.5 min-h-[40px] text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-[6px] transition-colors"
                                >
                                    <BuildingOffice2Icon className="h-4 w-4 mr-1.5" />
                                    Pusat FT Maos
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div>
                                <label
                                    htmlFor="latitude"
                                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                                >
                                    Latitude (Garis Lintang)
                                </label>
                                <input
                                    type="number"
                                    id="latitude"
                                    name="latitude"
                                    value={formData.latitude}
                                    onChange={handleChange}
                                    step="any"
                                    placeholder="-7.604500"
                                    className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="longitude"
                                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                                >
                                    Longitude (Garis Bujur)
                                </label>
                                <input
                                    type="number"
                                    id="longitude"
                                    name="longitude"
                                    value={formData.longitude}
                                    onChange={handleChange}
                                    step="any"
                                    placeholder="109.153400"
                                    className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="valid_radius"
                                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                                >
                                    Toleransi Radius (Meter) *
                                </label>
                                <input
                                    type="number"
                                    id="valid_radius"
                                    name="valid_radius"
                                    value={formData.valid_radius}
                                    onChange={handleChange}
                                    required
                                    min="10"
                                    max="1000"
                                    className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* CARD 3: Siklus & Catatan Tambahan */}
                <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                        <div className="flex items-center space-x-2">
                            <CalendarIcon className="w-5 h-5 text-[#11468F]" />
                            <h2 className="text-base font-bold text-slate-900">
                                3. Siklus Hidup, Masa Berlaku & Status
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Pemberitahuan kadaluarsa berkala dan status kelayakan operasional
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Status */}
                        <div>
                            <label
                                htmlFor="status"
                                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                            >
                                Status Tabung *
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                                className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                            >
                                <option value="active">Aktif (Siap Pakai)</option>
                                <option value="needs_repair">Perlu Perbaikan</option>
                                <option value="under_repair">Sedang Perbaikan</option>
                                <option value="inactive">Nonaktif</option>
                            </select>
                        </div>

                        {/* Manufactured Date */}
                        <div>
                            <label
                                htmlFor="manufactured_date"
                                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                            >
                                Tanggal Produksi / Pembelian
                            </label>
                            <input
                                type="date"
                                id="manufactured_date"
                                name="manufactured_date"
                                value={formData.manufactured_date}
                                onChange={handleChange}
                                className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Expired At */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label
                                    htmlFor="expired_at"
                                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                                >
                                    Tanggal Kadaluarsa
                                </label>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setQuickExpiry(1)}
                                        className="text-[10px] font-semibold text-[#11468F] hover:underline"
                                    >
                                        +1 Thn
                                    </button>
                                    <span className="text-slate-300">&bull;</span>
                                    <button
                                        type="button"
                                        onClick={() => setQuickExpiry(2)}
                                        className="text-[10px] font-semibold text-[#11468F] hover:underline"
                                    >
                                        +2 Thn
                                    </button>
                                    <span className="text-slate-300">&bull;</span>
                                    <button
                                        type="button"
                                        onClick={() => setQuickExpiry(5)}
                                        className="text-[10px] font-semibold text-[#11468F] hover:underline"
                                    >
                                        +5 Thn
                                    </button>
                                </div>
                            </div>
                            <input
                                type="date"
                                id="expired_at"
                                name="expired_at"
                                value={formData.expired_at}
                                onChange={handleChange}
                                className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Notes */}
                        <div className="md:col-span-3">
                            <label
                                htmlFor="notes"
                                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                            >
                                Catatan Khusus / Riwayat Tabung
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                rows={3}
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Informasi tambahan terkait kondisi tabung, vendor penyedia, atau riwayat uji tekanan..."
                                className="block w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
                    <Link
                        to="/apar"
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-[6px] shadow-xs transition-colors text-center"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] hover:bg-[#0d3873] disabled:opacity-50 disabled:cursor-not-allowed rounded-[6px] shadow-sm transition-colors"
                    >
                        {updateMutation.isPending ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2" />
                                Menyimpan Perubahan...
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="w-4 h-4 mr-2" />
                                Simpan Perubahan APAR
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AparEdit;
