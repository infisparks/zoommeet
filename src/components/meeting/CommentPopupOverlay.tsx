"use client";

import React from "react";
import { MessageSquare, Zap, ArrowUpRight } from "lucide-react";
import { renderWithClickableLinks } from "@/lib/linkify";
import { ChatInteractiveCard } from "@/types";

export interface CommentPopupItem {
  id: string;
  senderName: string;
  message: string;
  timestamp: number;
  interactiveCard?: ChatInteractiveCard;
}

interface CommentPopupOverlayProps {
  popups: CommentPopupItem[];
}

const AVATAR_GRADIENTS = [
  "from-indigo-600 via-purple-600 to-pink-600",
  "from-blue-600 via-indigo-600 to-violet-600",
  "from-emerald-600 via-teal-600 to-cyan-600",
  "from-amber-500 via-orange-600 to-red-600",
  "from-purple-600 via-fuchsia-600 to-pink-600",
  "from-rose-600 via-pink-600 to-purple-600",
];

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export function CommentPopupOverlay({ popups }: CommentPopupOverlayProps) {
  if (!popups || popups.length === 0) return null;

  return (
    <div
      style={{
        bottom: "max(5.5rem, calc(env(safe-area-inset-bottom, 0px) + 5.5rem))",
        left: "max(0.75rem, env(safe-area-inset-left, 0.75rem))",
      }}
      className="pointer-events-none fixed z-50 flex flex-col gap-2.5 max-w-[92vw] sm:max-w-sm select-none font-[Poppins,sans-serif]"
    >
      {popups.map(item => {
        const initials =
          item.senderName
            .split(" ")
            .filter(Boolean)
            .map(x => x[0])
            .join("")
            .substring(0, 2)
            .toUpperCase() || "U";
        const gradient = getAvatarGradient(item.senderName);
        const card = item.interactiveCard;

        return (
          <div
            key={item.id}
            className={`pointer-events-auto flex flex-col gap-2 rounded-2xl border px-3.5 py-2.5 text-white shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-4 fade-in duration-200 ring-1 ${
              card
                ? "bg-[#140F24]/98 border-amber-400/50 ring-amber-400/30 shadow-amber-950/60"
                : "bg-[#0A1020]/95 border-white/20 ring-white/10 shadow-black/70"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Sender Initials Avatar */}
              <div
                className={`flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-[11px] font-bold text-white shadow-md border border-white/20`}
              >
                {initials}
              </div>

              {/* Comment details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                  <span className="truncate text-xs font-bold text-slate-100">
                    {item.senderName}
                  </span>

                  {card?.badge ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-300 bg-amber-500/25 px-1.5 py-0.5 rounded-md border border-amber-400/30 uppercase tracking-wider">
                      <Zap className="w-2.5 h-2.5 fill-current text-amber-400" />
                      <span>{card.badge}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-300 bg-indigo-500/25 px-1.5 py-0.5 rounded-md border border-indigo-400/30">
                      <MessageSquare className="w-2.5 h-2.5 text-indigo-300" />
                      <span>New Message</span>
                    </span>
                  )}
                </div>

                {card?.title && (
                  <p className="text-[11px] font-extrabold text-amber-200 truncate mb-0.5">
                    {card.title}
                  </p>
                )}

                <div className="text-xs text-slate-200 leading-snug line-clamp-2 break-words">
                  {renderWithClickableLinks(
                    item.message,
                    "text-sky-300 hover:underline font-bold inline-flex items-center gap-0.5 break-all"
                  )}
                </div>
              </div>
            </div>

            {/* Quick CTA Action Button on Popup if Interactive Card */}
            {card?.buttonUrl && (
              <a
                href={card.buttonUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="w-full flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white py-1.5 px-3 text-[11px] font-black shadow-md transition active:scale-95 cursor-pointer"
              >
                <span>{card.buttonText || "Open Link ↗"}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
