import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/contexts/AuthContext";
import { Link } from '@tanstack/react-router';
import { 
    ClipboardDocumentCheckIcon, 
    MagnifyingGlassIcon,
    FunnelIcon,
    CalendarIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ArrowPathIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import ApprovalStatusBadge from '../components/ApprovalStatusBadge';
import ApprovalDetailModal from '../components/ApprovalDetailModal';

// Simplified Adapter to make inspection object compatible with ApprovalDetailModal
const adaptInspectionToApproval = (inspection) => {
    return {
        id: inspection.id,
        status: inspection.inspection_status?.includes('approved') ? 'approved' : 
               (inspection.inspection_status?.includes('rejected') ? 'rejected' : 'pending'),
        inspection: inspection,
        created_at: inspection.created_at,
        approved_at: inspection.checker_reviewed_at, // Use checker review time
        decision_made_at: inspection.checker_reviewed_at,
        approver: inspection.checker,
        // supervisor_notes: inspection.checker_notes, // Removed incorrect mapping
        // notes: inspection.checker_notes, // Removed incorrect mapping
    };
};

const InspectionHistoryPage = () => {
    const { apiClient } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedInspection, setSelectedInspection] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const { data: inspections, isLoading, error, refetch } = useQuery({
        queryKey: ['checker-history'],
        queryFn: async () => {
            const response = await apiClient.get('/api/inspections/review/history');
            return response.data?.data || [];
        }
    });

    const filteredInspections = inspections?.filter(inspection => {
        const matchesSearch = 
            inspection.apar?.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inspection.apar?.location_name?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'approved' && inspection.inspection_status === 'approved_by_checker') ||
            (statusFilter === 'rejected' && inspection.inspection_status === 'rejected_by_checker');

        return matchesSearch && matchesStatus;
    });

    const openDetail = (inspection) => {
        setSelectedInspection(adaptInspectionToApproval(inspection));
        setIsDetailOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <ClockIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Riwayat Persetujuan</h1>
                            <p className="text-gray-500">Daftar inspeksi yang telah Anda review</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari No. Seri APAR atau Lokasi..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="relative w-full md:w-48">
                    <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Semua Status</option>
                        <option value="approved">Disetujui</option>
                        <option value="rejected">Ditolak</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            {filteredInspections?.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
                    <div className="mx-auto h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <ClipboardDocumentCheckIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada riwayat</h3>
                    <p className="text-gray-500">Belum ada inspeksi yang sesuai dengan filter Anda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredInspections.map((inspection) => (
                        <div 
                            key={inspection.id}
                            onClick={() => openDetail(inspection)}
                            className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all cursor-pointer group"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${
                                        inspection.inspection_status?.includes('rejected') 
                                            ? 'bg-red-50 text-red-600' 
                                            : 'bg-emerald-50 text-emerald-600'
                                    }`}>
                                        {inspection.inspection_status?.includes('rejected') ? (
                                            <XCircleIcon className="h-6 w-6" />
                                        ) : (
                                            <CheckCircleIcon className="h-6 w-6" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                                {inspection.apar?.serial_number}
                                            </h3>
                                            <span className="text-sm text-gray-500">•</span>
                                            <span className="text-sm text-gray-500">{inspection.apar?.location_name}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                                            <div className="flex items-center gap-1.5">
                                                <CalendarIcon className="h-4 w-4" />
                                                <span>Review: {new Date(inspection.checker_reviewed_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <ClipboardDocumentCheckIcon className="h-4 w-4" />
                                                <span>Inspektor: {inspection.user?.name}</span>
                                            </div>
                                        </div>
                                        {inspection.checker_notes && (
                                            <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 line-clamp-1 italic">
                                                "{inspection.checker_notes}"
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-4 min-w-[200px]">
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                        inspection.inspection_status?.includes('rejected')
                                            ? 'bg-red-50 text-red-700 border-red-100'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    }`}>
                                        {inspection.inspection_status?.includes('rejected') ? 'Ditolak' : 'Disetujui'}
                                    </div>
                                    <ChevronRightIcon className="h-5 w-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ApprovalDetailModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                approval={selectedInspection}
            />
        </div>
    );
};

export default InspectionHistoryPage;
