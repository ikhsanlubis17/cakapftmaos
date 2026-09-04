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
                return 'bg-[#DA1212] hover:bg-[#b00f0f] text-white focus:ring-[#DA1212]';
            case 'green':
                return 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500';
            case 'blue':
            case 'yellow':
            default:
                return 'bg-[#11468F] hover:bg-[#0d3873] text-white focus:ring-[#11468F]';
        }
    };

    const handleConfirm = () => {
        onConfirm();
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
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-150 ease-in-out"
                    onClick={handleBackdropClick}
                />
                
                {/* Dialog */}
                <div className="relative bg-white rounded-[6px] shadow-xl max-w-md w-full mx-auto border border-[#EEEEEE] transform transition-all duration-150 ease-in-out scale-100 opacity-100 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-[#EEEEEE]">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                {getIcon()}
                            </div>
                            <h3 className="text-base font-bold text-slate-900 leading-6 tracking-tight">
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors duration-150 rounded-[4px] p-1.5 hover:bg-[#EEEEEE]"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div className="px-6 py-4">
                        <p className="text-slate-600 leading-relaxed text-sm font-medium">
                            {message}
                        </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:justify-end p-4 bg-slate-50 border-t border-[#EEEEEE]">
                        {showCancel && (
                            <button
                                onClick={onClose}
                                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-[6px] hover:bg-[#EEEEEE] transition-colors duration-150"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            className={`w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-[6px] shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getConfirmButtonStyle()}`}
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