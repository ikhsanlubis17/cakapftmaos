import React, { useState } from "react";
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    CheckIcon,
    XMarkIcon,
    FireIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const AparTypeManagement = () => {
    // derive apar types directly from query result instead of local state
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        is_active: true,
    });
    const [errors, setErrors] = useState({});
    
    // Bulk delete state
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const { showSuccess, showError } = useToast();
    const { isOpen, config, confirm, close } = useConfirmDialog();
    const { apiClient } = useAuth();
    const queryClient = useQueryClient();

    const { data: aparTypesData, isLoading } = useQuery({
        queryKey: ["apar-types"],
        queryFn: async () => {
            const res = await apiClient.get("/api/apar-types");
            return res.data || res;
        },
        staleTime: 1000 * 60 * 2,
        // no local state update needed; components will read from aparTypesData
        onError: (err) => {
            console.error("Error fetching APAR types:", err);
            showError("Gagal memuat data jenis APAR");
        },
    });

    const createMutation = useMutation({
        mutationFn: (payload) => apiClient.post("/api/apar-types", payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["apar-types"] });
            showSuccess("Jenis APAR berhasil ditambahkan");
            closeModal();
        },
        onError: (err) => {
            const resp = err?.response?.data;
            if (resp?.errors) setErrors(resp.errors);
            else showError("Gagal menyimpan jenis APAR");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) =>
            apiClient.put(`/api/apar-types/${id}`, payload),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["apar-types"] });
            showSuccess("Jenis APAR berhasil diperbarui");
            closeModal();
        },
        onError: (err) => {
            const resp = err?.response?.data;
            if (resp?.errors) setErrors(resp.errors);
            else showError("Gagal menyimpan jenis APAR");
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (editingType) {
            await updateMutation.mutateAsync({
                id: editingType.id,
                payload: formData,
            });
        } else {
            await createMutation.mutateAsync(formData);
        }
    };

    const deleteMutation = useMutation({
        mutationFn: (id) => apiClient.delete(`/api/apar-types/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["apar-types"] });
            showSuccess("Jenis APAR berhasil dihapus");
        },
        onError: (err) => {
            console.error("Error deleting APAR type:", err);
            const msg = err?.response?.data?.message;
            showError(msg || "Gagal menghapus jenis APAR");
        },
    });

    const handleDelete = async (id, name) => {
        const confirmed = await confirm({
            title: "Konfirmasi Hapus",
            message: `Apakah Anda yakin ingin menghapus jenis APAR "${name}"? Tindakan ini tidak dapat dibatalkan.`,
            type: "warning",
            confirmText: "Ya, Hapus",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (!confirmed) return;

        await deleteMutation.mutateAsync(id);
    };

    // Bulk delete handlers
    const handleBulkDelete = async () => {
        if (selectedTypes.length === 0) {
            showError("Pilih jenis APAR yang akan dihapus terlebih dahulu");
            return;
        }

        const confirmed = await confirm({
            title: "Konfirmasi Hapus Massal",
            message: `Apakah Anda yakin ingin menghapus ${selectedTypes.length} jenis APAR? Tindakan ini tidak dapat dibatalkan.`,
            type: "warning",
            confirmText: "Ya, Hapus Semua",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (!confirmed) return;

        setDeleting(true);
        try {
            const deletePromises = selectedTypes.map(async (id) => {
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
                    `${successful.length} jenis APAR berhasil dihapus${
                        failed.length > 0 ? `, ${failed.length} gagal` : ""
                    }`
                );
            } else {
                showError("Gagal menghapus semua jenis APAR yang dipilih");
            }

            setSelectedTypes([]);
            setBulkDeleteMode(false);
        } catch (error) {
            console.error("Gagal dalam bulk delete:", error);
            showError("Gagal menghapus jenis APAR yang dipilih. Silakan coba lagi.");
        } finally {
            setDeleting(false);
        }
    };

    const toggleBulkDeleteMode = () => {
        setBulkDeleteMode(!bulkDeleteMode);
        setSelectedTypes([]);
    };

    const handleSelectType = (id) => {
        setSelectedTypes((prev) =>
            prev.includes(id)
                ? prev.filter((typeId) => typeId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        const aparTypes = aparTypesData?.data || aparTypesData || [];
        if (selectedTypes.length === aparTypes.length) {
            setSelectedTypes([]);
        } else {
            setSelectedTypes(aparTypes.map((type) => type.id));
        }
    };

    const openModal = (type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({
                name: type.name,
                description: type.description || "",
                is_active: type.is_active,
            });
        } else {
            setEditingType(null);
            setFormData({
                name: "",
                description: "",
                is_active: true,
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingType(null);
        setFormData({
            name: "",
            description: "",
            is_active: true,
        });
        setErrors({});
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
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
            {/* Header */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-[6px] p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-[#041562] text-white rounded-[6px] shadow-sm">
                            <FireIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Jenis APAR
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Manajemen jenis-jenis APAR dalam sistem
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {bulkDeleteMode ? (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <div className="flex items-center justify-center sm:justify-start px-3 py-2 bg-gray-50 rounded-[6px]">
                                    <span className="text-sm text-gray-600">
                                        {selectedTypes.length} dipilih
                                    </span>
                                </div>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedTypes.length === 0 || deleting}
                                    className={`inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-[6px] text-white ${
                                        selectedTypes.length > 0 && !deleting
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
                                            Hapus ({selectedTypes.length})
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
                            </div>
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
                                    onClick={() => openModal()}
                                    className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#11468F] transition-all duration-200 shadow-sm"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Tambah Jenis APAR
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* APAR Types List */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-[6px] overflow-hidden">
                {/* List Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <FireIcon className="h-5 w-5 text-[#041562]" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Daftar Jenis APAR (
                                {
                                    (aparTypesData?.data || aparTypesData || [])
                                        .length
                                }
                                )
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Bulk Delete Header */}
                {bulkDeleteMode && (
                    <div className="px-6 py-3 border-b border-gray-200 bg-red-50">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={
                                        selectedTypes.length ===
                                            (aparTypesData?.data || aparTypesData || []).length &&
                                        (aparTypesData?.data || aparTypesData || []).length > 0
                                    }
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                />
                                <span className="text-sm font-medium text-gray-900">
                                    Pilih Semua ({(aparTypesData?.data || aparTypesData || []).length})
                                </span>
                            </label>
                            <span className="text-sm text-gray-500">
                                {selectedTypes.length} dari {(aparTypesData?.data || aparTypesData || []).length} dipilih
                            </span>
                        </div>
                    </div>
                )}

                {/* APAR Types Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {bulkDeleteMode && (
                                    <th scope="col" className="px-6 py-3 text-left">
                                        <span className="sr-only">Pilih</span>
                                    </th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nama Jenis
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Deskripsi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {(aparTypesData?.data || aparTypesData || [])
                                .length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={bulkDeleteMode ? 5 : 4}
                                        className="px-6 py-12 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <FireIcon className="h-12 w-12 text-gray-400" />
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    Tidak ada jenis APAR
                                                </h3>
                                                <p className="text-gray-500">
                                                    Belum ada jenis APAR yang
                                                    dibuat
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => openModal()}
                                                className="inline-flex items-center px-4 py-2 bg-[#11468F] text-white rounded-[6px] hover:bg-[#0d3873] transition-colors text-sm font-semibold shadow-sm"
                                            >
                                                <PlusIcon className="h-4 w-4 mr-2" />
                                                Tambah Jenis APAR Pertama
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                (
                                    aparTypesData?.data ||
                                    aparTypesData ||
                                    []
                                ).map((type) => (
                                    <tr
                                        key={type.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        {bulkDeleteMode && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTypes.includes(type.id)}
                                                    onChange={() => handleSelectType(type.id)}
                                                    className="h-4 w-4 text-[#11468F] focus:ring-[#11468F] border-gray-300 rounded-[3px]"
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-8 h-8 bg-[#041562]/10 rounded-[6px]">
                                                    <FireIcon className="h-4 w-4 text-[#041562]" />
                                                </div>
                                                <div className="text-sm font-medium text-gray-900 capitalize">
                                                    {type.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs">
                                                {type.description ? (
                                                    <span className="line-clamp-2">
                                                        {type.description}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic">
                                                        Tidak ada deskripsi
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-[3px] text-xs font-bold uppercase tracking-wider ${
                                                    type.is_active
                                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                        : "bg-rose-50 text-rose-800 border border-rose-200"
                                                }`}
                                            >
                                                {type.is_active
                                                    ? "Aktif"
                                                    : "Nonaktif"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        openModal(type)
                                                    }
                                                    className="inline-flex items-center p-2 text-slate-600 hover:text-[#11468F] hover:bg-slate-100 rounded-[3px] transition-colors"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(
                                                            type.id,
                                                            type.name
                                                        )
                                                    }
                                                    className="inline-flex items-center p-2 text-red-600 hover:text-red-700 hover:bg-rose-50 rounded-[3px] transition-colors"
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative mx-auto p-6 border border-slate-200 w-full max-w-md shadow-xl rounded-[6px] bg-white">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                {editingType
                                    ? "Edit Jenis APAR"
                                    : "Tambah Jenis APAR Baru"}
                            </h3>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nama Jenis APAR *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] text-sm ${
                                            errors.name
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="Contoh: Powder, CO2, Foam"
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.name[0]}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="3"
                                        className={`w-full px-3 py-2 border rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#11468F] text-sm ${
                                            errors.description
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="Deskripsi jenis APAR..."
                                    />
                                    {errors.description && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.description[0]}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={formData.is_active}
                                            onChange={handleChange}
                                            className="h-4 w-4 text-[#11468F] focus:ring-[#11468F] border-gray-300 rounded-[3px]"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                            Aktif
                                        </span>
                                    </label>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-[6px] hover:bg-slate-50 text-sm font-medium transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-[#11468F] hover:bg-[#0d3873] text-white font-semibold border border-transparent rounded-[6px] text-sm transition-colors shadow-sm"
                                    >
                                        {editingType ? "Update" : "Simpan"}
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
        </div>
    );
};

export default AparTypeManagement;
