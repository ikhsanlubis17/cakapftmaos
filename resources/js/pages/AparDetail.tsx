import React, { useState, useEffect } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useQuery } from '@tanstack/react-query';
import { Apar } from '../types/api';
import {
    CameraIcon,
    MapPinIcon,
    CalendarIcon,
    FireIcon,
} from "@heroicons/react/24/outline";

const AparDetail: React.FC = () => {
    const route = getRouteApi('/authenticated/apar/$id');
    const { id } = route.useParams() as { id?: string };

    const { user, apiClient } = useAuth();
    const { showError } = useToast();

    // Minimal inspection shape used in the UI
    interface Inspection {
        id: number;
        created_at: string;
        condition?: string;
        notes?: string | null;
        photo_url?: string | null;
        user?: { name?: string } | null;
    }

    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [qrCodeError, setQrCodeError] = useState<boolean>(false);
    const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; inspection?: Inspection } | null>(null);
    const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);

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

    const { data: inspections = [], isLoading: inspectionsLoading } = useQuery<Inspection[], Error>({
        queryKey: ['apar', id, 'inspections'],
        queryFn: async () => {
            const response = await apiClient.get(`/api/apar/${id}/inspections`);
            return response.data.data ?? response.data;
        },
        staleTime: 1 * 60 * 1000, 
        enabled: !!id,
    });

    // Use react-query to fetch and cache the QR code blob
    const qrQuery = useQuery({
        queryKey: ['apar', id, 'qr-blob'],
        queryFn: async () => {
            const response = await apiClient.get(`/api/apar/${id}/qr-code`, {
                responseType: 'blob',
            });
            return response.data;
        },
        enabled: !!id,
        // Keep data fresh for 24 hours
        staleTime: 24 * 60 * 60 * 1000,
    });

    // Create object URL when blob is available and revoke on change/unmount
    useEffect(() => {
        let objectUrl: string | null = null;
        setQrCodeError(false);
        setQrCodeUrl('');

        if (qrQuery.data) {
            try {
                objectUrl = URL.createObjectURL(qrQuery.data as Blob);
                setQrCodeUrl(objectUrl);
            } catch (err) {
                console.error('Failed to create object URL for QR blob', err);
                setQrCodeError(true);
            }
        } else if (qrQuery.isError) {
            setQrCodeError(true);
        }

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
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

    const getConditionText = (condition?: string): string => {
        switch (condition) {
            case "good":
                return "Baik";
            case "needs_repair":
                return "Perlu Perbaikan";
            default:
                return condition ?? 'Unknown';
        }
    };

    const handlePhotoClick = (photoUrl: string, inspectionData?: Inspection): void => {
        setSelectedPhoto({ url: photoUrl, inspection: inspectionData });
        setShowPhotoModal(true);
    };

    const closePhotoModal = (): void => {
        setShowPhotoModal(false);
        setSelectedPhoto(null);
    };

    const handleQrCodeError = (): void => {
        console.error("QR Code failed to load");
        setQrCodeError(true);
    };

    const handlePhotoError = (e: React.SyntheticEvent<HTMLImageElement>, fallbackSelector: string): void => {
        const img = e.currentTarget as HTMLImageElement;
        console.error("Photo failed to load:", img.src);
        img.style.display = "none";

        // Cari fallback element menggunakan parent element
        const parent = img.parentElement as HTMLElement | null;
        const fallback = parent?.querySelector(fallbackSelector) as HTMLElement | null;
        if (fallback) {
            fallback.style.display = "flex";
        }
    };

    const loading = aparLoading || inspectionsLoading;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
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
            <div className="bg-white shadow rounded-lg">
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
                                className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors ${
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
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Kembali
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* APAR Information */}
            <div className="bg-white shadow rounded-lg">
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
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        QR Code
                    </h3>
                    <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-lg border">
                            {!qrCodeError ? (
                                qrQuery.isLoading ? (
                                    <div className="w-48 h-48 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                                    </div>
                                ) : qrCodeUrl ? (
                                    <img
                                        src={qrCodeUrl}
                                        alt="QR Code"
                                        className="w-48 h-48"
                                        onError={handleQrCodeError}
                                    />
                                ) : (
                                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-lg">
                                        <div className="text-gray-400 text-sm">QR Code tidak tersedia</div>
                                    </div>
                                )
                            ) : (
                                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-lg">
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

            {/* Inspection History */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Riwayat Inspeksi
                    </h3>
                    {inspections.length > 0 ? (
                        <div className="flow-root">
                            <ul className="-my-5 divide-y divide-gray-200">
                                {inspections.map((inspection: Inspection) => (
                                    <li key={inspection.id} className="py-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0">
                                                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                                    <CameraIcon className="h-4 w-4 text-red-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Inspeksi oleh {inspection.user?.name || "Unknown User"}
                                                    </p>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            inspection.condition === "good"
                                                                ? "bg-green-100 text-green-800"
                                                                : inspection.condition === "needs_repair"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        }`}>
                                                        {getConditionText(inspection.condition)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(inspection.created_at).toLocaleString("id-ID")}
                                                </p>
                                                {inspection.notes && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {inspection.notes}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex-shrink-0">
                                                {inspection.photo_url ? (
                                                    <div className="relative group">
                                                        <img
                                                            src={inspection.photo_url ?? undefined}
                                                            alt="Inspection Photo"
                                                            className="h-12 w-12 rounded-lg object-cover border border-gray-200 cursor-pointer hover:scale-110 transition-transform duration-200"
                                                            onClick={() => inspection.photo_url && handlePhotoClick(inspection.photo_url, inspection)}
                                                            onError={(e) => handlePhotoError(e as unknown as React.SyntheticEvent<HTMLImageElement>, ".photo-fallback")}
                                                        />
                                                        {/* Fallback icon when photo fails to load */}
                                                        <div
                                                            className="h-12 w-12 rounded-lg bg-gray-100 items-center justify-center border border-gray-200 photo-fallback"
                                                            style={{
                                                                display: "none",
                                                            }}
                                                        >
                                                            <CameraIcon className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                            Klik untuk lihat foto
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 group relative">
                                                        <CameraIcon className="h-6 w-6 text-gray-400" />
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-200 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                            Foto tidak tersedia
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                Belum ada inspeksi
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Mulai dengan melakukan inspeksi pertama.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Photo Modal */}
            {showPhotoModal && selectedPhoto && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 transition-opacity"
                            aria-hidden="true"
                        >
                            <div
                                className="absolute inset-0 bg-gray-500 opacity-75"
                                onClick={closePhotoModal}
                            ></div>
                        </div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                            Foto Inspeksi APAR
                                        </h3>
                                        <div className="text-center">
                                            <img
                                                src={selectedPhoto.url}
                                                alt="Inspection Photo"
                                                className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                                                onError={(e) => {
                                                    console.error(
                                                        "Error loading photo in modal:",
                                                        e
                                                    );
                                                    const img = e.currentTarget as HTMLImageElement;
                                                    img.style.display = "none";
                                                    const errorDiv = img.nextElementSibling as HTMLElement | null;
                                                    if (errorDiv) {
                                                        errorDiv.style.display = "block";
                                                    }
                                                }}
                                            />
                                            <div
                                                className="mt-4 text-sm text-gray-500 p-8 bg-gray-100 rounded-lg"
                                                style={{ display: "none" }}
                                            >
                                                <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                                <p>Foto tidak dapat dimuat</p>
                                            </div>
                                        </div>
                                        {selectedPhoto.inspection && (
                                            <div className="mt-4 text-sm text-gray-600">
                                                <p>
                                                    <strong>
                                                        Inspeksi oleh:
                                                    </strong> {selectedPhoto.inspection.user?.name || "Unknown User"}
                                                </p>
                                                <p>
                                                    <strong>Tanggal:</strong> {new Date(selectedPhoto.inspection.created_at).toLocaleString("id-ID")}
                                                </p>
                                                <p>
                                                    <strong>Kondisi:</strong> {getConditionText(selectedPhoto.inspection.condition)}
                                                </p>
                                                {selectedPhoto.inspection.notes && (
                                                    <p>
                                                        <strong>
                                                            Catatan:
                                                        </strong> {selectedPhoto.inspection.notes}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={closePhotoModal}
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

export default AparDetail;