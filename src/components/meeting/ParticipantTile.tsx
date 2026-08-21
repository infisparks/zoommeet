"use client";

import React from "react";
import {
  TrackReferenceOrPlaceholder,
  TrackReference,
  VideoTrack,
  useIsSpeaking,
  useTrackMutedIndicator,
  isTrackReference,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff, Hand, Crown, Pin, PinOff } from "lucide-react";

interface ParticipantTileProps {
  trackRef: TrackReferenceOrPlaceholder;
  isHost?: boolean;
  isCoHost?: boolean;
  isHandRaised?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  className?: string;
}

export function ParticipantTile({
  trackRef,
  isHost = false,
  isCoHost = false,
  isHandRaised = false,
  isPinned = false,
  onTogglePin,
  className = "",
}: ParticipantTileProps) {
  const isSpeaking = useIsSpeaking(trackRef?.participant);
  const isVideoMuted = useTrackMutedIndicator(trackRef);
  const isAudioMuted = !trackRef?.participant?.isMicrophoneEnabled;

  const displayName =
    trackRef?.participant?.name ||
    trackRef?.participant?.identity ||
    "Attendee";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map(p => p[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "A";

  const isRealTrack = isTrackReference(trackRef);
  const hasVideoTrack =
    isRealTrack &&
    trackRef.publication?.track &&
    !isVideoMuted.isMuted &&
    trackRef.source === Track.Source.Camera;

  return (
    <div
      className={`group relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-[#0E1626] border-2 transition-all duration-200 ${
        isSpeaking
          ? "border-indigo-500 speaking-highlight shadow-xl"
          : "border-slate-800/90 hover:border-slate-700 shadow-lg"
      } ${className}`}
    >
      {/* Real Video Track or Avatar Fallback */}
      {isRealTrack && hasVideoTrack ? (
        <div className="h-full w-full">
          <VideoTrack
            trackRef={trackRef as TrackReference}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-4">
          <div className="flex h-20 w-20 sm:h-26 sm:w-26 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white text-2xl sm:text-4xl font-bold shadow-2xl border-2 border-white/20 select-none tracking-tight">
            {initials}
          </div>
          <span className="mt-3.5 text-sm sm:text-base font-bold text-slate-100 tracking-tight">
            {displayName}
          </span>
        </div>
      )}

      {/* Top Left Badges: Host / Co-host / Raised Hand */}
      <div className="absolute top-3.5 left-3.5 flex items-center gap-2 z-10">
        {isHost && (
          <span className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1 text-xs font-bold text-white shadow-md">
            <Crown className="w-3.5 h-3.5" />
            <span>Host</span>
          </span>
        )}
        {isCoHost && !isHost && (
          <span className="inline-flex items-center gap-1 rounded-xl bg-purple-600/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            Co-host
          </span>
        )}
        {isHandRaised && (
          <span className="inline-flex items-center gap-1 rounded-xl bg-amber-400 px-3 py-1 text-xs font-bold text-slate-950 shadow-md animate-bounce">
            <Hand className="w-3.5 h-3.5" />
            <span>Hand Raised</span>
          </span>
        )}
      </div>

      {/* Top Right Pin Button */}
      {onTogglePin && (
        <button
          onClick={onTogglePin}
          className="absolute top-3.5 right-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/90 backdrop-blur-md cursor-pointer border border-white/10"
          title={isPinned ? "Unpin view" : "Pin participant"}
        >
          {isPinned ? <PinOff className="w-4.5 h-4.5 text-indigo-400" /> : <Pin className="w-4.5 h-4.5" />}
        </button>
      )}

      {/* Bottom Name & Mic status badge */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2 rounded-xl bg-black/75 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-md border border-white/15 max-w-[85%] shadow-md">
          <div
            className={`p-0.5 rounded ${
              isAudioMuted ? "text-rose-400" : isSpeaking ? "text-emerald-400" : "text-slate-300"
            }`}
          >
            {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </div>
          <span className="truncate text-xs sm:text-sm font-medium">
            {displayName} {trackRef?.participant?.isLocal ? "(You)" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
