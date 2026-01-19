import React from 'react';
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon,
    UserIcon
} from '@heroicons/react/24/outline';

const TimelineStep = ({ title, status, date, user, notes, isLast }) => {
    let icon, colorClass, borderClass;

    switch (status) {
        case 'completed':
        case 'approved':
            icon = <CheckCircleIcon className="h-5 w-5 text-white" />;
            colorClass = 'bg-emerald-500';
            borderClass = 'border-emerald-500';
            break;
        case 'rejected':
            icon = <XCircleIcon className="h-5 w-5 text-white" />;
            colorClass = 'bg-red-500';
            borderClass = 'border-red-500';
            break;
        case 'current':
            icon = <ClockIcon className="h-5 w-5 text-amber-600" />;
            colorClass = 'bg-amber-100 border-2 border-amber-500';
            borderClass = 'border-gray-200'; // Line color
            break;
        default: // pending/future
            icon = <div className="h-2 w-2 bg-gray-400 rounded-full" />;
            colorClass = 'bg-gray-100 border-2 border-gray-300';
            borderClass = 'border-gray-200';
    }

    return (
        <div className="relative pb-8">
            {!isLast && (
                <span 
                    className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${status === 'completed' || status === 'approved' ? 'bg-emerald-500' : 'bg-gray-200'}`} 
                    aria-hidden="true" 
                />
            )}
            <div className="relative flex space-x-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white ${colorClass}`}>
                    {icon}
                </div>
                <div className="min-w-0 flex-1 pt-1.5 justify-between space-y-1">
                    <div>
                        <p className="text-sm font-medium text-gray-900">{title}</p>
                        {date && <p className="text-xs text-gray-500">{new Date(date).toLocaleString('id-ID')}</p>}
                    </div>
                    {user && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                            <UserIcon className="h-3 w-3" />
                            <span>{user.name}</span>
                        </div>
                    )}
                    {notes && (
                        <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                           <span className="font-semibold text-xs">Catatan:</span> {notes}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ApprovalTimeline = ({ inspection, approval }) => {
    // If approval is provided, use it. Otherwise try to find it in inspection.
    const repairApproval = approval || inspection?.repairApproval;
    const currentInspection = inspection || approval?.inspection;
    
    // Safety check - we need at least inspection data
    if (!currentInspection) return null;

    // Helper to determine status based on robust checks
    const getCheckerStatus = () => {
        if (currentInspection.checker_reviewed_at) {
            if (currentInspection.inspection_status?.includes('rejected_by_checker')) return 'rejected';
            return 'completed';
        }
        return 'current'; // Default valid starting state for checker
    };

    const getSupervisorStatus = () => {
        // If repair approval is decided (approved/rejected/completed/scheduled), step is completed
        if (repairApproval?.status && repairApproval?.status !== 'pending') {
            if (repairApproval.status === 'rejected') return 'rejected';
            return 'completed';
        }
        
        // If inspection is rejected by checker, this step is pending (skipped)
        if (currentInspection.inspection_status?.includes('rejected_by_checker')) return 'pending';
        
        // If checker approved, this is current
        if (currentInspection.checker_reviewed_at) return 'current';
        
        return 'pending';
    };

    const getSchedulingStatus = () => {
        if (repairApproval?.scheduled_at) return 'completed';
        
        if (repairApproval?.status === 'approved') return 'current';
        
        return 'pending';
    };

    const getRepairStatus = () => {
         if (repairApproval?.status === 'completed') return 'completed';
         
         if (repairApproval?.scheduled_at) return 'current'; // Technician working
         
         return 'pending';
    };

    const steps = [
        {
            id: 'inspection',
            title: 'Inspeksi & Pelaporan',
            status: 'completed',
            date: currentInspection.created_at,
            user: currentInspection.user,
            notes: currentInspection.notes
        },
        {
            id: 'checker',
            title: 'Review Checker',
            status: getCheckerStatus(),
            date: currentInspection.checker_reviewed_at,
            user: currentInspection.checker,
            notes: currentInspection.checker_notes
        },
        {
            id: 'supervisor',
            title: 'Review Supervisor',
            status: getSupervisorStatus(),
            date: repairApproval?.updated_at || currentInspection.reviewed_at, // Use approval updated_at if available
            user: repairApproval?.approver || currentInspection.reviewer,
            notes: repairApproval?.supervisor_notes || repairApproval?.rejection_reason || currentInspection.review_notes
        },
        {
             id: 'scheduling',
             title: 'Penjadwalan Admin',
             status: getSchedulingStatus(),
             date: repairApproval?.scheduled_at,
             // We don't track who scheduled it explicitly in simple view, but could be admin
             user: null, // Could add scheduler if tracked
             notes: repairApproval?.schedule_notes
        },
        {
            id: 'repair',
            title: 'Pelaksanaan Perbaikan',
            status: getRepairStatus(),
            date: repairApproval?.status === 'completed' ? repairApproval.completed_at : null,
            user: repairApproval?.assigned_technician_id ? { name: 'Teknisi' } : null, // Would be better with actual technician relation
            notes: repairApproval?.repair_notes
        },
        {
            id: 'completed',
            title: 'Selesai',
            status: repairApproval?.status === 'completed' ? 'completed' : 'pending',
            date: repairApproval?.status === 'completed' ? repairApproval.updated_at : null,
            user: null, 
            notes: null
        }
    ];

    return (
        <div className="flow-root">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline Perbaikan</h3>
            <ul role="list" className="-mb-8">
                {steps.map((step, stepIdx) => (
                    <li key={step.id}>
                        <TimelineStep 
                            {...step} 
                            isLast={stepIdx === steps.length - 1} 
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ApprovalTimeline;
