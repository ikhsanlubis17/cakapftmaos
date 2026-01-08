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
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                                <FireIcon className="h-7 w-7 text-white" />
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
                                    <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md">
                                        <span className="text-sm text-gray-600">
                                            {selectedCategories.length} dipilih
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={selectedCategories.length === 0 || deleting}
                                        className={`inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white ${
                                            selectedCategories.length > 0 && !deleting
                                                ? "bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                                        className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                                    >
                                        <XMarkIcon className="h-4 w-4 mr-2" />
                                        Batal
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={toggleBulkDeleteMode}
                                    className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                                >
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    Hapus Massal
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Contoh: Cat tabung rusak/pudar"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        required
                                    >
                                        <option value="low">Rendah</option>
                                        <option value="medium">Sedang</option>
                                        <option value="high">Tinggi</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
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
                                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                    />
                                    <label
                                        htmlFor="is_active"
                                        className="ml-2 text-sm text-gray-700"
                                    >
                                        Kategori aktif
                                    </label>
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                                    >
                                        {editingCategory ? "Update" : "Simpan"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Categories Grouped by Type */}
                {(availableTypes.length > 0 || Object.keys(groupedCategories).length > 0) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...new Set([...availableTypes, ...Object.keys(groupedCategories)])].sort().map((type) => {
                            const typeCategories = groupedCategories[type] || [];
                            return (
                            <div
                                key={type}
                                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                            >
                                {/* Card Header - Type Name */}
                                <div className="bg-gradient-to-r from-red-500 to-red-600 px-5 py-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                                            <FireIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-lg capitalize">
                                                {type}
                                            </h3>
                                            <p className="text-white/80 text-xs">
                                                {typeCategories.length} item checklist
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAddForType(type)}
                                        className="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                        title="Tambah Item"
                                    >
                                        <PlusIcon className="h-5 w-5 text-white" />
                                    </button>
                                </div>

                                {/* Card Body - Categories List */}
                                <div className="max-h-96 overflow-y-auto">
                                    {typeCategories.length > 0 ? (
                                        <div className="divide-y divide-gray-100">
                                            {typeCategories.map((category, index) => (
                                                <div
                                                    key={category.id}
                                                    className={`px-5 py-3 hover:bg-gray-50 transition-colors ${
                                                        selectedCategories.includes(category.id)
                                                            ? "bg-red-50"
                                                            : ""
                                                    }`}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        {/* Drag Handle */}
                                                        <div className="flex items-center space-x-2 pt-1">
                                                            <div className="cursor-move text-gray-400 hover:text-gray-600">
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                                                                </svg>
                                                            </div>
                                                            {bulkDeleteMode && (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedCategories.includes(category.id)}
                                                                    onChange={() => handleSelectCategory(category.id)}
                                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                                />
                                                            )}
                                                        </div>

                                                        {/* Item Number */}
                                                        <div className="flex-shrink-0 pt-1">
                                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-gray-100 text-gray-600 text-xs font-medium">
                                                                #{index + 1}
                                                            </span>
                                                        </div>

                                                        {/* Category Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                                                {category.name}
                                                            </p>
                                                            {category.description && (
                                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                                    {category.description}
                                                                </p>
                                                            )}
                                                            <div className="mt-1">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                                    category.severity === 'high' ? 'bg-red-100 text-red-800' :
                                                                    category.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-green-100 text-green-800'
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
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                title="Edit"
                                                            >
                                                                <PencilIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(category)}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
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
                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                                                <FireIcon className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <p className="text-sm text-gray-500 mb-3">
                                                Belum ada item checklist
                                            </p>
                                            <button
                                                onClick={() => handleAddForType(type)}
                                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                                            >
                                                <PlusIcon className="h-4 w-4 mr-1" />
                                                Tambah Item
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer */}
                                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
                                    {typeCategories.length} item checklist
                                </div>
                            </div>
                        );
                        })}

                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                            <FireIcon className="h-8 w-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Belum ada kategori
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Mulai dengan menambahkan kategori kerusakan pertama.
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Tambah Kategori Pertama
                        </button>
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-white border border-gray-100 rounded-xl p-4">
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
