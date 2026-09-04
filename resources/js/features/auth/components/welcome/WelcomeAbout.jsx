import React from 'react';
import { Link } from '@tanstack/react-router';
import { 
    FireIcon, 
    PlayIcon, 
    ArrowRightIcon, 
    ChartBarIcon, 
    ShieldCheckIcon, 
    BellIcon 
} from '@heroicons/react/24/outline';

const WelcomeAbout = ({ scrollToSection, settings }) => {
    return (
        <section id="about" className="py-20 lg:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div>
                            <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full mb-6">
                                <FireIcon className="h-4 w-4 text-green-600 mr-2" />
                                <span className="text-sm font-semibold text-green-700">Tentang Sistem</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                                {settings.site_name}
                            </h2>
                        </div>
                        
                        <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                            <p>
                                {settings.site_description || `${settings.site_name} adalah sistem monitoring internal berbasis web yang dirancang untuk memastikan keandalan APAR di seluruh wilayah operasional, baik statis maupun di mobil tangki.`}
                            </p>
                            <p>
                                Dengan teknologi GPS, kamera real-time, dan validasi yang ketat, sistem ini memastikan setiap inspeksi APAR dilakukan dengan akurat dan dapat dipercaya, memberikan perlindungan optimal bagi seluruh area kerja {settings.organization_name}.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/login"
                                className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                            >
                                <PlayIcon className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                                Mulai Sekarang
                                <ArrowRightIcon className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                            </Link>
                            
                            <button
                                onClick={() => scrollToSection('features')}
                                className="group inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 text-lg font-semibold rounded-2xl hover:border-red-300 hover:text-red-600 transform hover:scale-105 transition-all duration-300"
                            >
                                <ChartBarIcon className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                                Pelajari Fitur
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {[
                            {
                                icon: ShieldCheckIcon,
                                title: 'Keamanan Terjamin',
                                description: 'Data terenkripsi dan akses terkontrol',
                                color: 'from-emerald-500 to-green-600',
                                bgColor: 'bg-emerald-50'
                            },
                            {
                                icon: ChartBarIcon,
                                title: 'Laporan Real-time',
                                description: 'Dashboard dengan data terkini',
                                color: 'from-blue-500 to-indigo-600',
                                bgColor: 'bg-blue-50'
                            },
                            {
                                icon: BellIcon,
                                title: 'Notifikasi Otomatis',
                                description: 'Pengingat inspeksi via Email',
                                color: 'from-purple-500 to-violet-600',
                                bgColor: 'bg-purple-50'
                            }
                        ].map((item, index) => (
                            <div key={index} className={`group ${item.bgColor} rounded-2xl p-6 hover:shadow-lg transition-all duration-500 hover:scale-105`}>
                                <div className="flex items-start space-x-4">
                                    <div className={`bg-gradient-to-r ${item.color} rounded-xl p-3 shadow-lg group-hover:scale-110 transition-all duration-300 flex-shrink-0`}>
                                        <item.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors duration-300">
                                            {item.title}
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed">
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
