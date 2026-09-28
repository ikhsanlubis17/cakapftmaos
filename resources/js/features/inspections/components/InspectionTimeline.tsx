import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    UserIcon,
    WrenchIcon,
    ClipboardDocumentCheckIcon,
    ArrowPathIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    PhotoIcon,
    DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface TimelineEntry {
    id: number;
    type: 'initial' | 'repair' | 'reinspection';
    date: string;
    technician: { id: number; name: string } | null;
    checker: {
        id: number;
        name: string;
        checked_at: string | null;
        was_edited: boolean;
    } | null;
    supervisor: {
        id: number;
        name: string;
        reviewed_at: string | null;
    } | null;
    status: string;
    condition: string;
    original_report: {
        condition: string;
        damages: any[];
    } | null;
    corrected_report: {
        condition: string;
        damages: any[];
        notes: string;
    } | null;
    damages: any[];
    photo_url: string | null;
    selfie_url: string | null;
    notes: string | null;
    checker_notes: string | null;
    rejection_reason: string | null;
    parent_inspection_id: number | null;
    reinspections: Array<{ id: number }>;
}

interface InspectionTimelineProps {
    aparId: number;
    className?: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    pending_checker_review: {
        label: 'Menunggu Review Checker',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: ClockIcon,
    },
    pending_supervisor_review: {
        label: 'Menunggu Review Supervisor',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: DocumentMagnifyingGlassIcon,
    },
    approved: {
        label: 'Disetujui',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: CheckCircleIcon,
    },
    rejected: {
        label: 'Ditolak',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: XCircleIcon,
    },
    pending_review: {
        label: 'Menunggu Review',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: ClockIcon,
    },
};

const InspectionTimeline: React.FC<InspectionTimelineProps> = ({ aparId, className = '' }) => {
    const { apiClient } = useAuth();
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const {
        data: timeline = [],
        isLoading,
        error,
        refetch,
    } = useQuery<TimelineEntry[]>({
        queryKey: ['inspection-timeline', aparId],
        queryFn: async () => {
            const res = await apiClient.get('/api/inspections/timeline', {
                params: { apar_id: aparId },
            });
            return res.data?.data || [];
        },
        enabled: !!aparId,
        staleTime: 30000,
    });

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center py-8 ${className}`}>
                <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`text-center py-8 ${className}`}>
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-2" />
                <p className="text-gray-600">Gagal memuat timeline</p>
                <button
                    onClick={() => refetch()}
                    className="mt-2 text-blue-600 hover:text-blue-700"
                >
                    Coba lagi
                </button>
            </div>
        );
    }

    if (timeline.length === 0) {
        return (
            <div className={`text-center py-8 ${className}`}>
                <ClipboardDocumentCheckIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Belum ada riwayat inspeksi untuk APAR ini</p>
            </div>
        );
    }

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className={`relative ${className}`}>
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-6">
                {timeline.map((entry, index) => {
                    const statusInfo = statusConfig[entry.status] || statusConfig.pending_review;
                    const StatusIcon = statusInfo.icon;
                    const isExpanded = expandedId === entry.id;
                    const wasEdited = entry.checker?.was_edited;

                    return (
                        <div key={entry.id} className="relative pl-14">
                            {/* Timeline dot */}
                            <div
                                className={`absolute left-4 w-5 h-5 rounded-full ${statusInfo.bgColor} flex items-center justify-center ring-4 ring-white`}
                            >
                                <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                            </div>

                            {/* Card */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                {/* Card Header */}
                                <div
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-50"
                                    onClick={() => toggleExpand(entry.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}
                                            >
                                                {statusInfo.label}
                                            </span>
                                            {entry.type === 'repair' && (
                                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-600">
                                                    <WrenchIcon className="h-3 w-3 inline mr-1" />
                                                    Perbaikan
                                                </span>
                                            )}
                                            {entry.type === 'reinspection' && (
                                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-600">
                                                    Re-inspeksi
                                                </span>
                                            )}
                                            {wasEdited && (
                                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-600">
                                                    Dikoreksi
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">
                                                {new Date(entry.date).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                            {isExpanded ? (
                                                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                                            ) : (
                                                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                                        {entry.technician && (
                                            <div className="flex items-center">
                                                <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                                                <span>Teknisi: {entry.technician.name}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center">
                                            <span
                                                className={`inline-flex items-center ${
                                                    entry.condition === 'good'
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                }`}
                                            >
                                                {entry.condition === 'good' ? 'Baik' : 'Rusak'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
                                        {/* Photos */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            {entry.photo_url && (
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Foto Inspeksi</p>
                                                    <img
                                                        src={entry.photo_url}
                                                        alt="Inspection"
                                                        className="w-full h-32 object-cover rounded-lg"
                                                    />
                                                </div>
                                            )}
                                            {entry.selfie_url && (
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Foto Selfie</p>
                                                    <img
                                                        src={entry.selfie_url}
                                                        alt="Selfie"
                                                        className="w-full h-32 object-cover rounded-lg"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Notes */}
                                        {entry.notes && (
                                            <div className="mb-4">
                                                <p className="text-xs text-gray-500 mb-1">Catatan Teknisi</p>
                                                <p className="text-sm text-gray-700 bg-white p-2 rounded">
                                                    {entry.notes}
                                                </p>
                                            </div>
                                        )}

                                        {/* Damages */}
                                        {entry.damages && entry.damages.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-xs text-gray-500 mb-2">Kerusakan Ditemukan</p>
                                                <div className="space-y-2">
                                                    {entry.damages.map((damage: any) => (
                                                        <div
                                                            key={damage.id}
                                                            className="flex items-start gap-2 bg-white p-2 rounded"
                                                        >
                                                            {damage.damage_photo_url && (
                                                                <img
                                                                    src={damage.damage_photo_url}
                                                                    alt="Damage"
                                                                    className="w-12 h-12 object-cover rounded"
                                                                />
                                                            )}
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {damage.damage_category?.name}
                                                                </span>
                                                                {damage.notes && (
                                                                    <p className="text-xs text-gray-500">
                                                                        {damage.notes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Checker Review */}
                                        {entry.checker && (
                                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <ClipboardDocumentCheckIcon className="h-4 w-4 text-blue-600" />
                                                    <span className="text-sm font-medium text-blue-900">
                                                        Review Checker
                                                    </span>
                                                </div>
                                                <div className="text-sm text-blue-800">
                                                    <p>Checker: {entry.checker.name}</p>
                                                    {entry.checker.checked_at && (
                                                        <p className="text-xs text-blue-600">
                                                            {new Date(entry.checker.checked_at).toLocaleString('id-ID')}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Show diff if edited */}
                                                {wasEdited && entry.original_report && entry.corrected_report && (
                                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                                        <div className="p-2 bg-red-50 rounded">
                                                            <p className="text-xs font-medium text-red-700 mb-1">
                                                                Laporan Asli
                                                            </p>
                                                            <p className="text-sm text-red-600">
                                                                Kondisi: {entry.original_report.condition === 'good' ? 'Baik' : 'Rusak'}
                                                            </p>
                                                            {entry.original_report.damages?.length > 0 && (
                                                                <p className="text-xs text-red-500">
                                                                    {entry.original_report.damages.length} kerusakan
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="p-2 bg-green-50 rounded">
                                                            <p className="text-xs font-medium text-green-700 mb-1">
                                                                Laporan Dikoreksi
                                                            </p>
                                                            <p className="text-sm text-green-600">
                                                                Kondisi: {entry.corrected_report.condition === 'good' ? 'Baik' : 'Rusak'}
                                                            </p>
                                                            {entry.corrected_report.damages?.length > 0 && (
                                                                <p className="text-xs text-green-500">
                                                                    {entry.corrected_report.damages.length} kerusakan
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {entry.checker_notes && (
                                                    <p className="mt-2 text-sm text-blue-700">
                                                        Catatan: {entry.checker_notes}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Supervisor Review */}
                                        {entry.supervisor && (
                                            <div className="mb-4 p-3 bg-green-50 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                                    <span className="text-sm font-medium text-green-900">
                                                        Review Supervisor
                                                    </span>
                                                </div>
                                                <div className="text-sm text-green-800">
                                                    <p>Supervisor: {entry.supervisor.name}</p>
                                                    {entry.supervisor.reviewed_at && (
                                                        <p className="text-xs text-green-600">
                                                            {new Date(entry.supervisor.reviewed_at).toLocaleString('id-ID')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Rejection reason */}
                                        {entry.status === 'rejected' && entry.rejection_reason && (
                                            <div className="p-3 bg-red-50 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <XCircleIcon className="h-4 w-4 text-red-600" />
                                                    <span className="text-sm font-medium text-red-900">
                                                        Alasan Penolakan
                                                    </span>
                                                </div>
                                                <p className="text-sm text-red-700">{entry.rejection_reason}</p>
                                            </div>
                                        )}

                                        {/* Re-inspections link */}
                                        {entry.reinspections && entry.reinspections.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <p className="text-xs text-gray-500">
                                                    Inspeksi ini memiliki {entry.reinspections.length} tindak lanjut
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default InspectionTimeline;
