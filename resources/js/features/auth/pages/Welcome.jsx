import React, { useState, useEffect } from 'react';
import { useSiteSettings } from '../../../contexts/SiteSettingsContext';
import WelcomeNav from '../components/welcome/WelcomeNav';
import WelcomeHero from '../components/welcome/WelcomeHero';
import WelcomeFeatures from '../components/welcome/WelcomeFeatures';
import WelcomeWorkflow from '../components/welcome/WelcomeWorkflow';
import WelcomeRoles from '../components/welcome/WelcomeRoles';
import WelcomeAbout from '../components/welcome/WelcomeAbout';
import WelcomeFooter from '../components/welcome/WelcomeFooter';

const Welcome = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const [scrollY, setScrollY] = useState(0);
    const { settings } = useSiteSettings();

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

    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-[#11468F] selection:text-white">
            <WelcomeNav
                scrollY={scrollY}
                activeSection={activeSection}
                scrollToSection={scrollToSection}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                settings={settings}
            />
            <WelcomeHero
                scrollToSection={scrollToSection}
                settings={settings}
            />
            <WelcomeFeatures
                settings={settings}
            />
            <WelcomeWorkflow />
            <WelcomeRoles />
            <WelcomeAbout
                scrollToSection={scrollToSection}
                settings={settings}
            />
            <WelcomeFooter
                scrollToSection={scrollToSection}
                settings={settings}
            />
        </div>
    );
};

export default Welcome;