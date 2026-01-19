import React from 'react';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/solid';

const ApprovalTimeline = ({ approval }) => {
    if (!approval || !approval.inspection) return null;

    const { inspection } = approval;

    // Helper to determine status based on inspection and approval state
    const steps = [
        {
            id: 'inspection',
            name: 'Inspeksi & Pelaporan',
            description: 'Inspeksi Selesai',
            completed: true,
            date: inspection.created_at,
        },
        {
            id: 'checker',
            name: 'Review Checker',
            description: 'Verifikasi Checker',
            completed: !!inspection.checker_reviewed_at,
            rejected: inspection.inspection_status?.includes('rejected_by_checker'),
            date: inspection.checker_reviewed_at,
        },
        {
            id: 'supervisor',
            name: 'Review Supervisor',
            description: 'Keputusan Supervisor',
            completed: !!approval.decision_made_at || !!approval.approved_at || approval.status !== 'pending',
            rejected: approval.status === 'rejected' && !inspection.inspection_status?.includes('rejected_by_checker'), // Only mark rejected if it was supervisor who rejected
            date: approval.decision_made_at || approval.approved_at,
        },
        {
            id: 'decision',
            name: 'Disetujui',
            description: 'Izin Perbaikan',
            completed: approval.status === 'approved',
            rejected: approval.status === 'rejected' || inspection.inspection_status?.includes('rejected_by_checker'), // Rejected at any prior point affects this milestone? Actually if rejected, this step is "reached but failed".
            // Let's stick to "completed" = green. If rejected, it stays incomplete or we mark this step specifically?
            // User requested "Disetujui" as a step. If rejected, we probably shouldn't show "Disetujui" as completed.
            // But if rejected, the flow stops. Visuals should reflect rejection.
            // If rejected, let's mark this step as "Ditolak" visually if it reached here.
            date: approval.approved_at || (approval.status === 'rejected' ? approval.decision_made_at : null),
            customLabel: approval.status === 'rejected' || inspection.inspection_status?.includes('rejected_by_checker') ? 'Ditolak' : 'Disetujui'
        },
        {
            id: 'repair',
            name: 'Perbaikan',
            description: 'Proses Perbaikan',
            completed: inspection.repair_status === 'completed',
            skip: approval.status !== 'approved', // Skip/Hide if not approved (optional, or just grey out)
            date: null,
        },
        {
            id: 'completed',
            name: 'Selesai',
            description: 'Verifikasi Akhir',
            completed: inspection.repair_status === 'completed',
            skip: approval.status !== 'approved',
            date: inspection.repair_status === 'completed' ? inspection.updated_at : null,
        }
    ];

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="py-4">
            <nav aria-label="Progress">
                <ol role="list" className="flex items-center justify-between">
                    {steps.filter(step => !step.skip).map((step, stepIdx) => (
                        <li
                            key={step.id}
                            className={`relative ${
                                stepIdx !== steps.filter(s => !s.skip).length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''
                            }`}
                        >
                            {/* Connector Line */}
                            {stepIdx !== steps.filter(s => !s.skip).length - 1 && (
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div
                                        className={`h-0.5 w-full ${
                                            step.completed
                                                ? step.rejected
                                                    ? 'bg-rose-300'
                                                    : 'bg-emerald-300'
                                                : 'bg-gray-200'
                                        }`}
                                    />
                                </div>
                            )}

                            {/* Step Circle */}
                            <div className="relative flex flex-col items-center group">
                                <span className="flex h-9 w-9 items-center justify-center">
                                    {step.completed ? (
                                        step.rejected ? (
                                            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 border-2 border-rose-500">
                                                <XCircleIcon className="h-5 w-5 text-rose-600" aria-hidden="true" />
                                            </span>
                                        ) : (
                                            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 border-2 border-emerald-500">
                                                <CheckCircleIcon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                                            </span>
                                        )
                                    ) : (
                                        <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                                            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                                        </span>
                                    )}
                                </span>

                                {/* Step Label */}
                                <span className="mt-2 text-center">
                                    <span
                                        className={`text-xs font-medium ${
                                            step.completed
                                                ? step.rejected
                                                    ? 'text-rose-600'
                                                    : 'text-emerald-600'
                                                : 'text-gray-500'
                                        }`}
                                    >
                                        {step.customLabel || step.name}
                                    </span>
                                    {step.date && (
                                        <span className="block text-xs text-gray-400 mt-0.5">
                                            {formatDate(step.date)}
                                        </span>
                                    )}
                                </span>
                            </div>
                        </li>
                    ))}
                </ol>
            </nav>
        </div>
    );
};

export default ApprovalTimeline;
