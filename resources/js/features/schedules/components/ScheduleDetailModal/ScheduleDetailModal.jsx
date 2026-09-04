import React from "react";
import {
    EyeIcon,
    XCircleIcon,
    FireIcon,
    CalendarIcon,
    UserIcon,
    ExclamationTriangleIcon,
    PencilIcon,
} from "@heroicons/react/24/outline";
import { getFrequencyText, getStatusColor, getStatusText } from "../../utils/scheduleUtils";

/**
 * ScheduleDetailModal Component
 * Modal for viewing schedule details
 */
const ScheduleDetailModal = ({ schedule, isOpen, onClose, onEdit }) => {
    if (!isOpen || !schedule) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-[6px] shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#041562] text-white rounded-[6px] flex items-center justify-center">
                                <EyeIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                    Detail Jadwal
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500">
                                    Informasi lengkap jadwal inspeksi
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-[6px] transition-colors duration-200"
                        >
                            <XCircleIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-180px)]">
                    <div className="space-y-4 sm:space-y-5">
                        {/* APAR Information */}
                        <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-4">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <FireIcon className="w-4 h-4 text-red-600" />
                                Informasi APAR
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Serial Number
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                                        {schedule.apar?.serial_number}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Lokasi
                                    </p>
                                    <p className="text-sm font-medium text-slate-900 mt-0.5">
                                        {schedule.apar?.location_name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Jenis
                                    </p>
                                    <p className="text-sm font-medium text-slate-900 mt-0.5">
                                        {schedule.apar?.aparType?.name || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Kapasitas
                                    </p>
                                    <p className="text-sm font-medium text-slate-900 mt-0.5">
                                        {schedule.apar?.capacity} kg
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Schedule Information */}
                        <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-4">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-[#11468F]" />
                                Informasi Jadwal
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Tanggal
                                    </p>
                                    <p className="text-sm font-medium text-slate-900 mt-0.5">
                                        {schedule.scheduled_date
                                            ? new Date(
                                                  schedule.scheduled_date
                                              ).toLocaleDateString("id-ID", {
                                                  weekday: "long",
                                                  year: "numeric",
                                                  month: "long",
                                                  day: "numeric",
                                              })
                                            : "Tanggal tidak valid"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Waktu
                                    </p>
                                    <p className="text-sm font-medium text-slate-900 mt-0.5">
                                        {schedule.start_time || "N/A"} -{" "}
                                        {schedule.end_time || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Frekuensi
                                    </p>
                                    <p className="text-sm font-medium text-slate-900 mt-0.5">
                                        {getFrequencyText(schedule.frequency)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Status Jadwal
                                    </p>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold mt-1 ${getStatusColor(
                                            schedule
                                        )}`}
                                    >
                                        {getStatusText(schedule)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Status Aktif
                                    </p>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold mt-1 ${
                                            schedule.is_active
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : "bg-slate-100 text-slate-700 border border-slate-200"
                                        }`}
                                    >
                                        {schedule.is_active ? "Aktif" : "Nonaktif"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Technician Information */}
                        <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-4">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-emerald-600" />
                                Teknisi
                            </h4>
                            {schedule.assigned_user ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                            Nama
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                                            {schedule.assigned_user.name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                            Email
                                        </p>
                                        <p className="text-sm font-medium text-slate-900 mt-0.5">
                                            {schedule.assigned_user.email}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-3">
                                    <div className="w-10 h-10 bg-red-100 rounded-[6px] flex items-center justify-center mx-auto mb-2">
                                        <UserIcon className="w-5 h-5 text-red-600" />
                                    </div>
                                    <p className="text-xs sm:text-sm font-medium text-red-600">
                                        Teknisi tidak ditugaskan
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        {schedule.notes && (
                            <div className="bg-amber-50 rounded-[6px] p-4 border border-amber-200">
                                <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                                    <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
                                    Catatan
                                </h4>
                                <p className="text-xs sm:text-sm text-slate-700">
                                    {schedule.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-[6px] text-sm font-medium hover:bg-slate-100 transition-colors duration-200"
                    >
                        Tutup
                    </button>
                    <button
                        onClick={() => {
                            onClose();
                            onEdit(schedule);
                        }}
                        className="px-4 py-2 bg-[#11468F] hover:bg-[#0d3873] text-white font-semibold border border-transparent rounded-[6px] text-sm shadow-sm transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <PencilIcon className="w-4 h-4" />
                        Edit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleDetailModal;
