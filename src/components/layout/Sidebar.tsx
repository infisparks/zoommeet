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
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200/90 bg-white shadow-xs transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* App Branding */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-100/90">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/25">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-[15px]">
                {branding.appName}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Enterprise Suite</p>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workspace
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
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold tracking-tight transition-all duration-150",
                  isActive
                    ? "bg-blue-50/90 text-blue-600 shadow-2xs font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-600" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-6 px-1">
            <div className="rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 border border-blue-100/80 p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>LiveKit Cloud Engine</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                Sub-50ms ultra-low latency SFU stream connected at <code className="text-[10px] bg-white/80 border border-blue-200/60 px-1.5 py-0.5 rounded font-mono text-blue-900 font-semibold">live.infiplus.in</code>
              </p>
            </div>
          </div>
        </div>

        {/* User Profile & Logout Bottom Bar */}
        <div className="border-t border-slate-100 p-3.5 bg-slate-50/40">
          <div className="flex items-center justify-between rounded-xl p-2 hover:bg-white transition-all shadow-2xs border border-transparent hover:border-slate-200/80">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                name={user?.name || "Member"}
                src={user?.avatar}
                size="sm"
                status="online"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-900">
                  {user?.name || "Demo User"}
                </p>
                <p className="truncate text-[10px] text-slate-400 font-medium">
                  {user?.email || "alex@infiplus.in"}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
