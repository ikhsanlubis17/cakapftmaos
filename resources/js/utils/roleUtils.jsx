import React from 'react';
import {
    ShieldCheckIcon,
    UserGroupIcon,
    UserIcon,
} from '@heroicons/react/24/outline';

export const getRoleDisplayName = (role) => {
    switch (role?.toLowerCase()) {
        case 'admin':
            return 'Administrator';
        case 'supervisor':
            return 'Supervisor';
        case 'teknisi':
            return 'Teknisi';
        default:
            return role || 'Pengguna';
    }
};

export const getRoleText = (role) => getRoleDisplayName(role);

export const getRoleIcon = (role, className = 'w-4 h-4') => {
    switch (role?.toLowerCase()) {
        case 'admin':
            return <ShieldCheckIcon className={className} />;
        case 'supervisor':
            return <UserGroupIcon className={className} />;
        case 'teknisi':
            return <UserIcon className={className} />;
        default:
            return <UserIcon className={className} />;
    }
};

export const getRoleBadgeClasses = (role) => {
    switch (role?.toLowerCase()) {
        case 'admin':
            return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'supervisor':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'teknisi':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        default:
            return 'bg-slate-50 text-slate-700 border-slate-200';
    }
};
