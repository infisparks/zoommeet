"use client";

import React, { useState } from "react";
import { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { ParticipantTile } from "./ParticipantTile";

interface VideoGridProps {
  tracks: TrackReferenceOrPlaceholder[];
  hostIdentity?: string;
  coHostIdentities?: string[];
  raisedHandIdentities?: string[];
  customNames?: Record<string, string>;
  isFocusView?: boolean;
}

export function VideoGrid({
  tracks,
  hostIdentity,
  coHostIdentities = [],
  raisedHandIdentities = [],
  customNames = {},
  isFocusView = false,
}: VideoGridProps) {
  const [pinnedIdentity, setPinnedIdentity] = useState<string | null>(null);

  if (tracks.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-slate-500">
        <p className="text-sm">Waiting for participants to connect...</p>
      </div>
    );
  }

  // Handle Focus / Pinned View
  if (isFocusView || pinnedIdentity) {
    const focusTrack =
      tracks.find(t => t.participant.identity === pinnedIdentity) ||
      tracks[0];
    const otherTracks = tracks.filter(t => t.participant.identity !== focusTrack.participant.identity);

    return (
      <div className="flex h-full w-full flex-col gap-3 p-3 sm:p-4">
        {/* Main Stage */}
        <div className="flex-1 min-h-0 w-full">
          <ParticipantTile
            trackRef={focusTrack}
            isHost={focusTrack.participant.identity === hostIdentity}
            isCoHost={coHostIdentities.includes(focusTrack.participant.identity)}
            isHandRaised={raisedHandIdentities.includes(focusTrack.participant.identity)}
            customName={customNames[focusTrack.participant.identity]}
            isPinned={pinnedIdentity === focusTrack.participant.identity}
            onTogglePin={() =>
              setPinnedIdentity(
                pinnedIdentity === focusTrack.participant.identity ? null : focusTrack.participant.identity
              )
            }
            className="h-full w-full"
          />
        </div>

        {/* Filmstrip at bottom */}
        {otherTracks.length > 0 && (
          <div className="flex h-28 sm:h-36 w-full gap-3 overflow-x-auto pb-1 shrink-0">
            {otherTracks.map(track => (
              <div key={track.participant.identity + track.source} className="h-full aspect-video shrink-0">
                <ParticipantTile
                  trackRef={track}
                  isHost={track.participant.identity === hostIdentity}
                  isCoHost={coHostIdentities.includes(track.participant.identity)}
                  isHandRaised={raisedHandIdentities.includes(track.participant.identity)}
                  customName={customNames[track.participant.identity]}
                  isPinned={false}
                  onTogglePin={() => setPinnedIdentity(track.participant.identity)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Adaptive Grid Layout based on count
  const count = tracks.length;

  let gridColsClass = "grid-cols-1";
  let gridRowsClass = "grid-rows-1";

  if (count === 2) {
    gridColsClass = "grid-cols-1 md:grid-cols-2";
    gridRowsClass = "grid-rows-2 md:grid-rows-1";
  } else if (count >= 3 && count <= 4) {
    gridColsClass = "grid-cols-1 sm:grid-cols-2";
    gridRowsClass = "grid-rows-2";
  } else if (count >= 5 && count <= 6) {
    gridColsClass = "grid-cols-2 sm:grid-cols-3";
    gridRowsClass = "grid-rows-3 sm:grid-rows-2";
  } else if (count >= 7 && count <= 9) {
    gridColsClass = "grid-cols-2 sm:grid-cols-3";
    gridRowsClass = "grid-rows-3";
  } else if (count >= 10) {
    gridColsClass = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
    gridRowsClass = "grid-rows-auto";
  }

  return (
    <div className={`grid h-full w-full gap-3 sm:gap-4 p-3 sm:p-4 ${gridColsClass} ${gridRowsClass} auto-rows-fr`}>
      {tracks.map(track => (
        <div key={track.participant.identity + track.source} className="h-full w-full min-h-0 min-w-0">
          <ParticipantTile
            trackRef={track}
            isHost={track.participant.identity === hostIdentity}
            isCoHost={coHostIdentities.includes(track.participant.identity)}
            isHandRaised={raisedHandIdentities.includes(track.participant.identity)}
            customName={customNames[track.participant.identity]}
            isPinned={pinnedIdentity === track.participant.identity}
            onTogglePin={() =>
              setPinnedIdentity(
                pinnedIdentity === track.participant.identity ? null : track.participant.identity
              )
            }
          />
        </div>
      ))}
    </div>
  );
}
