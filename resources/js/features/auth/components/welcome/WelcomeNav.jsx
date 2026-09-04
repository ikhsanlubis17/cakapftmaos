import React from 'react';
import { Link } from '@tanstack/react-router';
import { 
    SparklesIcon, 
    ArrowRightIcon, 
    ChevronDownIcon, 
    ChevronUpIcon 
} from '@heroicons/react/24/outline';

const WelcomeNav = ({ 
    scrollY, 
    activeSection, 
    scrollToSection, 
    isMenuOpen, 
    setIsMenuOpen, 
    settings 
}) => {
    const navItems = [
        { id: 'about', label: 'Tentang' },
        { id: 'features', label: 'Fitur' },
        { id: 'workflow', label: 'Alur Kerja' },
        { id: 'roles', label: 'Peran' }
    ];

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            scrollY > 50 
                ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100' 
                : 'bg-transparent'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 lg:h-20">
                    {/* Logo */}
                    <div className="flex items-center group cursor-pointer" onClick={() => scrollToSection('hero')}>
                        <img 
                            src={settings.site_logo} 
                            alt={`${settings.site_name} Logo`} 
                            className="h-9 w-9 lg:h-12 lg:w-12 shadow-lg rounded-xl group-hover:scale-105 transition-all duration-300"
                        />
                        <div className="ml-3">
                            <span className="text-lg lg:text-2xl font-bold text-gray-500">
                                {settings.site_name}
                            </span>
                            <div className="hidden sm:block text-sm text-gray-500 font-medium">
                                {settings.site_tagline}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-8">
                        {navItems.map((item) => (
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
                            className="group inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
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

                {/* Mobile Navigation Menu */}
                <div className={`lg:hidden absolute top-full left-0 right-0 p-4 transition-all duration-300 ${
                    isMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible'
                }`}>
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="p-2 space-y-1">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollToSection(item.id)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 group"
                                >
                                    <span className="font-medium">{item.label}</span>
                                    <ArrowRightIcon className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default WelcomeNav;
