"use client";

import React from "react";
import { Pin, X, ExternalLink, Sparkles, Zap, ArrowUpRight } from "lucide-react";
import { renderWithClickableLinks, extractFirstUrl } from "@/lib/linkify";
import { ChatInteractiveCard } from "@/types";

export interface PinnedMessage {
  id: string;
  participantId: string;
  participantName: string;
  message: string;
  timestamp: number;
  pinnedBy: string;
  pinnedAt: number;
  interactiveCard?: ChatInteractiveCard;
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

  const card = pinnedMessage.interactiveCard;
  const targetUrl = card?.buttonUrl || extractFirstUrl(pinnedMessage.message);
  const buttonText = card?.buttonText || (targetUrl ? "Open Link ↗" : null);

  return (
    <div className="absolute top-14 sm:top-18 left-1/2 -translate-x-1/2 z-30 w-[94vw] sm:max-w-md md:max-w-lg select-none font-[Poppins,sans-serif] animate-in slide-in-from-top-3 fade-in duration-200">
      <div className={`relative flex flex-col gap-2 rounded-2xl border p-3 sm:p-4 shadow-2xl backdrop-blur-2xl text-white ${
        card
          ? "border-amber-400/50 bg-gradient-to-b from-[#161226]/98 to-[#0B1020]/98 ring-2 ring-amber-400/30 shadow-amber-950/50"
          : "border-amber-500/40 bg-[#0B1222]/95 ring-1 ring-amber-500/20 shadow-indigo-950/50"
      }`}>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-extrabold uppercase tracking-wider shrink-0 shadow-xs border ${
              card
                ? "bg-amber-500/30 border-amber-400/60 text-amber-200 animate-pulse"
                : "bg-amber-500/20 border-amber-500/40 text-amber-300"
            }`}>
              {card ? <Zap className="w-2.5 h-2.5 fill-current" /> : <Pin className="w-2.5 h-2.5 fill-current rotate-45" />}
              <span>{card?.badge || "PINNED BY HOST"}</span>
            </span>

            {card?.priceTag && (
              <span className="flex h-5 items-center rounded-full bg-emerald-500/25 border border-emerald-400/40 px-2 text-[11px] font-black text-emerald-300">
                {card.priceTag}
              </span>
            )}

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

        {/* Card Title if Present */}
        {card?.title && (
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>{card.title}</span>
          </div>
        )}

        {/* Message Content & Links */}
        <div className="text-xs sm:text-sm text-slate-100 leading-relaxed break-words">
          {renderWithClickableLinks(
            pinnedMessage.message,
            "text-sky-300 hover:text-sky-200 underline font-bold inline-flex items-center gap-1 break-all bg-sky-950/60 border border-sky-600/40 px-1.5 py-0.5 rounded-md my-0.5 hover:bg-sky-900/80 transition"
          )}
        </div>

        {/* High-Converting CTA Action Button */}
        {targetUrl && (
          <div className="mt-1 flex items-center justify-between gap-3 pt-2 border-t border-white/10">
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px] sm:max-w-[200px]">
              {targetUrl}
            </span>
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white px-4 py-2 text-xs sm:text-sm font-black shadow-lg shadow-orange-500/25 transition active:scale-95 cursor-pointer shrink-0"
            >
              <span>{buttonText}</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

