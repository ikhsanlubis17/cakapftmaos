import React, { useState } from "react";
import { useNavigate, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/contexts/ToastContext";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
    TruckIcon,
    ArrowLeftIcon,
    FireIcon,
    UserIcon,
    PhoneIcon,
    MapPinIcon,
    PlusIcon,
    TrashIcon,
    EyeIcon,
    PencilIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    CheckIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const TankTruckDetail = () => {
    const { id } = useParams({ from: "/authenticated/tank-trucks/$id" });
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { isOpen, config, confirm, close } = useConfirmDialog();
    const { apiClient } = useAuth();
    const queryClient = useQueryClient();
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedAparId, setSelectedAparId] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [assigning, setAssigning] = useState(false);

    const {
        data: truckData,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["tank-truck", id],
        queryFn: async () => {
            const res = await apiClient.get(`/api/tank-trucks/${id}`);
            return res.data || res;
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 2,
        onError: (err) => {
            console.error("Error fetching tank truck detail:", err);
            showError("Gagal memuat data mobil tangki. Silakan coba lagi.");
            navigate({ to: "/tank-trucks" });
        },
    });

    const { data: aparsData } = useQuery({
        queryKey: ["apars"],
        queryFn: async () => {
            const res = await apiClient.get("/api/apar");
            return res.data || res;
        },
        staleTime: 1000 * 60 * 2,
    });

    const tankTruck = truckData?.data || truckData || null;
    const apars = tankTruck?.apars || [];
    const allApars = aparsData?.data || aparsData || [];
    const availableApars = allApars.filter(
        (apar) => (apar.location_type === "mobile") && (!apar.tank_truck_id || apar.tank_truck_id == id)
    );

    const assignMutation = useMutation({
        mutationFn: (payload) =>
            apiClient.post(`/api/tank-trucks/${id}/assign-apar`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tank-truck", id] });
            queryClient.invalidateQueries({ queryKey: ["apars"] });
            showSuccess("APAR berhasil ditugaskan ke mobil tangki");
            setShowAssignModal(false);
            setSelectedAparId("");
            setSearchTerm("");
        },
        onError: (err) => {
            console.error("Error assigning APAR:", err);
            const msg = err?.response?.data?.message;
            if (msg) showError(msg);
            else showError("Gagal menugaskan APAR. Silakan coba lagi.");
        },
    });

    const handleAssignApar = async () => {
        if (!selectedAparId) {
            showError("Pilih APAR terlebih dahulu");
            return;
        }

        setAssigning(true);
        try {
            await assignMutation.mutateAsync({ apar_id: selectedAparId });
        } finally {
            setAssigning(false);
        }
    };

    const filteredAvailableApars = availableApars.filter((apar) => {
        const matchesSearch =
            apar.serial_number
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            (apar.aparType?.name || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            apar.location_name.toLowerCase().includes(searchTerm.toLowerCase());
        const isAvailable = !apar.tank_truck_id || apar.tank_truck_id == id;
        return matchesSearch && isAvailable;
    });

    const removeMutation = useMutation({
        mutationFn: (payload) =>
            apiClient.post(`/api/tank-trucks/${id}/remove-apar`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tank-truck", id] });
            queryClient.invalidateQueries({ queryKey: ["apars"] });
            showSuccess("APAR berhasil dihapus dari mobil tangki");
        },
        onError: (err) => {
            console.error("Error removing APAR:", err);
            showError("Gagal menghapus APAR. Silakan coba lagi.");
        },
    });

    const handleRemoveApar = async (aparId, serialNumber) => {
        const confirmed = await confirm({
            title: "Konfirmasi Hapus",
            message: `Apakah Anda yakin ingin menghapus APAR ${serialNumber} dari mobil tangki ini?`,
            type: "warning",
            confirmText: "Ya, Hapus",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (confirmed) {
            await removeMutation.mutateAsync({ apar_id: aparId });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "active":
                return "bg-emerald-50 text-emerald-700 border border-emerald-200";
            case "inactive":
                return "bg-slate-50 text-slate-700 border border-slate-200";
            case "maintenance":
                return "bg-amber-50 text-amber-700 border border-amber-200";
            default:
                return "bg-slate-50 text-slate-700 border border-slate-200";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "active":
                return "Aktif";
            case "inactive":
                return "Tidak Aktif";
            case "maintenance":
                return "Maintenance";
            default:
                return status;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11468F] mx-auto mb-4"></div>
                    <p className="text-slate-600 text-sm">Memuat data mobil tangki...</p>
                </div>
            </div>
        );
    }

    if (!tankTruck) {
        return (
            <div className="text-center py-12">
                <TruckIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">
                    Mobil Tangki Tidak Ditemukan
                </h3>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header - Responsive */}
            <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Detail Mobil Tangki
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Informasi lengkap mobil tangki dan APAR terpasang
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Link
                        to={`/tank-trucks/${id}/edit`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-[6px] shadow-sm text-sm font-semibold text-white bg-[#11468F] hover:bg-[#0d3873] focus:outline-none focus:ring-2 focus:ring-[#11468F]"
                    >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Edit</span>
                        <span className="sm:hidden">Edit</span>
                    </Link>
                    <button
                        onClick={() => navigate({ to: "/tank-trucks" })}
                        className="inline-flex items-center justify-center px-3.5 py-2 border border-slate-300 rounded-[6px] shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#11468F]"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Kembali</span>
                        <span className="sm:hidden">Kembali</span>
                    </button>
                </div>
            </div>

            {/* Tank Truck Info - Responsive */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-[6px] p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center flex-shrink-0">
                        <TruckIcon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                            {tankTruck.plate_number}
                        </h2>
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-[3px] text-xs font-semibold ${getStatusColor(
                                tankTruck.status
                            )}`}
                        >
                            {getStatusText(tankTruck.status)}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-slate-400 mr-2 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-900 truncate">
                            Supir: {tankTruck.driver_name}
                        </span>
                    </div>
                    {tankTruck.driver_phone && (
                        <div className="flex items-center">
                            <PhoneIcon className="h-5 w-5 text-slate-400 mr-2 flex-shrink-0" />
                            <span className="text-sm font-medium text-slate-900 truncate">
                                Telp: {tankTruck.driver_phone}
                            </span>
                        </div>
                    )}
                    {tankTruck.description && (
                        <div className="sm:col-span-2">
                            <p className="text-sm text-slate-600">
                                {tankTruck.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* APAR Management - Responsive */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-[6px]">
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center">
                            <FireIcon className="h-5 w-5 text-red-500 mr-2" />
                            <h3 className="text-lg font-bold text-slate-900">
                                APAR Terpasang
                            </h3>
                            <span className="ml-2.5 inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                {apars.length} APAR
                            </span>
                        </div>
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] shadow-sm transition-colors"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">
                                Tambah APAR
                            </span>
                            <span className="sm:hidden">Tambah</span>
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6">
                    {apars.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {apars.map((apar) => (
                                <div
                                    key={apar.id}
                                    className="bg-slate-50 border border-slate-200 rounded-[6px] p-4 hover:border-slate-300 transition-colors"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                        <div className="flex items-start flex-1 min-w-0">
                                            <div className="h-10 w-10 rounded-[6px] bg-[#11468F]/10 text-[#11468F] flex items-center justify-center flex-shrink-0">
                                                <FireIcon className="h-5 w-5" />
                                            </div>
                                            <div className="ml-3.5 flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5">
                                                    <p className="text-sm font-bold text-slate-900 truncate">
                                                        {apar.serial_number}
                                                    </p>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold ${
                                                            apar.status ===
                                                            "active"
                                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                : apar.status ===
                                                                  "needs_repair"
                                                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                                : apar.status ===
                                                                  "inactive"
                                                                ? "bg-red-50 text-red-700 border border-red-200"
                                                                : apar.status ===
                                                                  "under_repair"
                                                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                                : "bg-slate-50 text-slate-700 border border-slate-200"
                                                        }`}
                                                    >
                                                        {apar.status ===
                                                        "active"
                                                            ? "Aktif"
                                                            : apar.status ===
                                                              "needs_repair"
                                                            ? "Perlu Perbaikan"
                                                            : apar.status ===
                                                              "inactive"
                                                            ? "Nonaktif"
                                                            : apar.status ===
                                                              "under_repair"
                                                            ? "Sedang Perbaikan"
                                                            : apar.status}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">
                                                            {(
                                                                apar.aparType
                                                                    ?.name ||
                                                                "N/A"
                                                            ).toUpperCase()}
                                                        </span>{" "}
                                                        • {apar.capacity} kg
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {apar.location_name}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-start sm:justify-end gap-2 flex-shrink-0">
                                            <Link
                                                to={`/apar/${apar.id}`}
                                                className="inline-flex items-center justify-center p-2 text-[#11468F] hover:bg-[#11468F]/10 bg-slate-100 rounded-[6px] transition-colors"
                                                title="Lihat Detail APAR"
                                            >
                                                <EyeIcon className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() =>
                                                    handleRemoveApar(
                                                        apar.id,
                                                        apar.serial_number
                                                    )
                                                }
                                                className="inline-flex items-center justify-center p-2 text-[#DA1212] bg-red-50 hover:bg-red-100 rounded-[6px] transition-colors"
                                                title="Hapus dari Mobil Tangki"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="mx-auto h-14 w-14 rounded-[6px] bg-slate-100 flex items-center justify-center mb-4">
                                <FireIcon className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                Belum ada APAR terpasang
                            </h3>
                            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                                Tambahkan APAR ke mobil tangki ini untuk memulai
                                monitoring keselamatan.
                            </p>
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] shadow-sm transition-colors"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">
                                    Tambah APAR Pertama
                                </span>
                                <span className="sm:hidden">Tambah APAR</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Assign APAR Modal - Responsive */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative mx-auto border border-slate-200 w-full max-w-4xl shadow-xl rounded-[6px] bg-white overflow-hidden my-6">
                        {/* Modal Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-slate-200 gap-4 bg-slate-50/50">
                            <div className="flex items-center min-w-0 flex-1">
                                <div className="h-10 w-10 rounded-[6px] bg-[#041562] text-white flex items-center justify-center mr-3.5 flex-shrink-0">
                                    <FireIcon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                                        Pilih APAR untuk Mobil Tangki
                                    </h3>
                                    <p className="text-sm text-slate-500 truncate">
                                        Pilih APAR yang akan dipasang pada{" "}
                                        {tankTruck?.plate_number}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedAparId("");
                                    setSearchTerm("");
                                }}
                                className="p-2 rounded-[6px] hover:bg-slate-100 transition-colors flex-shrink-0 text-slate-400 hover:text-slate-600"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-6">
                            {/* Search Bar */}
                            <div className="mb-6">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Cari APAR berdasarkan nomor seri, jenis, atau lokasi..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] text-sm"
                                    />
                                </div>
                            </div>

                            {/* APAR List */}
                            <div className="max-h-96 overflow-y-auto pr-1">
                                {filteredAvailableApars.length > 0 ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {filteredAvailableApars.map((apar) => (
                                            <div
                                                key={apar.id}
                                                className={`relative p-4 border rounded-[6px] cursor-pointer transition-all ${
                                                    selectedAparId ===
                                                    apar.id.toString()
                                                        ? "border-[#11468F] bg-blue-50/30 ring-2 ring-[#11468F]"
                                                        : "border-slate-200 hover:border-slate-300"
                                                }`}
                                                onClick={() =>
                                                    setSelectedAparId(
                                                        apar.id.toString()
                                                    )
                                                }
                                            >
                                                {selectedAparId ===
                                                    apar.id.toString() && (
                                                    <div className="absolute top-3 right-3">
                                                        <div className="h-5 w-5 rounded-full bg-[#11468F] text-white flex items-center justify-center">
                                                            <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-start">
                                                    <div className="h-10 w-10 rounded-[6px] bg-[#11468F]/10 text-[#11468F] flex items-center justify-center flex-shrink-0">
                                                        <FireIcon className="h-5 w-5" />
                                                    </div>
                                                    <div className="ml-3.5 flex-1 min-w-0">
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                                            <p className="text-sm font-bold text-slate-900 truncate">
                                                                {
                                                                    apar.serial_number
                                                                }
                                                            </p>
                                                            <span
                                                                className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold ${
                                                                    apar.status ===
                                                                    "active"
                                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                        : apar.status ===
                                                                          "needs_repair"
                                                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                                        : apar.status ===
                                                                          "inactive"
                                                                        ? "bg-red-50 text-red-700 border border-red-200"
                                                                        : apar.status ===
                                                                          "under_repair"
                                                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                                        : "bg-slate-50 text-slate-700 border border-slate-200"
                                                                }`}
                                                            >
                                                                {apar.status ===
                                                                "active"
                                                                    ? "Aktif"
                                                                    : apar.status ===
                                                                      "needs_repair"
                                                                    ? "Perlu Perbaikan"
                                                                    : apar.status ===
                                                                      "inactive"
                                                                    ? "Nonaktif"
                                                                    : apar.status ===
                                                                      "under_repair"
                                                                    ? "Sedang Perbaikan"
                                                                    : apar.status}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm text-slate-600">
                                                                <span className="font-semibold text-slate-800">
                                                                    {(
                                                                        apar
                                                                            .aparType
                                                                            ?.name ||
                                                                        "N/A"
                                                                    ).toUpperCase()}
                                                                </span>{" "}
                                                                •{" "}
                                                                {apar.capacity}{" "}
                                                                kg
                                                            </p>
                                                            <p className="text-xs text-slate-500 truncate">
                                                                {
                                                                    apar.location_name
                                                                }
                                                            </p>
                                                            {apar.tank_truck_id &&
                                                                apar.tank_truck_id ==
                                                                    id && (
                                                                    <p className="text-xs text-[#11468F] font-semibold">
                                                                        ✓ Sudah
                                                                        terpasang
                                                                        di mobil
                                                                        ini
                                                                    </p>
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                                            Tidak ada APAR tersedia
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            {searchTerm
                                                ? "Coba ubah kata kunci pencarian Anda."
                                                : "Semua APAR sudah terpasang di mobil tangki lain."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-t border-slate-200 bg-slate-50 gap-4">
                            <div className="text-sm text-slate-600 text-center sm:text-left">
                                {selectedAparId ? (
                                    <span>
                                        APAR terpilih:{" "}
                                        <span className="font-bold text-slate-900">
                                            {
                                                availableApars.find(
                                                    (a) =>
                                                        a.id.toString() ===
                                                        selectedAparId
                                                )?.serial_number
                                            }
                                        </span>
                                    </span>
                                ) : (
                                    "Pilih APAR untuk melanjutkan"
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedAparId("");
                                        setSearchTerm("");
                                    }}
                                    className="px-4 py-2 border border-slate-300 rounded-[6px] text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleAssignApar}
                                    disabled={!selectedAparId || assigning}
                                    className={`px-5 py-2 rounded-[6px] font-semibold text-sm transition-colors border ${
                                        selectedAparId && !assigning
                                            ? "bg-[#11468F] hover:bg-[#0d3873] text-white border-transparent shadow-sm"
                                            : "bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed"
                                    }`}
                                >
                                    {assigning ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current inline-block mr-2"></div>
                                            <span className="hidden sm:inline">
                                                Menambahkan...
                                            </span>
                                            <span className="sm:hidden">
                                                Tambah...
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <PlusIcon className="h-4 w-4 inline-block mr-2" />
                                            <span className="hidden sm:inline">
                                                Tambahkan APAR
                                            </span>
                                            <span className="sm:hidden">
                                                Tambah APAR
                                            </span>
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
        </div>
    );
};

export default TankTruckDetail;
