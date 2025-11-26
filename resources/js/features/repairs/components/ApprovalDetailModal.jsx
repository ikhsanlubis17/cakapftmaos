import React, { useState } from 'react';
import {
    XMarkIcon,
    FireIcon,
    MapPinIcon,
    UserIcon,
    CalendarIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    DocumentTextIcon,
    CameraIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';
import ApprovalStatusBadge from './ApprovalStatusBadge';
import ApprovalTimeline from './ApprovalTimeline';

const ApprovalDetailModal = ({ approval, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    if (!isOpen || !approval) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const tabs = [
        { id: 'overview', name: 'Overview', icon: FireIcon },
        { id: 'timeline', name: 'Timeline', icon: ClockIcon },
        { id: 'notes', name: 'Catatan & Keputusan', icon: ChatBubbleLeftRightIcon },
        { id: 'photos', name: 'Foto', icon: CameraIcon },
    ];

    return (
        <>
            {/* Modal Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                    <FireIcon className="h-7 w-7 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {approval.inspection?.apar?.serial_number || 'N/A'}
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Detail Persetujuan Perbaikan
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="mt-4 flex gap-2 overflow-x-auto">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                            activeTab === tab.id
                                                ? 'bg-red-600 text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {tab.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Status Badge */}
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">Status Persetujuan</h3>
                                    <ApprovalStatusBadge status={approval.status} size="lg" />
                                </div>

                                {/* APAR Information */}
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <h4 className="font-semibold text-gray-900 mb-4">Informasi APAR</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Serial Number</p>
                                            <p className="font-medium text-gray-900">
                                                {approval.inspection?.apar?.serial_number || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Tipe APAR</p>
                                            <p className="font-medium text-gray-900">
                                                {approval.inspection?.apar?.apar_type?.name || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Lokasi</p>
                                            <p className="font-medium text-gray-900">
                                                {approval.inspection?.apar?.location_name || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Jenis Lokasi</p>
                                            <p className="font-medium text-gray-900 capitalize">
                                                {approval.inspection?.apar?.location_type || '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Supervisor Decision */}
                                {approval.approver && (
                                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                                        <h4 className="font-semibold text-gray-900 mb-4">Keputusan Supervisor</h4>
                                        <div className="flex items-start gap-4 mb-4">
                                            {approval.approver.photo ? (
                                                <img
                                                    src={approval.approver.photo}
                                                    alt={approval.approver.name}
                                                    className="w-16 h-16 rounded-full border-2 border-white shadow-md"
                                                />
                                            ) : (
                                                <UserCircleIcon className="w-16 h-16 text-blue-600" />
                                            )}
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 text-lg">
                                                    {approval.approver.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {approval.approver.role 
                                                        ? approval.approver.role.charAt(0).toUpperCase() + approval.approver.role.slice(1) 
                                                        : 'Approver'}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {approval.approver.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Waktu Keputusan</p>
                                                <p className="font-medium text-gray-900">
                                                    {formatDate(approval.decision_made_at || approval.approved_at)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Status</p>
                                                <ApprovalStatusBadge status={approval.status} size="md" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Teknisi Information */}
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <h4 className="font-semibold text-gray-900 mb-4">Informasi Teknisi</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Nama Teknisi</p>
                                            <p className="font-medium text-gray-900">
                                                {approval.inspection?.user?.name || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Tanggal Inspeksi</p>
                                            <p className="font-medium text-gray-900">
                                                {formatDate(approval.inspection?.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Damage Categories */}
                                {approval.inspection?.inspection_damages && approval.inspection.inspection_damages.length > 0 && (
                                    <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                                        <h4 className="font-semibold text-gray-900 mb-4">Kategori Kerusakan</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {approval.inspection.inspection_damages.map((damage, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300"
                                                >
                                                    {damage.damage_category?.name || 'Kategori tidak tersedia'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Timeline Tab */}
                        {activeTab === 'timeline' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">Progress Timeline</h3>
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <ApprovalTimeline
                                        status={approval.status}
                                        createdAt={approval.inspection?.created_at}
                                        approvedAt={approval.approved_at}
                                        rejectedAt={approval.decision_made_at}
                                        completedAt={approval.completed_at}
                                    />
                                </div>

                                {/* Timeline Details */}
                                <div className="space-y-4">
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-start gap-3">
                                            <CheckCircleIcon className="h-5 w-5 text-emerald-600 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-gray-900">Inspeksi Dilakukan</p>
                                                <p className="text-sm text-gray-600">
                                                    {formatDate(approval.inspection?.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {(approval.approved_at || approval.decision_made_at) && (
                                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                                            <div className="flex items-start gap-3">
                                                {approval.status === 'rejected' ? (
                                                    <ExclamationTriangleIcon className="h-5 w-5 text-rose-600 mt-0.5" />
                                                ) : (
                                                    <CheckCircleIcon className="h-5 w-5 text-emerald-600 mt-0.5" />
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {approval.status === 'rejected' ? 'Perbaikan Ditolak' : 'Perbaikan Disetujui'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {formatDate(approval.approved_at || approval.decision_made_at)}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        oleh {approval.approver?.name || (approval.approver?.role ? approval.approver.role.charAt(0).toUpperCase() + approval.approver.role.slice(1) : 'Supervisor')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {approval.completed_at && (
                                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                                            <div className="flex items-start gap-3">
                                                <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-gray-900">Perbaikan Selesai</p>
                                                    <p className="text-sm text-gray-600">
                                                        {formatDate(approval.completed_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Notes Tab */}
                        {activeTab === 'notes' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">Catatan & Keputusan</h3>

                                {/* Supervisor Notes */}
                                {approval.supervisor_notes && (
                                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                                        <div className="flex items-start gap-3 mb-3">
                                            <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                                            <h4 className="font-semibold text-gray-900">Catatan Supervisor</h4>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {approval.supervisor_notes}
                                        </p>
                                        <div className="mt-3 pt-3 border-t border-blue-200">
                                            <p className="text-sm text-gray-600">
                                                Oleh: <span className="font-medium">{approval.approver?.name || (approval.approver?.role ? approval.approver.role.charAt(0).toUpperCase() + approval.approver.role.slice(1) : 'Supervisor')}</span>
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(approval.decision_made_at || approval.approved_at)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Rejection Reason */}
                                {approval.status === 'rejected' && approval.rejection_reason && (
                                    <div className="bg-rose-50 rounded-xl p-5 border border-rose-200">
                                        <div className="flex items-start gap-3 mb-3">
                                            <ExclamationTriangleIcon className="h-5 w-5 text-rose-600 mt-0.5" />
                                            <h4 className="font-semibold text-gray-900">Alasan Penolakan</h4>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">
                                            {approval.rejection_reason}
                                        </p>
                                    </div>
                                )}

                                {/* Inspection Notes */}
                                {approval.inspection?.notes && (
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                        <div className="flex items-start gap-3 mb-3">
                                            <DocumentTextIcon className="h-5 w-5 text-gray-600 mt-0.5" />
                                            <h4 className="font-semibold text-gray-900">Catatan Inspeksi</h4>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">
                                            {approval.inspection.notes}
                                        </p>
                                    </div>
                                )}

                                {/* Repair Notes */}
                                {approval.repair_notes && (
                                    <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                                        <div className="flex items-start gap-3 mb-3">
                                            <CheckCircleIcon className="h-5 w-5 text-emerald-600 mt-0.5" />
                                            <h4 className="font-semibold text-gray-900">Catatan Perbaikan</h4>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">
                                            {approval.repair_notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Photos Tab */}
                        {activeTab === 'photos' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">Foto Inspeksi</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {/* APAR Photo */}
                                    {approval.inspection?.photo_url && (
                                        <div
                                            className="relative group cursor-pointer"
                                            onClick={() => setSelectedPhoto(approval.inspection.photo_url)}
                                        >
                                            <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                                                <img
                                                    src={approval.inspection.photo_url}
                                                    alt="Foto APAR"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                                                <CameraIcon className="h-8 w-8 text-white drop-shadow-lg" />
                                            </div>
                                            <p className="mt-2 text-sm font-medium text-gray-700">Foto APAR</p>
                                        </div>
                                    )}

                                    {/* Selfie Photo */}
                                    {approval.inspection?.selfie_url && (
                                        <div
                                            className="relative group cursor-pointer"
                                            onClick={() => setSelectedPhoto(approval.inspection.selfie_url)}
                                        >
                                            <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                                                <img
                                                    src={approval.inspection.selfie_url}
                                                    alt="Foto Selfie"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                                                <CameraIcon className="h-8 w-8 text-white drop-shadow-lg" />
                                            </div>
                                            <p className="mt-2 text-sm font-medium text-gray-700">Foto Selfie</p>
                                        </div>
                                    )}

                                    {/* Damage Photos */}
                                    {approval.inspection?.inspection_damages?.map((damage, idx) => (
                                        damage.damage_photo_url && (
                                            <div
                                                key={idx}
                                                className="relative group cursor-pointer"
                                                onClick={() => setSelectedPhoto(damage.damage_photo_url)}
                                            >
                                                <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                                                    <img
                                                        src={damage.damage_photo_url}
                                                        alt={`Kerusakan ${idx + 1}`}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-sm z-10">
                                                    Rusak
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                                                    <CameraIcon className="h-8 w-8 text-white drop-shadow-lg" />
                                                </div>
                                                <p className="mt-2 text-sm font-medium text-gray-700">
                                                    {damage.damage_category?.name || `Kerusakan ${idx + 1}`}
                                                </p>
                                            </div>
                                        )
                                    ))}
                                </div>

                                {(!approval.inspection?.photo_url && 
                                  !approval.inspection?.selfie_url && 
                                  (!approval.inspection?.inspection_damages || approval.inspection.inspection_damages.filter(d => d.damage_photo_url).length === 0)) && (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                                        <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500">Tidak ada foto tersedia</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>

            {/* Photo Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div className="max-w-5xl max-h-full">
                        <img
                            src={selectedPhoto}
                            alt="Foto inspeksi"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default ApprovalDetailModal;
