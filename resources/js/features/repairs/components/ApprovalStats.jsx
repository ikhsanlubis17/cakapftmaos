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
                            className="bg-white border border-slate-200 rounded-[6px] p-5 shadow-sm hover:border-[#11468F] transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                        {stat.name}
                                    </p>
                                    <p className="text-3xl font-black text-slate-900 tracking-tight">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`w-11 h-11 ${stat.bgColor} border ${stat.borderColor} rounded-[6px] flex items-center justify-center`}>
                                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Additional Metrics */}
            <div className="bg-slate-50 border border-slate-200 rounded-[6px] p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center sm:border-r sm:border-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Total Permohonan</p>
                        <p className="text-2xl font-black text-slate-900">{total}</p>
                    </div>
                    <div className="text-center sm:border-r sm:border-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Tingkat Persetujuan</p>
                        <div className="flex items-center justify-center gap-2">
                            <p className="text-2xl font-black text-emerald-600">{approvalRate}%</p>
                            {approvalRate > 50 && (
                                <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-600" />
                            )}
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Tingkat Penolakan</p>
                        <div className="flex items-center justify-center gap-2">
                            <p className="text-2xl font-black text-rose-600">{rejectionRate}%</p>
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
