import React from 'react';

const StatsCard = ({ icon: Icon, title, value, color, bgColor, iconColor }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 hover-lift">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className={`text-3xl font-bold ${color}`}>{value}</p>
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
