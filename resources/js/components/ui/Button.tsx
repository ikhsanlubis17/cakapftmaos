import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?:
        | "primary"
        | "navy"
        | "destructive"
        | "outline"
        | "ghost"
        | "secondary";
    size?: "sm" | "md" | "lg" | "xl";
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
    primary:
        "bg-[#11468F] text-white hover:bg-[#0d3873] active:bg-[#0a2b59] shadow-sm hover:shadow border border-transparent focus-visible:ring-[#11468F]",
    navy:
        "bg-[#041562] text-white hover:bg-[#030f47] active:bg-[#02092d] shadow-sm hover:shadow border border-transparent focus-visible:ring-[#041562]",
    destructive:
        "bg-[#DA1212] text-white hover:bg-[#b00f0f] active:bg-[#8f0c0c] shadow-sm hover:shadow border border-transparent focus-visible:ring-[#DA1212]",
    outline:
        "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 shadow-sm focus-visible:ring-slate-400",
    secondary:
        "bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200/80 active:bg-slate-200 focus-visible:ring-slate-400",
    ghost:
        "bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200/70 border border-transparent focus-visible:ring-slate-400",
};

// Field usability sizes: default md is h-11 (44px), lg is h-12 (48px)
const sizeStyles: Record<string, string> = {
    sm: "h-9 px-3 text-xs gap-1.5 rounded-md",
    md: "h-11 px-4 text-sm gap-2 rounded-lg font-semibold", // Ergonomic 44px
    lg: "h-12 px-5 text-base gap-2.5 rounded-lg font-semibold", // Ergonomic 48px
    xl: "h-14 px-6 text-lg gap-3 rounded-lg font-bold",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = "primary",
            size = "md",
            isLoading = false,
            leftIcon,
            rightIcon,
            disabled,
            className,
            type = "button",
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || isLoading;

        return (
            <button
                ref={ref}
                type={type}
                disabled={isDisabled}
                className={cn(
                    "inline-flex items-center justify-center select-none font-medium transition-all duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    "disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none",
                    variantStyles[variant] || variantStyles.primary,
                    sizeStyles[size] || sizeStyles.md,
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <>
                        <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span>Memproses...</span>
                    </>
                ) : (
                    <>
                        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
                        <span>{children}</span>
                        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = "Button";

export default Button;
