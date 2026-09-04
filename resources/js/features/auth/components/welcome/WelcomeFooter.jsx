import React from 'react';
import { Link } from '@tanstack/react-router';

const WelcomeFooter = ({ scrollToSection, settings }) => {
    return (
        <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8 lg:gap-12">
                    <div className="col-span-2 space-y-6">
                        <div className="flex items-center">
                            <img 
                                src={settings.site_logo} 
                                alt={`${settings.site_name} Logo`} 
                                className="h-12 w-12 rounded-2xl shadow-xl"
                            />
                            <div className="ml-4">
                                <span className="text-2xl font-bold">{settings.site_name}</span>
                                <div className="text-sm text-gray-400 font-medium">{settings.site_tagline}</div>
                            </div>
                        </div>
                        
                        <p className="text-gray-300 text-lg leading-relaxed max-w-md">
                            Sistem monitoring APAR yang handal dan terpercaya untuk memastikan keamanan di seluruh wilayah operasional {settings.organization_name}.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-6 text-white">Navigasi</h3>
                        <ul className="space-y-4">
                            {[
                                { id: 'about', label: 'Tentang Sistem' },
                                { id: 'features', label: 'Fitur Unggulan' },
                                { id: 'workflow', label: 'Alur Kerja' },
                                { id: 'roles', label: 'Peran Pengguna' }
                            ].map((item) => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => scrollToSection(item.id)}
                                        className="text-gray-400 hover:text-white transition-all duration-300 text-lg hover:translate-x-1 transform inline-block"
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                            <li>
                                <Link
                                    to="/login"
                                    className="text-red-400 hover:text-red-300 transition-all duration-300 text-lg hover:translate-x-1 transform inline-block font-semibold"
                                >
                                    Login Sistem
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-6 text-white">Informasi</h3>
                        <ul className="space-y-4">
                            <li className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                                <span className="text-gray-300">Versi: v1.0.0</span>
                            </li>
                            <li className="flex items-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse delay-100"></div>
                                <span className="text-gray-300">{settings.contact_address || 'FT Maos, Cilacap'}</span>
                            </li>
                            <li className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse delay-200"></div>
                                <span className="text-gray-300">Status: Aktif</span>
                            </li>
                            <li className="flex items-center">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3 animate-pulse delay-300"></div>
                                <span className="text-gray-300">Uptime: 99.9%</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-700 mt-12 pt-8 text-center">
                    <p className="text-gray-400">
                        © {new Date().getFullYear()} {settings.site_name}. {settings.footer_copyright}
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default WelcomeFooter;
