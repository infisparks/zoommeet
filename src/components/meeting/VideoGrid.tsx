"use client";

import React, { useState } from "react";
import { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { ParticipantTile } from "./ParticipantTile";
import { Users } from "lucide-react";

interface VideoGridProps {
  tracks: TrackReferenceOrPlaceholder[];
  hostIdentity?: string;
  coHostIdentities?: string[];
  raisedHandIdentities?: string[];
  customNames?: Record<string, string>;
  isFocusView?: boolean;
  onlyShowHost?: boolean;
  totalAudienceCount?: number;
}

export function VideoGrid({
  tracks,
  hostIdentity,
  coHostIdentities = [],
  raisedHandIdentities = [],
  customNames = {},
  isFocusView = false,
  onlyShowHost = false,
  totalAudienceCount = 0,
}: VideoGridProps) {
  const [pinnedIdentity, setPinnedIdentity] = useState<string | null>(null);

  if (tracks.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-slate-500">
        <p className="text-sm">Waiting for participants to connect...</p>
      </div>
    );
  }

  // If onlyShowHost is enabled (Webinar Stage Mode):
  // Filter stage tracks to Host, Co-Hosts, and the local attendee ("You") only
  const stageTracks = onlyShowHost
    ? tracks.filter(t => {
        const isHost = t.participant.identity === hostIdentity;
        const isCoHost = coHostIdentities.includes(t.participant.identity);
        const isLocal = t.participant.isLocal;
        return isHost || isCoHost || isLocal;
      })
    : tracks;

  // Fallback to all tracks if no stage track matched
  const activeTracks = stageTracks.length > 0 ? stageTracks : tracks;

  // Handle Focus / Pinned View OR Single Host Stage View
  if (isFocusView || pinnedIdentity || (onlyShowHost && activeTracks.length === 1)) {
    const focusTrack =
      activeTracks.find(t => t.participant.identity === pinnedIdentity) ||
      activeTracks.find(t => t.participant.identity === hostIdentity) ||
      activeTracks[0];
    const otherTracks = activeTracks.filter(t => t.participant.identity !== focusTrack.participant.identity);

    return (
      <div className="relative flex h-full w-full flex-col gap-3 p-1.5 sm:p-4 min-h-0 min-w-0 overflow-hidden">
        {/* Main Stage */}
        <div className="flex-1 min-h-0 w-full relative">
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

          {/* Social Proof Floating Audience Badge in Stage Mode */}
          {totalAudienceCount > 1 && (
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full bg-slate-950/80 px-3.5 py-1.5 border border-white/15 text-xs font-semibold text-slate-200 backdrop-blur-md shadow-lg pointer-events-none">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>+ {totalAudienceCount - 1} others in call</span>
            </div>
          )}
        </div>

        {/* Filmstrip at bottom for Co-Hosts/Presenters if present */}
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
  const count = activeTracks.length;

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
    <div className={`relative grid h-full w-full gap-2 sm:gap-4 p-1.5 sm:p-4 ${gridColsClass} ${gridRowsClass} auto-rows-fr min-h-0 min-w-0 overflow-hidden`}>
      {activeTracks.map(track => (
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

      {/* Social Proof Floating Audience Badge */}
      {totalAudienceCount > count && (
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full bg-slate-950/80 px-3.5 py-1.5 border border-white/15 text-xs font-semibold text-slate-200 backdrop-blur-md shadow-lg pointer-events-none">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>+ {totalAudienceCount - count} others in call</span>
        </div>
      )}
    </div>
  );
}
