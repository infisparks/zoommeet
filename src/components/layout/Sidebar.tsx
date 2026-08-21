"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  Calendar,
  Disc,
  Users,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { branding } from "@/config/branding";
import { Avatar } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Meetings", href: "/meetings", icon: Video },
    { name: "Schedule", href: "/schedule", icon: Calendar },
    { name: "Recordings", href: "/recordings", icon: Disc },
    { name: "Team Directory", href: "/contacts", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200/90 bg-white transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-lg lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* App Logo */}
        <div className="flex h-20 items-center gap-3.5 px-6 border-b border-slate-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-lg tracking-tight">
                {branding.appName}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Enterprise Cloud SFU</p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="px-3 pb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Main Workspace
          </div>
          {navigation.map(item => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm sm:text-base font-semibold transition-all duration-150",
                  isActive
                    ? "bg-indigo-50/90 text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-700"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-6 px-1">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100/80 p-4">
              <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm mb-1">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>LiveKit Cloud Engine</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ultra-low latency SFU connected at <code className="text-xs font-mono font-bold text-indigo-900">live.infiplus.in</code>
              </p>
            </div>
          </div>
        </div>

        {/* User profile footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/70">
          <div className="flex items-center justify-between rounded-xl p-2 bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                name={user?.name || "Alex Morgan"}
                src={user?.avatar}
                size="md"
                status="online"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {user?.name || "Alex Morgan"}
                </p>
                <p className="truncate text-xs text-slate-400 font-medium">
                  {user?.email || "alex@infiplus.in"}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
