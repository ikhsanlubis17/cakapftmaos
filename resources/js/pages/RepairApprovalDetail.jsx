import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
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
} from '@heroicons/react/24/outline';

const RepairApprovalDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    
    const [approval, setApproval] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchApprovalDetail();
    }, [id]);

    const fetchApprovalDetail = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Use test endpoint temporarily for debugging
            const response = await axios.get(`/api/test-repair-approval/${id}`);
            
            if (response.data.success) {
                setApproval(response.data.data);
            } else {
                throw new Error('Gagal memuat detail persetujuan');
            }
        } catch (error) {
            console.error('Error fetching approval detail:', error);
            setError(error.response?.data?.message || 'Gagal memuat detail persetujuan');
            showError('Gagal memuat detail persetujuan');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (actionType === 'reject' && !notes.trim()) {
            showError('Alasan penolakan wajib diisi');
            return;
        }

        try {
            setSubmitting(true);
            
            if (actionType === 'approve') {
                await axios.post(`/api/repair-approvals/${id}/approve`, { 
                    admin_notes: notes.trim() || null 
                });
                showSuccess('Persetujuan berhasil disetujui');
            } else if (actionType === 'reject') {
                await axios.post(`/api/repair-approvals/${id}/reject`, { 
                    admin_notes: notes 
                });
                showSuccess('Persetujuan berhasil ditolak');
            }
            
            setShowActionModal(false);
            setNotes('');
            setActionType(null);
            fetchApprovalDetail(); // Refresh data
        } catch (error) {
            console.error('Error processing action:', error);
            showError(error.response?.data?.message || 'Gagal memproses tindakan');
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

    if (error || !approval) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md mx-auto">
                    <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-red-100 mb-6">
                        <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-3">Terjadi Kesalahan</h3>
                    <p className="text-gray-600 mb-6 text-lg">{error || 'Data tidak ditemukan'}</p>
                    <div className="space-y-3">
                        <button
                            onClick={fetchApprovalDetail}
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate({ to: '/repair-approvals' })}
                        className="p-2 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-200 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Detail Persetujuan Perbaikan</h1>
                        <p className="text-gray-600 text-lg">APAR {approval.inspection?.apar?.serial_number || 'N/A'}</p>
                    </div>
                </div>

                {/* Status Banner */}
                <div className={`rounded-2xl p-6 border ${statusConfig.color}`}>
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white/50 rounded-xl">
                            <StatusIcon className="h-8 w-8 text-current" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl lg:text-2xl font-bold text-current mb-2">
                                {statusConfig.text}
                            </h2>
                            <p className="text-current/80 text-lg">{statusConfig.description}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left Column - APAR Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* APAR Information Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                                    <FireIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Informasi APAR</h3>
                                    <p className="text-gray-600">Detail lengkap APAR yang perlu diperbaiki</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Nomor Seri</label>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {approval.inspection?.apar?.serial_number || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Jenis APAR</label>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {approval.inspection?.apar?.aparType?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Kapasitas</label>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {approval.inspection?.apar?.capacity || 'N/A'} kg
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Lokasi</label>
                                        <div className="flex items-center space-x-2">
                                            <MapPinIcon className="h-5 w-5 text-gray-400" />
                                            <p className="text-lg font-semibold text-gray-900">
                                                {approval.inspection?.apar?.location_name || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Tipe Lokasi</label>
                                        <p className="text-lg font-semibold text-gray-900 capitalize">
                                            {approval.inspection?.apar?.location_type || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Status</label>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getConditionConfig(approval.inspection?.condition).color}`}>
                                            {getConditionConfig(approval.inspection?.condition).text}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inspection Details Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                    <DocumentTextIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Detail Inspeksi</h3>
                                    <p className="text-gray-600">Informasi hasil inspeksi dan temuan</p>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Inspektor</label>
                                        <div className="flex items-center space-x-2">
                                            <UserIcon className="h-5 w-5 text-gray-400" />
                                            <p className="text-lg font-semibold text-gray-900">
                                                {approval.inspection?.user?.name || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Tanggal Inspeksi</label>
                                        <div className="flex items-center space-x-2">
                                            <CalendarIcon className="h-5 w-5 text-gray-400" />
                                            <p className="text-lg font-semibold text-gray-900">
                                                {approval.inspection?.created_at 
                                                    ? new Date(approval.inspection.created_at).toLocaleDateString('id-ID', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })
                                                    : 'N/A'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {approval.inspection?.notes && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Catatan Inspeksi</label>
                                        <p className="text-lg text-gray-900 bg-gray-50 rounded-xl p-4 mt-2">
                                            {approval.inspection.notes}
                                        </p>
                                    </div>
                                )}

                                {/* Damage Categories */}
                                {approval.inspection?.inspectionDamages && approval.inspection.inspectionDamages.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 mb-3 block">Kategori Kerusakan</label>
                                        <div className="flex flex-wrap gap-3">
                                            {approval.inspection.inspectionDamages.map((damage, index) => (
                                                <span key={index} className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium border border-red-200">
                                                    {damage.damageCategory?.name || 'Kategori tidak tersedia'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Photos Card */}
                        {approval.inspection?.photo_url && (
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                <div className="flex items-center space-x-4 mb-6">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                                        <CameraIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Foto Inspeksi</h3>
                                        <p className="text-gray-600">Bukti visual kondisi APAR</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {approval.inspection.photo_url && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-2 block">Foto APAR</label>
                                            <img 
                                                src={approval.inspection.photo_url} 
                                                alt="Foto APAR"
                                                className="w-full h-48 object-cover rounded-xl border border-gray-200"
                                            />
                                        </div>
                                    )}
                                    {approval.inspection.selfie_url && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-2 block">Foto Selfie</label>
                                            <img 
                                                src={approval.inspection.selfie_url} 
                                                alt="Foto Selfie"
                                                className="w-full h-48 object-cover rounded-xl border border-gray-200"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Actions & Status */}
                    <div className="space-y-6">
                        {/* Action Card */}
                        {approval.status === 'pending' && (
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                <div className="flex items-center space-x-4 mb-6">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                                        <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Tindakan</h3>
                                        <p className="text-gray-600">Setujui atau tolak perbaikan</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <button
                                        onClick={() => {
                                            setActionType('approve');
                                            setShowActionModal(true);
                                        }}
                                        className="w-full bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                                    >
                                        <CheckCircleIcon className="h-5 w-5" />
                                        <span>Setujui Perbaikan</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActionType('reject');
                                            setShowActionModal(true);
                                        }}
                                        className="w-full bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2"
                                    >
                                        <XCircleIcon className="h-5 w-5" />
                                        <span>Tolak Perbaikan</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Status Timeline Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                    <ClockIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Timeline</h3>
                                    <p className="text-gray-600">Riwayat status persetujuan</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Inspeksi Dilakukan</p>
                                        <p className="text-sm text-gray-600">
                                            {approval.inspection?.created_at 
                                                ? new Date(approval.inspection.created_at).toLocaleDateString('id-ID')
                                                : 'N/A'
                                            }
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start space-x-3">
                                    <div className={`w-3 h-3 rounded-full mt-2 ${
                                        ['approved', 'rejected', 'completed'].includes(approval.status) 
                                            ? 'bg-blue-500' 
                                            : 'bg-gray-300'
                                    }`}></div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Persetujuan</p>
                                        <p className="text-sm text-gray-600">
                                            {approval.status === 'pending' ? 'Menunggu' : 
                                             approval.status === 'approved' ? 'Disetujui' :
                                             approval.status === 'rejected' ? 'Ditolak' : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                
                                {approval.status === 'completed' && (
                                    <div className="flex items-start space-x-3">
                                        <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">Perbaikan Selesai</p>
                                            <p className="text-sm text-gray-600">
                                                {approval.updated_at 
                                                    ? new Date(approval.updated_at).toLocaleDateString('id-ID')
                                                    : 'N/A'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Admin Notes Card */}
                        {approval.admin_notes && (
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                <div className="flex items-center space-x-4 mb-6">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg">
                                        <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Catatan Admin</h3>
                                        <p className="text-gray-600">Pesan dari administrator</p>
                                    </div>
                                </div>
                                
                                <p className="text-gray-900 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                                    {approval.admin_notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            {showActionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {actionType === 'approve' ? 'Setujui Perbaikan' : 'Tolak Perbaikan'}
                        </h3>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {actionType === 'approve' ? 'Catatan (Opsional)' : 'Alasan Penolakan *'}
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                placeholder={actionType === 'approve' 
                                    ? 'Tambahkan catatan jika diperlukan...' 
                                    : 'Masukkan alasan penolakan...'
                                }
                            />
                        </div>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowActionModal(false);
                                    setNotes('');
                                    setActionType(null);
                                }}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={submitting || (actionType === 'reject' && !notes.trim())}
                                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                                    actionType === 'approve'
                                        ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                                        : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                                }`}
                            >
                                {submitting ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Memproses...</span>
                                    </div>
                                ) : (
                                    actionType === 'approve' ? 'Setujui' : 'Tolak'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RepairApprovalDetail;



