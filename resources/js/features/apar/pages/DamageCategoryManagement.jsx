import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
    PlusIcon,
    TrashIcon,
    XMarkIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import DamageCategoryFormModal from "../components/DamageCategoryFormModal";
import DamageCategoryGroup from "../components/DamageCategoryGroup";

export const DamageCategoryManagement = () => {
    const { showSuccess, showError } = useToast();
    const { apiClient } = useAuth();
    const { isOpen, config, confirm, close } = useConfirmDialog();
    const queryClient = useQueryClient();

    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMediaType, setSelectedMediaType] = useState("all");
    const [selectedSeverity, setSelectedSeverity] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");

    const [formData, setFormData] = useState({
        name: "",
        type: "",
        description: "",
        severity: "medium",
        is_active: true,
    });

    // Queries
    const { data: categories = [], isLoading } = useQuery({
        queryKey: ["damage-categories"],
        queryFn: async () => {
            const res = await apiClient.get("/api/damage-categories");
            return res.data?.data || [];
        },
        staleTime: 60 * 1000,
    });

    const { data: availableTypes = [] } = useQuery({
        queryKey: ["damage-category-types"],
        queryFn: async () => {
            const res = await apiClient.get("/api/damage-categories/types");
            return res.data?.data || [];
        },
        staleTime: 60 * 1000,
    });

    // KPI Metrics calculation
    const kpiStats = useMemo(() => {
        const total = categories.length;
        const active = categories.filter((c) => c.is_active).length;
        const highPriority = categories.filter((c) =>
            ["high", "critical", "tinggi", "kritis"].includes(c.severity?.toLowerCase())
        ).length;
        const distinctTypes = new Set(categories.map((c) => c.type?.toLowerCase())).size;

        return { total, active, highPriority, distinctTypes };
    }, [categories]);

    // Filtered categories
    const filteredCategories = useMemo(() => {
        return categories.filter((cat) => {
            // Search text
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = cat.name?.toLowerCase().includes(q);
                const matchDesc = cat.description?.toLowerCase().includes(q);
                if (!matchName && !matchDesc) return false;
            }

            // Media Type
            if (selectedMediaType !== "all") {
                if (cat.type?.toLowerCase() !== selectedMediaType.toLowerCase()) return false;
            }

            // Severity
            if (selectedSeverity !== "all") {
                if (cat.severity?.toLowerCase() !== selectedSeverity.toLowerCase()) return false;
            }

            // Status
            if (selectedStatus !== "all") {
                const isActive = selectedStatus === "active";
                if (Boolean(cat.is_active) !== isActive) return false;
            }

            return true;
        });
    }, [categories, searchQuery, selectedMediaType, selectedSeverity, selectedStatus]);

    // Group filtered categories by type
    const groupedCategories = useMemo(() => {
        return filteredCategories.reduce((acc, category) => {
            const type = category.type || "uncategorized";
            if (!acc[type]) acc[type] = [];
            acc[type].push(category);
            return acc;
        }, {});
    }, [filteredCategories]);

    const hasActiveFilters =
        searchQuery.trim() !== "" ||
        selectedMediaType !== "all" ||
        selectedSeverity !== "all" ||
        selectedStatus !== "all";

    const handleResetFilters = () => {
        setSearchQuery("");
        setSelectedMediaType("all");
        setSelectedSeverity("all");
        setSelectedStatus("all");
    };

    // Mutations
    const saveMutation = useMutation({
        mutationFn: async (payload) => {
            if (editingCategory) {
                return apiClient.put(`/api/damage-categories/${editingCategory.id}`, payload);
            }
            return apiClient.post("/api/damage-categories", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["damage-categories"] });
            showSuccess(
                editingCategory
                    ? "Kategori kerusakan berhasil diperbarui!"
                    : "Kategori kerusakan baru berhasil disimpan!"
            );
            handleCloseModal();
        },
        onError: (err) => {
            console.error("Error saving damage category:", err);
            showError(
                err?.response?.data?.message || "Gagal menyimpan kategori kerusakan."
            );
        },
    });

    const toggleActiveMutation = useMutation({
        mutationFn: async (cat) => {
            return apiClient.put(`/api/damage-categories/${cat.id}`, {
                ...cat,
                is_active: !cat.is_active,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["damage-categories"] });
            showSuccess("Status keaktifan kategori berhasil diubah.");
        },
        onError: () => {
            showError("Gagal mengubah status kategori.");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            return apiClient.delete(`/api/damage-categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["damage-categories"] });
            showSuccess("Kategori kerusakan berhasil dihapus.");
        },
        onError: () => {
            showError("Gagal menghapus kategori kerusakan.");
        },
    });

    const handleOpenCreateModal = (type = "") => {
        setEditingCategory(null);
        setFormData({
            name: "",
            type: type || (availableTypes.length > 0 ? availableTypes[0] : "co2"),
            description: "",
            severity: "medium",
            is_active: true,
        });
        setShowForm(true);
    };

    const handleEdit = (cat) => {
        setEditingCategory(cat);
        setFormData({
            name: cat.name,
            type: cat.type,
            description: cat.description || "",
            severity: cat.severity || "medium",
            is_active: Boolean(cat.is_active),
        });
        setShowForm(true);
    };

    const handleCloseModal = () => {
        setShowForm(false);
        setEditingCategory(null);
        setFormData({
            name: "",
            type: "",
            description: "",
            severity: "medium",
            is_active: true,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    const handleDelete = async (id, name) => {
        const confirmed = await confirm({
            title: "Konfirmasi Hapus Kategori",
            message: `Apakah Anda yakin ingin menghapus kategori "${name}"? Tindakan ini tidak dapat dibatalkan.`,
            type: "danger",
            confirmText: "Ya, Hapus",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (confirmed) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedCategories.length === 0) {
            showError("Pilih minimal satu kategori yang akan dihapus.");
            return;
        }

        const confirmed = await confirm({
            title: "Konfirmasi Hapus Massal",
            message: `Apakah Anda yakin ingin menghapus ${selectedCategories.length} kategori kerusakan sekaligus?`,
            type: "warning",
            confirmText: "Ya, Hapus Semua",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (confirmed) {
            setDeleting(true);
            try {
                await Promise.all(
                    selectedCategories.map((id) => deleteMutation.mutateAsync(id))
                );
                showSuccess(`${selectedCategories.length} kategori berhasil dihapus.`);
                setSelectedCategories([]);
                setBulkDeleteMode(false);
            } catch (error) {
                showError("Gagal menghapus sebagian kategori.");
            } finally {
                setDeleting(false);
            }
        }
    };

    const handleSelectCategory = (id) => {
        setSelectedCategories((prev) =>
            prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center font-bold shadow-sm">
                        <ExclamationTriangleIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Kategori Kerusakan APAR
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Katalog opsi temuan kerusakan standar lapangan untuk teknisi saat inspeksi tabung
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => {
                            setBulkDeleteMode(!bulkDeleteMode);
                            if (bulkDeleteMode) setSelectedCategories([]);
                        }}
                        className={`inline-flex items-center px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider border rounded-[6px] transition-colors shadow-2xs ${
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
                        onClick={() => handleOpenCreateModal()}
                        className="inline-flex items-center px-5 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] hover:bg-[#0d3873] rounded-[6px] shadow-sm transition-colors"
                    >
                        <PlusIcon className="w-4 h-4 mr-1.5" />
                        Tambah Kategori
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-[8px] border border-slate-200 shadow-2xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Total Kategori
                    </p>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black font-mono text-[#041562]">
                            {kpiStats.total}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">Opsi Temuan</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-[8px] border border-slate-200 shadow-2xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Status Aktif
                    </p>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black font-mono text-emerald-700">
                            {kpiStats.active}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-600">
                            Siap Dipakai
                        </span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-[8px] border border-slate-200 shadow-2xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Prioritas Tinggi / Kritis
                    </p>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black font-mono text-[#DA1212]">
                            {kpiStats.highPriority}
                        </span>
                        <span className="text-[11px] font-semibold text-rose-600">
                            High Severity
                        </span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-[8px] border border-slate-200 shadow-2xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Klasifikasi Media
                    </p>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black font-mono text-[#11468F]">
                            {kpiStats.distinctTypes}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">Tipe Aset</span>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white border border-slate-200 rounded-[8px] p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-0">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <MagnifyingGlassIcon className="h-4 w-4" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama kategori atau deskripsi temuan kerusakan..."
                            className="block w-full pl-10 pr-9 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <select
                            value={selectedMediaType}
                            onChange={(e) => setSelectedMediaType(e.target.value)}
                            className="px-3 py-2 min-h-[44px] text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F]"
                        >
                            <option value="all">Semua Tipe Media</option>
                            {availableTypes.map((t) => (
                                <option key={t} value={t}>
                                    Tipe: {t.toUpperCase()}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedSeverity}
                            onChange={(e) => setSelectedSeverity(e.target.value)}
                            className="px-3 py-2 min-h-[44px] text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F]"
                        >
                            <option value="all">Semua Severity</option>
                            <option value="critical">Kritis (Critical)</option>
                            <option value="high">Tinggi (High)</option>
                            <option value="medium">Sedang (Medium)</option>
                            <option value="low">Rendah (Low)</option>
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="col-span-2 sm:col-span-1 px-3 py-2 min-h-[44px] text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F]"
                        >
                            <option value="all">Semua Status</option>
                            <option value="active">Aktif Saja</option>
                            <option value="inactive">Nonaktif Saja</option>
                        </select>
                    </div>

                    {/* Reset Button */}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center justify-center px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-[6px] transition-colors"
                        >
                            <XMarkIcon className="w-3.5 h-3.5 mr-1" />
                            Reset Filter
                        </button>
                    )}
                </div>
            </div>

            {/* Bulk Delete Notification Bar */}
            {bulkDeleteMode && (
                <div className="bg-rose-50 border border-rose-200 rounded-[8px] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                    <span className="text-xs font-bold text-rose-900">
                        Mode Hapus Massal: <span className="font-mono">{selectedCategories.length}</span> kategori dipilih.
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleBulkDelete}
                            disabled={selectedCategories.length === 0 || deleting}
                            className="inline-flex items-center px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-[6px] transition-colors shadow-xs"
                        >
                            {deleting ? "Menghapus..." : `Hapus (${selectedCategories.length})`}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setBulkDeleteMode(false);
                                setSelectedCategories([]);
                            }}
                            className="px-3 py-2 min-h-[44px] text-xs font-semibold text-rose-700 hover:bg-rose-100 rounded-[6px] transition-colors"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            )}

            {/* Categories List Grouped by Type */}
            {isLoading ? (
                <div className="bg-white border border-slate-200 rounded-[8px] p-12 text-center shadow-sm">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#11468F] mx-auto mb-3" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Memuat data kategori kerusakan...
                    </p>
                </div>
            ) : Object.keys(groupedCategories).length === 0 ? (
                <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 p-12 text-center">
                    <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                    <h3 className="text-sm font-bold text-slate-900">
                        Tidak Ada Kategori Kerusakan Ditemukan
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4 max-w-sm mx-auto">
                        {hasActiveFilters
                            ? "Tidak ada item yang cocok dengan kriteria filter atau pencarian Anda."
                            : "Tambahkan kategori kerusakan pertama untuk memandu teknisi saat inspeksi."}
                    </p>
                    {hasActiveFilters ? (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="inline-flex items-center px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-[6px]"
                        >
                            Reset Semua Filter
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => handleOpenCreateModal()}
                            className="inline-flex items-center px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] rounded-[6px]"
                        >
                            <PlusIcon className="w-4 h-4 mr-1.5" />
                            Tambah Kategori Pertama
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedCategories).map(([type, items]) => (
                        <DamageCategoryGroup
                            key={type}
                            type={type}
                            categories={items}
                            bulkDeleteMode={bulkDeleteMode}
                            selectedCategories={selectedCategories}
                            onSelectCategory={handleSelectCategory}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onToggleActive={(cat) => toggleActiveMutation.mutate(cat)}
                            onAddForType={handleOpenCreateModal}
                        />
                    ))}
                </div>
            )}

            {/* Form Modal */}
            <DamageCategoryFormModal
                isOpen={showForm}
                onClose={handleCloseModal}
                formData={formData}
                setFormData={setFormData}
                availableTypes={availableTypes}
                isEditing={Boolean(editingCategory)}
                onSubmit={handleSubmit}
                isSubmitting={saveMutation.isPending}
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
        </div>
    );
};

export default DamageCategoryManagement;
