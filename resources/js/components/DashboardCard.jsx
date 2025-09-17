import React from 'react';

const DashboardCard = ({ title, value, icon: Icon, color, change, changeType }) => {
    const getColorClasses = () => {
        switch (color) {
            case 'red':
                return 'bg-red-500';
            case 'green':
                return 'bg-green-500';
            case 'yellow':
                return 'bg-yellow-500';
            case 'blue':
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getChangeColor = () => {
        if (changeType === 'increase') {
            return 'text-green-600';
        } else if (changeType === 'decrease') {
            return 'text-red-600';
        }
        return 'text-gray-600';
    };

    const getChangeIcon = () => {
        if (changeType === 'increase') {
            return '↗';
        } else if (changeType === 'decrease') {
            return '↘';
        }
        return '→';
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {change && (
                        <div className="flex items-center mt-2">
                            <span className={`text-sm font-medium ${getChangeColor()}`}>
                                {getChangeIcon()} {change}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">dari bulan lalu</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-full ${getColorClasses()}`}>
                    <Icon className="h-6 w-6 text-white' />
                </div>
            </div>
        </div>
    );
};

export default DashboardCard; 