"use client";

import React from "react";
import {
  TrackReferenceOrPlaceholder,
  TrackReference,
  VideoTrack,
  isTrackReference,
} from "@livekit/components-react";
import { ParticipantTile } from "./ParticipantTile";
import { Monitor, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ScreenShareViewProps {
  screenTrack: TrackReferenceOrPlaceholder;
  cameraTracks: TrackReferenceOrPlaceholder[];
  hostIdentity?: string;
  isLocalSharing?: boolean;
  onStopShare?: () => void;
}

export function ScreenShareView({
  screenTrack,
  cameraTracks,
  hostIdentity,
  isLocalSharing = false,
  onStopShare,
}: ScreenShareViewProps) {
  const sharerName =
    screenTrack.participant.name ||
    screenTrack.participant.identity ||
    "A participant";

  const isRealTrack = isTrackReference(screenTrack);

  return (
    <div className="flex h-full w-full flex-col gap-3 p-3 sm:p-4">
      {/* Top Sharer Notification Banner */}
      <div className="flex items-center justify-between rounded-xl bg-slate-900/80 border border-slate-800 px-4 py-2 text-xs text-white backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-blue-400" />
          <span>
            <strong className="text-slate-100">{sharerName}</strong> is sharing their screen
          </span>
        </div>
        {isLocalSharing && onStopShare && (
          <Button
            size="sm"
            variant="danger"
            onClick={onStopShare}
            className="h-7 text-xs"
          >
            <StopCircle className="w-3.5 h-3.5 mr-1" />
            <span>Stop Sharing</span>
          </Button>
        )}
      </div>

      {/* Main Screen Share Stage */}
      <div className="relative flex-1 min-h-0 w-full rounded-2xl bg-black border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
        {isRealTrack ? (
          <VideoTrack
            trackRef={screenTrack as TrackReference}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="text-slate-500 text-xs">Waiting for video feed...</div>
        )}
      </div>

      {/* Participant Video Filmstrip at Bottom */}
      {cameraTracks.length > 0 && (
        <div className="flex h-28 sm:h-36 w-full gap-3 overflow-x-auto pb-1 shrink-0">
          {cameraTracks.map(track => (
            <div key={track.participant.identity + track.source} className="h-full aspect-video shrink-0">
              <ParticipantTile
                trackRef={track}
                isHost={track.participant.identity === hostIdentity}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
