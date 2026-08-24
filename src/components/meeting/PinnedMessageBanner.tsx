"use client";

import React from "react";
import { Pin, X, ExternalLink } from "lucide-react";
import { renderWithClickableLinks, extractFirstUrl } from "@/lib/linkify";

export interface PinnedMessage {
  id: string;
  participantId: string;
  participantName: string;
  message: string;
  timestamp: number;
  pinnedBy: string;
  pinnedAt: number;
}

interface PinnedMessageBannerProps {
  pinnedMessage?: PinnedMessage | null;
  isCurrentUserHost?: boolean;
  onUnpin?: () => void;
  onOpenChat?: () => void;
}

export function PinnedMessageBanner({
  pinnedMessage,
  isCurrentUserHost = false,
  onUnpin,
  onOpenChat,
}: PinnedMessageBannerProps) {
  if (!pinnedMessage) return null;

  const firstUrl = extractFirstUrl(pinnedMessage.message);

  return (
    <div className="absolute top-14 sm:top-18 left-1/2 -translate-x-1/2 z-30 w-[94vw] sm:max-w-md md:max-w-lg select-none font-[Poppins,sans-serif] animate-in slide-in-from-top-3 fade-in duration-200">
      <div className="relative flex flex-col gap-1.5 rounded-2xl border border-amber-500/40 bg-[#0B1222]/95 p-3 sm:p-3.5 shadow-2xl backdrop-blur-2xl text-white ring-1 ring-amber-500/20">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-5 items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 text-[10px] font-bold text-amber-300 uppercase tracking-wider shrink-0 shadow-xs">
              <Pin className="w-2.5 h-2.5 fill-current rotate-45" />
              <span>Pinned by Host</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-300 truncate">
              {pinnedMessage.participantName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Host Unpin Button */}
            {isCurrentUserHost && onUnpin && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onUnpin();
                }}
                className="flex items-center gap-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold text-rose-200 transition-colors cursor-pointer"
                title="Unpin from screen"
              >
                <X className="w-3 h-3" />
                <span>Unpin</span>
              </button>
            )}
          </div>
        </div>

        {/* Message Content & Links */}
        <div className="text-xs sm:text-sm text-slate-100 leading-relaxed break-words pt-0.5">
          {renderWithClickableLinks(
            pinnedMessage.message,
            "text-sky-300 hover:text-sky-200 underline font-bold inline-flex items-center gap-1 break-all bg-sky-950/60 border border-sky-600/40 px-1.5 py-0.5 rounded-md my-0.5 hover:bg-sky-900/80 transition"
          )}
        </div>

        {/* Prominent Quick Action Button if message contains a link */}
        {firstUrl && (
          <div className="mt-1 flex items-center justify-between gap-2 pt-1.5 border-t border-white/5">
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px] sm:max-w-xs">
              {firstUrl}
            </span>
            <a
              href={firstUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 py-1.5 text-xs font-bold shadow-md hover:shadow-indigo-500/25 transition active:scale-95 cursor-pointer shrink-0"
            >
              <span>Open Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
