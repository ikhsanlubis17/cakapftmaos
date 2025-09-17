import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import {
    FireIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    MapPinIcon,
    TruckIcon,
    CameraIcon,
    XMarkIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const InspectionForm = () => {
    const { qrCode } = useParams();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { user } = useAuth();

    const [apar, setApar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [aparList, setAparList] = useState([]);
    const [filteredAparList, setFilteredAparList] = useState([]);

    // Location validation states
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationValid, setLocationValid] = useState(false);
    const [locationError, setLocationError] = useState("");
    const [locationDistance, setLocationDistance] = useState(null);
    const [locationValidRadius, setLocationValidRadius] = useState(null);
    const [locationDirection, setLocationDirection] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        condition: "good",
        notes: "",
        photos: [],
        damage_categories: [],
        damage_notes: "",
        needs_repair: false,
        repair_notes: "",
    });

    const [damageCategories, setDamageCategories] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (qrCode) {
            fetchAparByQR(qrCode);
        } else {
            fetchAparList();
        }
        fetchDamageCategories();
    }, [qrCode]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = aparList.filter(
                (apar) =>
                    apar.serial_number
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    apar.location_name
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    apar.apar_type?.name
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
            );
            setFilteredAparList(filtered);
        } else {
            setFilteredAparList(aparList);
        }
    }, [searchTerm, aparList]);

    const fetchAparByQR = async (qrCode) => {
        try {
            setLoading(true);
            // Use test endpoint temporarily for debugging
            const response = await axios.get(`/api/test-apar/qr/${qrCode}`);
            if (response.data.success) {
                setApar(response.data.data);

                // Auto-start location validation for static APAR
                if (response.data.data.location_type === "statis") {
                    setTimeout(() => {
                        getCurrentLocation();
                    }, 1000);
                }
            } else {
                showError("APAR tidak ditemukan atau QR Code tidak valid");
            }
        } catch (error) {
            console.error("Error fetching APAR:", error);
            showError("APAR tidak ditemukan atau QR Code tidak valid");
        } finally {
            setLoading(false);
        }
    };

    const fetchAparList = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/apar");
            setAparList(response.data.data);
            setFilteredAparList(response.data.data);
        } catch (error) {
            console.error("Error fetching APAR list:", error);
            showError("Gagal memuat daftar APAR");
        } finally {
            setLoading(false);
        }
    };

    const fetchDamageCategories = async () => {
        try {
            const response = await axios.get("/api/damage-categories");
            setDamageCategories(
                response.data.data.filter((cat) => cat.is_active)
            );
        } catch (error) {
            console.error("Error fetching damage categories:", error);
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolokasi tidak didukung di browser ini");
            return;
        }

        setLocationLoading(true);
        setLocationError("");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newLocation = { lat: latitude, lng: longitude };
                setCurrentLocation(newLocation);

                if (
                    apar &&
                    apar.location_type === "statis" &&
                    apar.latitude &&
                    apar.longitude
                ) {
                    validateLocation(
                        newLocation,
                        apar.latitude,
                        apar.longitude,
                        apar.valid_radius
                    );
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                setLocationError(
                    "Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan."
                );
                setLocationLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    };

    const validateLocation = (userLocation, aparLat, aparLng, validRadius) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (userLocation.lat * Math.PI) / 180;
        const φ2 = (aparLat * Math.PI) / 180;
        const Δφ = ((aparLat - userLocation.lat) * Math.PI) / 180;
        const Δλ = ((aparLng - userLocation.lng) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c;
        setLocationDistance(Math.round(distance));
        setLocationValidRadius(validRadius);

        const isValid = distance <= validRadius;
        setLocationValid(isValid);

        if (!isValid) {
            setLocationError(
                `Anda berada di luar radius valid. Jarak: ${Math.round(
                    distance
                )}m, Maksimal: ${validRadius}m`
            );
        }

        setLocationLoading(false);

        // Calculate direction
        const bearing =
            (Math.atan2(
                Math.sin(Δλ) * Math.cos(φ2),
                Math.cos(φ1) * Math.sin(φ2) -
                    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
            ) *
                180) /
            Math.PI;
        setLocationDirection((bearing + 360) % 360);
    };

    const handlePhotoCapture = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFormData((prev) => ({
                    ...prev,
                    photos: [...prev.photos, e.target.result],
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = (index) => {
        setFormData((prev) => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentLocation && apar.location_type === "statis") {
            showError("Lokasi harus divalidasi terlebih dahulu");
            return;
        }

        if (apar.location_type === "statis" && !locationValid) {
            showError(
                "Anda harus berada di lokasi APAR untuk melakukan inspeksi"
            );
            return;
        }

        try {
            setSubmitting(true);

            const formDataToSend = new FormData();
            formDataToSend.append("apar_id", apar.id);
            formDataToSend.append("condition", formData.condition);
            formDataToSend.append("notes", formData.notes);
            formDataToSend.append("latitude", currentLocation?.lat || 0);
            formDataToSend.append("longitude", currentLocation?.lng || 0);
            formDataToSend.append(
                "damage_categories",
                JSON.stringify(formData.damage_categories)
            );
            formDataToSend.append("damage_notes", formData.damage_notes);
            formDataToSend.append("needs_repair", formData.needs_repair);
            formDataToSend.append("repair_notes", formData.repair_notes);

            // Add photos
            formData.photos.forEach((photo, index) => {
                if (photo.startsWith("data:")) {
                    // Convert base64 to blob
                    const byteString = atob(photo.split(",")[1]);
                    const mimeString = photo
                        .split(",")[0]
                        .split(":")[1]
                        .split(";")[0];
                    const ab = new ArrayBuffer(byteString.length);
                    const ia = new Uint8Array(ab);
                    for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                    }
                    const blob = new Blob([ab], { type: mimeString });
                    formDataToSend.append(
                        `photos[${index}]`,
                        blob,
                        `photo_${index}.jpg`
                    );
                }
            });

            await axios.post("/api/inspections", formDataToSend, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            showSuccess("Inspeksi berhasil disimpan!");
            setTimeout(() => {
                navigate("/apar");
            }, 2000);
        } catch (error) {
            console.error("Error submitting inspection:", error);

            // Handle location validation error specifically
            if (error.response?.status === 422 && error.response?.data?.error) {
                showError(error.response.data.error);

                // Update location validation state with server response
                if (error.response.data.distance !== null) {
                    setLocationDistance(
                        Math.round(error.response.data.distance)
                    );
                }
                if (error.response.data.valid_radius !== null) {
                    setLocationValidRadius(error.response.data.valid_radius);
                }
                setLocationValid(false);
                setLocationError(error.response.data.error);
            } else {
                showError(
                    error.response?.data?.message || "Gagal menyimpan inspeksi"
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleAparSelect = (selectedApar) => {
        setApar(selectedApar);
        if (selectedApar.location_type === "statis") {
            setTimeout(() => {
                getCurrentLocation();
            }, 1000);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (!apar) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
                <div className="max-w-4xl mx-auto p-4 space-y-6">
                    {/* Header */}
                    <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                                <FireIcon className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Pilih APAR untuk Inspeksi
                                </h1>
                                <p className="text-gray-600">
                                    Pilih APAR yang akan diinspeksi atau scan QR
                                    Code
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cari berdasarkan nomor seri, lokasi, atau jenis APAR..."
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">
                                Memuat daftar APAR...
                            </p>
                        </div>
                    ) : Array.isArray(filteredAparList) &&
                      filteredAparList.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredAparList.map((apar) => (
                                <div
                                    key={apar.id}
                                    onClick={() => handleAparSelect(apar)}
                                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                                >
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                                            <FireIcon className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                APAR {apar.serial_number}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {apar.apar_type?.name ||
                                                    "Tidak ada jenis"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p>
                                            <strong>Lokasi:</strong>{" "}
                                            {apar.location_name ||
                                                "Tidak ada lokasi"}
                                        </p>
                                        <p>
                                            <strong>Status:</strong>
                                            <span
                                                className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                                    apar.status === "active"
                                                        ? "bg-green-100 text-green-800"
                                                        : apar.status ===
                                                          "needs_repair"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : apar.status ===
                                                          "inactive"
                                                        ? "bg-red-100 text-red-800"
                                                        : apar.status ===
                                                          "under_repair"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                                                {apar.status === "active"
                                                    ? "Aktif"
                                                    : apar.status ===
                                                      "needs_repair"
                                                    ? "Perlu Perbaikan"
                                                    : apar.status === "inactive"
                                                    ? "Nonaktif"
                                                    : apar.status ===
                                                      "under_repair"
                                                    ? "Sedang Perbaikan"
                                                    : "Tidak Diketahui"}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <FireIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 text-lg">
                                {searchTerm
                                    ? "Tidak ada APAR yang sesuai dengan pencarian"
                                    : "Belum ada APAR tersedia"}
                            </p>
                        </div>
                    )}

                    {/* Back Button */}
                    <div className="text-center mt-8">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold text-lg"
                        >
                            Kembali ke Dashboard
                        </button>
                    </div>

                    {/* QR Scanner Modal */}
                    {showQRScanner && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    Scan QR Code APAR
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Arahkan kamera ke QR Code yang ada di APAR
                                    untuk memulai inspeksi.
                                </p>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setShowQRScanner(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={() => navigate("/scan")}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Buka Scanner
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Show loading state if APAR data is not yet loaded
    if (loading || !apar) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Memuat Data APAR...
                    </h2>
                    <p className="text-gray-500">Mohon tunggu sebentar</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
            <div className="max-w-2xl mx-auto p-4 space-y-6">
                {/* Header */}
                <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                                <FireIcon className="h-7 w-7 text-white" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                Inspeksi APAR
                            </h1>
                            <div className="flex items-center space-x-3">
                                <p className="text-lg font-semibold text-gray-700">
                                    {apar?.serial_number || "N/A"}
                                </p>
                                <span className="text-gray-400">•</span>
                                <p className="text-gray-600">
                                    {apar?.location_name || "N/A"}
                                </p>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                                {apar?.location_type === "statis" ? (
                                    <MapPinIcon className="h-4 w-4 text-blue-600" />
                                ) : (
                                    <TruckIcon className="h-4 w-4 text-purple-600" />
                                )}
                                <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                    {apar?.location_type === "statis"
                                        ? "APAR Statis"
                                        : "APAR Mobil"}
                                </span>
                                {apar?.location_type === "statis" &&
                                    apar?.valid_radius && (
                                        <span className="text-xs text-gray-500">
                                            Radius: {apar.valid_radius}m
                                        </span>
                                    )}
                            </div>

                            {/* APAR Details */}
                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-gray-600">Tipe</div>
                                    <div className="font-medium text-gray-900 capitalize">
                                        {apar?.apar_type?.name || "N/A"}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-gray-600">
                                        Kapasitas
                                    </div>
                                    <div className="font-medium text-gray-900">
                                        {apar?.capacity || "N/A"} kg
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-gray-600">Status</div>
                                    <div
                                        className={`font-medium ${
                                            apar?.status === "active"
                                                ? "text-green-600"
                                                : apar?.status === "inactive"
                                                ? "text-red-600"
                                                : apar?.status ===
                                                  "needs_repair"
                                                ? "text-yellow-600"
                                                : apar?.status ===
                                                  "under_repair"
                                                ? "text-blue-600"
                                                : "text-gray-600"
                                        }`}
                                    >
                                        {apar?.status === "active"
                                            ? "Aktif"
                                            : apar?.status === "inactive"
                                            ? "Nonaktif"
                                            : apar?.status === "needs_repair"
                                            ? "Perlu Perbaikan"
                                            : apar?.status === "under_repair"
                                            ? "Sedang Perbaikan"
                                            : apar?.status || "N/A"}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-gray-600">
                                        Kadaluarsa
                                    </div>
                                    <div className="font-medium text-gray-900">
                                        {apar?.expired_at
                                            ? new Date(
                                                  apar.expired_at
                                              ).toLocaleDateString("id-ID")
                                            : "Tidak ada"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location Validation */}
                {apar?.location_type === "statis" && (
                    <div
                        className={`bg-white shadow-xl rounded-2xl p-6 border border-gray-100 ${
                            locationLoading
                                ? "border-l-4 border-blue-400 bg-blue-50"
                                : locationValid
                                ? "border-l-4 border-green-400 bg-green-50"
                                : "border-l-4 border-red-400 bg-red-50"
                        }`}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                                {locationLoading ? (
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : locationValid ? (
                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    Validasi Lokasi
                                </h3>
                                <p className="text-gray-600">
                                    {locationLoading
                                        ? "Mendapatkan lokasi..."
                                        : locationValid
                                        ? "Lokasi valid. Anda berada di lokasi APAR."
                                        : `${
                                              locationError ||
                                              "Lokasi tidak valid."
                                          }`}
                                </p>
                                {currentLocation && (
                                    <div className="mt-2 space-y-1">
                                        <p className="text-sm text-gray-500 font-mono">
                                            Lokasi Anda:{" "}
                                            {currentLocation.lat.toFixed(6)},{" "}
                                            {currentLocation.lng.toFixed(6)}
                                        </p>
                                        {apar?.location_type === "statis" &&
                                            apar?.latitude &&
                                            apar?.longitude && (
                                                <p className="text-sm text-gray-500 font-mono">
                                                    🎯 APAR: {apar.latitude},{" "}
                                                    {apar.longitude}
                                                </p>
                                            )}
                                        {locationDistance !== null &&
                                            locationValidRadius !== null && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-4">
                                                            <span
                                                                className={`px-2 py-1 rounded-full font-medium ${
                                                                    locationValid
                                                                        ? "bg-green-100 text-green-700"
                                                                        : "bg-red-100 text-red-700"
                                                                }`}
                                                            >
                                                                Jarak:{" "}
                                                                {
                                                                    locationDistance
                                                                }
                                                                m
                                                            </span>
                                                            <span className="text-gray-600">
                                                                Maksimal:{" "}
                                                                {
                                                                    locationValidRadius
                                                                }
                                                                m
                                                            </span>
                                                        </div>
                                                        {!locationValid &&
                                                            !locationLoading && (
                                                                <button
                                                                    type="button"
                                                                    onClick={
                                                                        getCurrentLocation
                                                                    }
                                                                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                                                                >
                                                                    Refresh
                                                                </button>
                                                            )}
                                                    </div>

                                                    {/* Simple distance visualization */}
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                                locationValid
                                                                    ? "bg-green-500"
                                                                    : "bg-red-500"
                                                            }`}
                                                            style={{
                                                                width: `${Math.min(
                                                                    (locationDistance /
                                                                        locationValidRadius) *
                                                                        100,
                                                                    100
                                                                )}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>0m</span>
                                                        <span>
                                                            {
                                                                locationValidRadius
                                                            }
                                                            m
                                                        </span>
                                                    </div>

                                                    {/* Progress indicator */}
                                                    <div className="text-center">
                                                        <div
                                                            className={`text-xs font-medium ${
                                                                locationValid
                                                                    ? "text-green-600"
                                                                    : "text-red-600"
                                                            }`}
                                                        >
                                                            {locationValid
                                                                ? "Dalam radius valid"
                                                                : "Di luar radius valid"}
                                                        </div>
                                                        {!locationValid &&
                                                            locationDistance >
                                                                locationValidRadius && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    Perlu
                                                                    mendekat{" "}
                                                                    {locationDistance -
                                                                        locationValidRadius}
                                                                    m lagi
                                                                </div>
                                                            )}
                                                    </div>

                                                    {/* Simple compass */}
                                                    {locationDirection !==
                                                        null &&
                                                        !locationValid && (
                                                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                                <div className="text-center">
                                                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                                                        Arah ke
                                                                        APAR
                                                                    </div>
                                                                    <div className="relative w-16 h-16 mx-auto">
                                                                        <div className="absolute inset-0 border-2 border-gray-300 rounded-full"></div>
                                                                        <div
                                                                            className="absolute inset-0 flex items-center justify-center"
                                                                            style={{
                                                                                transform: `rotate(${locationDirection}deg)`,
                                                                            }}
                                                                        >
                                                                            <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-red-500"></div>
                                                                        </div>
                                                                        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
                                                                            {Math.round(
                                                                                locationDirection
                                                                            )}
                                                                            °
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            )}
                                    </div>
                                )}

                                {!currentLocation && !locationLoading && (
                                    <button
                                        onClick={getCurrentLocation}
                                        className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Dapatkan Lokasi
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Inspection Form */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white shadow-xl rounded-2xl p-6 space-y-6 border border-gray-100"
                >
                    {/* Condition Selection */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                            📊 Kondisi APAR{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                            <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-green-300 transition-colors">
                                <input
                                    type="radio"
                                    name="condition"
                                    value="good"
                                    checked={formData.condition === "good"}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            condition: e.target.value,
                                        })
                                    }
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                                />
                                <div className="ml-3">
                                    <div className="flex items-center space-x-2">
                                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                        <span className="font-medium text-gray-900">
                                            Baik
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        APAR dalam kondisi baik dan siap
                                        digunakan
                                    </p>
                                </div>
                            </label>

                            <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-yellow-300 transition-colors">
                                <input
                                    type="radio"
                                    name="condition"
                                    value="needs_repair"
                                    checked={
                                        formData.condition === "needs_repair"
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            condition: e.target.value,
                                        })
                                    }
                                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
                                />
                                <div className="ml-3">
                                    <div className="flex items-center space-x-2">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                                        <span className="font-medium text-gray-900">
                                            Perlu Perbaikan
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        APAR perlu diperbaiki atau pengisian
                                        ulang
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Damage Categories */}
                    {formData.condition !== "good" && (
                        <div>
                            <label className="block text-lg font-semibold text-gray-900 mb-4">
                                🚨 Kategori Kerusakan
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {damageCategories.map((category) => (
                                    <label
                                        key={category.id}
                                        className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-red-300 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.damage_categories.includes(
                                                category.id
                                            )}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData({
                                                        ...formData,
                                                        damage_categories: [
                                                            ...formData.damage_categories,
                                                            category.id,
                                                        ],
                                                    });
                                                } else {
                                                    setFormData({
                                                        ...formData,
                                                        damage_categories:
                                                            formData.damage_categories.filter(
                                                                (id) =>
                                                                    id !==
                                                                    category.id
                                                            ),
                                                    });
                                                }
                                            }}
                                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                            {category.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Damage Notes */}
                    {formData.condition !== "good" && (
                        <div>
                            <label className="block text-lg font-semibold text-gray-900 mb-4">
                                📝 Catatan Kerusakan
                            </label>
                            <textarea
                                value={formData.damage_notes}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        damage_notes: e.target.value,
                                    })
                                }
                                rows={3}
                                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg resize-none"
                                placeholder="Jelaskan detail kerusakan yang ditemukan..."
                            />
                        </div>
                    )}

                    {/* Repair Assessment */}
                    {formData.condition !== "good" && (
                        <div>
                            <label className="block text-lg font-semibold text-gray-900 mb-4">
                                🔧 Perlu Perbaikan?
                            </label>
                            <div className="space-y-3">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.needs_repair}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                needs_repair: e.target.checked,
                                            })
                                        }
                                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-gray-700">
                                        Ya, APAR perlu diperbaiki
                                    </span>
                                </label>

                                {formData.needs_repair && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Catatan Perbaikan
                                        </label>
                                        <textarea
                                            value={formData.repair_notes}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    repair_notes:
                                                        e.target.value,
                                                })
                                            }
                                            rows={2}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                            placeholder="Jelaskan jenis perbaikan yang diperlukan..."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* General Notes */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                            📝 Catatan Umum
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    notes: e.target.value,
                                })
                            }
                            rows={3}
                            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg resize-none"
                            placeholder="Tambahkan catatan tambahan jika diperlukan..."
                        />
                    </div>

                    {/* Photo Capture */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                            📸 Foto Inspeksi
                        </label>
                        <div className="space-y-4">
                            {/* Photo capture button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:border-red-400 hover:bg-red-50 transition-all duration-200 group"
                            >
                                <div className="text-center">
                                    <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors duration-200">
                                        <CameraIcon className="h-8 w-8 text-red-600" />
                                    </div>
                                    <p className="mt-3 text-lg font-medium text-gray-700">
                                        Ambil Foto
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Foto kondisi APAR saat inspeksi
                                    </p>
                                </div>
                            </button>

                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhotoCapture}
                                className="hidden"
                            />

                            {/* Display captured photos */}
                            {formData.photos.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="font-medium text-gray-900">
                                        Foto yang Diambil:
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {formData.photos.map((photo, index) => (
                                            <div
                                                key={index}
                                                className="relative group"
                                            >
                                                <img
                                                    src={photo}
                                                    alt={`Photo ${index + 1}`}
                                                    className="w-full rounded-xl shadow-lg"
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-xl"></div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removePhoto(index)
                                                    }
                                                    className="absolute top-3 right-3 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-all duration-200 shadow-lg"
                                                >
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                                <div className="absolute bottom-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                                    Foto {index + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex space-x-4 pt-4">
                        <button
                            type="submit"
                            disabled={
                                submitting ||
                                (apar?.location_type === "statis" &&
                                    !locationValid)
                            }
                            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg"
                        >
                            {submitting ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Menyimpan...</span>
                                </div>
                            ) : (
                                "Simpan Inspeksi"
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/apar")}
                            className="px-6 py-4 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold text-lg"
                        >
                            Batal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InspectionForm;
