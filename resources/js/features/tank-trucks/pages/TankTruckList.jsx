import React, { useState, Fragment } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
    TruckIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    FireIcon,
    MapPinIcon,
    CheckIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

const TankTruckList = () => {
    const { showSuccess, showError } = useToast();
    const { isOpen, config, confirm, close } = useConfirmDialog();
    const { apiClient } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedTankTrucks, setSelectedTankTrucks] = useState([]);
    const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [formData, setFormData] = useState({
        plate_number: "",
        driver_name: "",
        driver_phone: "",
        description: "",
        status: "active",
    });

    // Query: fetch tank trucks with searchTerm
    const tankTrucksQuery = useQuery({
        queryKey: ["tank-trucks", searchTerm],
        queryFn: async () => {
            const res = await apiClient.get(
                `/api/tank-trucks?search=${encodeURIComponent(searchTerm)}`
            );
            return res.data || res;
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
        keepPreviousData: true,
    });

    const tankTrucks = tankTrucksQuery.data?.data || tankTrucksQuery.data || [];
    const loading = tankTrucksQuery.isLoading;
    // Mutations
    const createMutation = useMutation({
        mutationFn: (newData) => apiClient.post("/api/tank-trucks", newData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tank-trucks"] });
            showSuccess("Mobil tangki berhasil ditambahkan");
        },
        onError: (err) => {
            console.error("Error creating tank truck:", err);
            showError("Gagal menambahkan mobil tangki. Silakan coba lagi.");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => apiClient.delete(`/api/tank-trucks/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tank-trucks"] });
            showSuccess("Mobil tangki berhasil dihapus");
        },
        onError: (err) => {
            console.error("Error deleting tank truck:", err);
            showError("Gagal menghapus mobil tangki. Silakan coba lagi.");
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await createMutation.mutateAsync(formData);
        setShowModal(false);
        setFormData({
            plate_number: "",
            driver_name: "",
            driver_phone: "",
            description: "",
            status: "active",
        });
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm({
            title: "Konfirmasi Hapus Mobil Tangki",
            message:
                "Apakah Anda yakin ingin menghapus mobil tangki ini? Tindakan ini tidak dapat dibatalkan.",
            type: "warning",
            confirmText: "Ya, Hapus",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (confirmed) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedTankTrucks.length === 0) {
            showError("Pilih mobil tangki yang akan dihapus terlebih dahulu");
            return;
        }

        const confirmed = await confirm({
            title: "Konfirmasi Hapus Massal",
            message: `Apakah Anda yakin ingin menghapus ${selectedTankTrucks.length} mobil tangki? Tindakan ini tidak dapat dibatalkan.`,
            type: "warning",
            confirmText: "Ya, Hapus Semua",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (!confirmed) return;

        setDeleting(true);
        try {
            const deletePromises = selectedTankTrucks.map(async (id) => {
                try {
                    await deleteMutation.mutateAsync(id);
                    return { success: true, id };
                } catch (error) {
                    return { success: false, id, error };
                }
            });

            const results = await Promise.all(deletePromises);
            const successful = results.filter((r) => r.success);
            const failed = results.filter((r) => !r.success);

            if (successful.length > 0) {
                showSuccess(
                    `${successful.length} mobil tangki berhasil dihapus${
                        failed.length > 0 ? `, ${failed.length} gagal` : ""
                    }`
                );
            } else {
                showError("Gagal menghapus semua mobil tangki yang dipilih");
            }

            setSelectedTankTrucks([]);
            setBulkDeleteMode(false);
            // queries already invalidated by successful deleteMutation onSuccess
        } catch (error) {
            console.error("Gagal dalam bulk delete:", error);
            showError(
                "Gagal menghapus mobil tangki yang dipilih. Silakan coba lagi."
            );
        } finally {
            setDeleting(false);
        }
    };

    const toggleBulkDeleteMode = () => {
        setBulkDeleteMode(!bulkDeleteMode);
        setSelectedTankTrucks([]);
    };

    const handleSelectTankTruck = (id) => {
        setSelectedTankTrucks((prev) =>
            prev.includes(id)
                ? prev.filter((truckId) => truckId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedTankTrucks.length === tankTrucks.length) {
            setSelectedTankTrucks([]);
        } else {
            setSelectedTankTrucks(tankTrucks.map((truck) => truck.id));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "active":
                return "bg-emerald-50 text-emerald-700 border border-emerald-200";
            case "inactive":
                return "bg-red-50 text-red-700 border border-red-200";
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
                return "Nonaktif";
            case "maintenance":
                return "Maintenance";
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11468F]"></div>
            </div>
        );
    }

    return (
        <Fragment>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white shadow-sm border border-slate-200 rounded-[6px] p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 bg-[#041562] text-white rounded-[6px]">
                                <TruckIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Manajemen Mobil Tangki
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Kelola data mobil tangki dan APAR yang
                                    terpasang
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {bulkDeleteMode ? (
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                    <div className="flex items-center justify-center sm:justify-start px-3 py-2 bg-slate-50 border border-slate-200 rounded-[6px]">
                                        <span className="text-sm font-medium text-slate-700">
                                            {selectedTankTrucks.length} dipilih
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={
                                            selectedTankTrucks.length === 0 ||
                                             deleting
                                        }
                                        className={`inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-[6px] text-white ${
                                            selectedTankTrucks.length > 0 &&
                                            !deleting
                                                ? "bg-[#DA1212] hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DA1212]"
                                                : "bg-slate-300 cursor-not-allowed"
                                        } transition-all duration-200`}
                                    >
                                        {deleting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                <span className="hidden sm:inline">
                                                    Menghapus...
                                                </span>
                                                <span className="sm:hidden">
                                                    Hapus
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <TrashIcon className="h-4 w-4 mr-2" />
                                                <span className="hidden sm:inline">
                                                    Hapus (
                                                    {selectedTankTrucks.length})
                                                </span>
                                                <span className="sm:hidden">
                                                    Hapus
                                                </span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={toggleBulkDeleteMode}
                                        className="inline-flex items-center px-4 py-2.5 border border-slate-300 rounded-[6px] text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#11468F] transition-all duration-200"
                                    >
                                        <XMarkIcon className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">
                                            Batal
                                        </span>
                                        <span className="sm:hidden">Batal</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                        onClick={toggleBulkDeleteMode}
                                        className="inline-flex items-center px-4 py-2.5 border border-slate-300 rounded-[6px] text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#11468F] transition-all duration-200"
                                    >
                                        <TrashIcon className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">
                                            Hapus Massal
                                        </span>
                                        <span className="sm:hidden">Hapus</span>
                                    </button>
                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#11468F] transition-all duration-200 shadow-sm"
                                    >
                                        <PlusIcon className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">
                                            Tambah Mobil Tangki
                                        </span>
                                        <span className="sm:hidden">
                                            Tambah
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white shadow-sm border border-slate-200 rounded-[6px] p-6">
                    <div className="flex flex-col lg:flex-row lg:items-end gap-6">
                        <div className="flex-1">
                            <label
                                htmlFor="search"
                                className="block text-sm font-medium text-slate-700 mb-2"
                            >
                                Cari Mobil Tangki
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    name="search"
                                    id="search"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-colors duration-200"
                                    placeholder="Nomor plat atau nama supir..."
                                />
                            </div>
                        </div>

                        {searchTerm && (
                            <div className="w-full lg:w-auto">
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="w-full lg:w-auto px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 border border-slate-300 rounded-[6px] hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-colors duration-200"
                                >
                                    Bersihkan Pencarian
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tank Trucks List */}
                <div className="bg-white shadow-sm border border-slate-200 rounded-[6px] overflow-hidden">
                    {/* List Header */}
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <TruckIcon className="h-5 w-5 text-[#11468F]" />
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Daftar Mobil Tangki ({tankTrucks.length})
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* Bulk Delete Header */}
                    {bulkDeleteMode && (
                        <div className="px-6 py-3 border-b border-red-200 bg-red-50">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={
                                            selectedTankTrucks.length ===
                                                tankTrucks.length &&
                                            tankTrucks.length > 0
                                        }
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 text-[#DA1212] focus:ring-[#DA1212] border-slate-300 rounded-[3px]"
                                    />
                                    <span className="text-sm font-medium text-slate-900">
                                        Pilih Semua ({tankTrucks.length})
                                    </span>
                                </label>
                                <span className="text-sm text-slate-500">
                                    {selectedTankTrucks.length} dari{" "}
                                    {tankTrucks.length} dipilih
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Tank Trucks Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    {bulkDeleteMode && (
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left"
                                        >
                                            <span className="sr-only">
                                                Pilih
                                            </span>
                                        </th>
                                    )}
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                                    >
                                        Mobil Tangki
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                                    >
                                        Supir
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                                    >
                                        APAR
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                                    >
                                        Status
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                                    >
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {tankTrucks.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={bulkDeleteMode ? 6 : 5}
                                            className="px-6 py-12 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <TruckIcon className="h-12 w-12 text-slate-400" />
                                                <div>
                                                    <h3 className="text-lg font-medium text-slate-900">
                                                        Tidak ada mobil tangki
                                                    </h3>
                                                    <p className="text-slate-500">
                                                        {searchTerm
                                                            ? "Tidak ada mobil tangki yang sesuai dengan pencarian"
                                                            : "Belum ada mobil tangki yang dibuat"}
                                                    </p>
                                                </div>
                                                {!searchTerm && (
                                                    <button
                                                        onClick={() =>
                                                            setShowModal(true)
                                                        }
                                                        className="inline-flex items-center px-4 py-2 bg-[#11468F] hover:bg-[#0d3873] text-white font-semibold rounded-[6px] transition-colors shadow-sm"
                                                    >
                                                        <PlusIcon className="h-4 w-4 mr-2" />
                                                        Tambah Mobil Tangki
                                                        Pertama
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    tankTrucks.map((tankTruck) => (
                                        <tr
                                            key={tankTruck.id}
                                            className="hover:bg-slate-50 transition-colors"
                                        >
                                            {bulkDeleteMode && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTankTrucks.includes(
                                                            tankTruck.id
                                                        )}
                                                        onChange={() =>
                                                            handleSelectTankTruck(
                                                                tankTruck.id
                                                            )
                                                        }
                                                        className="h-4 w-4 text-[#DA1212] focus:ring-[#DA1212] border-slate-300 rounded-[3px]"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-8 h-8 bg-[#11468F]/10 text-[#11468F] rounded-[6px]">
                                                        <TruckIcon className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-900">
                                                            {
                                                                tankTruck.plate_number
                                                            }
                                                        </div>
                                                        {tankTruck.description && (
                                                            <div className="text-xs text-slate-500 max-w-xs truncate">
                                                                {
                                                                    tankTruck.description
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-900 font-medium">
                                                    {tankTruck.driver_name}
                                                </div>
                                                {tankTruck.driver_phone && (
                                                    <div className="text-xs text-slate-500">
                                                        {tankTruck.driver_phone}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <FireIcon className="h-4 w-4 text-red-500" />
                                                    <span className="text-sm text-slate-900 font-medium">
                                                        {tankTruck.apars
                                                            ?.length || 0}{" "}
                                                        APAR
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-[3px] text-xs font-semibold ${getStatusColor(
                                                        tankTruck.status
                                                    )}`}
                                                >
                                                    {getStatusText(
                                                        tankTruck.status
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Link
                                                        to={`/tank-trucks/${tankTruck.id}`}
                                                        className="inline-flex items-center p-1.5 text-[#11468F] hover:bg-[#11468F]/10 rounded-[6px] transition-colors"
                                                        title="Lihat Detail"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                    </Link>
                                                    <Link
                                                        to={`/tank-trucks/${tankTruck.id}/edit`}
                                                        className="inline-flex items-center p-1.5 text-amber-600 hover:bg-amber-50 rounded-[6px] transition-colors"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                tankTruck.id
                                                            )
                                                        }
                                                        className="inline-flex items-center p-1.5 text-[#DA1212] hover:bg-red-50 rounded-[6px] transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Tank Truck Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative mx-auto p-6 border border-slate-200 w-full max-w-md shadow-xl rounded-[6px] bg-white">
                        <div>
                            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900">
                                    Tambah Mobil Tangki
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="text-slate-400 hover:text-slate-600 rounded-[6px] p-1"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Nomor Plat{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.plate_number}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                plate_number: e.target.value,
                                            })
                                        }
                                        className="mt-1 block w-full border border-slate-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F]"
                                        placeholder="Contoh: B 1234 ABC"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Nama Supir{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.driver_name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                driver_name: e.target.value,
                                            })
                                        }
                                        className="mt-1 block w-full border border-slate-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F]"
                                        placeholder="Nama lengkap supir"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Nomor Telepon Supir
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.driver_phone}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                driver_phone: e.target.value,
                                            })
                                        }
                                        className="mt-1 block w-full border border-slate-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F]"
                                        placeholder="08xxxxxxxxxx"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                        rows="3"
                                        className="mt-1 block w-full border border-slate-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F]"
                                        placeholder="Keterangan tambahan..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                status: e.target.value,
                                            })
                                        }
                                        className="mt-1 block w-full border border-slate-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F]"
                                    >
                                        <option value="active">Aktif</option>
                                        <option value="inactive">
                                            Nonaktif
                                        </option>
                                        <option value="maintenance">
                                            Maintenance
                                        </option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-[6px] hover:bg-slate-200 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-[#11468F] hover:bg-[#0d3873] text-white font-semibold rounded-[6px] transition-colors shadow-sm"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </form>
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

export default TankTruckList;
