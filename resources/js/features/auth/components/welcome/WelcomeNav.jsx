import React, { useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { 
    ArrowRightIcon, 
    Bars3Icon,
    XMarkIcon,
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

    const menuRef = useRef(null);

    // Close menu when clicking outside or scrolling
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) && isMenuOpen) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isMenuOpen, setIsMenuOpen]);

    const handleItemClick = (id) => {
        scrollToSection(id);
        setIsMenuOpen(false);
    };

    return (
        <header 
            ref={menuRef}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
                scrollY > 20 
                    ? 'bg-[#041562]/95 backdrop-blur-md shadow-md border-b border-white/10' 
                    : 'bg-[#041562] border-b border-white/10'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 sm:h-18 lg:h-20">
                    {/* Brand / Logo */}
                    <div 
                        className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer select-none" 
                        onClick={() => handleItemClick('hero')}
                    >
                        <img 
                            src={settings.site_logo} 
                            alt={`${settings.site_name} Logo`} 
                            className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-[6px] bg-white p-1 shadow-sm transition-transform duration-150 group-hover:scale-105"
                        />
                        <div className="flex flex-col">
                            <span className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-white leading-tight">
                                {settings.site_name}
                            </span>
                            <span className="hidden sm:block text-[11px] lg:text-xs text-slate-300 font-medium tracking-wide">
                                {settings.site_tagline}
                            </span>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-1.5">
                        {navItems.map((item) => {
                            const isActive = activeSection === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleItemClick(item.id)}
                                    className={`px-3.5 py-2 text-sm font-medium transition-colors duration-150 rounded-[6px] ${
                                        isActive
                                            ? 'text-white bg-[#11468F] font-semibold shadow-xs'
                                            : 'text-slate-200 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Action & Mobile Toggle */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#11468F] hover:bg-[#0d3873] text-white text-xs sm:text-sm font-semibold rounded-[6px] shadow-xs transition-colors duration-150"
                        >
                            <ShieldCheckIcon className="h-4 w-4 text-white" />
                            <span className="hidden sm:inline">Masuk ke Sistem</span>
                            <span className="sm:hidden">Masuk</span>
                            <ArrowRightIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Link>

                        {/* Mobile Menu Hamburger */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 rounded-[6px] text-slate-200 hover:text-white hover:bg-white/10 transition-colors duration-150 focus:outline-hidden"
                            aria-label="Toggle Menu Navigasi"
                        >
                            {isMenuOpen ? (
                                <XMarkIcon className="h-6 w-6" />
                            ) : (
                                <Bars3Icon className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden pb-4 pt-1 animate-fadeIn">
                        <div className="bg-[#030f47] rounded-[8px] border border-white/15 p-2 shadow-2xl space-y-1">
                            {navItems.map((item) => {
                                const isActive = activeSection === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleItemClick(item.id)}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[6px] text-sm font-medium transition-colors duration-150 ${
                                            isActive 
                                                ? 'bg-[#11468F] text-white font-semibold' 
                                                : 'text-slate-200 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <span>{item.label}</span>
                                        <ArrowRightIcon className="h-3.5 w-3.5 text-slate-400" />
                                    </button>
                                );
                            })}
                            <div className="pt-2 border-t border-white/10 px-2 pb-1">
                                <Link
                                    to="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#11468F] text-white text-xs font-bold uppercase tracking-wider rounded-[6px] shadow-xs"
                                >
                                    <ShieldCheckIcon className="h-4 w-4" />
                                    Masuk ke Sistem CAKAP
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default WelcomeNav;
