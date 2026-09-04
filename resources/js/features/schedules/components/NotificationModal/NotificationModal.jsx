import React from "react";
import {
    BellIcon,
    CalendarIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";

/**
 * NotificationModal Component
 * Modal for selecting notification type to send
 */
const NotificationModal = ({ isOpen, onClose, onSelectType, sending }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-[6px] shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
                {/* Modal Header */}
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#041562] text-white rounded-[6px] flex items-center justify-center">
                                <BellIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                    Pilih Jenis Notifikasi
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500">
                                    Pilih jenis notifikasi yang akan dikirim
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={sending}
                            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-[6px] transition-colors duration-200"
                        >
                            <XCircleIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-6">
                    <div className="space-y-3">
                        <button
                            onClick={() => onSelectType("today")}
                            disabled={sending}
                            className="w-full p-3.5 bg-[#11468F] hover:bg-[#0d3873] text-white border border-transparent rounded-[6px] text-sm font-semibold focus:ring-2 focus:ring-[#11468F] shadow-sm transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50"
                        >
                            <CalendarIcon className="w-5 h-5" />
                            <span>Jadwal Sedang Berlangsung</span>
                        </button>

                        <button
                            onClick={() => onSelectType("all")}
                            disabled={sending}
                            className="w-full p-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-[6px] text-sm font-semibold focus:ring-2 focus:ring-[#11468F] shadow-sm transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50"
                        >
                            <BellIcon className="w-5 h-5 text-[#11468F]" />
                            <span>Semua Jadwal Aktif</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;
