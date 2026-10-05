export interface StatusBadgeConfig {
    color: string;
    text: string;
    variant?: string;
    dotColor?: string;
}

export interface LocationTypeConfig {
    text: string;
    color: string;
    iconColor: string;
}

export interface AparExpiryConfig {
    status: 'active' | 'expiring_soon' | 'expired' | 'unknown';
    daysRemaining: number | null;
    text: string;
    shortText?: string;
    color: string;
    dotColor?: string;
    badgeClass?: string;
    isExpired: boolean;
    isWarning: boolean;
}

export interface TruckAparPosition {
    slot: string;
    zone: string;
    type: string;
    tagColor: string;
}

export interface TruckComplianceSummary {
    isFitToWork: boolean;
    badge: {
        color: string;
        text: string;
    };
    total: number;
    active: number;
    expired: number;
    warning: number;
    needsRepair: number;
}

export function getConditionBadgeConfig(condition?: string): StatusBadgeConfig;
export function getAparStatusConfig(status?: string): StatusBadgeConfig;
export function getLocationTypeConfig(type?: string): LocationTypeConfig;
export function getAparExpiryConfig(expiredAt?: string | null): AparExpiryConfig;
export function getTruckAparPosition(serialNumber?: string): TruckAparPosition;
export function getTruckComplianceSummary(apars?: any[]): TruckComplianceSummary;
