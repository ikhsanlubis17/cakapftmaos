import React from 'react';
import { 
    ArrowRightIcon, 
    MapPinIcon, 
    CameraIcon, 
    ChartBarIcon, 
    ShieldCheckIcon, 
    BellIcon, 
    QrCodeIcon 
} from '@heroicons/react/24/outline';

const WelcomeFeatures = ({ settings }) => {
    const features = [
        {
            icon: MapPinIcon,
            title: 'Validasi Lokasi GPS',
            badge: 'Geofencing',
            description: 'Memastikan inspeksi APAR hanya dapat dilakukan di lokasi fisik valid dengan batas radius 30 meter secara otomatis.',
        },
        {
            icon: CameraIcon,
            title: 'Bukti Foto Kamera Langsung',
            badge: 'Anti-Fraud',
            description: 'Mewajibkan pengambilan foto langsung melalui kamera gawai saat inspeksi berlangsung tanpa opsi unggah galeri.',
        },
        {
            icon: ChartBarIcon,
            title: 'Dashboard Telemetri Real-time',
            badge: 'Analytics',
            description: 'Visualisasi status APAR, rasio kesiapan darurat, grafik tipe tabung, dan pemantauan perbaikan secara instan.',
        },
        {
            icon: ShieldCheckIcon,
            title: 'Role-Based Access Control',
            badge: 'Security',
            description: 'Pembagian hierarki hak akses yang ketat antara Teknisi lapangan, Supervisor verifikator, dan Administrator sistem.',
        },
        {
            icon: BellIcon,
            title: 'Jadwal & Notifikasi Otomatis',
            badge: 'Scheduler',
            description: 'Pengingat berkala via sistem dan email untuk menjamin tidak ada tabung APAR yang melewati batas periode inspeksi.',
        },
        {
            icon: QrCodeIcon,
            title: 'Barcode & QR Scanner',
            badge: 'Identification',
            description: 'Pemindaian cepat QR code pada tabung statis maupun armada mobil tangki untuk mengakses rekam jejak aset seketika.',
        }
    ];

    return (
        <section id="features" className="py-20 bg-white text-slate-900 border-t border-b border-[#EEEEEE]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-14">
                    <div className="inline-flex items-center px-3 py-1 bg-[#EEEEEE] border border-slate-200 rounded-[6px] mb-3">
                        <span className="text-xs font-semibold text-[#041562] tracking-wider uppercase">
                            Fitur Inti Sistem
                        </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#041562] tracking-tight leading-tight mb-3">
                        Dirancang Khusus untuk Standar Keamanan Tinggi
                    </h2>
                    <p className="text-base text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
                        Fitur dirancang untuk menyederhanakan tugas lapangan teknisi sekaligus memberikan data yang tak terbantahkan bagi manajemen.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-[6px] p-6 border border-[#EEEEEE] hover:border-slate-300 hover:shadow-md transition-all duration-150 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-5">
                                    <div className="w-11 h-11 rounded-[6px] bg-blue-50 border border-blue-100 flex items-center justify-center text-[#11468F]">
                                        <feature.icon className="h-5 w-5" />
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-[3px] text-[10px] font-semibold bg-[#EEEEEE] text-slate-700 uppercase tracking-wider">
                                        {feature.badge}
                                    </span>
                                </div>

                                <h3 className="text-base font-bold text-[#041562] mb-2 tracking-tight">
                                    {feature.title}
                                </h3>

                                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                                    {feature.description}
                                </p>
                            </div>

                            <div className="pt-4 mt-5 border-t border-[#EEEEEE] flex items-center text-xs font-semibold text-[#11468F]">
                                <span>Standar Industri Terpenuhi</span>
                                <ArrowRightIcon className="h-3.5 w-3.5 ml-1.5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WelcomeFeatures;
