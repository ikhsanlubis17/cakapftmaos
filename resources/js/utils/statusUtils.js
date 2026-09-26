/**
 * Shared status badge styling and localization helpers.
 * Adheres to AGENTS.md Industrial Petrochemical Theme & Pertamina Design Tokens.
 */

export const getConditionBadgeConfig = (condition) => {
    switch (condition?.toLowerCase()) {
        case 'good':
        case 'baik':
        case 'siap_pakai':
            return {
                color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                text: 'Siap Pakai / Baik',
                variant: 'success',
            };
        case 'needs_repair':
        case 'perlu_perbaikan':
        case 'rusak':
            return {
                color: 'bg-rose-50 text-rose-700 border-rose-200',
                text: 'Perlu Perbaikan',
                variant: 'danger',
            };
        case 'pending':
        case 'menunggu':
            return {
                color: 'bg-amber-50 text-amber-700 border-amber-200',
                text: 'Menunggu',
                variant: 'warning',
            };
        default:
            return {
                color: 'bg-slate-50 text-slate-700 border-slate-200',
                text: condition || 'Tidak Diketahui',
                variant: 'default',
            };
    }
};

/**
 * APAR status styling & localization.
 * High-contrast border badges for field readability under harsh sunlight.
 */
export const getAparStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
        case 'active':
        case 'aktif':
            return {
                color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                text: 'Aktif',
                dotColor: 'bg-emerald-500',
            };
        case 'needs_repair':
        case 'perlu_perbaikan':
            return {
                color: 'bg-rose-50 text-rose-700 border-rose-200',
                text: 'Perlu Perbaikan',
                dotColor: 'bg-rose-500',
            };
        case 'under_repair':
        case 'sedang_perbaikan':
            return {
                color: 'bg-amber-50 text-amber-700 border-amber-200',
                text: 'Sedang Perbaikan',
                dotColor: 'bg-amber-500',
            };
        case 'inactive':
        case 'nonaktif':
            return {
                color: 'bg-slate-100 text-slate-700 border-slate-200',
                text: 'Nonaktif',
                dotColor: 'bg-slate-400',
            };
        default:
            return {
                color: 'bg-slate-50 text-slate-700 border-slate-200',
                text: status || 'Tidak Diketahui',
                dotColor: 'bg-slate-400',
            };
    }
};

/**
 * Location type styling & localization (Statis vs Mobil).
 */
export const getLocationTypeConfig = (type) => {
    switch (type?.toLowerCase()) {
        case 'statis':
            return {
                text: 'Statis',
                color: 'text-blue-700 bg-blue-50 border-blue-200',
                iconColor: 'text-blue-600',
            };
        case 'mobile':
        case 'mobil':
            return {
                text: 'Mobil Tangki',
                color: 'text-purple-700 bg-purple-50 border-purple-200',
                iconColor: 'text-purple-600',
            };
        default:
            return {
                text: type || 'Statis',
                color: 'text-slate-700 bg-slate-50 border-slate-200',
                iconColor: 'text-slate-600',
            };
    }
};
