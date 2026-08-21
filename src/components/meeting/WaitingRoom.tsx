"use client";

import React from "react";
import { branding } from "@/config/branding";
import { Button } from "@/components/ui/Button";
import { Video, ShieldCheck, Clock, UserCheck, UserX, Users } from "lucide-react";

export interface WaitingUser {
  identity: string;
  name: string;
  joinedAt: number;
}

interface WaitingRoomAttendeeViewProps {
  meetingTitle?: string;
  meetingId: string;
  hostName?: string;
  onLeave: () => void;
}

export function WaitingRoomAttendeeView({
  meetingTitle,
  meetingId,
  hostName = "Host",
  onLeave,
}: WaitingRoomAttendeeViewProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.12),transparent_70%)]" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-md space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Waiting Room Active
          </span>
          <h2 className="text-xl font-bold text-white mt-1">
            {meetingTitle || "Infiplus Conference"}
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Please wait, the meeting host (<span className="text-slate-200 font-semibold">{hostName}</span>) will let you in shortly.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs text-slate-400 font-mono">
          Meeting ID: {meetingId}
        </div>

        <div className="pt-2">
          <Button variant="outline" onClick={onLeave} className="w-full text-slate-300 border-slate-700 hover:bg-slate-800">
            Leave Waiting Room
          </Button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secured by {branding.appName}</span>
        </div>
      </div>
    </div>
  );
}

interface HostWaitingRoomBannerProps {
  waitingUsers: WaitingUser[];
  onAdmit: (identity: string) => void;
  onDeny: (identity: string) => void;
  onAdmitAll: () => void;
}

export function HostWaitingRoomBanner({
  waitingUsers,
  onAdmit,
  onDeny,
  onAdmitAll,
}: HostWaitingRoomBannerProps) {
  if (waitingUsers.length === 0) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in slide-in-from-top duration-200">
      <div className="flex items-center justify-between rounded-2xl border border-amber-500/40 bg-slate-900/95 p-3 text-white shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-100 truncate">
              {waitingUsers.length} attendee{waitingUsers.length > 1 ? "s" : ""} in Waiting Room
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {waitingUsers.map(u => u.name).join(", ")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDeny(waitingUsers[0].identity)}
            className="h-8 text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <UserX className="w-3.5 h-3.5 mr-1" />
            <span>Deny</span>
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={waitingUsers.length > 1 ? onAdmitAll : () => onAdmit(waitingUsers[0].identity)}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <UserCheck className="w-3.5 h-3.5 mr-1" />
            <span>{waitingUsers.length > 1 ? "Admit All" : "Admit"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
