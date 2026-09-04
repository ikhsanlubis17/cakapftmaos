import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
    ArrowLeftIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    FireIcon,
    ExclamationTriangleIcon,
    MapPinIcon,
    UserIcon,
    CalendarIcon,
    DocumentTextIcon,
    CameraIcon,
    WrenchScrewdriverIcon,
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    ArrowsPointingOutIcon,
    ShieldCheckIcon,
    XCircleIcon as XCircleIconSolid,
    CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/outline';

const RepairApprovalDetail = () => {
    const { id } = useParams({ strict: false });
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { apiClient } = useAuth();
    const queryClient = useQueryClient();

    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    
    // Lightbox State
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const { data: approval, isLoading: loading, error: queryError, refetch } = useQuery({
        queryKey: ['repair-approval', id],
        queryFn: async () => {
            const response = await apiClient.get(`/api/repair-approvals/${id}`);
            if (response.data?.success) return response.data.data;
            throw new Error('Gagal memuat detail persetujuan');
        },
        enabled: !!id,
        throwOnError: false,
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, notes }) => apiClient.post(`/api/repair-approvals/${id}/approve`, { supervisor_notes: notes }),
        onMutate: async ({ id, notes }) => {
            await queryClient.cancelQueries({ queryKey: ['repair-approval', id] });
            const previous = queryClient.getQueryData(['repair-approval', id]);
            queryClient.setQueryData(['repair-approval', id], (old) => ({ ...(old || {}), status: 'approved', admin_notes: notes }));
            return { previous };
        },
        onError: (err, vars, context) => {
            if (context?.previous) queryClient.setQueryData(['repair-approval', id], context.previous);
            console.error('Error approving:', err);
            showError(err?.response?.data?.message || 'Gagal memproses tindakan');
        },
        onSuccess: () => {
            showSuccess('Persetujuan berhasil disetujui');
            queryClient.invalidateQueries({ queryKey: ['repair-approvals'] });
            queryClient.invalidateQueries({ queryKey: ['repair-approvals-stats'] });
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['repair-approval', id] })
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, notes, rejectionReason }) => apiClient.post(`/api/repair-approvals/${id}/reject`, {
            supervisor_notes: notes,
            rejection_reason: rejectionReason
        }),
        onMutate: async ({ id, notes }) => {
            await queryClient.cancelQueries({ queryKey: ['repair-approval', id] });
            const previous = queryClient.getQueryData(['repair-approval', id]);
            queryClient.setQueryData(['repair-approval', id], (old) => ({ ...(old || {}), status: 'rejected', admin_notes: notes }));
            return { previous };
        },
        onError: (err, vars, context) => {
            if (context?.previous) queryClient.setQueryData(['repair-approval', id], context.previous);
            console.error('Error rejecting:', err);

            // Handle validation errors
            if (err?.response?.status === 422 && err?.response?.data?.errors) {
                setValidationErrors(err.response.data.errors);
            }

            showError(err?.response?.data?.message || 'Gagal memproses tindakan');
        },
        onSuccess: () => {
            showSuccess('Persetujuan berhasil ditolak');
            queryClient.invalidateQueries({ queryKey: ['repair-approvals'] });
            queryClient.invalidateQueries({ queryKey: ['repair-approvals-stats'] });
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['repair-approval', id] })
    });

    const handleAction = async () => {
        // Clear previous validation errors
        setValidationErrors({});

        // Validate supervisor notes (required for both approve and reject)
        if (!notes.trim() || notes.trim().length < 10) {
            setValidationErrors({
                supervisor_notes: ['Catatan supervisor wajib diisi minimal 10 karakter. Jelaskan alasan keputusan Anda.']
            });
            return;
        }

        // Validate rejection reason (required only for reject)
        if (actionType === 'reject' && !rejectionReason.trim()) {
            setValidationErrors({
                rejection_reason: ['Alasan penolakan wajib dipilih']
            });
            return;
        }

        setSubmitting(true);
        try {
            if (actionType === 'approve') {
                approveMutation.mutate({ id, notes: notes.trim() });
            } else if (actionType === 'reject') {
                rejectMutation.mutate({ id, notes: notes.trim(), rejectionReason });
            }

            setShowActionModal(false);
            setNotes('');
            setRejectionReason('');
            setActionType(null);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusConfig = (status) => {
        const configs = {
            pending: {
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                icon: ClockIcon,
                text: 'Menunggu Persetujuan',
                description: 'Perlu ditinjau dan disetujui/ditolak'
            },
            approved: {
                color: 'bg-green-100 text-green-800 border-green-200',
                icon: CheckCircleIcon,
                text: 'Disetujui',
                description: 'Teknisi dapat melakukan perbaikan'
            },
            rejected: {
                color: 'bg-red-100 text-red-800 border-red-200',
                icon: XCircleIcon,
                text: 'Ditolak',
                description: 'Perbaikan tidak disetujui'
            },
            completed: {
                color: 'bg-blue-100 text-blue-800 border-blue-200',
                icon: CheckCircleIcon,
                text: 'Selesai',
                description: 'Perbaikan telah selesai'
            }
        };
        return configs[status] || configs.pending;
    };

    const getConditionConfig = (condition) => {
        const configs = {
            good: { color: 'bg-green-100 text-green-800', text: 'Baik' },
            needs_repair: { color: 'bg-yellow-100 text-yellow-800', text: 'Perlu Perbaikan' }
        };
        return configs[condition] || configs.good;
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md mx-auto">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-[#11468F] mx-auto mb-4"></div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Memuat Detail...</h2>
                    <p className="text-slate-500 text-sm">Sedang memuat detail persetujuan perbaikan</p>
                </div>
            </div>
        );
    }

    if (queryError || !approval) {
        return (
            <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md mx-auto bg-white border border-slate-200 rounded-[6px] p-8 shadow-sm">
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-[6px] bg-rose-50 text-rose-600 mb-4">
                        <ExclamationTriangleIcon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Terjadi Kesalahan</h3>
                    <p className="text-slate-600 mb-6 text-sm">{queryError?.message || 'Data tidak ditemukan'}</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => refetch()}
                            className="w-full bg-[#11468F] hover:bg-[#0d3873] text-white border border-transparent font-bold px-4 py-2.5 rounded-[6px] shadow-sm transition-colors text-sm"
                        >
                            Coba Lagi
                        </button>
                        <button
                            onClick={() => navigate({ to: '/repair-approvals' })}
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-4 py-2.5 rounded-[6px] transition-colors text-sm"
                        >
                            Kembali ke Daftar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(approval.status);
    const StatusIcon = statusConfig.icon;

    const openLightbox = (photoUrl, caption) => {
        if (!photoUrl) return;
        setSelectedPhoto({ url: photoUrl, caption });
        setLightboxOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => window.history.back()}
                            className="p-2 hover:bg-slate-100 rounded-[6px] transition-colors text-slate-600 hover:text-slate-900"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">Detail Persetujuan Perbaikan</h1>
                            <p className="text-xs text-slate-500">APAR {approval.inspection?.apar?.serial_number || '-'}</p>
                        </div>
                    </div>
                    {/* Status Badge in Header */}
                    <div className={`px-2.5 py-1 rounded-[3px] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                        approval.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                        approval.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        approval.status === 'rejected' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                        'bg-slate-100 text-slate-800 border-slate-300'
                    }`}>
                        <StatusIcon className="h-4 w-4" />
                        <span>{
                             approval.status === 'pending' ? 'Menunggu Review' :
                             approval.status === 'approved' ? 'Disetujui' :
                             approval.status === 'rejected' ? 'Ditolak' : 
                             approval.status
                        }</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column: Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* APAR Information Card */}
                        <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-[4px] bg-[#041562] text-white flex items-center justify-center">
                                    <FireIcon className="h-4 w-4" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase">Informasi APAR</h3>
                            </div>
                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nomor Seri</p>
                                    <p className="font-bold text-slate-900 text-base font-mono">{approval.inspection?.apar?.serial_number || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Lokasi</p>
                                    <div className="flex items-start gap-2">
                                        <MapPinIcon className="h-4 w-4 text-slate-400 mt-0.5" />
                                        <p className="font-medium text-slate-800 text-sm">{approval.inspection?.apar?.location_name || '-'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tipe APAR</p>
                                    <p className="font-medium text-slate-800 text-sm">{approval.inspection?.apar?.type || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kapasitas</p>
                                    <p className="font-medium text-slate-800 text-sm">{approval.inspection?.apar?.capacity || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Inspection Details Card */}
                        <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-[4px] bg-[#041562] text-white flex items-center justify-center">
                                    <DocumentTextIcon className="h-4 w-4" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase">Detail Inspeksi</h3>
                            </div>
                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Inspektor</p>
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-slate-400" />
                                        <p className="font-medium text-slate-800 text-sm">{approval.inspection?.user?.name || '-'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tanggal Inspeksi</p>
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-slate-400" />
                                        <p className="font-medium text-slate-800 text-sm">{
                                            approval.inspection?.created_at 
                                            ? new Date(approval.inspection.created_at).toLocaleDateString('id-ID', {
                                                weekday: 'long', 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric'
                                              })
                                            : '-'
                                        }</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Damages List */}
                        {approval.inspection?.inspection_damages && approval.inspection.inspection_damages.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                                    Daftar Kerusakan
                                </h3>
                                
                                {approval.inspection.inspection_damages.map((damage, index) => (
                                    <div key={index} className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row gap-4 hover:border-slate-300 transition-colors">
                                        {/* Photos Side */}
                                        <div className="flex gap-3 md:w-1/3">
                                            {damage.damage_photo_url ? (
                                                <div 
                                                    className="relative aspect-square w-full rounded-[4px] overflow-hidden cursor-pointer group bg-slate-100 border border-slate-200"
                                                    onClick={() => openLightbox(damage.damage_photo_url, `Kerusakan: ${damage.damage_category?.name}`)}
                                                >
                                                    <img src={damage.damage_photo_url} alt="Rusak" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                        <ArrowsPointingOutIcon className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-all" />
                                                    </div>
                                                    <div className="absolute bottom-1.5 left-1.5 bg-rose-600 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-[3px] shadow-sm">
                                                        Rusak
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="aspect-square w-full rounded-[4px] bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                                                    No Photo
                                                </div>
                                            )}
                                            
                                            {damage.repair_photo_url && (
                                                <div 
                                                    className="relative aspect-square w-full rounded-[4px] overflow-hidden cursor-pointer group bg-slate-100 border border-emerald-200"
                                                    onClick={() => openLightbox(damage.repair_photo_url, `Perbaikan: ${damage.damage_category?.name}`)}
                                                >
                                                    <img src={damage.repair_photo_url} alt="Perbaikan" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                        <ArrowsPointingOutIcon className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-all" />
                                                    </div>
                                                    <div className="absolute bottom-1.5 left-1.5 bg-emerald-600 text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-[3px] shadow-sm">
                                                        Diperbaiki
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info Side */}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-slate-900 text-sm">{damage.damage_category?.name || 'Uncategorized'}</h4>
                                                <span className={`px-2 py-0.5 rounded-[3px] text-[10px] font-bold uppercase tracking-wider border ${
                                                    damage.severity === 'high' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                                                    damage.severity === 'medium' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                                    'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                }`}>
                                                    {damage.severity}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-3 rounded-[4px] border border-slate-200">
                                                {damage.notes || 'Tidak ada catatan tambahan.'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Photo Gallery (Grid) */}
                        <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-[4px] bg-[#041562] text-white flex items-center justify-center">
                                    <CameraIcon className="h-4 w-4" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase">Galeri Inspeksi</h3>
                            </div>
                            <div className="p-5">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Main APAR Photo */}
                                    {approval.inspection.photo_url && (
                                        <div 
                                            className="relative aspect-square rounded-[4px] overflow-hidden cursor-pointer group border border-slate-200"
                                            onClick={() => openLightbox(approval.inspection.photo_url, 'Foto Kondisi APAR')}
                                        >
                                            <img src={approval.inspection.photo_url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                <ArrowsPointingOutIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-all" />
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-4">
                                                <p className="text-white text-xs font-semibold">Foto APAR</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Selfie */}
                                    {approval.inspection.selfie_url && (
                                        <div 
                                            className="relative aspect-square rounded-[4px] overflow-hidden cursor-pointer group border border-slate-200"
                                            onClick={() => openLightbox(approval.inspection.selfie_url, 'Foto Selfie')}
                                        >
                                            <img src={approval.inspection.selfie_url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                <ArrowsPointingOutIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-all" />
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-4">
                                                <p className="text-white text-xs font-semibold">Foto Selfie</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Damage Photos Summary */}
                                     {approval.inspection?.inspection_damages?.map((damage, idx) => (
                                        damage.damage_photo_url && (
                                            <div 
                                                key={`dmg-${idx}`}
                                                className="relative aspect-square rounded-[4px] overflow-hidden cursor-pointer group border border-rose-200 w-full"
                                                onClick={() => openLightbox(damage.damage_photo_url, `Kerusakan: ${damage.damage_category?.name}`)}
                                            >
                                                <img src={damage.damage_photo_url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                    <ArrowsPointingOutIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-all" />
                                                </div>
                                                 <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1">
                                                    <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] shadow-sm uppercase">
                                                        RUSAK
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* Timeline / Status History */}
                         <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-5">
                            <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase mb-5 flex items-center gap-2">
                                <ClockIcon className="h-4 w-4 text-slate-500" />
                                Riwayat Status
                            </h3>
                            <div className="relative pl-4 border-l-2 border-slate-200 space-y-6">
                                {/* Current Status */}
                                <div className="relative">
                                    <div className={`absolute -left-[21px] h-3 w-3 rounded-[2px] ring-4 ring-white ${
                                        approval.status === 'pending' ? 'bg-amber-400' :
                                        approval.status === 'approved' ? 'bg-emerald-500' :
                                        approval.status === 'rejected' ? 'bg-rose-500' : 'bg-slate-400'
                                    }`}></div>
                                    <p className="text-sm font-bold text-slate-900 capitalize">
                                        {approval.status === 'pending' ? 'Menunggu Persetujuan' : 
                                         approval.status === 'approved' ? 'Disetujui' : 
                                         approval.status === 'rejected' ? 'Ditolak' : approval.status}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">Sekarang</p>
                                </div>

                                {/* Created At */}
                                <div className="relative">
                                    <div className="absolute -left-[21px] h-3 w-3 rounded-[2px] bg-[#041562] ring-4 ring-white"></div>
                                    <p className="text-sm font-semibold text-slate-900">Inspeksi Selesai</p>
                                    <div className="text-xs text-slate-500 mt-1 gap-1 flex flex-col">
                                        <span>{approval.inspection?.user?.name}</span>
                                        <span>{
                                            approval.inspection?.created_at 
                                            ? new Date(approval.inspection.created_at).toLocaleDateString()
                                            : '-'
                                        }</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Approver Info (if decided) */}
                        {approval.approver && (
                            <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-5">
                                <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase mb-4 flex items-center gap-2">
                                    <ShieldCheckIcon className="h-4 w-4 text-slate-500" />
                                    Reviewer
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-[4px] bg-[#041562] text-white flex items-center justify-center font-bold text-sm">
                                        {approval.approver.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{approval.approver.name}</p>
                                        <p className="text-xs text-slate-500 capitalize">{approval.approver.role}</p>
                                    </div>
                                </div>
                                {approval.notes && (
                                    <div className="mt-4 p-3 bg-slate-50 rounded-[4px] text-xs text-slate-600 italic border border-slate-200">
                                        "{approval.notes}"
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Card (Only if Pending) */}
                        {approval.status === 'pending' && (
                             <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-5 sticky top-24">
                                <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase mb-2">Tindakan Diperlukan</h3>
                                <p className="text-xs text-slate-500 mb-5 leading-relaxed">Sebagai Supervisor, tinjau hasil inspeksi ini dan berikan keputusan.</p>
                                
                                <div className="space-y-3">
                                    <button
                                        onClick={() => {
                                            setActionType('approve');
                                            setShowActionModal(true);
                                        }}
                                        className="w-full py-2.5 px-4 bg-[#11468F] hover:bg-[#0d3873] text-white border border-transparent rounded-[6px] font-bold shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        <CheckCircleIconSolid className="h-4 w-4" />
                                        Setujui Perbaikan
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActionType('reject');
                                            setShowActionModal(true);
                                        }}
                                        className="w-full py-2.5 px-4 bg-[#DA1212] hover:bg-red-700 text-white rounded-[6px] font-bold transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        <XCircleIconSolid className="h-4 w-4" />
                                        Tolak
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            {showActionModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setShowActionModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="relative inline-block align-bottom bg-white rounded-[6px] text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-slate-200">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-[6px] sm:mx-0 sm:h-10 sm:w-10 ${
                                        actionType === 'approve' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                    }`}>
                                        {actionType === 'approve' ? (
                                            <CheckCircleIcon className="h-6 w-6" aria-hidden="true" />
                                        ) : (
                                            <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
                                        )}
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-base font-bold text-slate-900" id="modal-title">
                                            {actionType === 'approve' ? 'Konfirmasi Persetujuan' : 'Tolak Permintaan'}
                                        </h3>
                                        <div className="mt-2">
                                             <p className="text-xs text-slate-500 mb-4">
                                                {actionType === 'approve' 
                                                    ? 'Anda yakin ingin menyetujui permintaan perbaikan ini?' 
                                                    : 'Mohon berikan alasan penolakan untuk permintaan ini.'}
                                            </p>
                                            
                                            {actionType === 'reject' && (
                                                <div className="mb-4">
                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Alasan Penolakan</label>
                                                    <select
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        className="w-full border border-slate-300 rounded-[6px] p-2.5 text-sm focus:ring-1 focus:ring-[#11468F] focus:border-[#11468F] outline-none"
                                                    >
                                                        <option value="">Pilih alasan...</option>
                                                        <option value="Data tidak lengkap">Data tidak lengkap</option>
                                                        <option value="Foto buram">Foto buram</option>
                                                        <option value="Lainnya">Lainnya</option>
                                                    </select>
                                                </div>
                                            )}

                                            <textarea
                                                rows={4}
                                                className={`block w-full focus:ring-1 focus:ring-[#11468F] focus:border-[#11468F] text-sm border ${
                                                    validationErrors.supervisor_notes ? 'border-rose-300' : 'border-slate-300'
                                                } rounded-[6px] p-3 outline-none`}
                                                placeholder={actionType === 'approve' ? "Catatan tambahan (opsional)..." : "Wajib isi alasan penolakan..."}
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                            />
                                            {validationErrors.supervisor_notes && (
                                                <p className="text-xs text-rose-600 mt-1.5 flex items-center space-x-1 font-medium">
                                                    <XCircleIcon className="h-4 w-4 flex-shrink-0" />
                                                    <span>{validationErrors.supervisor_notes[0]}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={handleAction}
                                    disabled={submitting}
                                    className={`w-full inline-flex justify-center rounded-[6px] px-4 py-2 text-sm font-bold shadow-sm sm:w-auto transition-colors ${
                                        actionType === 'approve' 
                                            ? 'bg-[#11468F] hover:bg-[#0d3873] text-white' 
                                            : 'bg-[#DA1212] hover:bg-red-700 text-white'
                                    } ${submitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    {submitting ? 'Memproses...' : (actionType === 'approve' ? 'Ya, Setujui' : 'Tolak')}
                                </button>
                                <button
                                    type="button"
                                    className="mt-2 sm:mt-0 w-full inline-flex justify-center rounded-[6px] border border-slate-300 px-4 py-2 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto transition-colors"
                                    onClick={() => {
                                        setShowActionModal(false);
                                        setValidationErrors({});
                                    }}
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Modal */}
            {lightboxOpen && selectedPhoto && (
                <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 transition-all" onClick={() => setLightboxOpen(false)}>
                    <div className="relative w-full max-w-6xl h-full flex flex-col items-center justify-center">
                        <button
                            onClick={() => setLightboxOpen(false)}
                            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-[6px] backdrop-blur-md transition-all z-50"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        
                        <img
                            src={selectedPhoto.url}
                            alt={selectedPhoto.caption || 'Full size'}
                            className="max-w-full max-h-[85vh] object-contain rounded-[6px] shadow-2xl border border-slate-700"
                            onClick={(e) => e.stopPropagation()} 
                        />
                        
                        {selectedPhoto.caption && (
                            <div className="absolute bottom-8 bg-slate-900/80 backdrop-blur-md px-5 py-2 rounded-[6px] border border-slate-700">
                                <p className="text-white text-sm font-semibold">{selectedPhoto.caption}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RepairApprovalDetail;



