import React, { useState, useEffect } from 'react';
import {
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    XMarkIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

const ActionDialog = ({
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
    requireInput = false,
    requireNotes = false,
    requireSchedule = false,
    requiresRepair = false,
    teknisiList = [],
    inputLabel = 'Catatan',
    notesLabel = 'Catatan',
    inputPlaceholder = 'Masukkan catatan...',
    minInputLength = 0,
    notesPlaceholder = 'Masukkan catatan...',
    initialInputValue = '',
    isLoading = false,
}) => {
    const [formData, setFormData] = useState({
        notes: initialInputValue,
        assigned_teknisi_id: '',
        schedule_date: '',
        schedule_time: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            setFormData({
                notes: initialInputValue,
                assigned_teknisi_id: '',
                schedule_date: new Date().toISOString().split('T')[0],
                schedule_time: '09:00',
            });
            setErrors({});
        }
    }, [isOpen, initialInputValue]);

    if (!isOpen) return null;

    const getIcon = () => {
        const iconClasses = "h-12 w-12";
        
        switch (type) {
            case 'success':
            case 'approve':
                return <CheckCircleIcon className={`${iconClasses} text-green-600`} />;
            case 'error':
            case 'reject':
                return <XCircleIcon className={`${iconClasses} text-red-600`} />;
            case 'info':
                return <InformationCircleIcon className={`${iconClasses} text-blue-600`} />;
            case 'rework':
                return <ArrowPathIcon className={`${iconClasses} text-amber-600`} />;
            case 'warning':
            default:
                return <ExclamationTriangleIcon className={`${iconClasses} text-yellow-600`} />;
        }
    };

    const getConfirmButtonStyle = () => {
        if (type === 'approve') return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
        if (type === 'reject') return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
        if (type === 'rework') return 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500';
        
        switch (confirmButtonColor) {
            case 'red':
                return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'green':
                return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
            case 'blue':
                return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
            case 'yellow':
            case 'amber':
                return 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500';
            default:
                return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
        }
    };

    const getDefaultConfirmText = () => {
        if (confirmText !== 'Ya, Lanjutkan') return confirmText;
        switch (type) {
            case 'approve': return 'Setujui';
            case 'reject': return 'Tolak';
            case 'rework': return 'Minta Perbaikan Ulang';
            default: return confirmText;
        }
    };

    const handleConfirm = () => {
        const newErrors = {};
        
        if ((requireInput || requireNotes) && !formData.notes.trim()) {
            newErrors.notes = 'Field ini wajib diisi';
        } else if (minInputLength > 0 && formData.notes.trim().length < minInputLength) {
            newErrors.notes = `Minimal ${minInputLength} karakter`;
        }
        
        if (requireSchedule) {
            if (!formData.schedule_date) {
                newErrors.schedule_date = 'Tanggal wajib diisi';
            }
            if (!formData.schedule_time) {
                newErrors.schedule_time = 'Waktu wajib diisi';
            }
        }
        
        if (requiresRepair && formData.assigned_teknisi_id && (!formData.schedule_date || !formData.schedule_time)) {
            if (!formData.schedule_date) {
                newErrors.schedule_date = 'Tanggal wajib diisi jika memilih teknisi';
            }
            if (!formData.schedule_time) {
                newErrors.schedule_time = 'Waktu wajib diisi jika memilih teknisi';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        onConfirm(formData);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !isLoading) {
            onClose();
        }
    };

    const showNotesField = requireInput || requireNotes || true; // Always show notes
    const showTeknisiSelect = requiresRepair && teknisiList.length > 0;
    const showScheduleFields = requireSchedule || (showTeknisiSelect && formData.assigned_teknisi_id);

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
                            disabled={isLoading}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200 rounded-lg p-1 hover:bg-gray-100 disabled:opacity-50"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        {message && (
                            <p className="text-gray-600 leading-relaxed text-base">
                                {message}
                            </p>
                        )}

                        {/* Teknisi Selection */}
                        {showTeknisiSelect && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pilih Teknisi untuk Perbaikan
                                </label>
                                <select
                                    value={formData.assigned_teknisi_id}
                                    onChange={(e) => {
                                        setFormData({ ...formData, assigned_teknisi_id: e.target.value });
                                        if (errors.assigned_teknisi_id) setErrors({ ...errors, assigned_teknisi_id: '' });
                                    }}
                                    className="w-full rounded-lg border border-gray-300 shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">-- Pilih Teknisi --</option>
                                    {teknisiList.map((teknisi) => (
                                        <option key={teknisi.id} value={teknisi.id}>
                                            {teknisi.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Schedule Fields */}
                        {showScheduleFields && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal {(requireSchedule || formData.assigned_teknisi_id) && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.schedule_date}
                                        onChange={(e) => {
                                            setFormData({ ...formData, schedule_date: e.target.value });
                                            if (errors.schedule_date) setErrors({ ...errors, schedule_date: '' });
                                        }}
                                        min={new Date().toISOString().split('T')[0]}
                                        className={`w-full rounded-lg border ${errors.schedule_date ? 'border-red-300' : 'border-gray-300'} shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500`}
                                    />
                                    {errors.schedule_date && <p className="mt-1 text-xs text-red-600">{errors.schedule_date}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Waktu {(requireSchedule || formData.assigned_teknisi_id) && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.schedule_time}
                                        onChange={(e) => {
                                            setFormData({ ...formData, schedule_time: e.target.value });
                                            if (errors.schedule_time) setErrors({ ...errors, schedule_time: '' });
                                        }}
                                        className={`w-full rounded-lg border ${errors.schedule_time ? 'border-red-300' : 'border-gray-300'} shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500`}
                                    />
                                    {errors.schedule_time && <p className="mt-1 text-xs text-red-600">{errors.schedule_time}</p>}
                                </div>
                            </div>
                        )}

                        {/* Notes Field */}
                        {showNotesField && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {notesLabel || inputLabel} {(requireInput || requireNotes) && <span className="text-red-500">*</span>}
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => {
                                        setFormData({ ...formData, notes: e.target.value });
                                        if (errors.notes) setErrors({ ...errors, notes: '' });
                                    }}
                                    placeholder={notesPlaceholder || inputPlaceholder}
                                    rows={3}
                                    className={`w-full rounded-lg border ${errors.notes ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} shadow-sm p-2 text-sm`}
                                />
                                {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes}</p>}
                                {minInputLength > 0 && (
                                    <p className={`mt-1 text-xs ${formData.notes.trim().length >= minInputLength ? 'text-green-600' : 'text-gray-500'}`}>
                                        {formData.notes.trim().length}/{minInputLength} karakter minimum
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-end p-6 bg-gray-50 rounded-b-2xl">
                        {showCancel && (
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className={`w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-sm disabled:opacity-50 flex items-center justify-center ${getConfirmButtonStyle()}`}
                        >
                            {isLoading && (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {getDefaultConfirmText()}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActionDialog;
