import React, { useState, useEffect } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useQuery } from '@tanstack/react-query';
import { Apar } from '@/types/api';
import {
    FireIcon,
} from "@heroicons/react/24/outline";

const AparDetail: React.FC = () => {
    const route = getRouteApi('/authenticated/apar/$id');
    const { id } = route.useParams() as { id?: string };

    const { user, apiClient } = useAuth();
    const { showError } = useToast();

    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [qrCodeError, setQrCodeError] = useState<boolean>(false);

    // Check if id parameter is available
    if (!id) {
        return (
            <div className="text-center py-12">
                <FireIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Parameter ID tidak ditemukan
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    ID APAR tidak tersedia dalam URL. Router context mungkin belum terinisialisasi.
                </p>
            </div>
        );
    }

    // Use react-query to fetch APAR detail and inspections
    const { data: apar, isLoading: aparLoading, isError: aparError } = useQuery<Apar, Error>({
        queryKey: ['apar', id],
        queryFn: async () => {
            const response = await apiClient.get(`/api/apar/${id}`);
            return response.data.data ?? response.data;
        },
        staleTime: 1 * 60 * 1000,
        enabled: !!id,
    });



    // Use react-query to fetch the QR code base64 string
    const qrQuery = useQuery({
        queryKey: ['apar', id, 'qr-code'],
        queryFn: async () => {
            // Add version to bust browser cache since we updated generation params
            const response = await apiClient.get(`/api/apar/${id}/qr-code?v=3`);
            return response.data;
        },
        enabled: !!id,
        // Keep data fresh for 24 hours
        staleTime: 24 * 60 * 60 * 1000,
    });

    // Set QR code URL when data is available
    useEffect(() => {
        setQrCodeError(false);
        setQrCodeUrl('');

        if (qrQuery.data?.qr_code) {
            setQrCodeUrl(`data:image/png;base64,${qrQuery.data.qr_code}`);
        } else if (qrQuery.isError) {
            setQrCodeError(true);
        }
    }, [qrQuery.data, qrQuery.isError]);

    const getStatusColor = (status?: string): string => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800";
            case "needs_repair":
                return "bg-yellow-100 text-yellow-800";
            case "inactive":
                return "bg-red-100 text-red-800";
            case "under_repair":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusText = (status?: string): string => {
        switch (status) {
            case "active":
                return "Aktif";
            case "needs_repair":
                return "Perlu Perbaikan";
            case "inactive":
                return "Nonaktif";
            case "under_repair":
                return "Sedang Perbaikan";
            default:
                return status ?? 'Unknown';
        }
    };

    const handleQrCodeError = (): void => {
        console.error("QR Code failed to load");
        setQrCodeError(true);
    };

    const loading = aparLoading;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11468F]"></div>
            </div>
        );
    }

    if (!apar) {
        return (
            <div className="text-center py-12">
                <FireIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                    APAR tidak ditemukan
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    APAR yang Anda cari tidak dapat ditemukan.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-[6px]">
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                APAR {apar.serial_number}
                            </h1>
                            <p className="text-gray-600">Detail lengkap APAR</p>
                        </div>
                        <div className="flex space-x-3">
                            <Link
                                to={
                                    apar?.id
                                        ? `/apar/${apar.id}/edit`
                                        : "/apar"
                                }
                                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-[6px] text-sm font-semibold text-white bg-[#11468F] hover:bg-[#0d3873] shadow-sm transition-colors ${
                                    !apar?.id
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }`}
                                onClick={(e) => {
                                    if (!apar?.id) {
                                        e.preventDefault();
                                        console.error(
                                            "Invalid APAR data, cannot navigate to edit page"
                                        );
                                        showError(
                                            "Data APAR tidak valid, tidak dapat mengedit"
                                        );
                                    }
                                }}
                            >
                                Edit APAR
                            </Link>
                            <Link
                                to="/apar"
                                className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-[6px] text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors"
                            >
                                Kembali
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* APAR Information */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-[6px]">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Informasi APAR
                    </h3>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                Nomor Seri
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {apar.serial_number}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                Jenis
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {apar.apar_type?.name?.toUpperCase() || 'Unknown'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                Kapasitas
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {apar.capacity} {/* Format capacity accordingly */}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                Status
                            </dt>
                            <dd className="mt-1">
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                        apar.status
                                    )}`}
                                >
                                    {getStatusText(apar.status)}
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                Tanggal Manufaktur
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {apar.manufactured_date
                                    ? new Date(
                                          apar.manufactured_date
                                      ).toLocaleDateString("id-ID")
                                    : "-"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                Tanggal Kadaluarsa
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {apar.expired_at
                                    ? new Date(
                                          apar.expired_at
                                      ).toLocaleDateString("id-ID")
                                    : "-"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                Lokasi
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {apar.location_name}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">
                                Tipe Lokasi
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {apar.location_type === "statis"
                                    ? "Statis"
                                    : "Mobil"}
                            </dd>
                        </div>
                        {apar.tank_truck && (
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Mobil Tangki
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {apar.tank_truck.plate_number} - {apar.tank_truck.driver_name}
                                </dd>
                            </div>
                        )}
                        {apar.latitude && apar.longitude && (
                            <div>
                                <dt className="text-sm font-medium text-gray-500">
                                    Koordinat
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {apar.latitude}, {apar.longitude} {/* Coordinates */}
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>
            </div>

            {/* QR Code */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-[6px]">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        QR Code
                    </h3>
                    <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-[6px] border border-slate-200">
                            {!qrCodeError ? (
                                qrQuery.isLoading ? (
                                    <div className="w-48 h-48 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#11468F]"></div>
                                    </div>
                                ) : qrCodeUrl ? (
                                    <img
                                        src={qrCodeUrl}
                                        alt="QR Code"
                                        className="w-48 h-48"
                                        onError={handleQrCodeError}
                                    />
                                ) : (
                                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-[6px]">
                                        <div className="text-gray-400 text-sm">QR Code tidak tersedia</div>
                                    </div>
                                )
                            ) : (
                                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-[6px]">
                                    <div className="text-center">
                                        <div className="text-gray-400 text-sm">
                                            QR Code tidak tersedia
                                        </div>
                                        <div className="text-gray-300 text-xs mt-1">
                                            Endpoint belum dikonfigurasi
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 text-center">
                        Scan QR Code ini untuk melakukan inspeksi
                    </p>
                </div>
            </div>


        </div>
    );
};

export default AparDetail;