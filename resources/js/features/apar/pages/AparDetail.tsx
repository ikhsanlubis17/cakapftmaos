import React, { useState, useEffect } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useQuery } from "@tanstack/react-query";
import { Apar } from "@/types/api";
import {
    FireIcon,
    ArrowLeftIcon,
    PencilIcon,
    MapPinIcon,
    TruckIcon,
    ScaleIcon,
    QrCodeIcon,
    ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { getAparStatusConfig, getLocationTypeConfig } from "@/utils/statusUtils";

const AparDetail: React.FC = () => {
    const route = getRouteApi("/authenticated/apar/$id");
    const { id } = route.useParams() as { id?: string };

    const { user, apiClient } = useAuth();
    const { showError, showSuccess } = useToast();

    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
    const [qrCodeError, setQrCodeError] = useState<boolean>(false);

    if (!id) {
        return (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-[8px] p-8">
                <FireIcon className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                <h3 className="text-base font-bold text-slate-800">
                    Parameter ID tidak ditemukan
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                    ID APAR tidak tersedia dalam URL.
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

    // Use react-query to fetch APAR detail
    const {
        data: apar,
        isLoading: aparLoading,
        isError: aparError,
    } = useQuery<Apar, Error>({
        queryKey: ["apar", id],
        queryFn: async () => {
            const response = await apiClient.get(`/api/apar/${id}`);
            return response.data.data ?? response.data;
        },
        staleTime: 60 * 1000,
        enabled: Boolean(id),
    });

    // Use react-query to fetch the QR code base64 string
    const qrQuery = useQuery({
        queryKey: ["apar", id, "qr-code"],
        queryFn: async () => {
            const response = await apiClient.get(`/api/apar/${id}/qr-code?v=3`);
            return response.data;
        },
        enabled: Boolean(id),
        staleTime: 24 * 60 * 60 * 1000,
    });

    useEffect(() => {
        setQrCodeError(false);
        setQrCodeUrl("");

        if (qrQuery.data?.qr_code) {
            const mimeType = qrQuery.data.mime_type || "image/svg+xml";
            setQrCodeUrl(`data:${mimeType};base64,${qrQuery.data.qr_code}`);
        } else if (qrQuery.isError) {
            setQrCodeError(true);
        }
    }, [qrQuery.data, qrQuery.isError]);

    const handleDownloadPng = () => {
        if (!qrCodeUrl || !apar) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const size = 600;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, size, size);
                ctx.drawImage(img, 0, 0, size, size);
                const pngUrl = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.href = pngUrl;
                link.download = `QR_${apar.serial_number}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showSuccess("QR Code berhasil diunduh sebagai PNG.");
            }
        };
        img.onerror = () => {
            showError("Gagal mengonversi QR Code ke format PNG.");
        };
        img.src = qrCodeUrl;
    };

    if (aparLoading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#11468F] mx-auto mb-3" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Memuat detail APAR...
                    </p>
                </div>
            </div>
        );
    }

    if (!apar) {
        return (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-[8px] p-8">
                <FireIcon className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                <h3 className="text-base font-bold text-slate-800">
                    APAR Tidak Ditemukan
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                    Data tabung pemadam api tidak ditemukan dalam sistem.
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

    const statusConfig = getAparStatusConfig(apar.status);
    const locationConfig = getLocationTypeConfig(apar.location_type);
    const isExpired =
        apar.expired_at && new Date(apar.expired_at) < new Date();

    return (
        <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-12 px-1 sm:px-0">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-[8px] p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
                        <FireIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight break-all">
                                APAR {apar.serial_number}
                            </h1>
                            <span
                                className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-[4px] text-[11px] sm:text-xs font-semibold border ${statusConfig.color} flex-shrink-0`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusConfig.dotColor}`}
                                />
                                {statusConfig.text}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Spesifikasi fisik, status kesiapan, kode QR terenkripsi, dan lokasi toleransi geofence
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                    {(user?.role === "admin" || user?.role === "supervisor") && (
                        <Link
                            to="/apar/$id/edit"
                            params={{ id: String(apar.id) }}
                            className="inline-flex items-center justify-center flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] hover:bg-[#0d3873] rounded-[6px] shadow-sm transition-colors"
                        >
                            <PencilIcon className="w-4 h-4 mr-1.5" />
                            Edit APAR
                        </Link>
                    )}
                    <Link
                        to="/apar"
                        className="inline-flex items-center justify-center flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-[6px] shadow-xs transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                        Kembali
                    </Link>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Left Col: Spec & Location */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    {/* Specifications Card */}
                    <div className="bg-white border border-slate-200 rounded-[8px] p-4 sm:p-6 shadow-sm space-y-4">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                            <ScaleIcon className="w-5 h-5 text-[#11468F]" />
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                                Identitas & Spesifikasi Fisik
                            </h2>
                        </div>

                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                            <div className="bg-slate-50 p-3 rounded-[6px] border border-slate-100">
                                <dt className="text-slate-500 font-semibold mb-0.5">
                                    Nomor Seri
                                </dt>
                                <dd className="font-mono font-bold text-xs sm:text-sm text-slate-900 break-all">
                                    {apar.serial_number}
                                </dd>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-[6px] border border-slate-100">
                                <dt className="text-slate-500 font-semibold mb-0.5">
                                    Jenis Media Pemadam
                                </dt>
                                <dd className="font-bold text-xs sm:text-sm text-slate-900">
                                    {apar.apar_type?.name || "Standar"}
                                </dd>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-[6px] border border-slate-100">
                                <dt className="text-slate-500 font-semibold mb-0.5">
                                    Kapasitas Berat
                                </dt>
                                <dd className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                                    {apar.capacity} kg
                                </dd>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-[6px] border border-slate-100">
                                <dt className="text-slate-500 font-semibold mb-0.5">
                                    Status Kesiapan
                                </dt>
                                <dd className="mt-0.5">
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border ${statusConfig.color}`}
                                    >
                                        {statusConfig.text}
                                    </span>
                                </dd>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-[6px] border border-slate-100">
                                <dt className="text-slate-500 font-semibold mb-0.5">
                                    Tanggal Produksi / Pembelian
                                </dt>
                                <dd className="font-mono font-semibold text-slate-800 break-words">
                                    {apar.manufactured_date
                                        ? new Date(apar.manufactured_date).toLocaleDateString("id-ID", {
                                              year: "numeric",
                                              month: "long",
                                              day: "numeric",
                                          })
                                        : "-"}
                                </dd>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-[6px] border border-slate-100">
                                <dt className="text-slate-500 font-semibold mb-0.5">
                                    Masa Berlaku / Kadaluarsa
                                </dt>
                                <dd
                                    className={`font-mono font-semibold break-words ${
                                        isExpired ? "text-rose-600 font-bold" : "text-slate-800"
                                    }`}
                                >
                                    {apar.expired_at
                                        ? new Date(apar.expired_at).toLocaleDateString("id-ID", {
                                              year: "numeric",
                                              month: "long",
                                              day: "numeric",
                                          })
                                        : "-"}
                                    {isExpired && " (Kadaluarsa)"}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Geofence & Location Card */}
                    <div className="bg-white border border-slate-200 rounded-[8px] p-4 sm:p-6 shadow-sm space-y-4">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                            <MapPinIcon className="w-5 h-5 text-[#11468F]" />
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                                Lokasi Penempatan & Validasi Geofence
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                            <div className="sm:col-span-2 bg-slate-50 p-3 sm:p-3.5 rounded-[6px] border border-slate-100">
                                <dt className="text-slate-500 font-semibold mb-1">
                                    Nama Titik Lokasi
                                </dt>
                                <dd className="text-sm font-bold text-slate-900 break-words">
                                    {apar.location_name}
                                </dd>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${locationConfig.color}`}
                                    >
                                        {apar.location_type === "mobile" ? (
                                            <TruckIcon className="w-3 h-3 mr-1" />
                                        ) : (
                                            <MapPinIcon className="w-3 h-3 mr-1" />
                                        )}
                                        {locationConfig.text}
                                    </span>
                                    {apar.tank_truck && (
                                        <span className="text-[10px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded-[3px] border border-slate-200">
                                            Mobil Tangki: {apar.tank_truck.plate_number}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-[6px] border border-slate-100">
                                <dt className="text-slate-500 font-semibold mb-0.5">
                                    Koordinat Latitude & Longitude
                                </dt>
                                <dd className="font-mono font-semibold text-xs sm:text-sm text-slate-900 break-all">
                                    {apar.latitude && apar.longitude
                                        ? `${apar.latitude}, ${apar.longitude}`
                                        : "Belum diset"}
                                </dd>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-[6px] border border-slate-100">
                                <dt className="text-slate-500 font-semibold mb-0.5">
                                    Toleransi Radius GPS
                                </dt>
                                <dd className="font-mono font-semibold text-xs sm:text-sm text-slate-900">
                                    {apar.valid_radius || 50} meter
                                </dd>
                            </div>
                        </div>

                        {apar.notes && (
                            <div className="mt-4 p-3 sm:p-3.5 bg-blue-50/60 rounded-[6px] border border-blue-100">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-[#11468F] mb-1">
                                    Catatan Khusus:
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed break-words">
                                    {apar.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Col: QR Code Card */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="bg-white border border-slate-200 rounded-[8px] p-4 sm:p-6 shadow-sm text-center">
                        <div className="flex items-center justify-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                            <QrCodeIcon className="w-5 h-5 text-[#041562]" />
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                                Label QR Code
                            </h2>
                        </div>

                        {qrCodeUrl ? (
                            <div className="space-y-4">
                                <div className="p-3 sm:p-4 bg-white border border-slate-200 rounded-[8px] inline-block shadow-xs max-w-full">
                                    <img
                                        src={qrCodeUrl}
                                        alt={`QR Code APAR ${apar.serial_number}`}
                                        className="w-40 h-40 sm:w-48 sm:h-48 mx-auto object-contain"
                                    />
                                </div>
                                <div className="font-mono text-xs font-bold text-slate-700 break-all px-2">
                                    {apar.qr_code_token || apar.serial_number}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed px-1">
                                    Pindai kode QR ini menggunakan modul scanner kamera teknisi untuk memulai inspeksi berkala.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleDownloadPng}
                                        className="inline-flex items-center justify-center flex-1 px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#041562] hover:bg-[#11468F] rounded-[6px] shadow-sm transition-colors cursor-pointer"
                                    >
                                        <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />
                                        Unduh PNG
                                    </button>
                                    <a
                                        href={qrCodeUrl}
                                        download={`QR_${apar.serial_number}.svg`}
                                        className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-[6px] shadow-xs transition-colors"
                                    >
                                        <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />
                                        Unduh SVG
                                    </a>
                                </div>
                            </div>
                        ) : qrCodeError ? (
                            <div className="py-6 sm:py-8 text-center space-y-2.5">
                                <p className="text-xs text-rose-600 font-semibold">
                                    Gagal memuat pratinjau QR Code.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => qrQuery.refetch()}
                                    className="inline-flex items-center px-3.5 py-2 min-h-[40px] text-xs font-bold uppercase tracking-wider text-[#11468F] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-[6px] transition-colors"
                                >
                                    Coba Muat Ulang
                                </button>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#11468F] mx-auto mb-2" />
                                <span className="text-xs text-slate-500">
                                    Membuat QR Code...
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AparDetail;