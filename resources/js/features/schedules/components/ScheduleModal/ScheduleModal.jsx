import React from "react";
import {
    CalendarIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

/**
 * ScheduleModal Component
 * Modal for creating and editing schedules
 */
const ScheduleModal = ({
    isOpen,
    onClose,
    onSubmit,
    formData,
    onChange,
    errors,
    apars,
    teknisi,
    editingSchedule,
    submitting,
    submitted,
}) => {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(e);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-[6px] shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#041562] text-white rounded-[6px] flex items-center justify-center">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                    {editingSchedule
                                        ? "Edit Jadwal"
                                        : "Buat Jadwal Baru"}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500">
                                    {editingSchedule
                                        ? "Perbarui informasi jadwal"
                                        : "Buat jadwal inspeksi baru"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-[6px] transition-colors duration-200"
                        >
                            <XCircleIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)]">
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4 sm:space-y-5"
                    >
                        {/* APAR Selection */}
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                                APAR <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="apar_id"
                                value={formData.apar_id || ""}
                                onChange={onChange}
                                disabled={submitting}
                                className={`w-full px-3 py-2 border rounded-[6px] text-sm focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all duration-200 ${
                                    errors.apar_id
                                        ? "border-red-300 bg-red-50"
                                        : "border-slate-300"
                                }`}
                            >
                                <option value="">Pilih APAR</option>
                                {apars.map((apar) => (
                                    <option key={apar.id} value={apar.id}>
                                        {apar.serial_number} - {apar.location_name} (
                                        {(apar.aparType?.name || "N/A").toUpperCase()})
                                    </option>
                                ))}
                            </select>
                            {errors.apar_id && (
                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                    <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                    {errors.apar_id}
                                </p>
                            )}
                        </div>

                        {/* Teknisi Selection */}
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                                Teknisi <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="assigned_user_id"
                                value={formData.assigned_user_id || ""}
                                onChange={onChange}
                                disabled={submitting}
                                className={`w-full px-3 py-2 border rounded-[6px] text-sm focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all duration-200 ${
                                    errors.assigned_user_id
                                        ? "border-red-300 bg-red-50"
                                        : "border-slate-300"
                                }`}
                            >
                                <option value="">Pilih Teknisi</option>
                                {teknisi.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} - {user.email || "No email"}
                                    </option>
                                ))}
                            </select>
                            {errors.assigned_user_id && (
                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                    <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                    {errors.assigned_user_id}
                                </p>
                            )}
                        </div>

                        {/* Date and Time */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                                    Tanggal <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="scheduled_date"
                                    value={formData.scheduled_date || ""}
                                    onChange={onChange}
                                    disabled={submitting}
                                    min={
                                        editingSchedule
                                            ? undefined
                                            : new Date().toISOString().split("T")[0]
                                    }
                                    className={`w-full px-3 py-2 border rounded-[6px] text-sm focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all duration-200 ${
                                        errors.scheduled_date
                                            ? "border-red-300 bg-red-50"
                                            : "border-slate-300"
                                    }`}
                                />
                                {errors.scheduled_date && (
                                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                        <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                        {errors.scheduled_date}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                                    Waktu Mulai <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    name="start_time"
                                    value={formData.start_time || ""}
                                    onChange={onChange}
                                    disabled={submitting}
                                    className={`w-full px-3 py-2 border rounded-[6px] text-sm focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all duration-200 ${
                                        errors.start_time
                                            ? "border-red-300 bg-red-50"
                                            : "border-slate-300"
                                    }`}
                                />
                                {errors.start_time && (
                                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                        <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                        {errors.start_time}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                                    Waktu Selesai <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    name="end_time"
                                    value={formData.end_time || ""}
                                    onChange={onChange}
                                    disabled={submitting}
                                    className={`w-full px-3 py-2 border rounded-[6px] text-sm focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all duration-200 ${
                                        errors.end_time
                                            ? "border-red-300 bg-red-50"
                                            : "border-slate-300"
                                    }`}
                                />
                                {errors.end_time && (
                                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                        <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                        {errors.end_time}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Frequency */}
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                                Frekuensi
                            </label>
                            <select
                                name="frequency"
                                value={formData.frequency || "weekly"}
                                onChange={onChange}
                                disabled={submitting}
                                className="w-full px-3 py-2 border border-slate-300 rounded-[6px] text-sm focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all duration-200"
                            >
                                <option value="weekly">Perminggu</option>
                                <option value="monthly">Perbulan</option>
                                <option value="quarterly">Per-3 Bulan</option>
                                <option value="semiannual">Per-6 Bulan</option>
                            </select>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                                Catatan
                            </label>
                            <textarea
                                name="notes"
                                rows={3}
                                value={formData.notes || ""}
                                onChange={onChange}
                                disabled={submitting}
                                placeholder="Catatan tambahan (opsional)"
                                className="w-full px-3 py-2 border border-slate-300 rounded-[6px] text-sm focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] transition-all duration-200 resize-none"
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="is_active"
                                id="is_active"
                                checked={Boolean(formData.is_active)}
                                onChange={onChange}
                                disabled={submitting}
                                className="h-4 w-4 text-[#11468F] focus:ring-[#11468F] border-slate-300 rounded-[3px]"
                            />
                            <label
                                htmlFor="is_active"
                                className="ml-2.5 text-xs sm:text-sm font-medium text-slate-700"
                            >
                                Jadwal aktif
                            </label>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-5 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 text-sm rounded-[6px] font-medium hover:bg-slate-100 focus:ring-2 focus:ring-[#11468F] transition-all duration-200 disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`flex-1 px-4 py-2 rounded-[6px] text-sm font-semibold border transition-all duration-200 disabled:opacity-50 ${
                                    submitted
                                        ? "bg-emerald-600 text-white border-emerald-600"
                                        : "bg-[#11468F] hover:bg-[#0d3873] text-white border-transparent shadow-sm focus:ring-2 focus:ring-[#11468F]"
                                }`}
                            >
                                {submitting ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                                        <span>
                                            {editingSchedule ? "Menyimpan..." : "Membuat..."}
                                        </span>
                                    </div>
                                ) : submitted ? (
                                    "Berhasil!"
                                ) : (
                                    <>
                                        <span>
                                            {editingSchedule
                                                ? "Simpan Perubahan"
                                                : "Buat Jadwal"}
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ScheduleModal;
