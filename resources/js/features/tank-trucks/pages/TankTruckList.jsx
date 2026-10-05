import React, { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
    TruckIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    TrashIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import TankTruckModal from "../components/TankTruckModal";
import TankTruckTable from "../components/TankTruckTable";

export const TankTruckList = () => {
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

    // Query: fetch tank trucks with search
    const {
        data: tankTrucksResponse,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["tank-trucks", searchTerm],
        queryFn: async () => {
            const res = await apiClient.get(
                `/api/tank-trucks?search=${encodeURIComponent(searchTerm)}`
            );
            return res.data || res;
        },
        staleTime: 60 * 1000,
        keepPreviousData: true,
    });

    const tankTrucks = tankTrucksResponse?.data || tankTrucksResponse || [];

    // Mutations
    const createMutation = useMutation({
        mutationFn: (newData) => apiClient.post("/api/tank-trucks", newData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tank-trucks"] });
            showSuccess("Mobil tangki baru berhasil ditambahkan!");
            setShowModal(false);
            setFormData({
                plate_number: "",
                driver_name: "",
                driver_phone: "",
                description: "",
                status: "active",
            });
        },
        onError: (err) => {
            console.error("Error creating tank truck:", err);
            showError(
                err?.response?.data?.message ||
                    "Gagal menambahkan mobil tangki. Silakan periksa data."
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => apiClient.delete(`/api/tank-trucks/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tank-trucks"] });
            showSuccess("Mobil tangki berhasil dihapus.");
        },
        onError: (err) => {
            console.error("Error deleting tank truck:", err);
            showError("Gagal menghapus mobil tangki.");
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await createMutation.mutateAsync(formData);
    };

    const handleDelete = async (id) => {
        const truck = tankTrucks.find((t) => t.id === id);
        const plate = truck?.plate_number || "armada ini";

        const confirmed = await confirm({
            title: "Konfirmasi Hapus Mobil Tangki",
            message: `Apakah Anda yakin ingin menghapus mobil tangki ${plate}? Seluruh data terkait penugasan APAR pada truk ini akan dilepas. Tindakan ini tidak dapat dibatalkan.`,
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
            showError("Pilih minimal satu mobil tangki untuk dihapus.");
            return;
        }

        const confirmed = await confirm({
            title: "Konfirmasi Hapus Massal",
            message: `Apakah Anda yakin ingin menghapus ${selectedTankTrucks.length} mobil tangki sekaligus? Tindakan ini tidak dapat dibatalkan.`,
            type: "warning",
            confirmText: "Ya, Hapus Semua",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (confirmed) {
            setDeleting(true);
            try {
                await Promise.all(
                    selectedTankTrucks.map((id) => deleteMutation.mutateAsync(id))
                );
                showSuccess(`${selectedTankTrucks.length} mobil tangki berhasil dihapus.`);
                setSelectedTankTrucks([]);
                setBulkDeleteMode(false);
            } catch (error) {
                console.error("Gagal dalam bulk delete:", error);
                showError("Gagal menghapus sebagian mobil tangki.");
            } finally {
                setDeleting(false);
            }
        }
    };

    const handleSelectTankTruck = (id) => {
        setSelectedTankTrucks((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedTankTrucks.length === tankTrucks.length) {
            setSelectedTankTrucks([]);
        } else {
            setSelectedTankTrucks(tankTrucks.map((truck) => truck.id));
        }
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center font-bold shadow-sm">
                            <TruckIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                Manajemen Mobil Tangki
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Kelola data armada mobil tangki distribusi BBM dan APAR terpasang di armada
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => {
                                setBulkDeleteMode(!bulkDeleteMode);
                                if (bulkDeleteMode) setSelectedTankTrucks([]);
                            }}
                            className={`inline-flex items-center px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider border rounded-[6px] transition-colors shadow-xs ${
                                bulkDeleteMode
                                    ? "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100"
                                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                            {bulkDeleteMode ? (
                                <>
                                    <XMarkIcon className="h-4 w-4 mr-1.5" />
                                    Keluar Hapus Massal
                                </>
                            ) : (
                                <>
                                    <TrashIcon className="h-4 w-4 mr-1.5" />
                                    Hapus Massal
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center px-5 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] hover:bg-[#0d3873] rounded-[6px] shadow-sm transition-colors"
                        >
                            <PlusIcon className="w-4 h-4 mr-1.5" />
                            Tambah Mobil Tangki
                        </button>
                    </div>
                </div>

                {/* Bulk Delete Notification Bar */}
                {bulkDeleteMode && (
                    <div className="bg-rose-50 border border-rose-200 rounded-[8px] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-xs font-bold text-rose-800">
                            Mode Hapus Massal: {selectedTankTrucks.length} mobil tangki dipilih dari {tankTrucks.length} total.
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleBulkDelete}
                                disabled={selectedTankTrucks.length === 0 || deleting}
                                className="inline-flex items-center px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-[6px] transition-colors shadow-xs"
                            >
                                {deleting ? "Menghapus..." : `Hapus (${selectedTankTrucks.length})`}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setBulkDeleteMode(false);
                                    setSelectedTankTrucks([]);
                                }}
                                className="px-3 py-2 min-h-[44px] text-xs font-semibold text-rose-700 hover:bg-rose-100 rounded-[6px] transition-colors"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="bg-white border border-slate-200 rounded-[8px] p-4 sm:p-5 shadow-sm">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <MagnifyingGlassIcon className="h-5 w-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari plat mobil atau nama pengemudi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-4 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all placeholder:text-slate-400"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="bg-white border border-slate-200 rounded-[8px] p-12 text-center shadow-sm">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#11468F] mx-auto mb-3" />
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Memuat data armada mobil tangki...
                        </p>
                    </div>
                ) : (
                    <TankTruckTable
                        tankTrucks={tankTrucks}
                        bulkDeleteMode={bulkDeleteMode}
                        selectedTankTrucks={selectedTankTrucks}
                        onSelectTankTruck={handleSelectTankTruck}
                        onSelectAll={handleSelectAll}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            {/* Create/Edit Modal */}
            <TankTruckModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                isSubmitting={createMutation.isPending}
            />

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
        </>
    );
};

export default TankTruckList;
