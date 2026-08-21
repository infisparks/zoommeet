"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { branding } from "@/config/branding";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Video, ArrowLeft, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";

export default function JoinMeetingPage() {
  const [meetingIdInput, setMeetingIdInput] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let cleanId = meetingIdInput.trim();
    if (!cleanId) {
      setError("Please enter a valid Meeting ID or link.");
      return;
    }

    // If full URL was pasted, extract path segment
    if (cleanId.includes("/meeting/")) {
      const parts = cleanId.split("/meeting/");
      cleanId = parts[1]?.split("?")[0] || cleanId;
    }

    // Clean slashes
    cleanId = cleanId.replace(/^\/+|\/+$/g, "");

    if (displayName) {
      sessionStorage.setItem("infiplus_guest_name", displayName);
    }

    router.push(`/meeting/${cleanId}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.12),transparent_70%)]" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Video className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">{branding.appName}</span>
          </div>
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-100">Join a Conference</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter the 9-10 character Meeting ID or room link shared by the host.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Meeting ID or Link
            </label>
            <input
              type="text"
              placeholder="e.g. abc-defg-hij or 123-456"
              value={meetingIdInput}
              onChange={e => setMeetingIdInput(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Your Display Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Alex Morgan"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full h-11">
              <span>Continue to Pre-Join</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </form>

        <div className="mt-6 border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>No download required</span>
          </span>
          <Link href="/login" className="text-blue-400 hover:underline">
            Host a meeting
          </Link>
        </div>
      </div>
    </div>
  );
}
