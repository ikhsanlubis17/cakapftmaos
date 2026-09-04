import React from 'react';
import { Link } from '@tanstack/react-router';
import { 
    ArrowRightIcon, 
    ChevronDownIcon, 
    ChevronUpIcon,
    ShieldCheckIcon
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
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
            scrollY > 40 
                ? 'bg-[#041562]/95 backdrop-blur-md shadow-md border-b border-white/10' 
                : 'bg-[#041562] border-b border-white/10'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 lg:h-20">
                    {/* Logo */}
                    <div 
                        className="flex items-center group cursor-pointer" 
                        onClick={() => scrollToSection('hero')}
                    >
                        <div className="relative">
                            <img 
                                src={settings.site_logo} 
                                alt={`${settings.site_name} Logo`} 
                                className="h-9 w-9 lg:h-10 lg:w-10 rounded-[6px] bg-white p-1 shadow-sm"
                            />
                        </div>
                        <div className="ml-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg lg:text-xl font-bold tracking-tight text-white">
                                    {settings.site_name}
                                </span>
                            </div>
                            <div className="hidden sm:block text-xs text-slate-200 font-medium tracking-wide">
                                {settings.site_tagline}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-1.5">
                        {navItems.map((item) => {
                            const isActive = activeSection === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => scrollToSection(item.id)}
                                    className={`px-4 py-2 text-sm font-medium transition-colors duration-150 rounded-[6px] ${
                                        isActive
                                            ? 'text-white bg-[#11468F] font-semibold shadow-sm'
                                            : 'text-slate-200 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Login Button */}
                    <div className="flex items-center space-x-3">
                        <Link
                            to="/login"
                            className="inline-flex items-center px-4 py-2 sm:px-5 sm:py-2.5 bg-[#11468F] text-white text-xs sm:text-sm font-semibold rounded-[6px] shadow-sm hover:bg-[#0d3873] transition-colors duration-150"
                        >
                            <ShieldCheckIcon className="h-4 w-4 mr-1.5 text-white" />
                            <span className="hidden sm:inline">Masuk ke Sistem</span>
                            <span className="sm:hidden">Masuk</span>
                            <ArrowRightIcon className="ml-1.5 h-3.5 w-3.5" />
                        </Link>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 rounded-[6px] text-slate-200 hover:text-white hover:bg-white/10 transition-colors duration-150"
                            aria-label="Toggle Navigation Menu"
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
                <div className={`lg:hidden absolute top-full left-0 right-0 p-4 transition-all duration-150 ${
                    isMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible'
                }`}>
                    <div className="bg-[#041562] rounded-[6px] shadow-xl border border-white/10 overflow-hidden p-2 space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-[6px] text-sm font-medium transition-colors duration-150 ${
                                    activeSection === item.id 
                                        ? 'bg-[#11468F] text-white font-semibold' 
                                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <span>{item.label}</span>
                                <ArrowRightIcon className="h-4 w-4" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default WelcomeNav;
