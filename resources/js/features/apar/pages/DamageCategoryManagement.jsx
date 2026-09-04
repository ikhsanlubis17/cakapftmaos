import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    EyeSlashIcon,
    FireIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

const DamageCategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [groupedCategories, setGroupedCategories] = useState({});
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [selectedTypeForAdd, setSelectedTypeForAdd] = useState(""); // Type for adding new category
    const [formData, setFormData] = useState({
        name: "",
        type: "",
        description: "",
        severity: "medium",
        is_active: true,
    });
    const [availableTypes, setAvailableTypes] = useState([]);
    const { showSuccess, showError } = useToast();
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "warning",
        confirmText: "",
        cancelText: "",
        confirmButtonColor: "red",
        onConfirm: () => {},
    });
    
    // Bulk delete state
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const closeConfirmDialog = () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
    };

    const { apiClient } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["damage-categories"],
        queryFn: async () => {
            const res = await apiClient.get("/api/damage-categories");
            return res.data.data;
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    // Fetch available types
    const { data: typesData } = useQuery({
        queryKey: ["damage-category-types"],
        queryFn: async () => {
            const res = await apiClient.get("/api/damage-categories/types");
            return res.data.data;
        },
        staleTime: 0, // Always fetch fresh data
        refetchOnWindowFocus: true, // Refetch when user returns to this page
        refetchOnMount: true, // Refetch when component mounts
    });

    useEffect(() => {
        if (isError) showError("Gagal memuat kategori kerusakan");
        if (data) {
            setCategories(data);
            // Group categories by type
            const grouped = data.reduce((acc, category) => {
                const type = category.type || 'uncategorized';
                if (!acc[type]) {
                    acc[type] = [];
                }
                acc[type].push(category);
                return acc;
            }, {});
            setGroupedCategories(grouped);
        }
    }, [data, isError]);

    useEffect(() => {
        if (typesData) {
            setAvailableTypes(typesData);
            // Set default type to first available type if not set
            if (typesData.length > 0 && !formData.type) {
                setFormData(prev => ({ ...prev, type: typesData[0] }));
            }
        }
    }, [typesData]);

    const createCategoryMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await apiClient.post("/api/damage-categories", payload);
            return res.data;
        },
        onSuccess: () => {
            showSuccess("Kategori berhasil dibuat");
            queryClient.invalidateQueries({ queryKey: ["damage-categories"] });
            setShowForm(false);
            setEditingCategory(null);
            const defaultType = availableTypes.length > 0 ? availableTypes[0] : "";
            setFormData({ name: "", type: defaultType, description: "", is_active: true });
        },
        onError: (error) => {
            showError(
                error.response?.data?.message || "Gagal menyimpan kategori"
            );
        },
    });

    const updateCategoryMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            const res = await apiClient.put(
                `/api/damage-categories/${id}`,
                payload
            );
            return res.data;
        },
        onSuccess: () => {
            showSuccess("Kategori berhasil diperbarui");
            queryClient.invalidateQueries({ queryKey: ["damage-categories"] });
            setShowForm(false);
            setEditingCategory(null);
            const defaultType = availableTypes.length > 0 ? availableTypes[0] : "";
            setFormData({ name: "", type: defaultType, description: "", is_active: true });
        },
        onError: (error) => {
            showError(
                error.response?.data?.message || "Gagal menyimpan kategori"
            );
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showError("Nama kategori wajib diisi");
            return;
        }

        if (editingCategory) {
            updateCategoryMutation.mutate({
                id: editingCategory.id,
                payload: formData,
            });
        } else {
            createCategoryMutation.mutate(formData);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        const defaultType = availableTypes.length > 0 ? availableTypes[0] : "";
        setFormData({
            name: category.name,
            type: category.type || defaultType,
            description: category.description || "",
            severity: category.severity || "medium",
            is_active: category.is_active,
        });
        setSelectedTypeForAdd(""); // Clear selected type when editing
        setShowForm(true);
    };

    const handleAddForType = (type) => {
        setSelectedTypeForAdd(type);
        const defaultType = type || (availableTypes.length > 0 ? availableTypes[0] : "");
        setFormData({
            name: "",
            type: defaultType,
            description: "",
            severity: "medium",
            is_active: true,
        });
        setEditingCategory(null);
        setShowForm(true);
    };

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await apiClient.delete(`/api/damage-categories/${id}`);
            return res.data;
        },
        onSuccess: () => {
            showSuccess("Kategori berhasil dihapus");
            queryClient.invalidateQueries({ queryKey: ["damage-categories"] });
        },
        onError: (error) => {
            showError(
                error.response?.data?.message || "Gagal menghapus kategori"
            );
        },
    });

    const handleDelete = (category) => {
        setConfirmDialog({
            isOpen: true,
            title: "Konfirmasi Hapus Kategori",
            message: `Apakah Anda yakin ingin menghapus kategori "${category.name}"? Tindakan ini tidak dapat dibatalkan.`,
            type: "warning",
            confirmText: "Ya, Hapus",
            cancelText: "Batal",
            confirmButtonColor: "red",
            onConfirm: async () => deleteMutation.mutate(category.id),
        });
    };

    const toggleStatusMutation = useMutation({
        mutationFn: async (id) => {
            const res = await apiClient.patch(
                `/api/damage-categories/${id}/toggle-status`
            );
            return res.data;
        },
        onSuccess: () => {
            showSuccess("Status kategori berhasil diubah");
            queryClient.invalidateQueries({ queryKey: ["damage-categories"] });
        },
        onError: () => showError("Gagal mengubah status kategori"),
    });

    const toggleStatus = (category) => {
        toggleStatusMutation.mutate(category.id);
    };

    const resetForm = () => {
        const defaultType = availableTypes.length > 0 ? availableTypes[0] : "";
        setFormData({ name: "", type: defaultType, description: "", severity: "medium", is_active: true });
        setEditingCategory(null);
        setShowForm(false);
    };

    // Bulk delete handlers
    const handleBulkDelete = async () => {
        if (selectedCategories.length === 0) {
            showError("Pilih kategori yang akan dihapus terlebih dahulu");
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: "Konfirmasi Hapus Massal",
            message: `Apakah Anda yakin ingin menghapus ${selectedCategories.length} kategori kerusakan? Tindakan ini tidak dapat dibatalkan.`,
            type: "warning",
            confirmText: "Ya, Hapus Semua",
            cancelText: "Batal",
            confirmButtonColor: "red",
            onConfirm: async () => {
                setDeleting(true);
                try {
                    const deletePromises = selectedCategories.map(async (id) => {
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
                            `${successful.length} kategori berhasil dihapus${
                                failed.length > 0 ? `, ${failed.length} gagal` : ""
                            }`
                        );
                    } else {
                        showError("Gagal menghapus semua kategori yang dipilih");
                    }

                    setSelectedCategories([]);
                    setBulkDeleteMode(false);
                } catch (error) {
                    console.error("Gagal dalam bulk delete:", error);
                    showError("Gagal menghapus kategori yang dipilih. Silakan coba lagi.");
                } finally {
                    setDeleting(false);
                }
            },
        });
    };

    const toggleBulkDeleteMode = () => {
        setBulkDeleteMode(!bulkDeleteMode);
        setSelectedCategories([]);
    };

    const handleSelectCategory = (id) => {
        setSelectedCategories((prev) =>
            prev.includes(id)
                ? prev.filter((catId) => catId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedCategories.length === categories.length) {
            setSelectedCategories([]);
        } else {
            setSelectedCategories(categories.map((cat) => cat.id));
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11468F]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="bg-white shadow-sm border border-slate-200 rounded-[6px] p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center shadow-sm">
                                <FireIcon className="h-7 w-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Manajemen Kategori Kerusakan
                                </h1>
                                <p className="text-gray-600">
                                    Kelola kategori kerusakan untuk aset
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {bulkDeleteMode ? (
                                <>
                                    <div className="flex items-center px-3 py-2 bg-gray-50 rounded-[6px]">
                                        <span className="text-sm text-gray-600">
                                            {selectedCategories.length} dipilih
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={selectedCategories.length === 0 || deleting}
                                        className={`inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-[6px] text-white ${
                                            selectedCategories.length > 0 && !deleting
                                                ? "bg-[#DA1212] hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                : "bg-gray-300 cursor-not-allowed"
                                        } transition-all duration-200`}
                                    >
                                        {deleting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Menghapus...
                                            </>
                                        ) : (
                                            <>
                                                <TrashIcon className="h-4 w-4 mr-2" />
                                                Hapus ({selectedCategories.length})
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={toggleBulkDeleteMode}
                                        className="inline-flex items-center px-4 py-2.5 border border-slate-300 rounded-[6px] text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all duration-200"
                                    >
                                        <XMarkIcon className="h-4 w-4 mr-2" />
                                        Batal
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={toggleBulkDeleteMode}
                                        className="inline-flex items-center px-4 py-2.5 border border-slate-300 rounded-[6px] text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all duration-200 shadow-sm"
                                    >
                                        <TrashIcon className="h-4 w-4 mr-2" />
                                        Hapus Massal
                                    </button>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#11468F] transition-all duration-200 shadow-sm"
                                    >
                                        <PlusIcon className="h-4 w-4 mr-2" />
                                        Tambah Kategori
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                        <div className="relative mx-auto p-6 border border-slate-200 w-full max-w-md shadow-xl rounded-[6px] bg-white">
                            <div className="mt-3 mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-medium text-gray-900">
                                    {editingCategory
                                        ? "Edit Kategori"
                                        : "Tambah Kategori Baru"}
                                </h2>
                                <button
                                    onClick={resetForm}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Nama Kategori{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        className="w-full border border-slate-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F]"
                                        placeholder="Contoh: Cat tabung rusak/pudar"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Tipe Aset{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                type: e.target.value,
                                            })
                                        }
                                        className="w-full border border-slate-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F]"
                                        required
                                    >
                                        {availableTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Tingkat Keparahan{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.severity}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                severity: e.target.value,
                                            })
                                        }
                                        className="w-full border border-slate-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F]"
                                        required
                                    >
                                        <option value="low">Rendah</option>
                                        <option value="medium">Sedang</option>
                                        <option value="high">Tinggi</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                                        rows={3}
                                        className="w-full border border-slate-300 rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] resize-none"
                                        placeholder="Jelaskan detail kategori kerusakan..."
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                is_active: e.target.checked,
                                            })
                                        }
                                        className="h-4 w-4 text-[#11468F] focus:ring-[#11468F] border-slate-300 rounded-[3px]"
                                    />
                                    <label
                                        htmlFor="is_active"
                                        className="ml-2 text-sm text-slate-700"
                                    >
                                        Kategori aktif
                                    </label>
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-[#11468F] hover:bg-[#0d3873] text-white font-semibold border border-transparent px-4 py-2 rounded-[6px] transition-colors shadow-sm text-sm"
                                    >
                                        {editingCategory ? "Update" : "Simpan"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2 border border-slate-300 rounded-[6px] text-slate-700 hover:bg-slate-50 transition-colors font-medium text-sm"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Categories Grouped by Type */}
                {Object.keys(groupedCategories).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(groupedCategories).map(([type, typeCategories]) => (
                            <div
                                key={type}
                                className="bg-white border border-slate-200 rounded-[6px] shadow-sm overflow-hidden"
                            >
                                {/* Card Header - Type Name */}
                                <div className="bg-[#041562] border-b-2 border-[#11468F] px-5 py-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-[6px] bg-white/10 flex items-center justify-center text-white">
                                            <FireIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-lg capitalize tracking-tight">
                                                {type}
                                            </h3>
                                            <p className="text-slate-300 text-xs">
                                                {typeCategories.length} item checklist
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAddForType(type)}
                                        className="h-8 w-8 rounded-[6px] bg-[#11468F] hover:bg-[#0d3873] text-white flex items-center justify-center transition-colors shadow-sm"
                                        title="Tambah Item"
                                    >
                                        <PlusIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Card Body - Categories List */}
                                <div className="max-h-96 overflow-y-auto">
                                    {typeCategories.length > 0 ? (
                                        <div className="divide-y divide-slate-100">
                                            {typeCategories.map((category, index) => (
                                                <div
                                                    key={category.id}
                                                    className={`px-5 py-3 hover:bg-slate-50 transition-colors ${
                                                        selectedCategories.includes(category.id)
                                                            ? "bg-amber-50/50"
                                                            : ""
                                                    }`}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        {/* Drag Handle */}
                                                        <div className="flex items-center space-x-2 pt-1">
                                                            <div className="cursor-move text-slate-400 hover:text-slate-600">
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                                                                </svg>
                                                            </div>
                                                            {bulkDeleteMode && (
                                                                 <input
                                                                     type="checkbox"
                                                                     checked={selectedCategories.includes(category.id)}
                                                                     onChange={() => handleSelectCategory(category.id)}
                                                                     className="h-4 w-4 text-[#11468F] focus:ring-[#11468F] border-slate-300 rounded-[3px]"
                                                                 />
                                                            )}
                                                        </div>

                                                        {/* Item Number */}
                                                        <div className="flex-shrink-0 pt-1">
                                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-[3px] bg-slate-100 text-slate-600 text-xs font-semibold">
                                                                #{index + 1}
                                                            </span>
                                                        </div>

                                                        {/* Category Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-900 line-clamp-2">
                                                                {category.name}
                                                            </p>
                                                            {category.description && (
                                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                                                    {category.description}
                                                                </p>
                                                            )}
                                                            <div className="mt-1.5">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold ${
                                                                    category.severity === 'high' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                                    category.severity === 'medium' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                                                    'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                                }`}>
                                                                    {category.severity === 'high' ? 'Tinggi' :
                                                                     category.severity === 'medium' ? 'Sedang' : 'Rendah'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex items-center space-x-1">
                                                            <button
                                                                onClick={() => handleEdit(category)}
                                                                className="p-1.5 text-slate-600 hover:text-[#11468F] hover:bg-slate-100 rounded-[3px] transition-colors"
                                                                title="Edit"
                                                            >
                                                                <PencilIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(category)}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-[3px] transition-colors"
                                                                title="Hapus"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="px-5 py-8 text-center">
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-[6px] bg-slate-100 mb-3">
                                                <FireIcon className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <p className="text-sm text-slate-500 mb-3">
                                                Belum ada item checklist
                                            </p>
                                            <button
                                                onClick={() => handleAddForType(type)}
                                                className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-[#11468F] hover:text-[#041562] transition-colors"
                                            >
                                                <PlusIcon className="h-4 w-4 mr-1" />
                                                Tambah Item
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer */}
                                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
                                    {typeCategories.length} item checklist
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-[6px] p-16 text-center shadow-sm">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[6px] bg-[#041562]/10 text-[#041562] mb-4">
                            <FireIcon className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            Belum ada kategori
                        </h3>
                        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                            Mulai dengan menambahkan kategori kerusakan pertama untuk inspeksi APAR.
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#11468F] transition-all duration-200 shadow-sm"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Tambah Kategori Pertama
                        </button>
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-white border border-slate-200 rounded-[6px] p-4 shadow-sm">
                    <div className="flex items-start space-x-3">
                        <div className="text-gray-600 text-lg">💡</div>
                        <div className="text-sm text-gray-800">
                            <div className="font-medium mb-1">
                                Tips Manajemen Kategori Kerusakan:
                            </div>
                            <ul className="space-y-1">
                                <li>
                                    • Kategori yang nonaktif tidak akan muncul
                                    di form inspeksi
                                </li>
                                <li>
                                    • Pastikan nama kategori jelas dan mudah
                                    dipahami teknisi
                                </li>
                                <li>
                                    • Deskripsi membantu teknisi memahami jenis
                                    kerusakan
                                </li>
                                <li>
                                    • Kategori yang sudah digunakan dalam
                                    inspeksi tidak dapat dihapus
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
                confirmText={confirmDialog.confirmText}
                cancelText={confirmDialog.cancelText}
                confirmButtonColor={confirmDialog.confirmButtonColor}
                onConfirm={confirmDialog.onConfirm}
                onClose={closeConfirmDialog}
            />
        </div>
    );
};

export default DamageCategoryManagement;
