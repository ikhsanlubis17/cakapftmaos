import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    FireIcon, 
    QrCodeIcon, 
    MapPinIcon, 
    CameraIcon, 
    ChartBarIcon, 
    ShieldCheckIcon, 
    BellIcon,
    ArrowRightIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    PlayIcon,
    CheckCircleIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

const Welcome = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
            
            const sections = ['hero', 'features', 'workflow', 'roles', 'about'];
            const scrollPosition = window.scrollY + 100;

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const offsetTop = element.offsetTop;
                    const offsetHeight = element.offsetHeight;
                    
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsMenuOpen(false);
    };

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

    const workflowSteps = [
        { step: 1, title: 'Scan QR', description: 'Scan QR code APAR dengan kamera', icon: QrCodeIcon },
        { step: 2, title: 'Validasi Lokasi', description: 'Sistem memvalidasi lokasi GPS', icon: MapPinIcon },
        { step: 3, title: 'Ambil Foto', description: 'Foto APAR langsung dari kamera', icon: CameraIcon },
        { step: 4, title: 'Isi Form', description: 'Input kondisi dan catatan APAR', icon: CheckCircleIcon },
        { step: 5, title: 'Submit', description: 'Data tersimpan dan muncul di dashboard', icon: ChartBarIcon }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Header Navigation */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                scrollY > 50 
                    ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100' 
                    : 'bg-transparent'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 lg:h-20">
                        {/* Logo */}
                        <div className="flex items-center group cursor-pointer">
                            <div className="h-10 w-10 lg:h-12 lg:w-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300">
                                <FireIcon className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                            </div>
                            <div className="ml-3">
                                <span className="text-xl lg:text-2xl font-bold text-gray-500">
                                    CAKAP FT MAOS
                                </span>
                                <div className="text-sm text-gray-500 font-medium">
                                    Monitoring APAR
                                </div>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center space-x-8">
                            {[
                                { id: 'about', label: 'Tentang' },
                                { id: 'features', label: 'Fitur' },
                                { id: 'workflow', label: 'Alur Kerja' },
                                { id: 'roles', label: 'Peran' }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollToSection(item.id)}
                                    className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg ${
                                        activeSection === item.id
                                            ? 'text-red-600 bg-red-50'
                                            : scrollY > 50
                                            ? 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                                            : 'text-white hover:text-red-200 hover:bg-white/10'
                                    }`}
                                >
                                    {item.label}
                                    {activeSection === item.id && (
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-600 rounded-full"></div>
                                    )}
                                </button>
                            ))}
                        </nav>

                        {/* Login Button */}
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/login"
                                className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                            >
                                <SparklesIcon className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                                <span className="hidden md:inline">Masuk ke Sistem</span>
                                <span className="md:hidden">Masuk</span>
                                <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                            </Link>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="lg:hidden p-2 rounded-md text-gray-700 hover:text-red-600 transition-colors duration-300"
                            >
                                {isMenuOpen ? (
                                    <ChevronUpIcon className="h-6 w-6" />
                                ) : (
                                    <ChevronDownIcon className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    <div className={`lg:hidden transition-all duration-300 overflow-hidden ${
                        isMenuOpen ? 'max-h-96 pb-6' : 'max-h-0'
                    }`}>
                        <div className="pt-4 border-t border-gray-200">
                            <div className="space-y-2">
                                {[
                                    { id: 'about', label: 'Tentang' },
                                    { id: 'features', label: 'Fitur' },
                                    { id: 'workflow', label: 'Alur Kerja' },
                                    { id: 'roles', label: 'Peran' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => scrollToSection(item.id)}
                                        className="block w-full text-left px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section id="hero" className="relative min-h-screen flex items-center bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 overflow-hidden">
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
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
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
                                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-all duration-500">
                                    <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-8 text-white text-center relative overflow-hidden">
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

            {/* Features Section */}
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
                            CAKAP FT MAOS dilengkapi dengan fitur-fitur canggih untuk memastikan inspeksi APAR yang akurat dan dapat dipercaya.
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

            {/* Workflow Section */}
            <section id="workflow" className="py-20 lg:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 lg:mb-20">
                        <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full mb-6">
                            <ArrowRightIcon className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="text-sm font-semibold text-blue-700">Proses Inspeksi</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                            Alur Kerja Inspeksi
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Proses inspeksi APAR yang sederhana namun terjamin keakuratannya
                        </p>
                    </div>

                    {/* Desktop Workflow */}
                    <div className="hidden lg:block">
                        <div className="relative">
                            <div className="flex justify-between items-start">
                                {workflowSteps.map((step, index) => (
                                    <div key={index} className="group text-center relative flex-1 max-w-xs">
                                        <div className="bg-white rounded-2xl p-6 shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 border border-gray-100 mx-4">
                                            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl w-16 h-16 flex items-center justify-center font-bold text-xl mx-auto mb-6 shadow-lg group-hover:scale-110 transition-all duration-300">
                                                {step.step}
                                            </div>
                                            
                                            <div className="bg-gray-50 rounded-xl p-4 mb-4 group-hover:bg-red-50 transition-colors duration-300">
                                                <step.icon className="h-8 w-8 text-gray-600 mx-auto group-hover:text-red-600 transition-colors duration-300" />
                                            </div>

                                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors duration-300">
                                                {step.title}
                                            </h3>

                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>

                                        {/* Connection Arrow */}
                                        {index < workflowSteps.length - 1 && (
                                            <div className="absolute top-12 -right-6 z-10">
                                                <div className="bg-white rounded-full p-2 shadow-lg">
                                                    <ArrowRightIcon className="h-6 w-6 text-red-500" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Workflow */}
                    <div className="lg:hidden space-y-6">
                        {workflowSteps.map((step, index) => (
                            <div key={index} className="group">
                                <div className="bg-white rounded-2xl p-6 shadow-lg group-hover:shadow-2xl transition-all duration-500 border border-gray-100">
                                    <div className="flex items-start space-x-4">
                                        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                                            {step.step}
                                        </div>
                                        
                                        <div className="flex-1">
                                            <div className="flex items-center mb-3">
                                                <step.icon className="h-6 w-6 text-gray-600 mr-3 group-hover:text-red-600 transition-colors duration-300" />
                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-300">
                                                    {step.title}
                                                </h3>
                                            </div>
                                            <p className="text-gray-600 leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Arrow */}
                                {index < workflowSteps.length - 1 && (
                                    <div className="flex justify-center my-4">
                                        <div className="bg-gray-100 rounded-full p-2">
                                            <ArrowRightIcon className="h-5 w-5 text-red-500 rotate-90" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Roles Section */}
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

            {/* About Section */}
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
                                    CAKAP FT MAOS
                                </h2>
                            </div>
                            
                            <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                                <p>
                                    CAKAP FT MAOS adalah sistem monitoring internal berbasis web yang dirancang untuk memastikan keandalan APAR di seluruh wilayah operasional, baik statis maupun di mobil tangki.
                                </p>
                                <p>
                                    Dengan teknologi GPS, kamera real-time, dan validasi yang ketat, sistem ini memastikan setiap inspeksi APAR dilakukan dengan akurat dan dapat dipercaya, memberikan perlindungan optimal bagi seluruh area kerja Pertamina.
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

            {/* Footer */}
            <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16 lg:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 lg:gap-12">
                        <div className="col-span-2 space-y-6">
                            <div className="flex items-center">
                                <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl">
                                    <FireIcon className="h-7 w-7 text-white" />
                                </div>
                                <div className="ml-4">
                                    <span className="text-2xl font-bold">CAKAP FT MAOS</span>
                                    <div className="text-sm text-gray-400 font-medium">Monitoring APAR</div>
                                </div>
                            </div>
                            
                            <p className="text-gray-300 text-lg leading-relaxed max-w-md">
                                Sistem monitoring APAR yang handal dan terpercaya untuk memastikan keamanan di seluruh wilayah operasional Pertamina.
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
                                    <span className="text-gray-300">Update: Agustus 2025</span>
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
                            © 2025 CAKAP FT MAOS. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Welcome;