import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "outline" | "host" | "purple";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "secondary", size = "sm", children, ...props }: BadgeProps) {
  const variantStyles = {
    primary: "bg-indigo-50 text-indigo-700 border-indigo-200/80 font-medium",
    purple: "bg-purple-50 text-purple-700 border-purple-200/80 font-medium",
    secondary: "bg-slate-100 text-slate-700 border-slate-200 font-medium",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/80 font-medium",
    warning: "bg-amber-50 text-amber-700 border-amber-200/80 font-medium",
    danger: "bg-rose-50 text-rose-700 border-rose-200/80 font-medium",
    outline: "border-slate-300 text-slate-700 bg-transparent font-medium",
    host: "bg-indigo-600 text-white border-transparent font-semibold shadow-xs",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2.5 py-0.5 rounded-md",
    md: "text-xs px-3 py-1 rounded-md",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "in-meeting" | "busy";
}

export function Avatar({ src, name = "User", size = "md", status, className, ...props }: AvatarProps) {
  const sizeStyles = {
    sm: "w-8 h-8 text-xs font-medium",
    md: "w-9 h-9 text-sm font-semibold",
    lg: "w-11 h-11 text-base font-bold",
    xl: "w-14 h-14 text-lg font-bold",
  };

  const statusStyles = {
    online: "bg-emerald-500",
    offline: "bg-slate-400",
    "in-meeting": "bg-indigo-500 ring-2 ring-white",
    busy: "bg-rose-500",
  };

  const initials = name
    .split(" ")
    .map(p => p[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={cn("relative inline-block select-none shrink-0", className)} {...props}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center overflow-hidden border border-slate-200 bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xs",
          sizeStyles[size]
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-white w-2.5 h-2.5",
            size === "xl" && "w-3.5 h-3.5 ring-[2px]",
            statusStyles[status]
          )}
        />
      )}
    </div>
  );
}
