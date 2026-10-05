import React from 'react';
import { Link } from '@tanstack/react-router';

const WelcomeFooter = ({ scrollToSection, settings }) => {
    // Pastikan teks copyright rapi dan tidak dobel tahun / nama sistem
    const renderCopyright = () => {
        const year = new Date().getFullYear();
        const siteName = settings.site_name || 'CAKAP FT MAOS';
        const rawCopyright = settings.footer_copyright || 'All rights reserved.';

        // Jika teks copyright dari database/pengaturan sudah memuat simbol © atau nama sistem, sederhanakan
        if (rawCopyright.includes('©') || rawCopyright.includes(siteName)) {
            return `© ${year} ${siteName}. All rights reserved.`;
        }

        return `© ${year} ${siteName}. ${rawCopyright}`;
    };

    return (
        <footer className="bg-[#041562] text-white border-t border-[#11468F]/40 pt-16 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-white/10">
                    {/* Brand Info (Spans 2 columns on tablet and desktop, 1 on mobile) */}
                    <div className="sm:col-span-2 space-y-4">
                        <div 
                            className="flex items-center gap-3 cursor-pointer group w-fit"
                            onClick={() => scrollToSection('hero')}
                        >
                            <img 
                                src={settings.site_logo} 
                                alt={`${settings.site_name} Logo`} 
                                className="h-10 w-10 rounded-[6px] bg-white p-1 border border-white/20 shadow-sm transition-transform duration-150 group-hover:scale-105"
                            />
                            <div>
                                <div className="text-xl font-bold tracking-tight text-white">
                                    {settings.site_name}
                                </div>
                                <div className="text-xs text-slate-300 font-medium">
                                    {settings.site_tagline}
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md font-normal">
                            Platform monitoring dan pemeliharaan APAR terpadu untuk memastikan standar keselamatan operasional tertinggi di wilayah kerja {settings.organization_name}.
                        </p>

                        <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-slate-300 font-medium">Sistem Monitoring Aktif & Terlindungi</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/10 pb-2 sm:border-0 sm:pb-0">
                            Navigasi Cepat
                        </h4>
                        <ul className="space-y-2.5 text-xs font-medium">
                            {[
                                { id: 'about', label: 'Tentang Sistem' },
                                { id: 'features', label: 'Fitur Utama' },
                                { id: 'workflow', label: 'Alur Kerja' },
                                { id: 'roles', label: 'Peran Pengguna' }
                            ].map((item) => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => scrollToSection(item.id)}
                                        className="text-slate-300 hover:text-white transition-colors duration-150 inline-flex items-center gap-1.5 py-0.5"
                                    >
                                        <span className="text-slate-400">&rsaquo;</span>
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                            <li className="pt-2">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#11468F] hover:bg-[#0d3873] text-white rounded-[4px] text-xs font-semibold shadow-xs transition-colors duration-150"
                                >
                                    Masuk ke Sistem &rarr;
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Industrial Telemetry / System Specs */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/10 pb-2 sm:border-0 sm:pb-0">
                            Status Sistem
                        </h4>
                        <ul className="space-y-2.5 text-xs font-medium text-slate-300">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">&bull;</span>
                                <div>
                                    <span className="text-white">Uptime Server:</span> 99.98% High Availability
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 font-bold">&bull;</span>
                                <div>
                                    <span className="text-white">Lokasi Operasional:</span> {settings.contact_address || 'Jl. Stasiun No. 1, Maos, Cilacap'}
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-slate-400 font-bold">&bull;</span>
                                <div>
                                    <span className="text-white">Versi Aplikasi:</span> v2.0 (Integrated APAR Management)
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-amber-400 font-bold">&bull;</span>
                                <div>
                                    <span className="text-white">Protokol Keamanan:</span> Geofencing GPS & JWT Dual-Auth
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar: Single Clean Copyright & HSSE Badges */}
                <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-300 font-medium text-center md:text-left">
                    <p className="tracking-wide">
                        {renderCopyright()}
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 sm:gap-4 text-slate-400 text-[11px] sm:text-xs">
                        <span className="inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Standar NFPA 10 Compliant
                        </span>
                        <span className="hidden sm:inline text-slate-500">&bull;</span>
                        <span>Pertamina Health, Safety, Security & Environment (HSSE)</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default WelcomeFooter;
