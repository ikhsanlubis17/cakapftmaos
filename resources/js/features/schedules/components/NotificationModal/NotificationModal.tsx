import React from 'react';
import {
    BellIcon,
    CalendarIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectType: (type: 'today' | 'all') => void;
    sending: boolean;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
    isOpen,
    onClose,
    onSelectType,
    sending,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Modal Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                                <BellIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                    Pilih Jenis Notifikasi
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600">
                                    Pilih jenis notifikasi yang akan dikirim
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={sending}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        >
                            <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                        <button
                            onClick={() => onSelectType('today')}
                            disabled={sending}
                            className="w-full p-3 sm:p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-green-600 hover:to-green-700 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Jadwal Sedang Berlangsung</span>
                        </button>

                        <button
                            onClick={() => onSelectType('all')}
                            disabled={sending}
                            className="w-full p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <BellIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Semua Jadwal Aktif</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;
