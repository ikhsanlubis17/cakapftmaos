import React, { useState, useEffect } from 'react';
import { 
    CheckCircleIcon, 
    ExclamationTriangleIcon, 
    InformationCircleIcon,
    XMarkIcon 
} from '@heroicons/react/24/outline';

const Toast = ({ 
    isOpen, 
    onClose, 
    type = 'success', 
    message, 
    duration = 4000,
    position = 'top-right'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setProgress(100);
            
            // Auto close after duration
            if (duration > 0) {
                const startTime = Date.now();
                const endTime = startTime + duration;
                
                const progressInterval = setInterval(() => {
                    const now = Date.now();
                    const remaining = Math.max(0, endTime - now);
                    const newProgress = (remaining / duration) * 100;
                    setProgress(newProgress);
                    
                    if (remaining <= 0) {
                        clearInterval(progressInterval);
                        handleClose();
                    }
                }, 50);

                return () => clearInterval(progressInterval);
            }
        }
    }, [isOpen, duration]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
        }, 200); // Wait for fade out animation
    };

    if (!isOpen) return null;

    const toastConfig = {
        success: {
            icon: CheckCircleIcon,
            bgColor: 'bg-emerald-500',
            iconColor: 'text-emerald-100',
            textColor: 'text-white',
            borderColor: 'border-emerald-400',
            shadowColor: 'shadow-emerald-500/20'
        },
        error: {
            icon: ExclamationTriangleIcon,
            bgColor: 'bg-red-500',
            iconColor: 'text-red-100',
            textColor: 'text-white',
            borderColor: 'border-red-400',
            shadowColor: 'shadow-red-500/20'
        },
        warning: {
            icon: ExclamationTriangleIcon,
            bgColor: 'bg-amber-500',
            iconColor: 'text-amber-100',
            textColor: 'text-white',
            borderColor: 'border-amber-400',
            shadowColor: 'shadow-amber-500/20'
        },
        info: {
            icon: InformationCircleIcon,
            bgColor: 'bg-blue-500',
            iconColor: 'text-blue-100',
            textColor: 'text-white',
            borderColor: 'border-blue-400',
            shadowColor: 'shadow-blue-500/20'
        }
    };

    const config = toastConfig[type];
    const IconComponent = config.icon;

    const positionClasses = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
    };

    return (
        <div className={`fixed z-50 ${positionClasses[position]} pointer-events-none`}>
            <div 
                className={`
                    ${config.bgColor} ${config.textColor}
                    border ${config.borderColor}
                    rounded-2xl shadow-2xl ${config.shadowColor}
                    max-w-sm w-80 backdrop-blur-sm
                    transform transition-all duration-300 ease-out
                    ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'}
                    pointer-events-auto
                `}
            >
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <IconComponent className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                        
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-relaxed break-words">
                                {message}
                            </p>
                        </div>

                        <button
                            onClick={handleClose}
                            className="text-white/80 hover:text-white transition-all duration-200 p-1.5 rounded-lg hover:bg-white/10 hover:scale-110 flex-shrink-0"
                            aria-label="Close toast"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Progress bar for auto-close */}
                {duration > 0 && (
                    <div className="h-1 bg-white/20 rounded-b-2xl overflow-hidden">
                        <div 
                            className="h-full bg-white/60 transition-all duration-100 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Toast;