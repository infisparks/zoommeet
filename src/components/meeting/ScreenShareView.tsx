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
  isCurrentUserHost?: boolean;
  isLocalSharing?: boolean;
  totalAudienceCount?: number;
  onStopShare?: () => void;
}

type LayoutMode = "pip" | "filmstrip" | "screenOnly";

export function ScreenShareView({
  screenTrack,
  cameraTracks,
  hostIdentity,
  isCurrentUserHost = false,
  isLocalSharing = false,
  totalAudienceCount = 1,
  onStopShare,
}: ScreenShareViewProps) {
  // Default to screenOnly for maximum screen real estate & clean viewing
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("screenOnly");
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
    <div className="relative flex h-full w-full flex-col p-0 sm:p-1 overflow-hidden select-none font-[Poppins,sans-serif] min-h-0 min-w-0">
      {/* Main Screen Share Stage (Takes 100% full space) */}
      <div className="relative flex-1 min-h-0 w-full rounded-xl sm:rounded-2xl bg-black border border-slate-800/80 overflow-hidden shadow-2xl flex items-center justify-center">
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

        {/* Small Floating Host Controls inside Screen (Top-Right) */}
        {(isCurrentUserHost || (isLocalSharing && onStopShare)) && (
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 pointer-events-auto">
            {isCurrentUserHost && (
              <div className="flex items-center bg-slate-950/85 rounded-xl p-0.5 border border-white/15 backdrop-blur-md shadow-lg">
                <button
                  type="button"
                  onClick={() => setLayoutMode("screenOnly")}
                  className={`flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold transition-all cursor-pointer ${
                    layoutMode === "screenOnly"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Screen Only"
                >
                  <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Screen Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutMode("pip")}
                  className={`flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold transition-all cursor-pointer ${
                    layoutMode === "pip"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Floating PiP"
                >
                  <PictureInPicture className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">PiP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutMode("filmstrip")}
                  className={`flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold transition-all cursor-pointer ${
                    layoutMode === "filmstrip"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Filmstrip"
                >
                  <Layout className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Filmstrip</span>
                </button>
              </div>
            )}

            {isLocalSharing && onStopShare && (
              <Button
                size="sm"
                variant="danger"
                onClick={onStopShare}
                className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-2.5 shrink-0 shadow-lg"
              >
                <StopCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                <span>Stop</span>
              </Button>
            )}
          </div>
        )}

        {/* Floating Presenter Face Camera (Picture-in-Picture Mode) */}
        {layoutMode === "pip" && pipCameraTrack && (
          <div
            className={`absolute ${getPipPositionClass()} z-20 w-32 sm:w-60 md:w-72 aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-2 border-indigo-500/70 bg-[#0E1626] backdrop-blur-xl transition-all duration-200 group`}
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
