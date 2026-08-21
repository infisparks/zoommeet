"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { ReactionItem } from "@/types";

interface ReactionsOverlayProps {
  reactions: ReactionItem[];
}

export function ReactionsOverlay({ reactions }: ReactionsOverlayProps) {
  useEffect(() => {
    if (reactions.length > 0) {
      const latest = reactions[reactions.length - 1];
      if (latest.emoji === "🎉") {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    }
  }, [reactions]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {reactions.map((reaction, index) => {
        // Distribute horizontally across bottom half
        const leftPos = 20 + ((index * 17) % 60);
        return (
          <div
            key={reaction.id}
            style={{ left: `${leftPos}%`, bottom: "100px" }}
            className="floating-reaction absolute flex flex-col items-center gap-1"
          >
            <span className="text-4xl filter drop-shadow-md select-none">
              {reaction.emoji}
            </span>
            <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs border border-white/10">
              {reaction.senderName}
            </span>
          </div>
        );
      })}
    </div>
  );
}
