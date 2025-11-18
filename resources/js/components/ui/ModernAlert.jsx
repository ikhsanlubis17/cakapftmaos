import React, { useState, useEffect } from 'react';
import { 
    CheckCircleIcon, 
    ExclamationTriangleIcon, 
    InformationCircleIcon,
    XMarkIcon 
} from '@heroicons/react/24/outline';

const ModernAlert = ({ 
    isOpen, 
    onClose, 
    type = 'success', 
    title, 
    message, 
    duration = 5000,
    showCloseButton = true 
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            
            // Auto close after duration
            if (duration > 0) {
                const timer = setTimeout(() => {
                    handleClose();
                }, duration);
                return () => clearTimeout(timer);
            }
        }
    }, [isOpen, duration]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 300); // Wait for fade out animation
    };

    if (!isOpen) return null;

    const alertConfig = {
        success: {
            icon: CheckCircleIcon,
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            iconColor: 'text-emerald-500',
            titleColor: 'text-emerald-800',
            messageColor: 'text-emerald-700',
            closeButtonColor: 'text-emerald-400 hover:text-emerald-600'
        },
        error: {
            icon: ExclamationTriangleIcon,
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            iconColor: 'text-red-500',
            titleColor: 'text-red-800',
            messageColor: 'text-red-700',
            closeButtonColor: 'text-red-400 hover:text-red-600'
        },
        warning: {
            icon: ExclamationTriangleIcon,
            bgColor: 'bg-amber-50',
            borderColor: 'border-amber-200',
            iconColor: 'text-amber-500',
            titleColor: 'text-amber-800',
            messageColor: 'text-amber-700',
            closeButtonColor: 'text-amber-400 hover:text-amber-600'
        },
        info: {
            icon: InformationCircleIcon,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            iconColor: 'text-blue-500',
            titleColor: 'text-blue-800',
            messageColor: 'text-blue-700',
            closeButtonColor: 'text-blue-400 hover:text-blue-600'
        }
    };

    const config = alertConfig[type];
    const IconComponent = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pointer-events-none">
            <div 
                className={`
                    ${config.bgColor} ${config.borderColor}
                    border rounded-2xl shadow-2xl shadow-gray-900/10
                    max-w-sm w-full mx-auto
                    transform transition-all duration-300 ease-out
                    ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'}
                    pointer-events-auto
                `}
            >
                <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            {title && (
                                <h3 className={`text-sm font-semibold ${config.titleColor} mb-1`}>
                                    {title}
                                </h3>
                            )}
                            {message && (
                                <p className={`text-sm ${config.messageColor} leading-relaxed`}>
                                    {message}
                                </p>
                            )}
                        </div>

                        {showCloseButton && (
                            <button
                                onClick={handleClose}
                                className={`
                                    flex-shrink-0 p-1 rounded-lg transition-colors duration-200
                                    ${config.closeButtonColor}
                                    hover:bg-gray-100/50
                                `}
                                aria-label="Close alert"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress bar for auto-close */}
                {duration > 0 && (
                    <div className="h-1 bg-gray-200 rounded-b-2xl overflow-hidden">
                        <div 
                            className={`h-full ${config.iconColor.replace('text-', 'bg-')} transition-all duration-300 ease-linear`}
                            style={{
                                width: isVisible ? '0%' : '100%',
                                transition: `width ${duration}ms linear`
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModernAlert;
