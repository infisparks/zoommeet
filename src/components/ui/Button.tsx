import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "dark" | "gradient" | "lux";
  size?: "sm" | "md" | "lg" | "xl" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer";

    const variantStyles = {
      primary:
        "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 focus:ring-indigo-500 rounded-xl",
      gradient:
        "bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-purple-600/35 focus:ring-purple-500 rounded-xl",
      lux:
        "bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 text-white border border-white/20 shadow-lg shadow-indigo-900/30 hover:shadow-xl hover:scale-[1.01] focus:ring-indigo-400 rounded-xl",
      secondary:
        "bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400 rounded-xl",
      outline:
        "border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-800 focus:ring-indigo-500 bg-white rounded-xl shadow-xs",
      ghost:
        "text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 focus:ring-slate-400 rounded-xl",
      danger:
        "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25 focus:ring-rose-500 rounded-xl",
      dark:
        "bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/80 focus:ring-slate-500 rounded-xl shadow-md",
    };

    const sizeStyles = {
      sm: "text-xs sm:text-sm px-3.5 py-1.5 h-9 gap-1.5 font-medium",
      md: "text-sm sm:text-base px-4.5 py-2.5 h-11 gap-2 font-semibold",
      lg: "text-base sm:text-lg px-6 py-3.5 h-13 gap-2.5 font-bold",
      xl: "text-lg px-8 py-4 h-15 gap-3 font-bold rounded-2xl",
      icon: "h-11 w-11 p-0 rounded-xl",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2.5 h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
