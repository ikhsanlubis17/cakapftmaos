import React, { useState } from "react";
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
    TagIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import AparTypeModal from "../components/AparTypeModal";

export const AparTypeManagement = () => {
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

    const { data: rawAparTypes = [], isLoading } = useQuery({
        queryKey: ["apar-types"],
        queryFn: async () => {
            const res = await apiClient.get("/api/apar-types");
            const raw = res?.data;
            return Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);
        },
        staleTime: 60 * 1000,
    });

    const aparTypes = Array.isArray(rawAparTypes)
        ? rawAparTypes
        : Array.isArray(rawAparTypes?.data)
            ? rawAparTypes.data
            : [];

    const createMutation = useMutation({
        mutationFn: (payload) => apiClient.post("/api/apar-types", payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["apar-types"] });
            showSuccess("Jenis APAR berhasil ditambahkan!");
            closeModal();
        },
        onError: (err) => {
            const resp = err?.response?.data;
            if (resp?.errors) setErrors(resp.errors);
            else showError(resp?.message || "Gagal menyimpan jenis APAR.");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) =>
            apiClient.put(`/api/apar-types/${id}`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["apar-types"] });
            showSuccess("Jenis APAR berhasil diperbarui!");
            closeModal();
        },
        onError: (err) => {
            const resp = err?.response?.data;
            if (resp?.errors) setErrors(resp.errors);
            else showError(resp?.message || "Gagal memperbarui jenis APAR.");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => apiClient.delete(`/api/apar-types/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["apar-types"] });
            showSuccess("Jenis APAR berhasil dihapus.");
        },
        onError: (err) => {
            console.error("Error deleting APAR type:", err);
            showError(
                err?.response?.data?.message || "Gagal menghapus jenis APAR."
            );
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

    const handleDelete = async (id, name) => {
        const confirmed = await confirm({
            title: "Konfirmasi Hapus",
            message: `Apakah Anda yakin ingin menghapus jenis APAR "${name}"? Tindakan ini tidak dapat dibatalkan.`,
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
        if (selectedTypes.length === 0) {
            showError("Pilih jenis APAR yang akan dihapus terlebih dahulu.");
            return;
        }

        const confirmed = await confirm({
            title: "Konfirmasi Hapus Massal",
            message: `Apakah Anda yakin ingin menghapus ${selectedTypes.length} jenis APAR sekaligus? Tindakan ini tidak dapat dibatalkan.`,
            type: "warning",
            confirmText: "Ya, Hapus Semua",
            cancelText: "Batal",
            confirmButtonColor: "red",
        });

        if (confirmed) {
            setDeleting(true);
            try {
                await Promise.all(
                    selectedTypes.map((id) => deleteMutation.mutateAsync(id))
                );
                showSuccess(`${selectedTypes.length} jenis APAR berhasil dihapus.`);
                setSelectedTypes([]);
                setBulkDeleteMode(false);
            } catch (error) {
                showError("Gagal menghapus sebagian jenis APAR.");
            } finally {
                setDeleting(false);
            }
        }
    };

    const openModal = (type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({
                name: type.name,
                description: type.description || "",
                is_active: Boolean(type.is_active),
            });
        } else {
            setEditingType(null);
            setFormData({
                name: "",
                description: "",
                is_active: true,
            });
        }
        setErrors({});
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

    const handleSelectType = (id) => {
        setSelectedTypes((prev) =>
            prev.includes(id) ? prev.filter((typeId) => typeId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedTypes.length === aparTypes.length) {
            setSelectedTypes([]);
        } else {
            setSelectedTypes(aparTypes.map((type) => type.id));
        }
    };

    const isAllSelected =
        aparTypes.length > 0 && selectedTypes.length === aparTypes.length;

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[6px] bg-[#041562] text-white flex items-center justify-center font-bold shadow-sm">
                        <TagIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Manajemen Jenis APAR
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Kelola data master klasifikasi jenis media pemadam api (Powder, CO2, Foam, dsb.)
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => {
                            setBulkDeleteMode(!bulkDeleteMode);
                            if (bulkDeleteMode) setSelectedTypes([]);
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
                        onClick={() => openModal()}
                        className="inline-flex items-center px-5 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] hover:bg-[#0d3873] rounded-[6px] shadow-sm transition-colors"
                    >
                        <PlusIcon className="w-4 h-4 mr-1.5" />
                        Tambah Jenis APAR
                    </button>
                </div>
            </div>

            {/* Bulk Delete Bar */}
            {bulkDeleteMode && (
                <div className="bg-rose-50 border border-rose-200 rounded-[8px] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs font-bold text-rose-800">
                        Mode Hapus Massal: {selectedTypes.length} jenis APAR dipilih dari {aparTypes.length} total.
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleBulkDelete}
                            disabled={selectedTypes.length === 0 || deleting}
                            className="inline-flex items-center px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-[6px] transition-colors shadow-xs"
                        >
                            {deleting ? "Menghapus..." : `Hapus (${selectedTypes.length})`}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setBulkDeleteMode(false);
                                setSelectedTypes([]);
                            }}
                            className="px-3 py-2 min-h-[44px] text-xs font-semibold text-rose-700 hover:bg-rose-100 rounded-[6px] transition-colors"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            {isLoading ? (
                <div className="bg-white border border-slate-200 rounded-[8px] p-12 text-center shadow-sm">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#11468F] mx-auto mb-3" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Memuat data jenis APAR...
                    </p>
                </div>
            ) : aparTypes.length === 0 ? (
                <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 p-12 text-center">
                    <TagIcon className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                    <h3 className="text-sm font-bold text-slate-900">
                        Belum Ada Jenis APAR
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                        Daftarkan jenis media APAR pertama untuk memulai pengelompokan tabung.
                    </p>
                    <button
                        type="button"
                        onClick={() => openModal()}
                        className="inline-flex items-center px-4 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] rounded-[6px]"
                    >
                        <PlusIcon className="w-4 h-4 mr-1.5" />
                        Tambah Jenis APAR
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-[8px] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left">
                            <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                <tr>
                                    {bulkDeleteMode && (
                                        <th scope="col" className="px-4 py-3.5 w-12 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                            />
                                        </th>
                                    )}
                                    <th scope="col" className="px-6 py-3.5">
                                        Jenis APAR
                                    </th>
                                    <th scope="col" className="px-6 py-3.5">
                                        Deskripsi Karakteristik
                                    </th>
                                    <th scope="col" className="px-6 py-3.5">
                                        Jumlah Tabung Terdaftar
                                    </th>
                                    <th scope="col" className="px-6 py-3.5">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3.5 text-right">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {aparTypes.map((type) => {
                                    const isSelected = selectedTypes.includes(type.id);
                                    return (
                                        <tr
                                            key={type.id}
                                            className={`hover:bg-slate-50/80 transition-colors ${
                                                isSelected ? "bg-rose-50/40" : ""
                                            }`}
                                        >
                                            {bulkDeleteMode && (
                                                <td className="px-4 py-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectType(type.id)}
                                                        className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-[6px] bg-[#11468F]/10 text-[#11468F] flex items-center justify-center font-bold text-xs">
                                                        <TagIcon className="w-4 h-4" />
                                                    </div>
                                                    <div className="font-bold text-slate-900 text-sm">
                                                        {type.name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-slate-600 max-w-md line-clamp-2">
                                                    {type.description || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-[4px] text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                                    {type.apars_count ?? 0} Tabung
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-xs font-semibold border ${
                                                        type.is_active
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            : "bg-slate-100 text-slate-500 border-slate-200"
                                                    }`}
                                                >
                                                    {type.is_active ? "Aktif" : "Nonaktif"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="inline-flex items-center space-x-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openModal(type)}
                                                        className="p-1.5 text-slate-500 hover:text-[#11468F] hover:bg-slate-100 rounded-[4px] transition-colors"
                                                        title="Edit Jenis APAR"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(type.id, type.name)}
                                                        className="p-1.5 text-slate-500 hover:text-[#DA1212] hover:bg-rose-50 rounded-[4px] transition-colors"
                                                        title="Hapus Jenis APAR"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Form */}
            <AparTypeModal
                isOpen={showModal}
                onClose={closeModal}
                editingType={editingType}
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                onSubmit={handleSubmit}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
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

export default AparTypeManagement;
