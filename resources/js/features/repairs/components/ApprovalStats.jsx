import React from 'react';
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

const ApprovalStats = ({ stats = {} }) => {
    const {
        total = 0,
        pending = 0,
        approved = 0,
        rejected = 0,
        completed = 0,
    } = stats;

    const statCards = [
        {
            name: 'Menunggu',
            value: pending,
            icon: ClockIcon,
            color: 'amber',
            bgColor: 'bg-amber-50',
            iconColor: 'text-amber-600',
            borderColor: 'border-amber-200',
        },
        {
            name: 'Disetujui',
            value: approved,
            icon: CheckCircleIcon,
            color: 'emerald',
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            borderColor: 'border-emerald-200',
        },
        {
            name: 'Ditolak',
            value: rejected,
            icon: XCircleIcon,
            color: 'rose',
            bgColor: 'bg-rose-50',
            iconColor: 'text-rose-600',
            borderColor: 'border-rose-200',
        },
        {
            name: 'Selesai',
            value: completed,
            icon: CheckCircleIcon,
            color: 'blue',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
            borderColor: 'border-blue-200',
        },
    ];

    // Calculate percentages
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : 0;
    const rejectionRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-4">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.name}
                            className={`${stat.bgColor} border ${stat.borderColor} rounded-xl p-4 hover:shadow-md transition-all duration-200`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600 mb-1">
                                        {stat.name}
                                    </p>
                                    <p className={`text-3xl font-bold ${stat.iconColor}`}>
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Additional Metrics */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Total Persetujuan</p>
                        <p className="text-2xl font-bold text-gray-900">{total}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Tingkat Persetujuan</p>
                        <div className="flex items-center justify-center gap-2">
                            <p className="text-2xl font-bold text-emerald-600">{approvalRate}%</p>
                            {approvalRate > 50 && (
                                <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-600" />
                            )}
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Tingkat Penolakan</p>
                        <div className="flex items-center justify-center gap-2">
                            <p className="text-2xl font-bold text-rose-600">{rejectionRate}%</p>
                            {rejectionRate > 30 && (
                                <ArrowTrendingDownIcon className="h-5 w-5 text-rose-600" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApprovalStats;
