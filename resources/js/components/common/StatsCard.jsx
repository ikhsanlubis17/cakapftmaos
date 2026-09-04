import React from 'react';

const StatsCard = ({ icon: Icon, title, value, color, bgColor, iconColor }) => {
    return (
        <div className="bg-white rounded-[6px] shadow-sm border border-[#EEEEEE] p-5 hover:border-slate-300 hover:shadow-md transition-all duration-150">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <div className={`w-12 h-12 ${bgColor} rounded-[6px] border border-[#EEEEEE] flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">{title}</p>
                    <p className={`text-2xl lg:text-3xl font-bold tracking-tight mt-0.5 ${color}`}>{value}</p>
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
