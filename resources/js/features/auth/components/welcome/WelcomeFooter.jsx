import React from 'react';
import { Link } from '@tanstack/react-router';

const WelcomeFooter = ({ scrollToSection, settings }) => {
    return (
        <footer className="bg-[#041562] text-white border-t border-[#11468F]/30 pt-16 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-10 lg:gap-12 pb-12 border-b border-white/10">
                    {/* Brand Info */}
                    <div className="col-span-2 space-y-4">
                        <div className="flex items-center gap-3">
                            <img 
                                src={settings.site_logo} 
                                alt={`${settings.site_name} Logo`} 
                                className="h-10 w-10 rounded-[6px] bg-white p-1 border border-white/20 shadow-sm"
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
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
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
                                        className="text-slate-300 hover:text-white transition-colors duration-150"
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                            <li className="pt-1">
                                <Link
                                    to="/login"
                                    className="text-white hover:text-blue-200 transition-colors duration-150 font-semibold"
                                >
                                    Login ke Sistem &rarr;
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Industrial Telemetry / System Specs */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                            Status Sistem
                        </h4>
                        <ul className="space-y-2 text-xs font-medium text-slate-300">
                            <li>
                                <span>Platform Status: Aktif & Terlindungi</span>
                            </li>
                            <li>
                                <span>Uptime: 99.98% High Availability</span>
                            </li>
                            <li>
                                <span>Lokasi: {settings.contact_address || 'FT Maos, Cilacap'}</span>
                            </li>
                            <li>
                                <span>Versi: v2.0 (Integrated APAR Management)</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300 font-medium">
                    <p>
                        &copy; {new Date().getFullYear()} {settings.site_name}. {settings.footer_copyright}
                    </p>
                    <div className="flex items-center gap-4 text-slate-400">
                        <span>Standar NFPA 10 Compliant</span>
                        <span>&bull;</span>
                        <span>Pertamina Health, Safety, Security & Environment (HSSE)</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default WelcomeFooter;
