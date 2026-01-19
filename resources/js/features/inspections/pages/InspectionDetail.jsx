import React, { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import {
    ArrowLeftIcon,
    CalendarIcon,
    MapPinIcon,
    UserIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    PhotoIcon,
    FireIcon,
    CameraIcon,
    ArrowsPointingOutIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import Loading from '../../../components/ui/Loading';
import ApprovalTimeline from '../../../components/common/ApprovalTimeline';
import ActionDialog from '../../../components/common/ActionDialog';

const InspectionDetail = () => {
    const { id } = useParams({ from: '/authenticated/inspections/$id' });
    const navigate = useNavigate();
    const { apiClient, user } = useAuth();
    const { showSuccess, showError } = useToast();
    const queryClient = useQueryClient();

    const [actionDialog, setActionDialog] = useState({
        isOpen: false,
        type: 'approve',
    });

    // Lightbox State
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const openLightbox = (photoUrl, caption) => {
        if (!photoUrl) return;
        setSelectedPhoto({ url: photoUrl, caption });
        setLightboxOpen(true);
    };

    // Fetch Inspection Details
    const { data: inspection, isLoading, error } = useQuery({
        queryKey: ['inspection', id],
        queryFn: async () => {
            const res = await apiClient.get(`/api/inspections/${id}`);
            return res.data;
        },
    });

    const approveMutation = useMutation({
        mutationFn: async ({ notes }) => {
            const res = await apiClient.post(`/api/inspections/${id}/approve`, { notes });
            return res.data;
        },
        onSuccess: (data) => {
            showSuccess(data.message || 'Inspeksi berhasil disetujui');
            queryClient.invalidateQueries({ queryKey: ['inspection', id] });
            setActionDialog({ isOpen: false, type: 'approve' });
        },
        onError: (err) => {
            showError(err.response?.data?.message || 'Gagal menyetujui inspeksi');
        },
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ notes }) => {
            const res = await apiClient.post(`/api/inspections/${id}/reject`, { notes });
            return res.data;
        },
        onSuccess: (data) => {
            showSuccess(data.message || 'Inspeksi ditolak');
            queryClient.invalidateQueries({ queryKey: ['inspection', id] });
            setActionDialog({ isOpen: false, type: 'reject' });
        },
        onError: (err) => {
            showError(err.response?.data?.message || 'Gagal menolak inspeksi');
        },
    });

    if (isLoading) return <Loading />;
    if (error) return (
        <div className="p-8 text-center">
            <h2 className="text-xl font-bold text-red-600">Terjadi Kesalahan</h2>
            <p className="text-gray-600 mt-2">Gagal memuat detail inspeksi.</p>
            <button onClick={() => navigate({ to: '..' })} className="mt-4 text-blue-600 hover:underline">Kembali</button>
        </div>
    );

    const isChecker = user?.role === 'checker';
    const isSupervisor = user?.role === 'supervisor' || user?.role === 'admin';
    
    // Determine if user can act
    const canReview = (isChecker && inspection.inspection_status === 'pending_checker') ||
                      (isSupervisor && ['approved_by_checker', 'pending_review'].includes(inspection.inspection_status));

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getConditionBadge = (condition) => {
        const styles = {
            good: 'bg-green-100 text-green-800',
            needs_refill: 'bg-yellow-100 text-yellow-800',
            expired: 'bg-orange-100 text-orange-800',
            damaged: 'bg-red-100 text-red-800',
        }[condition] || 'bg-gray-100 text-gray-800';

        const labels = {
            good: 'Baik',
            needs_refill: 'Isi Ulang',
            expired: 'Kadaluarsa',
            damaged: 'Rusak',
        }[condition] || condition;

        return <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles}`}>{labels}</span>;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white shadow border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => window.history.back()} 
                            className="p-2 rounded-full hover:bg-gray-100 transition"
                        >
                            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Detail Inspeksi</h1>
                            <p className="text-sm text-gray-500">ID: #{inspection.id}</p>
                        </div>
                        <div className="ml-auto">
                            {getConditionBadge(inspection.condition)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* APAR Info Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center">
                                <FireIcon className="h-5 w-5 text-red-600 mr-2" />
                                <h3 className="font-semibold text-gray-900">Informasi APAR</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Serial Number</label>
                                    <p className="mt-1 text-lg font-medium text-gray-900">{inspection.apar?.serial_number}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Lokasi</label>
                                    <div className="mt-1 flex items-start text-gray-700">
                                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-1.5 flex-shrink-0 mt-0.5" />
                                        <span>{inspection.apar?.location_name || '-'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Jenis APAR</label>
                                    <p className="mt-1 text-gray-700">{inspection.apar?.apar_type?.name || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Teknisi Inspeksi</label>
                                    <div className="mt-1 flex items-center text-gray-700">
                                        <UserIcon className="h-5 w-5 text-gray-400 mr-1.5" />
                                        <span>{inspection.user?.name || '-'}</span>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Waktu Inspeksi</label>
                                    <div className="mt-1 flex items-center text-gray-700">
                                        <ClockIcon className="h-5 w-5 text-gray-400 mr-1.5" />
                                        <span>{formatDate(inspection.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Damages List */}
                        {inspection.requires_repair && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                                    <h3 className="font-semibold text-red-900">Kerusakan Ditemukan ({inspection.inspection_damages?.length || 0})</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {inspection.inspection_damages?.map((damage) => (
                                        <div key={damage.id} className="p-6">
                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-gray-900">{damage.damage_category?.name}</h4>
                                                        <span className={`px-2 py-0.5 text-xs rounded uppercase font-bold
                                                            ${damage.severity === 'high' ? 'bg-red-100 text-red-800' : 
                                                              damage.severity === 'medium' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}
                                                        >
                                                            {damage.severity}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm mb-3">{damage.notes || 'Tidak ada catatan tambahan.'}</p>
                                                </div>
                                                {damage.photo_url && (
                                                    <div className="w-full md:w-48 flex-shrink-0">
                                                        <img 
                                                            src={damage.photo_url} 
                                                            alt="Foto Kerusakan" 
                                                            className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition cursor-zoom-in"
                                                            onClick={() => window.open(damage.photo_url, '_blank')}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Photo Gallery (Unified Grid) */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                                <CameraIcon className="h-5 w-5 text-purple-600" />
                                <h3 className="font-semibold text-gray-900">Galeri Inspeksi</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Main APAR Photo */}
                                    {inspection.photo_url && (
                                        <div 
                                            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-gray-200"
                                            onClick={() => openLightbox(inspection.photo_url, 'Foto Kondisi APAR')}
                                        >
                                            <img src={inspection.photo_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                <ArrowsPointingOutIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all" />
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-6">
                                                <p className="text-white text-xs font-medium">Foto APAR</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Selfie */}
                                    {inspection.selfie_url && (
                                        <div 
                                            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-gray-200"
                                            onClick={() => openLightbox(inspection.selfie_url, 'Foto Selfie')}
                                        >
                                            <img src={inspection.selfie_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                <ArrowsPointingOutIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all" />
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-6">
                                                <p className="text-white text-xs font-medium">Foto Selfie</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Damage Photos */}
                                    {inspection.inspection_damages?.map((damage, idx) => (
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
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-6">
                                                    <p className="text-white text-xs font-medium truncate">{damage.damage_category?.name}</p>
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Timeline */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-6">Status Persetujuan</h3>
                            <ApprovalTimeline inspection={inspection} />
                            
                            {/* Action Buttons */}
                            {canReview && (
                                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-3">
                                    <button
                                        onClick={() => setActionDialog({ isOpen: true, type: 'approve' })}
                                        className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-sm"
                                    >
                                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                                        Setujui Inspeksi
                                    </button>
                                    <button
                                        onClick={() => setActionDialog({ isOpen: true, type: 'reject' })}
                                        className="w-full flex items-center justify-center px-4 py-3 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition font-medium"
                                    >
                                        <XCircleIcon className="h-5 w-5 mr-2" />
                                        Tolak Inspeksi
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ActionDialog
                isOpen={actionDialog.isOpen}
                onClose={() => setActionDialog({ isOpen: false, type: 'approve' })}
                title={actionDialog.type === 'approve' ? "Setujui Inspeksi" : "Tolak Inspeksi"}
                type={actionDialog.type}
                onConfirm={(formData) => {
                    if (actionDialog.type === 'approve') {
                        approveMutation.mutate({ notes: formData.notes });
                    } else {
                        rejectMutation.mutate({ notes: formData.notes });
                    }
                }}
                isLoading={actionDialog.type === 'approve' ? approveMutation.isPending : rejectMutation.isPending}
                requireNotes={actionDialog.type === 'reject'}
            />

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

export default InspectionDetail;
