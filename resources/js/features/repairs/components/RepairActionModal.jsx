import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
    CheckCircleIcon,
    XCircleIcon,
    XMarkIcon,
    ExclamationTriangleIcon,
    CalendarIcon,
    ClockIcon,
    UserIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';

const REJECTION_REASONS = [
    'Data / Bukti temuan tidak lengkap',
    'Foto bukti buram atau tidak sesuai',
    'Kerusakan ringan dapat ditangani di tempat',
    'Kondisi APAR masih layak operasional',
    'Perlu verifikasi fisik ulang oleh teknisi lain',
    'Lainnya',
];

const RepairActionModal = ({
    isOpen,
    onClose,
    actionType = 'approve', // 'approve' | 'reject'
    approval,
    onConfirm,
    isSubmitting = false,
}) => {
    const { apiClient } = useAuth();

    const [assignedTeknisiId, setAssignedTeknisiId] = useState('');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('09:00');
    const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0]);
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState({});

    // Reset form when modal opens or approval changes
    useEffect(() => {
        if (isOpen) {
            const todayStr = new Date().toISOString().split('T')[0];
            setScheduleDate(todayStr);
            setScheduleTime('09:00');
            setAssignedTeknisiId('');
            setRejectionReason(REJECTION_REASONS[0]);
            setNotes('');
            setErrors({});
        }
    }, [isOpen, approval, actionType]);

    // Fetch available technicians for the selected date & time
    const { data: rawTeknisi = [], isLoading: loadingTeknisi } = useQuery({
        queryKey: ['available-technicians', scheduleDate, scheduleTime],
        queryFn: async () => {
            const res = await apiClient.get('/api/schedules/available-technicians', {
                params: {
                    schedule_date: scheduleDate,
                    schedule_time: scheduleTime,
                    only_available: true,
                },
            });
            const list = res.data?.data || [];
            // Strictly filter to only available technicians
            return list.filter((u) => u.is_available !== false);
        },
        staleTime: 1000 * 30,
        enabled: isOpen && actionType === 'approve' && Boolean(scheduleDate) && Boolean(scheduleTime),
    });

    // Auto-reset assignedTeknisiId if the selected technician is not available at the new date/time
    useEffect(() => {
        if (assignedTeknisiId) {
            const isAvailable = rawTeknisi.some((t) => String(t.id) === String(assignedTeknisiId));
            if (!isAvailable) {
                setAssignedTeknisiId('');
            }
        }
    }, [rawTeknisi, assignedTeknisiId]);

    if (!isOpen || !approval) return null;

    const apar = approval.inspection?.apar || {};
    const damages = approval.inspection?.inspection_damages || approval.inspection?.inspectionDamages || [];

    const validateForm = () => {
        const newErrors = {};

        if (actionType === 'approve') {
            if (!scheduleDate) {
                newErrors.schedule_date = 'Tanggal jadwal perbaikan wajib diisi';
            }
            if (!scheduleTime) {
                newErrors.schedule_time = 'Waktu jadwal perbaikan wajib diisi';
            }
            if (!assignedTeknisiId) {
                newErrors.assigned_teknisi_id = rawTeknisi.length === 0
                    ? 'Tidak ada teknisi yang tersedia pada waktu ini. Ubah tanggal atau jam perbaikan.'
                    : 'Teknisi yang ditugaskan wajib dipilih dari daftar teknisi yang tersedia';
            }
            if (!notes.trim()) {
                newErrors.supervisor_notes = 'Instruksi kerja perbaikan wajib diisi';
            } else if (notes.trim().length < 10) {
                newErrors.supervisor_notes = `Instruksi kerja minimal 10 karakter (${notes.trim().length}/10)`;
            }
        } else {
            if (!rejectionReason) {
                newErrors.rejection_reason = 'Alasan penolakan wajib dipilih';
            }
            if (!notes.trim()) {
                newErrors.supervisor_notes = 'Catatan alasan penolakan wajib diisi';
            } else if (notes.trim().length < 10) {
                newErrors.supervisor_notes = `Catatan minimal 10 karakter (${notes.trim().length}/10)`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await onConfirm({
                id: approval.id,
                assignedTeknisiId,
                scheduleDate,
                scheduleTime,
                rejectionReason,
                notes: notes.trim(),
                approval,
            });
        } catch (err) {
            // If backend returned validation errors (422), map them to field errors
            if (err?.response?.status === 422 && err?.response?.data?.errors) {
                const serverErrors = {};
                Object.entries(err.response.data.errors).forEach(([key, msgs]) => {
                    serverErrors[key] = Array.isArray(msgs) ? msgs[0] : msgs;
                });
                setErrors(serverErrors);
            }
        }
    };

    const isApprove = actionType === 'approve';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
                onClick={() => !isSubmitting && onClose()} 
            />

            <div className="flex min-h-screen items-center justify-center p-3 sm:p-4 text-center">
                <div 
                    className="relative inline-block w-full max-w-lg bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all border border-slate-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`px-5 py-4 border-b ${isApprove ? 'bg-emerald-50/70 border-emerald-100' : 'bg-rose-50/70 border-rose-100'} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                isApprove ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#DA1212] text-white shadow-sm'
                            }`}>
                                {isApprove ? (
                                    <CheckCircleIcon className="h-6 w-6" />
                                ) : (
                                    <XCircleIcon className="h-6 w-6" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 leading-tight">
                                    {isApprove ? 'Persetujuan & Penugasan Perbaikan' : 'Tolak Permohonan Perbaikan'}
                                </h3>
                                <p className="text-xs text-slate-600 mt-0.5">
                                    {isApprove 
                                        ? 'Tugaskan teknisi dan tentukan jadwal perbaikan fisik APAR'
                                        : 'Berikan evaluasi dan alasan penolakan bagi teknisi'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 transition-colors"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* APAR Quick Info Banner */}
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-500 uppercase tracking-wider">APAR:</span>
                            <span className="font-mono font-bold tracking-wider text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {apar.serial_number || 'N/A'}
                            </span>
                        </div>
                        <div className="text-slate-600 truncate max-w-[240px]">
                            {apar.location || apar.tank_truck?.plate_number || 'Area Terminal'}
                        </div>
                    </div>

                    {/* Damage Note Snippet (if available) */}
                    {approval.inspection?.notes && (
                        <div className="mx-5 mt-3 p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900">
                            <span className="font-bold">Temuan Kerusakan:</span> {approval.inspection.notes}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {isApprove ? (
                            <>
                                {/* Schedule Date & Time */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                                            <CalendarIcon className="h-4 w-4 text-[#11468F]" />
                                            Tanggal Perbaikan <span className="text-[#DA1212]">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={scheduleDate}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => {
                                                setScheduleDate(e.target.value);
                                                if (errors.schedule_date) {
                                                    setErrors({ ...errors, schedule_date: null });
                                                }
                                            }}
                                            disabled={isSubmitting}
                                            className={`w-full rounded-lg border px-3 py-2.5 text-sm min-h-[44px] bg-white transition-colors outline-none cursor-pointer ${
                                                errors.schedule_date 
                                                    ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20' 
                                                    : 'border-slate-300 focus:border-[#11468F] focus:ring-2 focus:ring-blue-100'
                                            }`}
                                        />
                                        {errors.schedule_date && (
                                            <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                                                <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                                                {errors.schedule_date}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                                            <ClockIcon className="h-4 w-4 text-[#11468F]" />
                                            Waktu Perbaikan <span className="text-[#DA1212]">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={scheduleTime}
                                            onChange={(e) => {
                                                setScheduleTime(e.target.value);
                                                if (errors.schedule_time) {
                                                    setErrors({ ...errors, schedule_time: null });
                                                }
                                            }}
                                            disabled={isSubmitting}
                                            className={`w-full rounded-lg border px-3 py-2.5 text-sm min-h-[44px] bg-white transition-colors outline-none cursor-pointer ${
                                                errors.schedule_time 
                                                    ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20' 
                                                    : 'border-slate-300 focus:border-[#11468F] focus:ring-2 focus:ring-blue-100'
                                            }`}
                                        />
                                        {errors.schedule_time && (
                                            <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                                                <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                                                {errors.schedule_time}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Teknisi Selection (Only Available Technicians) */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <UserIcon className="h-4 w-4 text-[#11468F]" />
                                            Pilih Teknisi Perbaikan (Hanya yang Tersedia) <span className="text-[#DA1212]">*</span>
                                        </span>
                                        {loadingTeknisi && (
                                            <span className="text-[11px] font-normal text-[#11468F] animate-pulse">
                                                Memeriksa jadwal teknisi...
                                            </span>
                                        )}
                                    </label>
                                    <select
                                        value={assignedTeknisiId}
                                        onChange={(e) => {
                                            setAssignedTeknisiId(e.target.value);
                                            if (errors.assigned_teknisi_id) {
                                                setErrors({ ...errors, assigned_teknisi_id: null });
                                            }
                                        }}
                                        disabled={loadingTeknisi || isSubmitting || rawTeknisi.length === 0}
                                        className={`w-full rounded-lg border px-3 py-2.5 text-sm min-h-[44px] bg-white transition-colors cursor-pointer outline-none ${
                                            errors.assigned_teknisi_id 
                                                ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20' 
                                                : 'border-slate-300 focus:border-[#11468F] focus:ring-2 focus:ring-blue-100'
                                        }`}
                                    >
                                        <option value="">
                                            {loadingTeknisi 
                                                ? '-- Memeriksa ketersediaan teknisi... --' 
                                                : rawTeknisi.length === 0
                                                ? '-- Tidak ada teknisi yang tersedia pada waktu ini --'
                                                : `-- Pilih Teknisi Tersedia (${rawTeknisi.length} teknisi) --`}
                                        </option>
                                        {rawTeknisi.map((tek) => (
                                            <option key={tek.id} value={tek.id}>
                                                {tek.name} {tek.phone ? `(${tek.phone})` : (tek.email ? `(${tek.email})` : '')} — Tersedia
                                            </option>
                                        ))}
                                    </select>
                                    {errors.assigned_teknisi_id && (
                                        <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                                            <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                                            {errors.assigned_teknisi_id}
                                        </p>
                                    )}
                                    {!loadingTeknisi && rawTeknisi.length === 0 && (
                                        <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
                                            <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold">Tidak ada teknisi yang tersedia pada waktu ini.</p>
                                                <p className="mt-0.5 text-amber-800 text-[11px]">
                                                    Semua teknisi sedang memiliki jadwal tugas lain pada {scheduleDate} pukul {scheduleTime}. Silakan pilih tanggal atau waktu perbaikan di atas.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Work Instructions / Supervisor Notes */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                            <DocumentTextIcon className="h-4 w-4 text-[#11468F]" />
                                            Instruksi Kerja Supervisor <span className="text-[#DA1212]">*</span>
                                        </label>
                                        <span className={`text-[11px] font-medium ${notes.trim().length < 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {notes.trim().length}/10 min
                                        </span>
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => {
                                            setNotes(e.target.value);
                                            if (errors.supervisor_notes) {
                                                setErrors({ ...errors, supervisor_notes: null });
                                            }
                                        }}
                                        disabled={isSubmitting}
                                        placeholder="Tuliskan instruksi kerja teknisi, bagian tabung/komponen yang harus diperbaiki/diganti, dan aspek K3 keselamatan..."
                                        className={`w-full rounded-lg border p-3 text-sm transition-colors outline-none ${
                                            errors.supervisor_notes 
                                                ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20' 
                                                : 'border-slate-300 focus:border-[#11468F] focus:ring-2 focus:ring-blue-100'
                                        }`}
                                    />
                                    {errors.supervisor_notes && (
                                        <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                                            <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                                            {errors.supervisor_notes}
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Rejection Reason Selection */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                                        <ShieldAlertIcon className="h-4 w-4 text-[#DA1212]" />
                                        Alasan Penolakan <span className="text-[#DA1212]">*</span>
                                    </label>
                                    <select
                                        value={rejectionReason}
                                        onChange={(e) => {
                                            setRejectionReason(e.target.value);
                                            if (errors.rejection_reason) {
                                                setErrors({ ...errors, rejection_reason: null });
                                            }
                                        }}
                                        disabled={isSubmitting}
                                        className={`w-full rounded-lg border px-3 py-2.5 text-sm min-h-[44px] bg-white transition-colors cursor-pointer outline-none ${
                                            errors.rejection_reason 
                                                ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20' 
                                                : 'border-slate-300 focus:border-[#11468F] focus:ring-2 focus:ring-blue-100'
                                        }`}
                                    >
                                        {REJECTION_REASONS.map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.rejection_reason && (
                                        <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                                            <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                                            {errors.rejection_reason}
                                        </p>
                                    )}
                                </div>

                                {/* Rejection Notes */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                            <DocumentTextIcon className="h-4 w-4 text-[#DA1212]" />
                                            Catatan Evaluasi / Arahan <span className="text-[#DA1212]">*</span>
                                        </label>
                                        <span className={`text-[11px] font-medium ${notes.trim().length < 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {notes.trim().length}/10 min
                                        </span>
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => {
                                            setNotes(e.target.value);
                                            if (errors.supervisor_notes) {
                                                setErrors({ ...errors, supervisor_notes: null });
                                            }
                                        }}
                                        disabled={isSubmitting}
                                        placeholder="Jelaskan alasan penolakan dan arahan kepada teknisi lapangan (contoh: minta upload ulang foto pressure gauge yang jelas)..."
                                        className={`w-full rounded-lg border p-3 text-sm transition-colors outline-none ${
                                            errors.supervisor_notes 
                                                ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20' 
                                                : 'border-slate-300 focus:border-[#11468F] focus:ring-2 focus:ring-blue-100'
                                        }`}
                                    />
                                    {errors.supervisor_notes && (
                                        <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                                            <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                                            {errors.supervisor_notes}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Modal Action Buttons */}
                        <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-colors min-h-[44px]"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white shadow-sm transition-colors min-h-[44px] ${
                                    isApprove 
                                        ? 'bg-[#11468F] hover:bg-[#0d3873]' 
                                        : 'bg-[#DA1212] hover:bg-red-700'
                                } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Memproses...</span>
                                    </>
                                ) : isApprove ? (
                                    <>
                                        <CheckCircleIcon className="h-5 w-5" />
                                        <span>Ya, Setujui & Tugaskan</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircleIcon className="h-5 w-5" />
                                        <span>Tolak Permohonan</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RepairActionModal;
