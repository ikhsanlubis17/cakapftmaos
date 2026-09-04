import React from 'react';
import { Link } from '@tanstack/react-router';
import { 
    ShieldCheckIcon, 
    CheckCircleIcon, 
    ArrowRightIcon 
} from '@heroicons/react/24/outline';

const WelcomeRoles = () => {
    const roles = [
        {
            title: 'Teknisi',
            description: 'Inspeksi lapangan via QR',
            features: ['Scan QR Code APAR', 'Ambil foto dengan kamera', 'Validasi lokasi GPS', 'Submit inspeksi real-time'],
            gradient: 'from-blue-500 to-cyan-500'
        },
        {
            title: 'Supervisor',
            description: 'Lihat laporan & pantau teknisi',
            features: ['Monitor inspeksi teknisi', 'Lihat dashboard statistik', 'Generate laporan', 'Pantau status APAR'],
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            title: 'Admin',
            description: 'Kelola data, jadwal, user, laporan',
            features: ['Kelola data APAR', 'Manajemen user', 'Set jadwal inspeksi', 'Generate laporan lengkap'],
            gradient: 'from-orange-500 to-red-500'
        }
    ];

    return (
        <section id="roles" className="py-20 lg:py-32 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16 lg:mb-20">
                    <div className="inline-flex items-center px-4 py-2 bg-purple-100 rounded-full mb-6">
                        <ShieldCheckIcon className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="text-sm font-semibold text-purple-700">Akses Terkontrol</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                        Peran Pengguna
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Setiap pengguna memiliki akses dan fungsi yang sesuai dengan peran mereka
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {roles.map((role, index) => (
                        <div
                            key={index}
                            className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
                        >
                            <div className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${role.gradient} text-white rounded-xl mb-6 shadow-lg group-hover:scale-105 transition-all duration-300`}>
                                <span className="text-sm font-bold">{role.title.toUpperCase()}</span>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors duration-300">
                                {role.title}
                            </h3>

                            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                                {role.description}
                            </p>

                            <ul className="space-y-4">
                                {role.features.map((feature, featureIndex) => (
                                    <li key={featureIndex} className="flex items-start group/item">
                                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-2 mr-4 mt-0.5 shadow-md group-hover/item:scale-110 transition-all duration-300 flex-shrink-0">
                                            <CheckCircleIcon className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-gray-700 font-medium group-hover/item:text-gray-900 transition-colors duration-300">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-8 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center text-red-600 font-semibold hover:text-red-700 transition-colors duration-300"
                                >
                                    Masuk sebagai {role.title}
                                    <ArrowRightIcon className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
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
