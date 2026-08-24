"use client";

import React from "react";
import {
  TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Monitor, StopCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ScreenShareViewProps {
  screenTrack: TrackReferenceOrPlaceholder;
  cameraTracks?: TrackReferenceOrPlaceholder[];
  hostIdentity?: string;
  isCurrentUserHost?: boolean;
  isLocalSharing?: boolean;
  totalAudienceCount?: number;
  onStopShare?: () => void;
}

export function ScreenShareView({
  screenTrack,
  isLocalSharing = false,
  totalAudienceCount = 1,
  onStopShare,
}: ScreenShareViewProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const sharerName =
    screenTrack?.participant?.name ||
    screenTrack?.participant?.identity ||
    "A participant";

  const track = screenTrack?.publication?.track;
  const isRealTrack = Boolean(track);

  React.useEffect(() => {
    const el = videoRef.current;
    if (el && track) {
      track.attach(el);
      try {
        if ("autoPictureInPicture" in el || "autoPictureInPicture" in HTMLVideoElement.prototype) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (el as any).autoPictureInPicture = true;
        }
        el.setAttribute("autopictureinpicture", "");
      } catch (e) {
        console.warn("autoPictureInPicture attribute notice:", e);
      }
      return () => {
        track.detach(el);
      };
    }
  }, [track]);

  return (
    <div className="relative flex h-full w-full flex-col p-0 sm:p-1 overflow-hidden select-none font-[Poppins,sans-serif] min-h-0 min-w-0">
      {/* Main Screen Share Stage (Takes 100% full space) */}
      <div className="relative flex-1 min-h-0 w-full rounded-xl sm:rounded-2xl bg-black border border-slate-800/80 overflow-hidden shadow-2xl flex items-center justify-center">
        <video
          ref={videoRef}
          className={`h-full w-full object-contain ${isRealTrack ? "block" : "hidden"}`}
          autoPlay
          playsInline
          // @ts-expect-error autopictureinpicture is standard in Chromium
          autopictureinpicture=""
        />

        {!isRealTrack && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <Monitor className="w-10 h-10 text-indigo-400 mb-2 animate-pulse" />
            <p className="text-sm font-semibold text-slate-200">Connecting to {sharerName}&apos;s screen stream...</p>
            <p className="text-xs text-slate-500 mt-1">LiveKit WebRTC stream is subscribing</p>
          </div>
        )}

        {/* Small Floating Sharer & Audience Info inside Screen (Top-Left) */}
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 pointer-events-auto max-w-[85%]">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-950/85 border border-white/15 px-2.5 py-1 text-[11px] sm:text-xs text-white backdrop-blur-md shadow-lg">
            <Monitor className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">
              <strong className="text-white font-semibold">{sharerName}</strong> is sharing
            </span>
          </div>

          {totalAudienceCount > 1 && (
            <div className="inline-flex items-center gap-1 rounded-full bg-indigo-950/85 border border-indigo-400/30 px-2 py-1 text-[10px] sm:text-[11px] font-bold text-indigo-200 backdrop-blur-md shadow-lg shrink-0">
              <Users className="w-3 h-3 text-indigo-300" />
              <span>+{totalAudienceCount - 1} in call</span>
            </div>
          )}
        </div>

        {/* Stop Share button for local sharer (Top-Right) */}
        {isLocalSharing && onStopShare && (
          <div className="absolute top-2.5 right-2.5 z-20 pointer-events-auto">
            <Button
              size="sm"
              variant="danger"
              onClick={onStopShare}
              className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-2.5 shrink-0 shadow-lg"
            >
              <StopCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
              <span>Stop Share</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
