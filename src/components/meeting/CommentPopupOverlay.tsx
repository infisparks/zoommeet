"use client";

import React from "react";
import { MessageSquare } from "lucide-react";

export interface CommentPopupItem {
  id: string;
  senderName: string;
  message: string;
  timestamp: number;
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
  if (popups.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-20 sm:bottom-24 left-3 sm:left-6 z-40 flex flex-col gap-2 max-w-[92vw] sm:max-w-sm select-none font-[Poppins,sans-serif]">
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

        return (
          <div
            key={item.id}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-[#0E1628]/95 border border-white/15 px-3.5 py-2.5 text-white shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-3 fade-in duration-200"
          >
            {/* Sender Initials Avatar */}
            <div
              className={`flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-[11px] font-bold text-white shadow-md border border-white/20`}
            >
              {initials}
            </div>

            {/* Comment details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="truncate text-xs font-bold text-slate-100">
                  {item.senderName}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded-md border border-indigo-400/20">
                  <MessageSquare className="w-2.5 h-2.5 text-indigo-300" />
                  <span>comment</span>
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-snug line-clamp-2 break-words">
                {item.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
