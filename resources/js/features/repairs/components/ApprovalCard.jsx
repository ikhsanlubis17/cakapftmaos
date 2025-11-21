import React from 'react';
import {
    FireIcon,
    MapPinIcon,
    UserIcon,
    CalendarIcon,
    EyeIcon,
    UserCircleIcon,
    ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import ApprovalStatusBadge from './ApprovalStatusBadge';
import ApprovalTimeline from './ApprovalTimeline';

const ApprovalCard = ({ approval, onViewDetail }) => {
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getDecisionDate = () => {
        if (approval.approved_at) return approval.approved_at;
        if (approval.decision_made_at) return approval.decision_made_at;
        return null;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <FireIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {approval.inspection?.apar?.serial_number || 'N/A'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {approval.inspection?.apar?.apar_type?.name || 'Tipe tidak tersedia'}
                            </p>
                        </div>
                    </div>
                    <ApprovalStatusBadge status={approval.status} size="md" />
                </div>

                {/* APAR Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                            {approval.inspection?.apar?.location_name || 'Lokasi tidak tersedia'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                        <span>
                            {formatDate(approval.inspection?.created_at)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Supervisor Decision Section */}
            {(approval.status === 'approved' || approval.status === 'rejected' || approval.status === 'completed') && approval.approver && (
                <div className="px-5 py-4 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            {approval.approver.photo ? (
                                <img
                                    src={approval.approver.photo}
                                    alt={approval.approver.name}
                                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                />
                            ) : (
                                <UserCircleIcon className="w-10 h-10 text-blue-600" />
                            )}
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                    {approval.approver.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                    {approval.approver.role 
                                        ? approval.approver.role.charAt(0).toUpperCase() + approval.approver.role.slice(1) 
                                        : 'Approver'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Keputusan dibuat</p>
                            <p className="text-xs font-medium text-gray-700">
                                {formatDate(getDecisionDate())}
                            </p>
                        </div>
                    </div>

                    {/* Supervisor Notes Preview */}
                    {approval.supervisor_notes && (
                        <div className="mt-3 bg-white rounded-lg p-3 border border-blue-200">
                            <div className="flex items-start gap-2">
                                <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-700 mb-1">
                                        Catatan Supervisor:
                                    </p>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {approval.supervisor_notes}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Teknisi Info */}
            <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium text-gray-700">Teknisi:</span>
                    <span>{approval.inspection?.user?.name || 'Tidak tersedia'}</span>
                </div>
            </div>

            {/* Timeline */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <ApprovalTimeline
                    status={approval.status}
                    createdAt={approval.inspection?.created_at}
                    approvedAt={approval.approved_at}
                    rejectedAt={approval.decision_made_at}
                    completedAt={approval.completed_at}
                />
            </div>

            {/* Damage Categories */}
            {approval.inspection?.inspection_damages && approval.inspection.inspection_damages.length > 0 && (
                <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                        Kategori Kerusakan:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {approval.inspection.inspection_damages.map((damage, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200"
                            >
                                {damage.damage_category?.name || 'Kategori tidak tersedia'}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer - Action Button */}
            <div className="px-5 py-4 bg-gray-50">
                <button
                    onClick={() => onViewDetail && onViewDetail(approval)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <EyeIcon className="h-4 w-4" />
                    Lihat Detail Lengkap
                </button>
            </div>
        </div>
    );
};

export default ApprovalCard;
