import React from 'react';
import { PlusIcon, TrashIcon, XMarkIcon, BellIcon } from '@heroicons/react/24/outline';

interface ScheduleActionsProps {
    bulkDeleteMode: boolean;
    selectedCount: number;
    deleting: boolean;
    sendingNotifications: boolean;
    onBulkDelete: () => void;
    onToggleBulkDelete: () => void;
    onSendNotifications: () => void;
    onCreateNew: () => void;
}

const ScheduleActions: React.FC<ScheduleActionsProps> = ({
    bulkDeleteMode,
    selectedCount,
    deleting,
    sendingNotifications,
    onBulkDelete,
    onToggleBulkDelete,
    onSendNotifications,
    onCreateNew,
}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {bulkDeleteMode ? (
                <>
                    <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-600">{selectedCount} dipilih</span>
                    </div>
                    <button
                        onClick={onBulkDelete}
                        disabled={selectedCount === 0 || deleting}
                        className={`inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 border border-transparent text-sm sm:text-base font-medium rounded-lg sm:rounded-xl text-white ${
                            selectedCount > 0 && !deleting
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500/20'
                                : 'bg-gray-300 cursor-not-allowed'
                        } transition-all duration-200`}
                    >
                        {deleting ? (
                            <>
                                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent mr-2"></div>
                                Menghapus...
                            </>
                        ) : (
                            <>
                                <TrashIcon className="w-4 h-4 mr-2" />
                                Hapus ({selectedCount})
                            </>
                        )}
                    </button>
                    <button
                        onClick={onToggleBulkDelete}
                        className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 text-sm sm:text-base font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500/20 transition-all duration-200"
                    >
                        <XMarkIcon className="w-4 h-4 mr-2" />
                        Batal
                    </button>
                </>
            ) : (
                <>
                    <button
                        onClick={onToggleBulkDelete}
                        className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 text-sm sm:text-base font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500/20 transition-all duration-200"
                    >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Hapus Massal</span>
                        <span className="sm:hidden">Hapus</span>
                    </button>
                    <button
                        onClick={onSendNotifications}
                        disabled={sendingNotifications}
                        className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 text-sm sm:text-base font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500/20 transition-all duration-200 disabled:opacity-50"
                    >
                        {sendingNotifications ? (
                            <>
                                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-gray-600 border-t-transparent mr-2"></div>
                                <span className="hidden sm:inline">Mengirim...</span>
                                <span className="sm:hidden">Mengirim</span>
                            </>
                        ) : (
                            <>
                                <BellIcon className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Kirim Notifikasi</span>
                                <span className="sm:hidden">Notifikasi</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={onCreateNew}
                        className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-red-600 hover:to-red-700 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                    >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Buat Jadwal</span>
                        <span className="sm:hidden">Buat</span>
                    </button>
                </>
            )}
        </div>
    );
};

export default ScheduleActions;
