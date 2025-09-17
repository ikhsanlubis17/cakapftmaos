import React from 'react';
import {
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Konfirmasi',
    message = 'Apakah Anda yakin ingin melanjutkan?',
    type = 'warning',
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    confirmButtonColor = 'red',
    showCancel = true,
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        const iconClasses = "h-12 w-12";
        
        switch (type) {
            case 'success':
                return <CheckCircleIcon className={`${iconClasses} text-green-600`} />;
            case 'error':
                return <XCircleIcon className={`${iconClasses} text-red-600`} />;
            case 'info':
                return <InformationCircleIcon className={`${iconClasses} text-blue-600`} />;
            case 'warning':
            default:
                return <ExclamationTriangleIcon className={`${iconClasses} text-yellow-600`} />;
        }
    };

    const getConfirmButtonStyle = () => {
        switch (confirmButtonColor) {
            case 'red':
                return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'green':
                return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
            case 'blue':
                return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
            case 'yellow':
                return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
            default:
                return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
        }
    };

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
                {/* Backdrop */}
                <div 
                    className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity duration-300 ease-out"
                    onClick={handleBackdropClick}
                />
                
                {/* Dialog */}
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto transform transition-all duration-300 ease-out scale-100 opacity-100">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                                {getIcon()}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 leading-6">
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200 rounded-lg p-1 hover:bg-gray-100"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div className="px-6 py-4">
                        <p className="text-gray-600 leading-relaxed text-base">
                            {message}
                        </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-end p-6 bg-gray-50 rounded-b-2xl">
                        {showCancel && (
                            <button
                                onClick={onClose}
                                className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            className={`w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-sm ${getConfirmButtonStyle()}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog; 