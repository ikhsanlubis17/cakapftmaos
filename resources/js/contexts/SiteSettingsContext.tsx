import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SiteSettings {
    site_name: string;
    site_tagline: string;
    site_description: string;
    site_logo: string;
    organization_name: string;
    contact_email: string;
    contact_phone: string;
    contact_address: string;
    footer_copyright: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
    site_name: 'CAKAP FT MAOS',
    site_tagline: 'Sistem Monitoring & Inspeksi APAR',
    site_description: 'Sistem Monitoring APAR Terintegrasi Fuel Terminal Maos. Pantau kesiapan alat pemadam api ringan secara real-time, akurat, dan terstandarisasi.',
    site_logo: '/images/logo2.svg',
    organization_name: 'Pertamina Fuel Terminal Maos',
    contact_email: 'support@cakap-maos.com',
    contact_phone: '+62 282 123456',
    contact_address: 'Jl. Raya Maos No. 1, Cilacap, Jawa Tengah',
    footer_copyright: 'Pertamina Fuel Terminal Maos. Hak Cipta Dilindungi.',
};

declare global {
    interface Window {
        APP_CONFIG?: Partial<SiteSettings>;
    }
}

interface SiteSettingsContextType {
    settings: SiteSettings;
    isLoading: boolean;
    updateSettings: (newSettings: Partial<SiteSettings>) => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
    settings: DEFAULT_SITE_SETTINGS,
    isLoading: false,
    updateSettings: () => {},
});

export const useSiteSettings = () => {
    const context = useContext(SiteSettingsContext);
    if (!context) {
        throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
    }
    return context;
};

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SiteSettings>(() => {
        const initialConfig = typeof window !== 'undefined' ? window.APP_CONFIG : undefined;
        return {
            ...DEFAULT_SITE_SETTINGS,
            ...(initialConfig || {}),
        };
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        // If window.APP_CONFIG wasn't available at hydration, fetch asynchronously
        if (typeof window !== 'undefined' && !window.APP_CONFIG) {
            setIsLoading(true);
            fetch('/api/public-settings')
                .then((res) => res.json())
                .then((resData) => {
                    if (resData && resData.data) {
                        setSettings((prev) => ({
                            ...prev,
                            ...resData.data,
                        }));
                    }
                })
                .catch((err) => {
                    console.warn('Failed to load dynamic site settings, using defaults:', err);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, []);

    const updateSettings = (newSettings: Partial<SiteSettings>) => {
        setSettings((prev) => ({
            ...prev,
            ...newSettings,
        }));
    };

    return (
        <SiteSettingsContext.Provider value={{ settings, isLoading, updateSettings }}>
            {children}
        </SiteSettingsContext.Provider>
    );
};
