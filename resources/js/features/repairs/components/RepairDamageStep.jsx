import React from 'react';
import {
    CheckCircleIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    ArrowPathIcon,
    XMarkIcon,
    CameraIcon,
} from '@heroicons/react/24/outline';
import { formatStorageUrl } from '@/utils/imageUrl';

export const RepairDamageStep = ({
    damages,
    damageRepairPhotos,
    isAllDamagesCompleted,
    completedDamagesCount,
    setPreviewModalUrl,
    openCamera,
    removeDamagePhoto,
    setCurrentStep,
    showError,
}) => {
    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Summary Progress Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Tahap 2: Verifikasi Fisik Kerusakan
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                isAllDamagesCompleted
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                                {completedDamagesCount} / {damages.length} Selesai
                            </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1">
                            Daftar Kerusakan Yang Harus Diperbaiki
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Ambil foto bukti perbaikan untuk masing-masing kerusakan yang telah diselesaikan.
                        </p>
                    </div>

                    {/* Progress Meter */}
                    <div className="w-full sm:w-44 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                        <div
                            className="bg-emerald-600 h-full transition-all duration-300"
                            style={{
                                width: `${damages.length > 0 ? (completedDamagesCount / damages.length) * 100 : 100}%`,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Damage Items List */}
            <div className="space-y-4">
                {damages.map((damage, index) => {
                    const damagePhoto = damageRepairPhotos[damage.id];
                    const isDone = !!damagePhoto?.blob;

                    return (
                        <div
                            key={damage.id}
                            className={`bg-white rounded-lg border p-4 sm:p-5 shadow-sm transition-all ${
                                isDone
                                    ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/20 to-white'
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {/* Item Header */}
                            <div className="flex flex-wrap items-start justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold flex items-center justify-center">
                                        #{index + 1}
                                    </span>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">
                                            {damage.damage_category?.name || 'Komponen Rusak'}
                                        </h4>
                                        <p className="text-xs text-slate-500 italic mt-0.5">
                                            "{damage.notes || 'Tidak ada catatan spesifik dari inspektor'}"
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">
                                        Tingkat: {damage.severity || 'Medium'}
                                    </span>
                                    {isDone ? (
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded flex items-center gap-1">
                                            <CheckCircleIcon className="h-3.5 w-3.5" /> Selesai
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                                            Wajib Foto
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Side-by-side Visual Comparison */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Left: Before Photo (From Inspection) */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            Sebelum (Saat Ditemukan)
                                        </span>
                                        <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                                            Kondisi Rusak
                                        </span>
                                    </div>

                                    <div
                                        onClick={() => setPreviewModalUrl(formatStorageUrl(damage.damage_photo_url))}
                                        className="aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200 relative group cursor-pointer"
                                    >
                                        <img
                                            src={formatStorageUrl(damage.damage_photo_url)}
                                            alt="Foto Temuan Kerusakan"
                                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                                            Klik untuk Perbesar
                                        </div>
                                    </div>
                                </div>

                                {/* Right: After Photo (Proof of Repair) */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            Sesudah (Bukti Perbaikan)
                                        </span>
                                        {isDone && (
                                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                                Tindakan Selesai
                                            </span>
                                        )}
                                    </div>

                                    {isDone ? (
                                        <div className="relative aspect-video rounded-lg overflow-hidden border border-emerald-200 bg-black group">
                                            <img
                                                src={damagePhoto.previewUrl}
                                                alt="Bukti Perbaikan"
                                                className="w-full h-full object-cover cursor-pointer"
                                                onClick={() => setPreviewModalUrl(damagePhoto.previewUrl)}
                                            />
                                            <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openCamera({
                                                        type: 'damage',
                                                        damageId: damage.id,
                                                        title: `Bukti Perbaikan: ${damage.damage_category?.name || 'Kerusakan'}`
                                                    })}
                                                    className="p-1.5 bg-slate-900/80 hover:bg-black text-white rounded shadow text-xs cursor-pointer"
                                                    title="Foto Ulang"
                                                >
                                                    <ArrowPathIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeDamagePhoto(damage.id)}
                                                    className="p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded shadow text-xs cursor-pointer"
                                                    title="Hapus Foto"
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => openCamera({
                                                type: 'damage',
                                                damageId: damage.id,
                                                title: `Bukti Perbaikan: ${damage.damage_category?.name || 'Kerusakan'}`
                                            })}
                                            className="w-full aspect-video border-2 border-dashed border-blue-200 rounded-lg flex flex-col items-center justify-center bg-blue-50/40 hover:bg-blue-50 hover:border-[#11468F] transition-all text-[#11468F] group cursor-pointer"
                                        >
                                            <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                                                <CameraIcon className="h-5 w-5 text-[#11468F]" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider">
                                                Ambil Foto Bukti Perbaikan
                                            </span>
                                            <span className="text-[10px] text-slate-500 mt-0.5">
                                                Buka kamera lapangan
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Step 2 Navigation Buttons */}
            <div className="flex items-center justify-between pt-2">
                <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="h-12 px-5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span>Kembali ke Langkah 1</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        if (!isAllDamagesCompleted) {
                            showError(`Harap lengkapi semua foto bukti perbaikan (${completedDamagesCount}/${damages.length} selesai)`);
                            return;
                        }
                        setCurrentStep(3);
                    }}
                    className="h-12 px-6 bg-[#11468F] hover:bg-[#0d3873] text-white font-bold text-sm uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                    <span>Lanjut ke Hasil Akhir</span>
                    <ArrowRightIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default RepairDamageStep;
