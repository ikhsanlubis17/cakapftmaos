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

/**
 * Evaluates APAR expiration status and days remaining.
 * Aligns with Pertamina early warning telemetry (<30 days = warning, <=0 days = expired).
 */
export const getAparExpiryConfig = (expiredAt) => {
    if (!expiredAt) {
        return {
            status: 'unknown',
            daysRemaining: null,
            text: 'Tanggal Exp Tidak Ada',
            color: 'bg-slate-100 text-slate-700 border-slate-200',
            badgeClass: 'status-inactive',
            isExpired: false,
            isWarning: false,
        };
    }

    const expDate = new Date(expiredAt);
    const today = new Date();
    // Normalize to midnight UTC/local
    expDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return {
            status: 'expired',
            daysRemaining: diffDays,
            text: `Kedaluwarsa (${Math.abs(diffDays)} hari lalu)`,
            shortText: 'Kedaluwarsa',
            color: 'bg-rose-50 text-rose-700 border-rose-200',
            dotColor: 'bg-rose-500',
            isExpired: true,
            isWarning: false,
        };
    }

    if (diffDays <= 30) {
        return {
            status: 'expiring_soon',
            daysRemaining: diffDays,
            text: diffDays === 0 ? 'Kedaluwarsa Hari Ini' : `Kedaluwarsa dlm ${diffDays} hari`,
            shortText: `${diffDays} hari lagi`,
            color: 'bg-amber-50 text-amber-700 border-amber-200',
            dotColor: 'bg-amber-500',
            isExpired: false,
            isWarning: true,
        };
    }

    return {
        status: 'active',
        daysRemaining: diffDays,
        text: `Aktif (${diffDays} hari lagi)`,
        shortText: 'Masa Berlaku Aktif',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
        isExpired: false,
        isWarning: false,
    };
};

/**
 * Resolves the physical mounting position of an APAR on a Pertamina BBM Tank Truck.
 */
export const getTruckAparPosition = (serialNumber) => {
    const s = (serialNumber || '').toUpperCase();

    if (s.includes('CO2-1')) {
        return {
            slot: 'CO2-1',
            zone: 'Kabin Depan (Sisi Kiri/Sopir)',
            type: 'CO2 3 KG',
            tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
    }
    if (s.includes('CO2-2')) {
        return {
            slot: 'CO2-2',
            zone: 'Kabin Depan (Sisi Kanan/Kernet)',
            type: 'CO2 3 KG',
            tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
    }
    if (s.includes('DCP-CARTRIDGE') || s.includes('DCP-C')) {
        return {
            slot: 'DCP-Cartridge',
            zone: 'Sisi Tangki Kanan (Tengah Tangki)',
            type: 'DCP Cartridge 6 KG',
            tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
        };
    }
    if (s.includes('DCP-PRESSURE-2')) {
        return {
            slot: 'DCP-Pressure-2',
            zone: 'Sisi Tangki Kanan (Stored Pressure)',
            type: 'DCP Pressure 6 KG',
            tagColor: 'bg-sky-50 text-sky-700 border-sky-200',
        };
    }
    if (s.includes('DCP-PRESSURE')) {
        return {
            slot: 'DCP-Pressure',
            zone: 'Sisi Tangki Kiri (Stored Pressure)',
            type: 'DCP Pressure 6 KG',
            tagColor: 'bg-sky-50 text-sky-700 border-sky-200',
        };
    }
    if (s.includes('FOAM-1')) {
        return {
            slot: 'FOAM-1',
            zone: 'Sisi Tangki Kiri (Belakang Tangki)',
            type: 'AFFF Foam 9 Liter',
            tagColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        };
    }
    if (s.includes('FOAM')) {
        return {
            slot: 'FOAM-2',
            zone: 'Sisi Tangki Kanan (Belakang Tangki)',
            type: 'AFFF Foam 9 Liter',
            tagColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        };
    }

    return {
        slot: 'APAR-Mobile',
        zone: 'Bodi Mobil Tangki',
        type: 'APAR Mobile',
        tagColor: 'bg-slate-50 text-slate-700 border-slate-200',
    };
};

/**
 * Calculates overall HSSE Fit-to-Work compliance for a Tank Truck.
 */
export const getTruckComplianceSummary = (apars = []) => {
    const total = apars.length;
    let expired = 0;
    let warning = 0;
    let active = 0;
    let needsRepair = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    apars.forEach((apar) => {
        if (apar.status === 'needs_repair' || apar.status === 'under_repair') {
            needsRepair++;
        }

        if (apar.expired_at) {
            const exp = new Date(apar.expired_at);
            exp.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
                expired++;
            } else if (diffDays <= 30) {
                warning++;
            } else {
                active++;
            }
        } else {
            active++;
        }
    });

    const isFitToWork = total > 0 && expired === 0 && needsRepair === 0;

    if (total === 0) {
        return {
            isFitToWork: false,
            badge: {
                color: 'bg-slate-100 text-slate-600 border-slate-200',
                text: 'Belum Ada APAR',
            },
            total,
            active,
            expired,
            warning,
            needsRepair,
        };
    }

    if (expired > 0 || needsRepair > 0) {
        return {
            isFitToWork: false,
            badge: {
                color: 'bg-rose-50 text-rose-700 border-rose-200',
                text: `${expired + needsRepair} APAR Tidak Siap`,
            },
            total,
            active,
            expired,
            warning,
            needsRepair,
        };
    }

    if (warning > 0) {
        return {
            isFitToWork: true,
            badge: {
                color: 'bg-amber-50 text-amber-700 border-amber-200',
                text: `${warning} APAR Segera Kedaluwarsa`,
            },
            total,
            active,
            expired,
            warning,
            needsRepair,
        };
    }

    return {
        isFitToWork: true,
        badge: {
            color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            text: 'Siap Operasi (Fit to Work)',
        },
        total,
        active,
        expired,
        warning,
        needsRepair,
    };
};

