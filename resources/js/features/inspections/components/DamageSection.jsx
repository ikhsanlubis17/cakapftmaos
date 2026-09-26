import React from 'react';
import {
    PlusIcon,
    TrashIcon,
    XMarkIcon,
    CameraIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

const DamageSection = ({
    selectedDamages,
    removeDamage,
    showDamageForm,
    setShowDamageForm,
    newDamage,
    setNewDamage,
    damageCategories,
    startDamageCamera,
    damageCameraActive,
    damageCameraLoading,
    damageVideoRef,
    damageCanvasRef,
    captureCountdown,
    showFlash,
    captureDamagePhoto,
    stopDamageCamera,
    addDamage,
}) => (
    <div className="bg-white p-4 sm:p-5 rounded-[8px] border border-rose-200 shadow-xs space-y-4 bg-rose-50/20">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-[6px] bg-rose-100 text-[#DA1212] ring-1 ring-rose-200 flex items-center justify-center flex-shrink-0">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                </div>
                <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center">
                        Kategori Kerusakan
                        <span className="text-[#DA1212] ml-1">*</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                        Dokumentasikan bagian tabung yang mengalami kerusakan
                    </p>
                </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-rose-100 text-rose-800 border border-rose-200">
                Temuan Lapangan
            </span>
        </div>

        {/* Selected Damages List */}
        {selectedDamages.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                {selectedDamages.map((damage) => (
                    <div
                        key={damage.id}
                        className="bg-white border border-rose-200 rounded-[8px] p-3.5 shadow-xs hover:shadow-sm transition-all"
                    >
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="space-y-1">
                                <span className="inline-block bg-rose-50 text-[#DA1212] border border-rose-200 px-2.5 py-0.5 rounded-[4px] text-xs font-bold font-mono">
                                    {damage.category_name}
                                </span>
                                <div>
                                    <span
                                        className={`inline-block px-2 py-0.5 rounded-[3px] text-[10px] font-semibold uppercase tracking-wider ${
                                            damage.severity === 'low'
                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                : damage.severity === 'medium'
                                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                                : damage.severity === 'high'
                                                ? 'bg-orange-50 text-orange-800 border border-orange-200'
                                                : 'bg-rose-50 text-[#DA1212] border border-rose-200'
                                        }`}
                                    >
                                        Keparahan:{' '}
                                        {damage.severity === 'low'
                                            ? 'Rendah'
                                            : damage.severity === 'medium'
                                            ? 'Sedang'
                                            : damage.severity === 'high'
                                            ? 'Tinggi'
                                            : 'Kritis'}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeDamage(damage.id)}
                                className="text-slate-400 hover:text-[#DA1212] transition-colors p-1.5 rounded-[4px] hover:bg-rose-50 cursor-pointer"
                                title="Hapus temuan ini"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>

                        {damage.notes && (
                            <p className="text-xs text-slate-600 mb-2.5 bg-slate-50 p-2 rounded-[4px] border border-slate-200">
                                {damage.notes}
                            </p>
                        )}

                        {damage.damage_photo && (
                            <div className="relative rounded-[6px] overflow-hidden aspect-video bg-black">
                                <img
                                    src={URL.createObjectURL(damage.damage_photo)}
                                    alt="Foto Kerusakan"
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute bottom-1 left-1 bg-black/70 backdrop-blur-xs text-white px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold">
                                    Foto Bukti
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}

        {/* Add Damage Button / Collapsible Form */}
        {!showDamageForm ? (
            <button
                type="button"
                onClick={() => setShowDamageForm(true)}
                className="w-full py-5 border-2 border-dashed border-rose-300 hover:border-rose-400 hover:bg-rose-50/50 rounded-[8px] flex flex-col items-center justify-center transition-all group cursor-pointer shadow-2xs"
            >
                <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-[#DA1212] group-hover:scale-110 transition-transform mb-2">
                    <PlusIcon className="h-5 w-5" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#DA1212]">
                    Tambah Kategori Kerusakan
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                    Klik untuk melampirkan foto & detail kerusakan
                </p>
            </button>
        ) : (
            <div className="border border-slate-200 rounded-[8px] p-4 sm:p-5 bg-white shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        Form Laporan Kerusakan
                    </h4>
                    <button
                        type="button"
                        onClick={() => {
                            stopDamageCamera();
                            setShowDamageForm(false);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        aria-label="Tutup Form"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Kategori Kerusakan <span className="text-[#DA1212]">*</span>
                            </label>
                            <select
                                value={newDamage.category_id}
                                onChange={(e) => {
                                    const category = damageCategories.find(
                                        (c) => c.id === parseInt(e.target.value)
                                    );
                                    setNewDamage({
                                        ...newDamage,
                                        category_id: e.target.value,
                                        severity: category ? category.severity : 'medium',
                                    });
                                }}
                                className="w-full border border-slate-300 rounded-[6px] px-3.5 py-2.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-transparent bg-white text-xs sm:text-sm text-slate-900 cursor-pointer shadow-2xs"
                                required
                            >
                                <option value="">
                                    {damageCategories.length === 0
                                        ? "Memuat kategori kerusakan..."
                                        : "Pilih kategori kerusakan"}
                                </option>
                                {damageCategories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Tingkat Keparahan
                            </label>
                            <select
                                value={newDamage.severity}
                                disabled
                                className="w-full border border-slate-200 rounded-[6px] px-3.5 py-2.5 min-h-[44px] bg-slate-50 text-slate-600 text-xs sm:text-sm cursor-not-allowed font-medium"
                            >
                                <option value="low">Rendah (Low)</option>
                                <option value="medium">Sedang (Medium)</option>
                                <option value="high">Tinggi (High)</option>
                                <option value="critical">Kritis (Critical)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Catatan Temuan
                        </label>
                        <textarea
                            value={newDamage.notes}
                            onChange={(e) =>
                                setNewDamage({ ...newDamage, notes: e.target.value })
                            }
                            rows={2}
                            className="w-full border border-slate-300 rounded-[6px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#11468F] focus:border-transparent resize-none bg-white text-xs sm:text-sm text-slate-900 shadow-2xs placeholder:text-slate-400"
                            placeholder="Jelaskan kondisi detail kerusakan yang ditemukan..."
                        />
                    </div>

                    {/* Camera Capture for Damage Photo */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Foto Bukti Kerusakan <span className="text-[#DA1212]">*</span>
                        </label>

                        {!newDamage.damage_photo && !damageCameraActive && (
                            <button
                                type="button"
                                onClick={() => startDamageCamera()}
                                disabled={damageCameraLoading}
                                className="w-full h-44 sm:h-48 border-2 border-dashed border-slate-300 hover:border-[#11468F] hover:bg-slate-50 rounded-[8px] flex flex-col items-center justify-center p-3 transition-all duration-200 group disabled:opacity-50 cursor-pointer shadow-2xs"
                            >
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform text-[#11468F] mb-2">
                                    <CameraIcon className="h-5 w-5" />
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#041562]">
                                    Ambil Foto Bukti Kerusakan
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Arahkan kamera ke bagian tabung yang rusak
                                </p>
                            </button>
                        )}

                        {damageCameraActive && !newDamage.damage_photo && (
                            <div className="relative bg-slate-950 rounded-[8px] overflow-hidden shadow-md h-64 sm:h-72 w-full flex items-center justify-center">
                                <video
                                    ref={damageVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                                <canvas ref={damageCanvasRef} className="hidden" />

                                {captureCountdown > 0 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs z-20">
                                        <div className="text-white text-6xl font-black font-mono animate-ping">
                                            {captureCountdown}
                                        </div>
                                    </div>
                                )}

                                {showFlash && (
                                    <div className="absolute inset-0 bg-white z-30 animate-flash" />
                                )}

                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex justify-center items-center space-x-4">
                                    <button
                                        type="button"
                                        onClick={stopDamageCamera}
                                        className="p-2 rounded-[6px] bg-slate-800/80 text-white hover:bg-slate-700 transition-colors cursor-pointer"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={captureDamagePhoto}
                                        disabled={captureCountdown > 0}
                                        className="p-1 rounded-full border-2 border-white/60 hover:border-white transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <div className="h-11 w-11 rounded-full bg-[#11468F] hover:bg-[#041562] border-2 border-white flex items-center justify-center text-white">
                                            <CameraIcon className="h-5 w-5" />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {newDamage.damage_photo && (
                            <div className="space-y-2.5">
                                <div className="relative rounded-[8px] overflow-hidden shadow-xs h-48 sm:h-52 bg-slate-900">
                                    <img
                                        src={URL.createObjectURL(newDamage.damage_photo)}
                                        alt="Foto Kerusakan"
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute bottom-2 left-2 bg-emerald-600/90 backdrop-blur-xs text-white px-2 py-0.5 rounded-[3px] text-[11px] font-bold shadow-sm flex items-center">
                                        <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                                        Foto Bukti Tersimpan
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setNewDamage({
                                            ...newDamage,
                                            damage_photo: null,
                                        })
                                    }
                                    className="w-full inline-flex items-center justify-center px-4 py-2 min-h-[40px] bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-[6px] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                    <ArrowPathIcon className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                                    Ambil Ulang Foto Kerusakan
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Action buttons inside form */}
                    <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={addDamage}
                            className="inline-flex items-center justify-center flex-1 bg-[#11468F] hover:bg-[#041562] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 min-h-[44px] rounded-[6px] transition-colors shadow-xs cursor-pointer"
                        >
                            <PlusIcon className="w-4 h-4 mr-1.5" />
                            Simpan Temuan Ini
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                stopDamageCamera();
                                setShowDamageForm(false);
                                setNewDamage({
                                    category_id: '',
                                    notes: '',
                                    severity: 'medium',
                                    damage_photo: null,
                                });
                            }}
                            className="inline-flex items-center justify-center px-5 py-2.5 min-h-[44px] border border-slate-300 rounded-[6px] hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
);

export default DamageSection;
