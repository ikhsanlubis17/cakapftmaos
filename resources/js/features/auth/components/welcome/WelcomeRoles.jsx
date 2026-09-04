import React from 'react';
import { Link } from '@tanstack/react-router';
import { 
    ShieldCheckIcon, 
    CheckCircleIcon, 
    ArrowRightIcon,
    WrenchScrewdriverIcon,
    ClipboardDocumentCheckIcon,
    AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const WelcomeRoles = () => {
    const roles = [
        {
            title: 'Teknisi',
            subtitle: 'Inspeksi & Eksekusi Lapangan',
            icon: WrenchScrewdriverIcon,
            description: 'Petugas lapangan yang melakukan pemeriksaan langsung terhadap unit APAR statis & mobil tangki.',
            features: [
                'Scan QR Code APAR di lokasi',
                'Pengambilan foto kamera langsung',
                'Validasi geofencing GPS 30m',
                'Pelaporan temuan kerusakan instan'
            ],
            highlight: false
        },
        {
            title: 'Supervisor',
            subtitle: 'Validasi & Persetujuan',
            icon: ClipboardDocumentCheckIcon,
            description: 'Pengawas yang memantau kualitas inspeksi, mengevaluasi kerusakan, dan memberi persetujuan perbaikan.',
            features: [
                'Monitoring status inspeksi real-time',
                'Persetujuan permintaan perbaikan tabung',
                'Akses ringkasan statistik & laporan',
                'Verifikasi kepatuhan jadwal teknisi'
            ],
            highlight: true
        },
        {
            title: 'Administrator',
            subtitle: 'Kendali Penuh Sistem',
            icon: AdjustmentsHorizontalIcon,
            description: 'Pengelola utama seluruh aset, pengguna, master data APAR, jadwal periode, dan konfigurasi global.',
            features: [
                'Manajemen data APAR & Mobil Tangki',
                'Pengelolaan user & hak akses peran',
                'Pengaturan jadwal & interval reminder',
                'Audit log aktivitas & konfigurasi sistem'
            ],
            highlight: false
        }
    ];

    return (
        <section id="roles" className="py-24 bg-white text-slate-900 border-t border-[#EEEEEE]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center px-3.5 py-1.5 bg-[#EEEEEE] border border-slate-200 rounded-[6px] mb-4">
                        <span className="text-xs font-bold text-[#041562] tracking-wider uppercase">
                            Hierarki Akses
                        </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#041562] tracking-tight leading-tight mb-4">
                        Peran & Tanggung Jawab Terintegrasi
                    </h2>
                    <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                        Setiap personel memiliki antarmuka dan hak fungsi yang disesuaikan secara presisi untuk efisiensi operasional.
                    </p>
                </div>

                {/* Roles Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    {roles.map((role, index) => (
                        <div
                            key={index}
                            className={`group bg-white rounded-[6px] p-7 border transition-all duration-200 flex flex-col justify-between ${
                                role.highlight 
                                    ? 'border-[#11468F] ring-1 ring-[#11468F]/20 shadow-md shadow-[#041562]/5' 
                                    : 'border-[#EEEEEE] hover:border-slate-300 hover:shadow-sm'
                            }`}
                        >
                            <div>
                                {/* Header tag */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className={`w-11 h-11 rounded-[6px] flex items-center justify-center ${
                                        role.highlight 
                                            ? 'bg-[#11468F] text-white' 
                                            : 'bg-[#041562] text-white'
                                    }`}>
                                        <role.icon className="h-6 w-6" />
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-[20px] text-xs font-bold uppercase tracking-wider ${
                                        role.highlight
                                            ? 'bg-[#11468F] text-white'
                                            : 'bg-[#EEEEEE] text-[#041562]'
                                    }`}>
                                        {role.title}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-[#041562] mb-1 tracking-tight">
                                    {role.title}
                                </h3>
                                <p className="text-xs text-[#11468F] font-semibold mb-3">
                                    {role.subtitle}
                                </p>
                                <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                                    {role.description}
                                </p>

                                {/* Features List */}
                                <ul className="space-y-2.5 mb-8">
                                    {role.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-start text-xs font-medium text-slate-700">
                                            <div className="w-4 h-4 rounded-[3px] bg-[#11468F]/10 text-[#11468F] flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
                                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                            </div>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Action Link */}
                            <div className="pt-4 border-t border-[#EEEEEE]">
                                <Link
                                    to="/login"
                                    className={`w-full inline-flex items-center justify-center px-4 py-2.5 rounded-[6px] text-xs font-bold tracking-wide transition-colors duration-150 ${
                                        role.highlight
                                            ? 'bg-[#11468F] text-white hover:bg-[#0d3873]'
                                            : 'bg-[#EEEEEE] text-[#041562] hover:bg-[#11468F] hover:text-white'
                                    }`}
                                >
                                    Masuk sebagai {role.title}
                                    <ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WelcomeRoles;
