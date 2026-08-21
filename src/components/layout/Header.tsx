"use client";

import React from "react";
import Link from "next/link";
import { Menu, Plus, Video, Calendar, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  onMenuClick?: () => void;
  title?: string;
  subtitle?: string;
  onNewMeeting?: () => void;
}

export function Header({ onMenuClick, title, subtitle, onNewMeeting }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 sm:px-8 backdrop-blur-xl">
      <div className="flex items-center gap-3.5">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        {title && (
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <Link href="/join">
          <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs sm:text-sm h-10 px-3.5">
            <Video className="w-4 h-4 text-slate-600 mr-1.5" />
            <span>Join with ID</span>
          </Button>
        </Link>

        <Link href="/schedule">
          <Button variant="secondary" size="sm" className="hidden sm:inline-flex text-xs sm:text-sm h-10 px-3.5">
            <Calendar className="w-4 h-4 text-slate-700 mr-1.5" />
            <span>Schedule</span>
          </Button>
        </Link>

        {onNewMeeting && (
          <Button variant="primary" size="md" onClick={onNewMeeting} className="h-10 sm:h-11 px-4 text-xs sm:text-sm font-semibold shadow-md">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New Meeting</span>
          </Button>
        )}

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        <button
          title="Notifications"
          className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
