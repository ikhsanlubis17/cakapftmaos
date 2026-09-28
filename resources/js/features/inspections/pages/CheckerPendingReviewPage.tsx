import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
    ClipboardDocumentCheckIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    EyeIcon,
    MapPinIcon,
    UserIcon,
    PhotoIcon,
    CalendarDaysIcon,
    ChevronLeftIcon,
} from '@heroicons/react/24/outline';

interface Inspection {
    id: number;
    condition: string;
    notes: string | null;
    photo_url: string;
    selfie_url: string;
    created_at: string;
    inspection_status: string;
    apar: {
        id: number;
        serial_number: string;
        location_name: string;
        apar_type?: {
            name: string;
        };
    };
    user: {
        id: number;
        name: string;
    };
    inspection_damages: Array<{
        id: number;
        notes: string | null;
        damage_photo_url: string;
        damage_category: {
            id: number;
            name: string;
            type: string;
        };
    }>;
}

const CheckerPendingReviewPage: React.FC = () => {
    const navigate = useNavigate();
    const { apiClient, user } = useAuth();
    const { showSuccess, showError } = useToast();
    const queryClient = useQueryClient();

    const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewData, setReviewData] = useState({
        is_valid: true,
        checker_notes: '',
        checker_condition: '',
        checker_damages: [] as Array<{
            category_id: number;
            notes: string;
            severity: 'low' | 'medium' | 'high' | 'critical';
            is_functional: boolean;
            checker_notes: string;
        }>,
    });

    // Fetch pending inspections
    const {
        data: inspections = [],
        isLoading,
        error,
        refetch,
    } = useQuery<Inspection[]>({
        queryKey: ['checker', 'pending-review'],
        queryFn: async () => {
            const res = await apiClient.get('/api/checker/pending-review');
            return res.data?.data || [];
        },
        staleTime: 30000,
    });

    // Submit review mutation
    const submitReviewMutation = useMutation({
        mutationFn: async ({ inspectionId, data }: { inspectionId: number; data: typeof reviewData }) => {
            const res = await apiClient.post(`/api/checker/inspections/${inspectionId}/review`, data);
            return res.data;
        },
        onSuccess: (data) => {
            showSuccess(data.message || 'Review berhasil disimpan');
            queryClient.invalidateQueries({ queryKey: ['checker'] });
            setShowReviewModal(false);
            setSelectedInspection(null);
            setReviewData({
                is_valid: true,
                checker_notes: '',
                checker_condition: '',
                checker_damages: [],
            });
        },
        onError: (error: any) => {
            showError(error.response?.data?.message || 'Gagal menyimpan review');
        },
    });

    const handleOpenReview = (inspection: Inspection) => {
        setSelectedInspection(inspection);
        setReviewData({
            is_valid: true,
            checker_notes: '',
            checker_condition: inspection.condition,
            checker_damages: inspection.inspection_damages.map((d) => ({
                category_id: d.damage_category.id,
                notes: d.notes || '',
                severity: 'medium' as const,
                is_functional: false,
                checker_notes: '',
            })),
        });
        setShowReviewModal(true);
    };

    const handleSubmitReview = () => {
        if (!selectedInspection) return;

        submitReviewMutation.mutate({
            inspectionId: selectedInspection.id,
            data: reviewData,
        });
    };

    if (!user || user.role !== 'checker') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700">Akses Ditolak</h2>
                    <p className="text-gray-500 mt-2">Halaman ini hanya untuk Checker</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <ArrowPathIcon className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Memuat inspeksi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        to="/checker"
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                    >
                        <ChevronLeftIcon className="h-4 w-4 mr-1" />
                        Kembali ke Dashboard
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Inspeksi Menunggu Review
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Review dan verifikasi hasil inspeksi teknisi
                            </p>
                        </div>
                        <button
                            onClick={() => refetch()}
                            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <ArrowPathIcon className="h-5 w-5 mr-2 text-gray-500" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Inspections List */}
                {inspections.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Tidak Ada Inspeksi</h3>
                        <p className="text-gray-500 mt-2">
                            Semua inspeksi yang ditugaskan kepada Anda sudah direview
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {inspections.map((inspection) => (
                            <div
                                key={inspection.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Photo Preview */}
                                <div className="aspect-video bg-gray-100 relative">
                                    {inspection.photo_url ? (
                                        <img
                                            src={inspection.photo_url}
                                            alt="Inspection photo"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <PhotoIcon className="h-12 w-12 text-gray-400" />
                                        </div>
                                    )}
                                    <div
                                        className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full ${
                                            inspection.condition === 'good'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {inspection.condition === 'good' ? 'Baik' : 'Rusak'}
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {inspection.apar?.serial_number}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {inspection.apar?.apar_type?.name}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                                            {inspection.apar?.location_name}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                                            {inspection.user?.name}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                                            {new Date(inspection.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </div>

                                    {/* Damages */}
                                    {inspection.inspection_damages.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {inspection.inspection_damages.map((damage) => (
                                                <span
                                                    key={damage.id}
                                                    className="px-2 py-0.5 text-xs bg-red-50 text-red-600 rounded"
                                                >
                                                    {damage.damage_category?.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => handleOpenReview(inspection)}
                                            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
                                            Review
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Review Modal */}
                {showReviewModal && selectedInspection && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Review Inspeksi - {selectedInspection.apar?.serial_number}
                                </h2>
                                <button
                                    onClick={() => setShowReviewModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <XCircleIcon className="h-6 w-6 text-gray-500" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6">
                                {/* Inspection Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-2">Foto Inspeksi</h3>
                                        <img
                                            src={selectedInspection.photo_url}
                                            alt="Inspection"
                                            className="w-full rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-2">Foto Selfie</h3>
                                        <img
                                            src={selectedInspection.selfie_url}
                                            alt="Selfie"
                                            className="w-full rounded-lg"
                                        />
                                    </div>
                                </div>

                                {/* Original Report */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <h3 className="font-medium text-gray-900 mb-3">Laporan Asli Teknisi</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Kondisi:</span>
                                            <span className={`ml-2 font-medium ${
                                                selectedInspection.condition === 'good' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {selectedInspection.condition === 'good' ? 'Baik' : 'Rusak'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Teknisi:</span>
                                            <span className="ml-2 font-medium">{selectedInspection.user?.name}</span>
                                        </div>
                                    </div>
                                    {selectedInspection.notes && (
                                        <div className="mt-2">
                                            <span className="text-gray-500">Catatan:</span>
                                            <p className="text-gray-700 mt-1">{selectedInspection.notes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Checker Review Form */}
                                <div className="space-y-6">
                                    {/* Validation */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Validasi Inspeksi
                                        </label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    checked={reviewData.is_valid}
                                                    onChange={() => setReviewData({ ...reviewData, is_valid: true })}
                                                    className="h-4 w-4 text-blue-600"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">
                                                    Valid - Setuju dengan laporan teknisi
                                                </span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    checked={!reviewData.is_valid}
                                                    onChange={() => setReviewData({ ...reviewData, is_valid: false })}
                                                    className="h-4 w-4 text-blue-600"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">
                                                    Perlu Koreksi
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Corrected Condition (if not valid) */}
                                    {!reviewData.is_valid && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Kondisi Sebenarnya
                                            </label>
                                            <select
                                                value={reviewData.checker_condition}
                                                onChange={(e) => setReviewData({
                                                    ...reviewData,
                                                    checker_condition: e.target.value,
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Pilih kondisi</option>
                                                <option value="good">Baik</option>
                                                <option value="damaged">Rusak</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Checker Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Catatan Checker
                                        </label>
                                        <textarea
                                            value={reviewData.checker_notes}
                                            onChange={(e) => setReviewData({
                                                ...reviewData,
                                                checker_notes: e.target.value,
                                            })}
                                            rows={4}
                                            placeholder="Tambahkan catatan untuk review ini..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Damage Categories Review */}
                                    {selectedInspection.inspection_damages.length > 0 && (
                                        <div>
                                            <h3 className="font-medium text-gray-900 mb-3">
                                                Review Kerusakan
                                            </h3>
                                            <div className="space-y-4">
                                                {selectedInspection.inspection_damages.map((damage, index) => (
                                                    <div
                                                        key={damage.id}
                                                        className="bg-gray-50 rounded-lg p-4"
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            {damage.damage_photo_url && (
                                                                <img
                                                                    src={damage.damage_photo_url}
                                                                    alt="Damage"
                                                                    className="w-24 h-24 object-cover rounded-lg"
                                                                />
                                                            )}
                                                            <div className="flex-1">
                                                                <div className="font-medium text-gray-900">
                                                                    {damage.damage_category?.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {damage.damage_category?.type}
                                                                </div>
                                                                {damage.notes && (
                                                                    <p className="text-sm text-gray-600 mt-1">
                                                                        {damage.notes}
                                                                    </p>
                                                                )}
                                                                <div className="mt-3 grid grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="block text-xs text-gray-500 mb-1">
                                                                            Tingkat Keparahan
                                                                        </label>
                                                                        <select
                                                                            value={reviewData.checker_damages[index]?.severity || 'medium'}
                                                                            onChange={(e) => {
                                                                                const updated = [...reviewData.checker_damages];
                                                                                updated[index] = {
                                                                                    ...updated[index],
                                                                                    severity: e.target.value as any,
                                                                                };
                                                                                setReviewData({
                                                                                    ...reviewData,
                                                                                    checker_damages: updated,
                                                                                });
                                                                            }}
                                                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                                                        >
                                                                            <option value="low">Rendah</option>
                                                                            <option value="medium">Sedang</option>
                                                                            <option value="high">Tinggi</option>
                                                                            <option value="critical">Kritis</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-gray-500 mb-1">
                                                                            Masih Berfungsi
                                                                        </label>
                                                                        <select
                                                                            value={reviewData.checker_damages[index]?.is_functional ? 'true' : 'false'}
                                                                            onChange={(e) => {
                                                                                const updated = [...reviewData.checker_damages];
                                                                                updated[index] = {
                                                                                    ...updated[index],
                                                                                    is_functional: e.target.value === 'true',
                                                                                };
                                                                                setReviewData({
                                                                                    ...reviewData,
                                                                                    checker_damages: updated,
                                                                                });
                                                                            }}
                                                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                                                        >
                                                                            <option value="true">Ya</option>
                                                                            <option value="false">Tidak</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Catatan checker untuk kerusakan ini..."
                                                                        value={reviewData.checker_damages[index]?.checker_notes || ''}
                                                                        onChange={(e) => {
                                                                            const updated = [...reviewData.checker_damages];
                                                                            updated[index] = {
                                                                                ...updated[index],
                                                                                checker_notes: e.target.value,
                                                                            };
                                                                            setReviewData({
                                                                                ...reviewData,
                                                                                checker_damages: updated,
                                                                            });
                                                                        }}
                                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowReviewModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSubmitReview}
                                    disabled={submitReviewMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                                >
                                    {submitReviewMutation.isPending ? (
                                        <>
                                            <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                                            Kirim Review
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CheckerPendingReviewPage;
