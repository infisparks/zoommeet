"use client";

import React from "react";
import Link from "next/link";
import { Menu, Plus, Video, Calendar, Bell, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  onMenuClick?: () => void;
  title?: string;
  subtitle?: string;
  onNewMeeting?: () => void;
}

export function Header({ onMenuClick, title, subtitle, onNewMeeting }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && <p className="text-[11px] text-slate-400 font-normal">{subtitle}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        <Link href="/join">
          <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
            <Video className="w-3.5 h-3.5 text-slate-500 mr-1" />
            <span>Join with ID</span>
          </Button>
        </Link>

        <Link href="/schedule">
          <Button variant="secondary" size="sm" className="hidden sm:inline-flex text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-600 mr-1" />
            <span>Schedule</span>
          </Button>
        </Link>

        {onNewMeeting && (
          <Button variant="primary" size="sm" onClick={onNewMeeting} className="text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Instant Meeting</span>
          </Button>
        )}

        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

        <button
          title="Notifications"
          className="relative rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
