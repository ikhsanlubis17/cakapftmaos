import React, { useState } from 'react';
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
    XMarkIcon,
    ArrowsPointingOutIcon,
    ShieldCheckIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { formatStorageUrl } from '@/utils/imageUrl';
import { formatDate } from '@/utils/dateUtils';
import RepairActionModal from '../components/RepairActionModal';

const RepairApprovalDetail = () => {
    const { id } = useParams({ strict: false });
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { apiClient, user } = useAuth();
    const queryClient = useQueryClient();

    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState('approve');
    const [validationErrors, setValidationErrors] = useState(null);
    
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

    // Fetch active technicians list for assignment (Supervisor/Admin only)
    const { data: teknisiList = [] } = useQuery({
        queryKey: ['users', 'teknisi', 'active'],
        queryFn: async () => {
            const res = await apiClient.get('/api/users?role=teknisi&is_active=true');
            return res.data?.data || res.data || [];
        },
        enabled: !!id && (user?.role === 'admin' || user?.role === 'supervisor'),
        staleTime: 1000 * 60 * 5,
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, notes, assignedTeknisiId, scheduleDate, scheduleTime }) => apiClient.post(`/api/repair-approvals/${id}/approve`, { 
            supervisor_notes: notes,
            assigned_teknisi_id: assignedTeknisiId,
            schedule_date: scheduleDate,
            schedule_time: scheduleTime,
        }),
        onMutate: async ({ id, notes }) => {
            await queryClient.cancelQueries({ queryKey: ['repair-approval', id] });
            const previous = queryClient.getQueryData(['repair-approval', id]);
            queryClient.setQueryData(['repair-approval', id], (old) => ({ ...(old || {}), status: 'approved', admin_notes: notes, supervisor_notes: notes }));
            return { previous };
        },
        onError: (err, vars, context) => {
            if (context?.previous) queryClient.setQueryData(['repair-approval', id], context.previous);
            console.error('Error approving:', err);
            if (err?.response?.status === 422 && err?.response?.data?.errors) {
                setValidationErrors(err.response.data.errors);
            }
            showError(err?.response?.data?.message || 'Gagal memproses tindakan');
        },
        onSuccess: () => {
            showSuccess('Persetujuan berhasil disetujui dan teknisi telah ditugaskan');
            queryClient.invalidateQueries({ queryKey: ['repair-approvals'] });
            queryClient.invalidateQueries({ queryKey: ['repair-approvals-stats'] });
            setShowActionModal(false);
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
            setShowActionModal(false);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['repair-approval', id] })
    });

    const handleActionConfirm = async (formData) => {
        if (actionType === 'approve') {
            await approveMutation.mutateAsync({ 
                id, 
                notes: formData.notes,
                assignedTeknisiId: formData.assignedTeknisiId,
                scheduleDate: formData.scheduleDate,
                scheduleTime: formData.scheduleTime
            });
        } else {
            await rejectMutation.mutateAsync({
                id,
                notes: formData.notes,
                rejectionReason: formData.rejectionReason
            });
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
                            onClick={() => navigate({ to: user?.role === 'teknisi' ? '/my-repairs' : '/repair-approvals' })}
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-4 py-2.5 rounded-[6px] transition-colors text-sm cursor-pointer"
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
        setSelectedPhoto({ url: formatStorageUrl(photoUrl), caption });
        setLightboxOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => {
                                if (window.history.length > 1) {
                                    window.history.back();
                                } else {
                                    navigate({ to: user?.role === 'teknisi' ? '/my-repairs' : '/repair-approvals' });
                                }
                            }}
                            className="p-2 hover:bg-slate-100 rounded-[6px] transition-colors text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">
                                {user?.role === 'teknisi' ? 'Detail Tugas Perbaikan' : 'Detail Persetujuan Perbaikan'}
                            </h1>
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
                                        <p className="font-medium text-slate-800 text-sm">
                                            {formatDate(approval.inspection?.created_at, {
                                                weekday: 'long',
                                                month: 'long',
                                            })}
                                        </p>
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
                                                    <img src={formatStorageUrl(damage.damage_photo_url)} alt="Rusak" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
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
                                                    <img src={formatStorageUrl(damage.repair_photo_url)} alt="Perbaikan" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
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
                                            <img src={formatStorageUrl(approval.inspection.photo_url)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
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
                                            <img src={formatStorageUrl(approval.inspection.selfie_url)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
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
                                                <img src={formatStorageUrl(damage.damage_photo_url)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
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

                        {/* Laporan Hasil Perbaikan Teknisi (Jika sudah dilaporkan) */}
                        {(approval.repair_report || approval.repairReport) && (() => {
                            const report = approval.repair_report || approval.repairReport;
                            return (
                                <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="px-5 py-3 border-b border-slate-200 bg-blue-50/60 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-[4px] bg-[#11468F] text-white flex items-center justify-center">
                                                <WrenchScrewdriverIcon className="h-4 w-4" />
                                            </div>
                                            <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase">
                                                Laporan Hasil Perbaikan Lapangan
                                            </h3>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${
                                            report.status === 'pending_review' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                            report.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                            report.status === 'needs_rework' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                            'bg-slate-100 text-slate-700 border-slate-200'
                                        }`}>
                                            {report.status === 'pending_review' ? 'Menunggu Review SPV' :
                                             report.status === 'approved' ? 'Telah Disetujui SPV' :
                                             report.status === 'needs_rework' ? 'Perlu Perbaikan Ulang' : report.status}
                                        </span>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        {/* Deskripsi Tindakan */}
                                        <div className="bg-slate-50 p-3.5 rounded-[4px] border border-slate-200">
                                            <span className="text-xs font-bold text-[#041562] block mb-1">Catatan Tindakan Teknisi:</span>
                                            <p className="text-sm text-slate-800 leading-relaxed">{report.repair_description}</p>
                                            <div className="mt-2.5 pt-2 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap gap-4">
                                                <span>Pelapor: <strong className="text-slate-700">{report.reporter?.name || 'Teknisi'}</strong></span>
                                                <span>Selesai: <strong className="text-slate-700">{report.repair_completed_at ? new Date(report.repair_completed_at).toLocaleString('id-ID') : '-'}</strong></span>
                                                {report.repair_lat && (
                                                    <span>GPS: <strong className="font-mono text-slate-700">{report.repair_lat}, {report.repair_lng}</strong></span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Perbandingan Foto Sebelum vs Sesudah */}
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Dokumentasi Foto Fisik</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {report.before_photo_url && (
                                                    <div
                                                        className="relative aspect-video rounded-[4px] overflow-hidden cursor-pointer group border border-slate-200 bg-black"
                                                        onClick={() => openLightbox(report.before_photo_url, 'Foto Sebelum Perbaikan')}
                                                    >
                                                        <img src={formatStorageUrl(report.before_photo_url)} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                        <div className="absolute top-2 left-2 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                                                            SEBELUM PERBAIKAN
                                                        </div>
                                                    </div>
                                                )}
                                                {report.after_photo_url && (
                                                    <div
                                                        className="relative aspect-video rounded-[4px] overflow-hidden cursor-pointer group border border-slate-200 bg-black"
                                                        onClick={() => openLightbox(report.after_photo_url, 'Foto Setelah Perbaikan')}
                                                    >
                                                        <img src={formatStorageUrl(report.after_photo_url)} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                        <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                                                            SELESAI PERBAIKAN
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Tautan Review jika masih pending (Khusus Supervisor / Admin) */}
                                        {report.status === 'pending_review' && (user?.role === 'supervisor' || user?.role === 'admin') && (
                                            <div className="pt-2 flex justify-end">
                                                <button
                                                    onClick={() => navigate({ to: '/repair-reports/review' })}
                                                    className="px-4 py-2 bg-[#11468F] hover:bg-[#0d3873] text-white text-xs font-bold uppercase tracking-wider rounded-[4px] shadow-sm flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                                                >
                                                    <CheckCircleIcon className="h-4 w-4" />
                                                    Buka Halaman Review Laporan
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

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
                                        <span>{formatDate(approval.inspection?.created_at)}</span>
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

                        {/* Assigned Technician Card (if approved & assigned) */}
                        {approval.assigned_teknisi && (
                            <div className="bg-white rounded-[6px] shadow-sm border border-blue-200 p-5 bg-blue-50/20">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase flex items-center gap-2">
                                        <WrenchScrewdriverIcon className="h-4 w-4 text-[#11468F]" />
                                        Teknisi Ditugaskan
                                    </h3>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-blue-100 text-[#11468F] border border-blue-200">
                                        Penugasan SPV
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-[4px] bg-[#11468F] text-white flex items-center justify-center font-bold text-sm">
                                        {approval.assigned_teknisi.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{approval.assigned_teknisi.name}</p>
                                        <p className="text-xs text-slate-500">{approval.assigned_teknisi.email || 'Teknisi Lapangan'}</p>
                                    </div>
                                </div>
                                {approval.supervisor_notes && (
                                    <div className="mt-3.5 p-3 bg-white rounded-[4px] text-xs text-slate-700 border border-slate-200 shadow-2xs">
                                        <span className="font-bold text-[#041562] block mb-1">Instruksi Kerja Supervisor:</span>
                                        <p className="leading-relaxed text-slate-600">{approval.supervisor_notes}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Card: Supervisor/Admin Decision (Pending Status) */}
                        {approval.status === 'pending' && (user?.role === 'supervisor' || user?.role === 'admin') && (
                             <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 p-5 sticky top-24">
                                <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase mb-2">Tindakan Diperlukan</h3>
                                <p className="text-xs text-slate-500 mb-5 leading-relaxed">Sebagai Supervisor, tinjau hasil inspeksi ini, tentukan penugasan teknisi dan jadwal perbaikan.</p>
                                
                                <div className="space-y-3">
                                    <button
                                        onClick={() => {
                                            setActionType('approve');
                                            setShowActionModal(true);
                                        }}
                                        className="w-full py-2.5 px-4 bg-[#11468F] hover:bg-[#0d3873] text-white border border-transparent rounded-[6px] font-bold shadow-sm transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                                    >
                                        <CheckCircleIcon className="h-4 w-4" />
                                        Setujui & Tugaskan Teknisi
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActionType('reject');
                                            setShowActionModal(true);
                                        }}
                                        className="w-full py-2.5 px-4 bg-[#DA1212] hover:bg-red-700 text-white rounded-[6px] font-bold transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                                    >
                                        <XCircleIcon className="h-4 w-4" />
                                        Tolak Permintaan
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Action Card: Status Info for Teknisi when Pending */}
                        {approval.status === 'pending' && user?.role === 'teknisi' && (
                            <div className="bg-white rounded-[6px] shadow-sm border border-amber-200 p-5 bg-amber-50/20">
                                <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase mb-2 flex items-center gap-2">
                                    <ClockIcon className="h-4 w-4 text-amber-600" />
                                    Menunggu Evaluasi Supervisor
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Permohonan perbaikan tabung APAR ini sedang dalam antrean evaluasi dan disposisi teknisi oleh Supervisor operasional.
                                </p>
                            </div>
                        )}

                        {/* Action Card: Teknisi Next Steps when Approved */}
                        {approval.status === 'approved' && user?.role === 'teknisi' && (
                            <>
                                {!approval.repair_report ? (
                                    <div className="bg-white rounded-[6px] shadow-sm border border-blue-200 p-5 bg-blue-50/20 sticky top-24">
                                        <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase mb-2 flex items-center gap-2">
                                            <WrenchScrewdriverIcon className="h-4 w-4 text-[#11468F]" />
                                            Tindakan Teknisi
                                        </h3>
                                        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                                            Perbaikan telah disetujui. Lakukan perbaikan fisik di lokasi APAR sesuai instruksi Supervisor dan unggah bukti foto perbaikan.
                                        </p>
                                        <button
                                            onClick={() => navigate({ to: `/repair-report/${approval.id}` })}
                                            className="w-full py-2.5 px-4 bg-[#11468F] hover:bg-[#0d3873] text-white rounded-[6px] font-bold shadow-sm transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                                        >
                                            <WrenchScrewdriverIcon className="h-4 w-4" />
                                            Lakukan Perbaikan Sekarang
                                        </button>
                                    </div>
                                ) : approval.repair_report.status === 'rework_needed' ? (
                                    <div className="bg-white rounded-[6px] shadow-sm border border-rose-200 p-5 bg-rose-50/20 sticky top-24">
                                        <h3 className="font-bold text-rose-900 text-sm tracking-wide uppercase mb-2 flex items-center gap-2">
                                            <ExclamationTriangleIcon className="h-4 w-4 text-rose-600" />
                                            Perlu Perbaikan Ulang
                                        </h3>
                                        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                                            Supervisor meminta perbaikan ulang terhadap hasil perbaikan sebelumnya. Silakan periksa catatan dan unggah laporan perbaikan ulang.
                                        </p>
                                        <button
                                            onClick={() => navigate({ to: `/repair-report/${approval.id}` })}
                                            className="w-full py-2.5 px-4 bg-rose-700 hover:bg-rose-800 text-white rounded-[6px] font-bold shadow-sm transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                                        >
                                            <ArrowPathIcon className="h-4 w-4" />
                                            Perbaiki Ulang Sekarang
                                        </button>
                                    </div>
                                ) : approval.repair_report.status === 'pending_review' ? (
                                    <div className="bg-white rounded-[6px] shadow-sm border border-blue-200 p-5 bg-blue-50/20">
                                        <h3 className="font-bold text-[#11468F] text-sm tracking-wide uppercase mb-2 flex items-center gap-2">
                                            <ClockIcon className="h-4 w-4 text-[#11468F]" />
                                            Laporan Menunggu Verifikasi
                                        </h3>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Laporan perbaikan fisik telah berhasil Anda kirimkan dan saat ini sedang menunggu review dan persetujuan penutupan tiket dari Supervisor.
                                        </p>
                                    </div>
                                ) : approval.repair_report.status === 'approved' ? (
                                    <div className="bg-white rounded-[6px] shadow-sm border border-emerald-200 p-5 bg-emerald-50/20">
                                        <h3 className="font-bold text-emerald-800 text-sm tracking-wide uppercase mb-2 flex items-center gap-2">
                                            <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                                            Perbaikan Selesai & Terverifikasi
                                        </h3>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Perbaikan fisik tabung APAR ini telah diverifikasi dan disetujui oleh Supervisor. Status APAR telah kembali aktif siap operasi.
                                        </p>
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            <RepairActionModal
                isOpen={showActionModal}
                onClose={() => setShowActionModal(false)}
                actionType={actionType}
                approval={approval}
                onConfirm={handleActionConfirm}
                isSubmitting={approveMutation.isPending || rejectMutation.isPending}
            />

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
                            src={formatStorageUrl(selectedPhoto.url)}
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



