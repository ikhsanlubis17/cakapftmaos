import React from "react";
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export const DamageCategoryFormModal = ({
    isOpen,
    onClose,
    formData,
    setFormData,
    availableTypes,
    isEditing,
    onSubmit,
    isSubmitting,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-[8px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#041562] text-white">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/10 rounded-[6px]">
                            <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-wide">
                                {isEditing ? "Edit Kategori Kerusakan" : "Tambah Kategori Kerusakan Baru"}
                            </h3>
                            <p className="text-xs text-slate-300">
                                Standar klasifikasi temuan kerusakan inspeksi
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 text-slate-300 hover:text-white rounded-[4px] hover:bg-white/10 transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Nama Kategori / Gejala Kerusakan <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                            placeholder="Contoh: Tekanan jarum manometer di bawah garis hijau"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Tipe Media / Aset <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) =>
                                    setFormData({ ...formData, type: e.target.value })
                                }
                                className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                                required
                            >
                                <option value="">-- Pilih Tipe --</option>
                                {availableTypes.map((t) => (
                                    <option key={t} value={t}>
                                        {t.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Tingkat Keparahan (Severity)
                            </label>
                            <select
                                value={formData.severity}
                                onChange={(e) =>
                                    setFormData({ ...formData, severity: e.target.value })
                                }
                                className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                            >
                                <option value="low">Rendah (Low - Kosmetik)</option>
                                <option value="medium">Sedang (Medium - Butuh Perawatan)</option>
                                <option value="high">Tinggi (High - Wajib Diganti/Perbaiki)</option>
                                <option value="critical">Kritis (Critical - Berbahaya)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Deskripsi / Panduan Tindakan
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            rows={3}
                            className="block w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                            placeholder="Penjelasan detail kerusakan dan tindakan perbaikan yang direkomendasikan..."
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) =>
                                setFormData({ ...formData, is_active: e.target.checked })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-[#11468F] focus:ring-[#11468F]"
                        />
                        <label htmlFor="is_active" className="text-xs font-bold uppercase tracking-wider text-slate-700 select-none">
                            Kategori Aktif (Dapat dipilih teknisi saat inspeksi)
                        </label>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-[6px] transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center px-6 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-white bg-[#11468F] hover:bg-[#0d3873] disabled:opacity-60 disabled:cursor-not-allowed rounded-[6px] shadow-sm transition-colors"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent mr-2" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                "Simpan Kategori"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DamageCategoryFormModal;
