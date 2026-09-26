import React from "react";
import { XMarkIcon, TruckIcon } from "@heroicons/react/24/outline";

export const TankTruckModal = ({
    isOpen,
    onClose,
    formData,
    setFormData,
    onSubmit,
    isSubmitting,
    isEditing = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-[8px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#041562] text-white">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/10 rounded-[6px]">
                            <TruckIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-wide">
                                {isEditing ? "Edit Mobil Tangki" : "Tambah Mobil Tangki Baru"}
                            </h3>
                            <p className="text-xs text-slate-300">
                                Armada distribusi Fuel Terminal Maos
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
                            Nomor Polisi (Plat Mobil) <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.plate_number}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    plate_number: e.target.value.toUpperCase(),
                                })
                            }
                            className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                            placeholder="Contoh: B 9290 TFV"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Nama Pengemudi / Awak <span className="text-rose-500">*</span>
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
                                className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                                placeholder="Nama lengkap pengemudi"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Nomor Telepon / HP
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
                                className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm font-mono text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                                placeholder="08xxxxxxxxxx"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Status Operasional
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    status: e.target.value,
                                })
                            }
                            className="block w-full px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                        >
                            <option value="active">Aktif (Beroperasi)</option>
                            <option value="maintenance">Maintenance / Bengkel</option>
                            <option value="inactive">Nonaktif</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Deskripsi / Catatan Tambahan
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
                            className="block w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-[6px] focus:ring-2 focus:ring-[#11468F] focus:border-transparent transition-all"
                            placeholder="Kapasitas tangki (KL), PT Transportir, dsb."
                        />
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
                                "Simpan Data"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TankTruckModal;
