import React from 'react';
import { Link } from '@tanstack/react-router';
import { 
    PlayIcon, 
    ArrowRightIcon, 
    ChartBarIcon, 
    QrCodeIcon, 
    ShieldCheckIcon,
    MapPinIcon,
    CameraIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

const WelcomeHero = ({ scrollToSection, settings }) => {
    return (
        <section id="hero" className="relative min-h-screen flex items-center bg-[#041562] text-white overflow-hidden pt-24 pb-16 lg:py-0">
            {/* Background Texture & Subtle Depth */}
            <div className="absolute inset-0 pointer-events-none">
                <div 
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#11468F] rounded-full blur-3xl opacity-40"></div>
                <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-[#11468F] rounded-full blur-3xl opacity-30"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                    {/* Left Column: Headline & Action */}
                    <div className="lg:col-span-7 text-center lg:text-left space-y-6">
                        {/* Pill Badge */}
                        <div className="inline-flex items-center px-3 py-1.5 bg-white/10 border border-white/20 rounded-[6px] shadow-sm">
                            <span className="text-xs font-semibold text-white tracking-wide uppercase">
                                Industrial Asset & Safety Management
                            </span>
                        </div>

                        {/* Display Headline */}
                        <div className="space-y-4">
                            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-bold text-white leading-[1.2] tracking-tight">
                                Sistem Monitoring APAR Berstandar Industrial.
                            </h1>
                            <p className="text-base sm:text-lg text-slate-200 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Optimalkan kepatuhan inspeksi, cegah risiko kegagalan darurat, dan pantau seluruh APAR statis serta armada mobil tangki dengan validasi GPS & kamera real-time.
                            </p>
                        </div>

                        {/* Key Spec Badges */}
                        <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start pt-1">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-white/10 border border-white/15 text-xs font-medium text-white">
                                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                                Validasi Geofence 30m
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-white/10 border border-white/15 text-xs font-medium text-white">
                                <CameraIcon className="w-4 h-4 text-emerald-400" />
                                Kamera Langsung (Anti-Manipulasi)
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-white/10 border border-white/15 text-xs font-medium text-white">
                                <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                                Audit Log Terverifikasi
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start pt-2">
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center px-6 py-3 bg-[#11468F] text-white text-sm font-semibold rounded-[6px] shadow-sm hover:bg-[#0d3873] transition-colors duration-150"
                            >
                                <PlayIcon className="h-4 w-4 mr-2" />
                                Masuk Sistem
                                <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </Link>
                            
                            <button
                                onClick={() => scrollToSection('features')}
                                className="inline-flex items-center justify-center px-6 py-3 bg-transparent text-white border border-white/30 text-sm font-semibold rounded-[6px] hover:bg-white/10 transition-colors duration-150"
                            >
                                <ChartBarIcon className="h-4 w-4 mr-2 text-slate-200" />
                                Pelajari Fitur
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Telemetry Card */}
                    <div className="lg:col-span-5 relative flex justify-center">
                        <div className="relative w-full max-w-md">
                            {/* Main Card Container */}
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[6px] p-6 shadow-xl space-y-5">
                                {/* Header bar */}
                                <div className="flex items-center justify-between pb-3.5 border-b border-white/15">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-white">
                                            Terminal Inspeksi Terintegrasi
                                        </span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        AKTIF
                                    </span>
                                </div>

                                {/* QR Scan Focus Panel */}
                                <div className="bg-[#041562]/80 border border-white/15 rounded-[6px] p-6 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-[6px] bg-[#11468F] border border-white/20 mb-3 text-white shadow-sm">
                                        <QrCodeIcon className="h-9 w-9" />
                                    </div>

                                    <h3 className="text-base font-bold text-white tracking-tight">
                                        Scan QR APAR
                                    </h3>
                                    <p className="text-xs text-slate-300 mt-1">
                                        Deteksi otomatis nomor seri & riwayat pemeliharaan
                                    </p>
                                </div>

                                {/* Live Telemetry Metrics */}
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div className="p-3 bg-white/5 border border-white/15 rounded-[4px]">
                                        <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                                            <MapPinIcon className="w-3.5 h-3.5 text-slate-200" />
                                            GPS Radius
                                        </div>
                                        <div className="text-sm font-bold text-white mt-1">
                                            &le; 30 Meter
                                        </div>
                                        <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                                            &bull; Terverifikasi
                                        </div>
                                    </div>

                                    <div className="p-3 bg-white/5 border border-white/15 rounded-[4px]">
                                        <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                                            <CameraIcon className="w-3.5 h-3.5 text-slate-200" />
                                            Foto Kamera
                                        </div>
                                        <div className="text-sm font-bold text-white mt-1">
                                            Kamera Langsung
                                        </div>
                                        <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                                            &bull; Anti-Manipulasi
                                        </div>
                                    </div>
                                </div>

                                {/* Status Footer */}
                                <div className="pt-2 flex items-center justify-between text-xs text-slate-300 border-t border-white/10">
                                    <span>Lokasi: FT Maos Cilacap</span>
                                    <span className="font-semibold text-emerald-300">Siaga Operasional</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WelcomeHero;
