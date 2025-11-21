import React from 'react';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/solid';

const ApprovalTimeline = ({ status, approvedAt, rejectedAt, completedAt, createdAt }) => {
    const steps = [
        {
            id: 'inspection',
            name: 'Inspeksi',
            description: 'Inspeksi dilakukan',
            completed: true,
            date: createdAt,
        },
        {
            id: 'pending',
            name: 'Menunggu',
            description: 'Menunggu persetujuan',
            completed: status !== 'pending',
            date: createdAt,
        },
        {
            id: 'decision',
            name: status === 'rejected' ? 'Ditolak' : 'Disetujui',
            description: status === 'rejected' ? 'Perbaikan ditolak' : 'Perbaikan disetujui',
            completed: status === 'approved' || status === 'rejected' || status === 'completed',
            rejected: status === 'rejected',
            date: approvedAt || rejectedAt,
        },
        {
            id: 'repair',
            name: 'Perbaikan',
            description: 'Proses perbaikan',
            completed: status === 'completed',
            date: null,
            skip: status === 'rejected',
        },
        {
            id: 'completed',
            name: 'Selesai',
            description: 'Perbaikan selesai',
            completed: status === 'completed',
            date: completedAt,
            skip: status === 'rejected',
        },
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
                                        {step.name}
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
