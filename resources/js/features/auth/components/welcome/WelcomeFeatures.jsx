import React from 'react';
import { 
    SparklesIcon, 
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
            title: 'Validasi Lokasi',
            description: 'Pastikan inspeksi APAR statis hanya bisa dilakukan di lokasi valid dengan radius 30 meter',
            color: 'from-emerald-500 to-teal-600'
        },
        {
            icon: CameraIcon,
            title: 'Bukti Foto Kamera',
            description: 'Tidak bisa upload dari galeri, hanya kamera langsung untuk memastikan keaslian',
            color: 'from-blue-500 to-indigo-600'
        },
        {
            icon: ChartBarIcon,
            title: 'Dashboard Realtime',
            description: 'Statistik inspeksi dan status APAR lengkap dengan grafik visual yang informatif',
            color: 'from-purple-500 to-violet-600'
        },
        {
            icon: ShieldCheckIcon,
            title: 'Akses Terbatas',
            description: 'Hanya user yang terverifikasi bisa input inspeksi dengan role-based access control',
            color: 'from-orange-500 to-red-600'
        },
        {
            icon: BellIcon,
            title: 'Notifikasi Inspeksi',
            description: 'Jadwal & pengingat via Email untuk memastikan inspeksi tepat waktu',
            color: 'from-amber-500 to-orange-600'
        },
        {
            icon: QrCodeIcon,
            title: 'QR Code Scanner',
            description: 'Scan QR code APAR untuk memulai inspeksi dengan cepat dan akurat',
            color: 'from-red-500 to-pink-600'
        }
    ];

    return (
        <section id="features" className="py-20 lg:py-32 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16 lg:mb-20">
                    <div className="inline-flex items-center px-4 py-2 bg-red-100 rounded-full mb-6">
                        <SparklesIcon className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-sm font-semibold text-red-700">Fitur Unggulan</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                        Fitur Utama Sistem
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        {settings.site_name} dilengkapi dengan fitur-fitur canggih untuk memastikan inspeksi APAR yang akurat dan dapat dipercaya.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
                        >
                            <div className={`bg-gradient-to-r ${feature.color} rounded-2xl p-4 w-fit mb-6 shadow-lg group-hover:scale-110 transition-all duration-300`}>
                                <feature.icon className="h-8 w-8 text-white" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors duration-300">
                                {feature.title}
                            </h3>

                            <p className="text-gray-600 leading-relaxed mb-6">
                                {feature.description}
                            </p>

                            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <ArrowRightIcon className="h-5 w-5 text-red-500 transform group-hover:translate-x-2 transition-transform duration-300" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WelcomeFeatures;
