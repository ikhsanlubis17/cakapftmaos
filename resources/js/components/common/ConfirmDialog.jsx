import React, { useEffect } from "react";
import {
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Konfirmasi",
    message = "Apakah Anda yakin ingin melanjutkan?",
    type = "warning",
    confirmText = "Ya, Lanjutkan",
    cancelText = "Batal",
    confirmButtonColor = "red",
    showCancel = true,
    loading = false,
    isLoading = false,
}) => {
    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getIcon = () => {
        const iconClasses = "h-8 w-8";

        switch (type) {
            case "success":
                return (
                    <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <CheckCircleIcon className={iconClasses} />
                    </div>
                );
            case "error":
                return (
                    <div className="p-2.5 rounded-full bg-rose-50 text-[#DA1212] border border-rose-200">
                        <XCircleIcon className={iconClasses} />
                    </div>
                );
            case "info":
                return (
                    <div className="p-2.5 rounded-full bg-blue-50 text-[#11468F] border border-blue-200">
                        <InformationCircleIcon className={iconClasses} />
                    </div>
                );
            case "warning":
            default:
                return (
                    <div className="p-2.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                        <ExclamationTriangleIcon className={iconClasses} />
                    </div>
                );
        }
    };

    const getButtonVariant = () => {
        switch (confirmButtonColor) {
            case "red":
                return "destructive";
            case "green":
                return "primary";
            case "blue":
            case "yellow":
            default:
                return "navy";
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 text-center">
                {/* Backdrop with blur */}
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200 ease-out"
                    onClick={handleBackdropClick}
                    aria-hidden="true"
                />

                {/* Dialog Container */}
                <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-auto border border-slate-200 text-left transform transition-all duration-200 ease-out overflow-hidden z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">{getIcon()}</div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 leading-tight">
                                    {title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Tindakan operasional sistem
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={loading || isLoading}
                            className="text-slate-400 hover:text-slate-600 transition-colors rounded-md p-1 hover:bg-slate-200/50 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Tutup"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-slate-700 leading-relaxed text-sm font-normal">
                            {message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-end p-4 bg-slate-50 border-t border-slate-100">
                        {showCancel && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                                disabled={loading || isLoading}
                                className="w-full sm:w-auto h-10 text-xs disabled:opacity-50"
                            >
                                {cancelText}
                            </Button>
                        )}
                        <Button
                            variant={getButtonVariant()}
                            size="sm"
                            onClick={onConfirm}
                            isLoading={loading || isLoading}
                            disabled={loading || isLoading}
                            className="w-full sm:w-auto h-10 text-xs"
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;