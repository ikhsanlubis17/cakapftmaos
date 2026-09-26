import React from "react";
import { cn } from "@/lib/utils";

const StatsCard = ({
    icon: Icon,
    title,
    value,
    color = "text-slate-900",
    bgColor = "bg-slate-50",
    iconColor = "text-slate-700",
    subtitle,
    badge,
    className,
}) => {
    return (
        <div
            className={cn(
                "group relative overflow-hidden bg-white rounded-lg p-5 lg:p-6 border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200",
                className
            )}
        >
            {/* Top border accent line on hover */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#11468F]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate leading-tight mb-1.5">
                        {title}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <p
                            className={cn(
                                "text-2xl lg:text-3xl font-black font-mono tracking-tight leading-tight",
                                color
                            )}
                        >
                            {value}
                        </p>
                        {badge && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                {badge}
                            </span>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-slate-500 mt-2 font-medium truncate">
                            {subtitle}
                        </p>
                    )}
                </div>

                {Icon && (
                    <div className="flex-shrink-0">
                        <div
                            className={cn(
                                "w-12 h-12 rounded-lg border border-slate-100 flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xs",
                                bgColor
                            )}
                        >
                            <Icon className={cn("w-6 h-6 transition-transform duration-200", iconColor)} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsCard;
