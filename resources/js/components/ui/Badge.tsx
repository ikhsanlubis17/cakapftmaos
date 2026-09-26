import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?:
        | "ready"
        | "active"
        | "success"
        | "damaged"
        | "danger"
        | "destructive"
        | "repair"
        | "warning"
        | "pending"
        | "neutral"
        | "inactive"
        | "draft"
        | "navy"
        | "blue"
        | "info";
    size?: "sm" | "md" | "lg";
    dot?: boolean;
    pulse?: boolean;
}

const variantStyles: Record<string, { badge: string; dot: string }> = {
    // Active / Ready
    ready: {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70",
        dot: "bg-emerald-500",
    },
    active: {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70",
        dot: "bg-emerald-500",
    },
    success: {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70",
        dot: "bg-emerald-500",
    },
    // Damaged / Danger / Destructive
    damaged: {
        badge: "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/70",
        dot: "bg-rose-500",
    },
    danger: {
        badge: "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/70",
        dot: "bg-rose-500",
    },
    destructive: {
        badge: "bg-[#DA1212]/10 text-[#DA1212] border-[#DA1212]/25 hover:bg-[#DA1212]/15",
        dot: "bg-[#DA1212]",
    },
    // Repair / Pending / Warning
    repair: {
        badge: "bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/70",
        dot: "bg-amber-500",
    },
    warning: {
        badge: "bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/70",
        dot: "bg-amber-500",
    },
    pending: {
        badge: "bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/70",
        dot: "bg-amber-500",
    },
    // Neutral / Inactive / Draft
    neutral: {
        badge: "bg-slate-100 text-slate-700 border-slate-200/90 hover:bg-slate-200/70",
        dot: "bg-slate-400",
    },
    inactive: {
        badge: "bg-slate-100 text-slate-700 border-slate-200/90 hover:bg-slate-200/70",
        dot: "bg-slate-400",
    },
    draft: {
        badge: "bg-slate-100 text-slate-600 border-slate-200/90 hover:bg-slate-200/70",
        dot: "bg-slate-400",
    },
    // Brand Navy & Blue
    navy: {
        badge: "bg-[#041562]/10 text-[#041562] border-[#041562]/20 hover:bg-[#041562]/15",
        dot: "bg-[#041562]",
    },
    blue: {
        badge: "bg-[#11468F]/10 text-[#11468F] border-[#11468F]/20 hover:bg-[#11468F]/15",
        dot: "bg-[#11468F]",
    },
    info: {
        badge: "bg-sky-50 text-sky-700 border-sky-200/80 hover:bg-sky-100/70",
        dot: "bg-sky-500",
    },
};

const sizeStyles: Record<string, string> = {
    sm: "text-[11px] px-2 py-0.5 gap-1.5 leading-none",
    md: "text-xs px-2.5 py-1 gap-1.5 font-medium leading-none",
    lg: "text-sm px-3 py-1.5 gap-2 font-medium leading-none",
};

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = "neutral",
    size = "md",
    dot = false,
    pulse = false,
    className,
    ...props
}) => {
    const currentVariant = variantStyles[variant] || variantStyles.neutral;
    const currentSize = sizeStyles[size] || sizeStyles.md;

    return (
        <span
            className={cn(
                "inline-flex items-center font-semibold rounded-md border tracking-wide transition-colors select-none",
                currentVariant.badge,
                currentSize,
                className
            )}
            {...props}
        >
            {dot && (
                <span className="relative flex h-2 w-2">
                    {pulse && (
                        <span
                            className={cn(
                                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                currentVariant.dot
                            )}
                        />
                    )}
                    <span
                        className={cn(
                            "relative inline-flex rounded-full h-2 w-2",
                            currentVariant.dot
                        )}
                    />
                </span>
            )}
            {children}
        </span>
    );
};

export default Badge;
