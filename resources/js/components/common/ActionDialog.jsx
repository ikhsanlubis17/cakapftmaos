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
        if (type === 'approve') return 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500';
        if (type === 'reject') return 'bg-[#DA1212] hover:bg-[#b00f0f] text-white focus:ring-[#DA1212]';
        if (type === 'rework') return 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500';
        
        switch (confirmButtonColor) {
            case 'red':
                return 'bg-[#DA1212] hover:bg-[#b00f0f] text-white focus:ring-[#DA1212]';
            case 'green':
                return 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500';
            case 'blue':
            case 'yellow':
            case 'amber':
            default:
                return 'bg-[#11468F] hover:bg-[#0d3873] text-white focus:ring-[#11468F]';
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
                <div className="relative bg-white rounded-[6px] border border-[#EEEEEE] shadow-xl max-w-md w-full mx-auto transform transition-all duration-150 ease-out scale-100 opacity-100">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-[#EEEEEE]">
                        <div className="flex items-center space-x-3.5">
                            <div className="flex-shrink-0">
                                {getIcon()}
                            </div>
                            <h3 className="text-base font-bold text-slate-900 leading-6">
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="text-slate-400 hover:text-slate-600 transition-colors duration-150 rounded-[4px] p-1.5 hover:bg-[#EEEEEE] disabled:opacity-50"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        {message && (
                            <p className="text-slate-600 leading-relaxed text-sm">
                                {message}
                            </p>
                        )}

                        {/* Teknisi Selection */}
                        {showTeknisiSelect && (
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Pilih Teknisi untuk Perbaikan
                                </label>
                                <select
                                    value={formData.assigned_teknisi_id}
                                    onChange={(e) => {
                                        setFormData({ ...formData, assigned_teknisi_id: e.target.value });
                                        if (errors.assigned_teknisi_id) setErrors({ ...errors, assigned_teknisi_id: '' });
                                    }}
                                    className="w-full rounded-[6px] border border-slate-300 shadow-sm p-2 text-sm focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] outline-none transition-colors"
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
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Tanggal {(requireSchedule || formData.assigned_teknisi_id) && <span className="text-rose-500">*</span>}
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.schedule_date}
                                        onChange={(e) => {
                                            setFormData({ ...formData, schedule_date: e.target.value });
                                            if (errors.schedule_date) setErrors({ ...errors, schedule_date: '' });
                                        }}
                                        min={new Date().toISOString().split('T')[0]}
                                        className={`w-full rounded-[6px] border ${errors.schedule_date ? 'border-rose-300' : 'border-slate-300'} shadow-sm p-2 text-sm focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] outline-none transition-colors`}
                                    />
                                    {errors.schedule_date && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.schedule_date}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Waktu {(requireSchedule || formData.assigned_teknisi_id) && <span className="text-rose-500">*</span>}
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.schedule_time}
                                        onChange={(e) => {
                                            setFormData({ ...formData, schedule_time: e.target.value });
                                            if (errors.schedule_time) setErrors({ ...errors, schedule_time: '' });
                                        }}
                                        className={`w-full rounded-[6px] border ${errors.schedule_time ? 'border-rose-300' : 'border-slate-300'} shadow-sm p-2 text-sm focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F] outline-none transition-colors`}
                                    />
                                    {errors.schedule_time && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.schedule_time}</p>}
                                </div>
                            </div>
                        )}

                        {/* Notes Field */}
                        {showNotesField && (
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    {notesLabel || inputLabel} {(requireInput || requireNotes) && <span className="text-rose-500">*</span>}
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => {
                                        setFormData({ ...formData, notes: e.target.value });
                                        if (errors.notes) setErrors({ ...errors, notes: '' });
                                    }}
                                    placeholder={notesPlaceholder || inputPlaceholder}
                                    rows={3}
                                    className={`w-full rounded-[6px] border ${errors.notes ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300 focus:ring-2 focus:ring-[#11468F] focus:border-[#11468F]'} shadow-sm p-2 text-sm outline-none transition-colors`}
                                />
                                {errors.notes && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.notes}</p>}
                                {minInputLength > 0 && (
                                    <p className={`mt-1 text-xs ${formData.notes.trim().length >= minInputLength ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                                        {formData.notes.trim().length}/{minInputLength} karakter minimum
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:justify-end p-4 bg-slate-50 border-t border-[#EEEEEE]">
                        {showCancel && (
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-[6px] hover:bg-[#EEEEEE] transition-colors duration-150 shadow-sm disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className={`w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-[6px] transition-colors duration-150 shadow-sm disabled:opacity-50 flex items-center justify-center ${getConfirmButtonStyle()}`}
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
