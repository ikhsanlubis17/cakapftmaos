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

export function getConditionBadgeConfig(condition?: string): StatusBadgeConfig;
export function getAparStatusConfig(status?: string): StatusBadgeConfig;
export function getLocationTypeConfig(type?: string): LocationTypeConfig;
