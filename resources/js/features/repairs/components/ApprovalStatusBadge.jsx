import React from 'react';
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const ApprovalStatusBadge = ({ status, size = 'md', showIcon = true }) => {
    const statusConfig = {
        pending: {
            color: 'bg-amber-50 text-amber-700 border-amber-200',
            icon: ClockIcon,
            text: 'Menunggu',
            dotColor: 'bg-amber-500',
        },
        approved: {
            color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            icon: CheckCircleIcon,
            text: 'Disetujui',
            dotColor: 'bg-emerald-500',
        },
        rejected: {
            color: 'bg-rose-50 text-rose-700 border-rose-200',
            icon: XCircleIcon,
            text: 'Ditolak',
            dotColor: 'bg-rose-500',
        },
        completed: {
            color: 'bg-blue-50 text-blue-700 border-blue-200',
            icon: CheckCircleIcon,
            text: 'Selesai',
            dotColor: 'bg-blue-500',
        },
        needs_reinspection: {
            color: 'bg-orange-50 text-orange-700 border-orange-200',
            icon: ExclamationTriangleIcon,
            text: 'Perlu Inspeksi Ulang',
            dotColor: 'bg-orange-500',
        },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
    };

    const iconSizes = {
        sm: 'h-3 w-3',
        md: 'h-3.5 w-3.5',
        lg: 'h-4 w-4',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.color} ${sizeClasses[size]}`}
        >
            {showIcon && <Icon className={iconSizes[size]} />}
            {config.text}
        </span>
    );
};

export default ApprovalStatusBadge;
