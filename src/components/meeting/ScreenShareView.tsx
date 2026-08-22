"use client";

import React, { useState } from "react";
import {
  TrackReferenceOrPlaceholder,
  TrackReference,
  VideoTrack,
  isTrackReference,
} from "@livekit/components-react";
import { ParticipantTile } from "./ParticipantTile";
import { Monitor, StopCircle, Layout, PictureInPicture, EyeOff, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ScreenShareViewProps {
  screenTrack: TrackReferenceOrPlaceholder;
  cameraTracks: TrackReferenceOrPlaceholder[];
  hostIdentity?: string;
  isLocalSharing?: boolean;
  totalAudienceCount?: number;
  onStopShare?: () => void;
}

type LayoutMode = "pip" | "filmstrip" | "screenOnly";

export function ScreenShareView({
  screenTrack,
  cameraTracks,
  hostIdentity,
  isLocalSharing = false,
  totalAudienceCount = 1,
  onStopShare,
}: ScreenShareViewProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("pip");
  const [pipPosition, setPipPosition] = useState<"bottom-right" | "bottom-left" | "top-right">("bottom-right");
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
      return () => {
        track.detach(el);
      };
    }
  }, [track]);

  // Find ONLY the presenter who is sharing their screen
  const sharerIdentity = screenTrack?.participant?.identity;
  const pipCameraTrack =
    cameraTracks.find(t => t.participant?.identity === sharerIdentity) ||
    cameraTracks.find(t => t.participant?.isLocal) ||
    cameraTracks[0];

  const getPipPositionClass = () => {
    switch (pipPosition) {
      case "bottom-left":
        return "bottom-4 left-4";
      case "top-right":
        return "top-4 right-4";
      default:
        return "bottom-4 right-4";
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col gap-2 p-2 sm:p-4 overflow-hidden select-none font-[Poppins,sans-serif]">
      {/* Top Sharer Notification & Layout Control Banner */}
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-900/95 border border-white/10 px-3.5 py-2 text-xs sm:text-sm text-white backdrop-blur-xl shrink-0 shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          <Monitor className="h-4 w-4 text-indigo-400 shrink-0" />
          <span className="truncate">
            <strong className="text-white">{sharerName}</strong> is sharing screen
          </span>

          {/* +n others badge */}
          {totalAudienceCount > 1 && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-2.5 py-0.5 text-[11px] font-bold text-indigo-200">
              <Users className="w-3 h-3 text-indigo-300" />
              <span>+{totalAudienceCount - 1} in call</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Layout Mode Toggles */}
          <div className="flex items-center bg-black/40 rounded-xl p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => setLayoutMode("pip")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                layoutMode === "pip"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Picture-in-Picture Camera Overlay"
            >
              <PictureInPicture className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Floating PiP</span>
            </button>

            <button
              type="button"
              onClick={() => setLayoutMode("filmstrip")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                layoutMode === "filmstrip"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Bottom Camera Filmstrip"
            >
              <Layout className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filmstrip</span>
            </button>

            <button
              type="button"
              onClick={() => setLayoutMode("screenOnly")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                layoutMode === "screenOnly"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Hide Camera (Full Screen)"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Screen Only</span>
            </button>
          </div>

          {/* Stop Share button for presenter */}
          {isLocalSharing && onStopShare && (
            <Button
              size="sm"
              variant="danger"
              onClick={onStopShare}
              className="h-7 sm:h-8 text-xs px-2.5 sm:px-3 shrink-0"
            >
              <StopCircle className="w-3.5 h-3.5 mr-1" />
              <span>Stop Share</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Screen Share Stage */}
      <div className="relative flex-1 min-h-0 w-full rounded-2xl bg-black border-2 border-slate-800/80 overflow-hidden shadow-2xl flex items-center justify-center">
        <video
          ref={videoRef}
          className={`h-full w-full object-contain ${isRealTrack ? "block" : "hidden"}`}
          autoPlay
          playsInline
        />

        {!isRealTrack && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <Monitor className="w-10 h-10 text-indigo-400 mb-2 animate-pulse" />
            <p className="text-sm font-semibold text-slate-200">Connecting to {sharerName}&apos;s screen stream...</p>
            <p className="text-xs text-slate-500 mt-1">LiveKit WebRTC stream is subscribing</p>
          </div>
        )}

        {/* Floating Presenter Face Camera (Picture-in-Picture Mode) */}
        {layoutMode === "pip" && pipCameraTrack && (
          <div
            className={`absolute ${getPipPositionClass()} z-20 w-36 sm:w-60 md:w-72 aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-indigo-500/70 bg-[#0E1626] backdrop-blur-xl transition-all duration-200 group`}
          >
            <ParticipantTile
              trackRef={pipCameraTrack}
              isHost={pipCameraTrack.participant?.identity === hostIdentity}
              className="h-full w-full object-cover"
            />

            {/* Switch corner position button on hover */}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setPipPosition(prev =>
                  prev === "bottom-right"
                    ? "bottom-left"
                    : prev === "bottom-left"
                    ? "top-right"
                    : "bottom-right"
                );
              }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/90 text-white rounded-lg px-2 py-1 text-[10px] font-bold backdrop-blur-md cursor-pointer border border-white/20"
              title="Move Floating Window Position"
            >
              Move
            </button>
          </div>
        )}
      </div>

      {/* Participant Video Filmstrip at Bottom (Filmstrip Mode) */}
      {layoutMode === "filmstrip" && cameraTracks.length > 0 && (
        <div className="flex h-24 sm:h-32 w-full gap-2.5 overflow-x-auto pb-1 shrink-0 animate-in slide-in-from-bottom duration-150">
          {cameraTracks.map(track => (
            <div key={track.participant?.identity + track.source} className="h-full aspect-video shrink-0 min-w-[120px]">
              <ParticipantTile
                trackRef={track}
                isHost={track.participant?.identity === hostIdentity}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
