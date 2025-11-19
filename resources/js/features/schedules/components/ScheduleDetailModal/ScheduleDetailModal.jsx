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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                                <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                    Detail Jadwal
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600">
                                    Informasi lengkap jadwal inspeksi
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        >
                            <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-180px)]">
                    <div className="space-y-4 sm:space-y-6">
                        {/* APAR Information */}
                        <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                            <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                                <FireIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                                Informasi APAR
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Serial Number
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">
                                        {schedule.apar?.serial_number}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Lokasi
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">
                                        {schedule.apar?.location_name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Jenis
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">
                                        {schedule.apar?.aparType?.name || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Kapasitas
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">
                                        {schedule.apar?.capacity} kg
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Schedule Information */}
                        <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                            <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                Informasi Jadwal
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Tanggal
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">
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
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Waktu
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">
                                        {schedule.start_time || "N/A"} -{" "}
                                        {schedule.end_time || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Frekuensi
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">
                                        {getFrequencyText(schedule.frequency)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Status Jadwal
                                    </p>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(
                                            schedule
                                        )}`}
                                    >
                                        {getStatusText(schedule)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Status Aktif
                                    </p>
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium mt-1 ${
                                            schedule.is_active
                                                ? "bg-green-100 text-green-700 border border-green-200"
                                                : "bg-gray-100 text-gray-700 border border-gray-200"
                                        }`}
                                    >
                                        {schedule.is_active ? "🟢 Aktif" : "⚫ Nonaktif"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Technician Information */}
                        <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                            <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                Teknisi
                            </h4>
                            {schedule.assigned_user ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Nama
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900 mt-1">
                                            {schedule.assigned_user.name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Email
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900 mt-1">
                                            {schedule.assigned_user.email}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-3 sm:py-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                                    </div>
                                    <p className="text-xs sm:text-sm font-medium text-red-600">
                                        Teknisi tidak ditugaskan
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        {schedule.notes && (
                            <div className="bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                                <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                                    Catatan
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-700">
                                    {schedule.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                    <button
                        onClick={onClose}
                        className="px-3 sm:px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                        Tutup
                    </button>
                    <button
                        onClick={() => {
                            onClose();
                            onEdit(schedule);
                        }}
                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
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
