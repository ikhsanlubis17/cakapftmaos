import React from 'react';
import { Link } from '@tanstack/react-router';
import { 
    PlayIcon, 
    ArrowRightIcon, 
    ChartBarIcon, 
    QrCodeIcon, 
    CameraIcon, 
    MapPinIcon, 
    ShieldCheckIcon 
} from '@heroicons/react/24/outline';

const WelcomeHero = ({ scrollToSection, settings }) => {
    return (
        <section id="hero" className="relative min-h-screen flex items-start lg:items-center bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 overflow-hidden pt-32 lg:pt-0">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-orange-500/20"></div>
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-20 left-10 w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <div className="absolute top-40 right-20 w-3 h-3 bg-orange-400 rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-40 left-20 w-1 h-1 bg-yellow-400 rounded-full animate-pulse delay-700"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    <div className="text-center lg:text-left space-y-8">
                        {/* Badge */}
                        <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
                            <div className="w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse"></div>
                            <span className="text-sm font-medium text-white/90">
                                Sistem Monitoring Terdepan
                            </span>
                        </div>

                        {/* Main Headline */}
                        <div className="space-y-6">
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                                <span className="block text-white mb-2">
                                    Sistem Monitoring
                                </span>
                                <span className="block bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                                    APAR Modern
                                </span>
                            </h1>
                            
                            <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Solusi digital untuk inspeksi APAR yang{' '}
                                <span className="text-emerald-400 font-semibold">akurat</span>,{' '}
                                <span className="text-blue-400 font-semibold">real-time</span>, dan{' '}
                                <span className="text-purple-400 font-semibold">anti-manipulasi</span>.
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                to="/login"
                                className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                            >
                                <PlayIcon className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                                Masuk Sistem
                                <ArrowRightIcon className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                            </Link>
                            
                            <button
                                onClick={() => scrollToSection('features')}
                                className="group inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-lg font-semibold rounded-2xl hover:bg-white/20 transform hover:scale-105 transition-all duration-300"
                            >
                                <ChartBarIcon className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                                Lihat Fitur
                            </button>
                        </div>
                    </div>

                    {/* Hero Visual */}
                    <div className="relative flex justify-center lg:justify-end">
                        <div className="relative max-w-md w-full">
                            {/* Main Card */}
                            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 transform hover:scale-105 transition-all duration-500">
                                <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-6 sm:p-8 text-white text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-white/10 rounded-2xl"></div>
                                    <div className="relative z-10">
                                        <QrCodeIcon className="h-20 w-20 mx-auto mb-6 animate-pulse" />
                                        <h3 className="text-2xl font-bold mb-3">Scan QR APAR</h3>
                                        <p className="text-white/90 text-lg mb-6">Mulai inspeksi dengan mudah</p>
                                        <div className="flex justify-center space-x-2">
                                            <div className="w-3 h-3 bg-white/70 rounded-full animate-bounce"></div>
                                            <div className="w-3 h-3 bg-white/70 rounded-full animate-bounce delay-100"></div>
                                            <div className="w-3 h-3 bg-white/70 rounded-full animate-bounce delay-200"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Icons */}
                            <div className="absolute -top-6 -right-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-xl hover:scale-110 transition-all duration-300">
                                <CameraIcon className="h-8 w-8" />
                            </div>
                            <div className="absolute -bottom-6 -left-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-xl hover:scale-110 transition-all duration-300">
                                <MapPinIcon className="h-8 w-8" />
                            </div>
                            <div className="absolute top-1/2 -right-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-3 text-white shadow-xl hover:scale-110 transition-all duration-300 hidden sm:block">
                                <ShieldCheckIcon className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WelcomeHero;
