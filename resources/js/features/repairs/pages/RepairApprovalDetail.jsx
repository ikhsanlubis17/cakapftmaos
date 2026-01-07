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
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md mx-auto">
                    <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-red-600 mx-auto mb-6"></div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-3">Memuat Detail...</h2>
                    <p className="text-gray-600 text-lg">Sedang memuat detail persetujuan perbaikan</p>
                </div>
            </div>
        );
    }

    if (queryError || !approval) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md mx-auto">
                    <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-red-100 mb-6">
                        <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-3">Terjadi Kesalahan</h3>
                    <p className="text-gray-600 mb-6 text-lg">{queryError?.message || 'Data tidak ditemukan'}</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => refetch()}
                            className="w-full bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium text-lg"
                        >
                            Coba Lagi
                        </button>
                        <button
                            onClick={() => navigate({ to: '/repair-approvals' })}
                            className="w-full bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors font-medium text-lg"
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
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => window.history.back()}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Detail Persetujuan Perbaikan</h1>
                            <p className="text-xs text-gray-500">APAR {approval.inspection?.apar?.serial_number || '-'}</p>
                        </div>
                    </div>
                    {/* Status Badge in Header */}
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                        approval.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        approval.status === 'approved' ? 'bg-green-100 text-green-800' :
                        approval.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="capitalize">{
                             approval.status === 'pending' ? 'Menunggu Review' :
                             approval.status === 'approved' ? 'Disetujui' :
                             approval.status === 'rejected' ? 'Ditolak' : 
                             approval.status
                        }</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* APAR Information Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                                <FireIcon className="h-5 w-5 text-red-500" />
                                <h3 className="font-semibold text-gray-900">Informasi APAR</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Nomor Seri</p>
                                    <p className="font-semibold text-gray-900 text-lg">{approval.inspection?.apar?.serial_number || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Lokasi</p>
                                    <div className="flex items-start gap-2">
                                        <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <p className="font-medium text-gray-900">{approval.inspection?.apar?.location_name || '-'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Tipe APAR</p>
                                    <p className="font-medium text-gray-900">{approval.inspection?.apar?.type || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Kapasitas</p>
                                    <p className="font-medium text-gray-900">{approval.inspection?.apar?.capacity || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Inspection Details Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                                <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                                <h3 className="font-semibold text-gray-900">Detail Inspeksi</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Inspektor</p>
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-gray-400" />
                                        <p className="font-medium text-gray-900">{approval.inspection?.user?.name || '-'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Tanggal Inspeksi</p>
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                                        <p className="font-medium text-gray-900">{
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
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                                    Daftar Kerusakan
                                </h3>
                                
                                {approval.inspection.inspection_damages.map((damage, index) => (
                                    <div key={index} className="bg-white rounded-2xl shadow-sm border border-red-100 p-5 flex flex-col md:flex-row gap-5">
                                        {/* Photos Side */}
                                        <div className="flex gap-3 md:w-1/3">
                                            {damage.damage_photo_url ? (
                                                <div 
                                                    className="relative aspect-square w-full rounded-xl overflow-hidden cursor-pointer group bg-gray-100 border border-gray-200"
                                                    onClick={() => openLightbox(damage.damage_photo_url, `Kerusakan: ${damage.damage_category?.name}`)}
                                                >
                                                    <img src={damage.damage_photo_url} alt="Rusak" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                        <ArrowsPointingOutIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all" />
                                                    </div>
                                                    <div className="absolute bottom-2 left-2 bg-red-600/90 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">
                                                        Rusak
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="aspect-square w-full rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                                    No Photo
                                                </div>
                                            )}
                                            
                                            {damage.repair_photo_url && (
                                                <div 
                                                    className="relative aspect-square w-full rounded-xl overflow-hidden cursor-pointer group bg-gray-100 border border-green-200"
                                                    onClick={() => openLightbox(damage.repair_photo_url, `Perbaikan: ${damage.damage_category?.name}`)}
                                                >
                                                    <img src={damage.repair_photo_url} alt="Perbaikan" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                        <ArrowsPointingOutIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all" />
                                                    </div>
                                                    <div className="absolute bottom-2 left-2 bg-green-600/90 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">
                                                        Diperbaiki
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info Side */}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-gray-900">{damage.damage_category?.name || 'Uncategorized'}</h4>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                                    damage.severity === 'high' ? 'bg-red-100 text-red-800' :
                                                    damage.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    {damage.severity}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                {damage.notes || 'Tidak ada catatan tambahan.'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Photo Gallery (Grid) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                                <CameraIcon className="h-5 w-5 text-purple-500" />
                                <h3 className="font-semibold text-gray-900">Galeri Inspeksi</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Main APAR Photo */}
                                    {approval.inspection.photo_url && (
                                        <div 
                                            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-gray-200"
                                            onClick={() => openLightbox(approval.inspection.photo_url, 'Foto Kondisi APAR')}
                                        >
                                            <img src={approval.inspection.photo_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                <ArrowsPointingOutIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all" />
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-6">
                                                <p className="text-white text-xs font-medium">Foto APAR</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Selfie */}
                                    {approval.inspection.selfie_url && (
                                        <div 
                                            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-gray-200"
                                            onClick={() => openLightbox(approval.inspection.selfie_url, 'Foto Selfie')}
                                        >
                                            <img src={approval.inspection.selfie_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                <ArrowsPointingOutIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all" />
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-6">
                                                <p className="text-white text-xs font-medium">Foto Selfie</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Damage Photos Summary */}
                                     {approval.inspection?.inspection_damages?.map((damage, idx) => (
                                        damage.damage_photo_url && (
                                            <div 
                                                key={`dmg-${idx}`}
                                                className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-red-200 w-full"
                                                onClick={() => openLightbox(damage.damage_photo_url, `Kerusakan: ${damage.damage_category?.name}`)}
                                            >
                                                <img src={damage.damage_photo_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                    <ArrowsPointingOutIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all" />
                                                </div>
                                                 <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
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
                         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <ClockIcon className="h-5 w-5 text-gray-400" />
                                Riwayat Status
                            </h3>
                            <div className="relative pl-4 border-l-2 border-gray-100 space-y-8">
                                {/* Current Status */}
                                <div className="relative">
                                    <div className={`absolute -left-[21px] h-3 w-3 rounded-full ring-4 ring-white ${
                                        approval.status === 'pending' ? 'bg-yellow-400' :
                                        approval.status === 'approved' ? 'bg-green-500' :
                                        approval.status === 'rejected' ? 'bg-red-500' : 'bg-gray-400'
                                    }`}></div>
                                    <p className="text-sm font-semibold text-gray-900 capitalize">
                                        {approval.status === 'pending' ? 'Menunggu Persetujuan' : 
                                         approval.status === 'approved' ? 'Disetujui' : 
                                         approval.status === 'rejected' ? 'Ditolak' : approval.status}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Sekarang</p>
                                </div>

                                {/* Created At */}
                                <div className="relative">
                                    <div className="absolute -left-[21px] h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white"></div>
                                    <p className="text-sm font-medium text-gray-900">Inspeksi Selesai</p>
                                    <div className="text-xs text-gray-500 mt-1 gap-1 flex flex-col">
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
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                                    Reviewer
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                        {approval.approver.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{approval.approver.name}</p>
                                        <p className="text-xs text-gray-500 capitalize">{approval.approver.role}</p>
                                    </div>
                                </div>
                                {approval.notes && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600 italic border border-gray-100">
                                        "{approval.notes}"
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Card (Only if Pending) */}
                        {approval.status === 'pending' && (
                             <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
                                <h3 className="font-bold text-gray-900 mb-4">Tindakan Diperlukan</h3>
                                <p className="text-sm text-gray-500 mb-6">Sebagai Supervisor, tinjau hasil inspeksi ini dan berikan keputusan.</p>
                                
                                <div className="space-y-3">
                                    <button
                                        onClick={() => {
                                            setActionType('approve');
                                            setShowActionModal(true);
                                        }}
                                        className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircleIconSolid className="h-5 w-5" />
                                        Setujui Perbaikan
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActionType('reject');
                                            setShowActionModal(true);
                                        }}
                                        className="w-full py-3 px-4 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircleIconSolid className="h-5 w-5" />
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
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowActionModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                                        actionType === 'approve' ? 'bg-green-100' : 'bg-red-100'
                                    }`}>
                                        {actionType === 'approve' ? (
                                            <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                                        ) : (
                                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                                        )}
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                            {actionType === 'approve' ? 'Konfirmasi Persetujuan' : 'Tolak Permintaan'}
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 mb-4">
                                                {actionType === 'approve' 
                                                    ? 'Anda yakin ingin menyetujui permintaan perbaikan ini?' 
                                                    : 'Mohon berikan alasan penolakan untuk permintaan ini.'}
                                            </p>
                                            
                                            {actionType === 'reject' && (
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Penolakan</label>
                                                    <select
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
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
                                                className={`shadow-sm block w-full focus:ring-red-500 focus:border-red-500 sm:text-sm border ${
                                                    validationErrors.supervisor_notes ? 'border-red-300' : 'border-gray-300'
                                                } rounded-xl p-3`}
                                                placeholder={actionType === 'approve' ? "Catatan tambahan (opsional)..." : "Wajib isi alasan penolakan..."}
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                            />
                                            {validationErrors.supervisor_notes && (
                                                <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                                                    <XCircleIcon className="h-4 w-4" />
                                                    <span>{validationErrors.supervisor_notes[0]}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                                <button
                                    type="button"
                                    onClick={handleAction}
                                    disabled={submitting}
                                    className={`w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                                        actionType === 'approve' 
                                            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                                            : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                    } ${submitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    {submitting ? 'Memproses...' : (actionType === 'approve' ? 'Ya, Setujui' : 'Tolak')}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
                <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 transition-all" onClick={() => setLightboxOpen(false)}>
                    <div className="relative w-full max-w-6xl h-full flex flex-col items-center justify-center">
                        <button
                            onClick={() => setLightboxOpen(false)}
                            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-all z-50"
                        >
                            <XMarkIcon className="h-8 w-8" />
                        </button>
                        
                        <img
                            src={selectedPhoto.url}
                            alt={selectedPhoto.caption || 'Full size'}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()} 
                        />
                        
                        {selectedPhoto.caption && (
                            <div className="absolute bottom-8 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                                <p className="text-white text-lg font-medium">{selectedPhoto.caption}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RepairApprovalDetail;



