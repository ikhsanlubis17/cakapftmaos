import React from 'react';
import { Link } from '@tanstack/react-router';
import { 
    PlayIcon, 
    ArrowRightIcon, 
    ChartBarIcon, 
    ShieldCheckIcon, 
    BellIcon,
    FireIcon
} from '@heroicons/react/24/outline';

const WelcomeAbout = ({ scrollToSection, settings }) => {
    const highlights = [
        {
            icon: ShieldCheckIcon,
            title: 'Keamanan Data & Integritas',
            description: 'Setiap entri inspeksi diverifikasi secara kriptografis dan dilindungi audit log tanpa celah manipulasi.'
        },
        {
            icon: ChartBarIcon,
            title: 'Analitik & Pelaporan Siaga',
            description: 'Akses instan rekapitulasi status tabung, masa uji hidrostatik, dan tren kerusakan di seluruh area instalasi.'
        },
        {
            icon: BellIcon,
            title: 'Preventive Alert System',
            description: 'Notifikasi otomatis untuk jadwal penggantian isi, perbaikan komponen rusak, dan uji berkala.'
        }
    ];

    return (
        <section id="about" className="py-24 bg-[#EEEEEE] text-slate-900 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                    {/* Left Column */}
                    <div className="lg:col-span-6 space-y-7 text-center lg:text-left">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-[20px] mb-4">
                                <FireIcon className="h-4 w-4 text-[#11468F]" />
                                <span className="text-xs font-bold text-[#041562] tracking-wider uppercase">
                                    Tentang Sistem
                                </span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#041562] tracking-tight leading-tight">
                                {settings.site_name}
                            </h2>
                        </div>
                        
                        <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                            <p>
                                {settings.site_description || `${settings.site_name} adalah platform monitoring aset proteksi kebakaran terintegrasi yang dirancang untuk menjamin keandalan 100% seluruh unit APAR di wilayah operasional ${settings.organization_name}.`}
                            </p>
                            <p>
                                Menggabungkan teknologi verifikasi geofencing GPS, bukti visual kamera gawai langsung, dan mekanisme persetujuan perbaikan berjenjang untuk mencegah kegagalan tanggap darurat saat insiden terjadi.
                            </p>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start pt-2">
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center px-6 py-3 bg-[#11468F] text-white text-sm font-semibold rounded-[6px] hover:bg-[#0d3873] shadow-sm transition-all duration-200"
                            >
                                <PlayIcon className="h-4 w-4 mr-2" />
                                Akses Dashboard
                                <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </Link>
                            
                            <button
                                onClick={() => scrollToSection('features')}
                                className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#041562] border border-slate-300 text-sm font-semibold rounded-[6px] hover:bg-slate-50 transition-all duration-200"
                            >
                                <ChartBarIcon className="h-4 w-4 mr-2 text-[#11468F]" />
                                Pelajari Fitur
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Industrial Card List */}
                    <div className="lg:col-span-6 space-y-4">
                        {highlights.map((item, index) => (
                            <div 
                                key={index}
                                className="bg-white rounded-[6px] p-6 border border-slate-200 hover:border-[#11468F] hover:shadow-sm transition-all duration-200"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-11 h-11 rounded-[6px] bg-[#041562] flex items-center justify-center text-white flex-shrink-0">
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-[#041562] mb-1 tracking-tight">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WelcomeAbout;
