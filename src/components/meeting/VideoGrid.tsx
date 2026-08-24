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
  onlyShowHost = true,
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

  // 1. Stage Mode: ONLY SHOW ADMIN SCREEN (Default Enabled)
  // When onlyShowHost is true, only the Admin / Host screen fills the entire stage (like ScreenShareView)
  if (onlyShowHost) {
    const hostTrack =
      tracks.find(t => t.participant.identity === hostIdentity) ||
      tracks.find(
        t =>
          t.participant.name?.toLowerCase().includes("admin") ||
          t.participant.name?.toLowerCase().includes("host")
      ) ||
      tracks.find(t => !t.participant.isLocal) ||
      tracks[0];

    return (
      <div className="relative flex h-full w-full flex-col p-0 sm:p-1 min-h-0 min-w-0 overflow-hidden select-none font-[Poppins,sans-serif]">
        {/* Full-Bleed Admin Stage (Takes 100% full view, like screen share) */}
        <div className="relative flex-1 min-h-0 w-full rounded-xl sm:rounded-2xl bg-black border border-slate-800/80 overflow-hidden shadow-2xl flex items-center justify-center">
          <ParticipantTile
            trackRef={hostTrack}
            isHost={hostTrack.participant.identity === hostIdentity || true}
            isCoHost={false}
            isHandRaised={raisedHandIdentities.includes(hostTrack.participant.identity)}
            customName={customNames[hostTrack.participant.identity]}
            isPinned={false}
            className="h-full w-full"
          />

          {/* Audience Social Proof Pill inside Admin Stage */}
          {totalAudienceCount > 1 && (
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full bg-slate-950/85 px-3.5 py-1.5 border border-white/15 text-xs font-semibold text-slate-200 backdrop-blur-md shadow-lg pointer-events-none">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>+ {totalAudienceCount - 1} in call</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Focus / Pinned View (When onlyShowHost is unchecked and a participant is pinned / focus view)
  if (isFocusView || pinnedIdentity) {
    const focusTrack =
      tracks.find(t => t.participant.identity === pinnedIdentity) ||
      tracks.find(t => t.participant.identity === hostIdentity) ||
      tracks[0];
    const otherTracks = tracks.filter(t => t.participant.identity !== focusTrack.participant.identity);

    return (
      <div className="relative flex h-full w-full flex-col gap-3 p-1.5 sm:p-4 min-h-0 min-w-0 overflow-hidden select-none font-[Poppins,sans-serif]">
        {/* Main Stage */}
        <div className="flex-1 min-h-0 w-full relative rounded-xl sm:rounded-2xl overflow-hidden bg-black border border-slate-800/80 shadow-2xl">
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

          {totalAudienceCount > 1 && (
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full bg-slate-950/80 px-3.5 py-1.5 border border-white/15 text-xs font-semibold text-slate-200 backdrop-blur-md shadow-lg pointer-events-none">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>+ {totalAudienceCount - 1} others in call</span>
            </div>
          )}
        </div>

        {/* Filmstrip at bottom for other participants */}
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

  // 3. Shared Multi-User Grid (When Admin UNCHECKS "Show Only Admin Screen")
  // Adaptive Grid Layout based on participant count so ALL can see ALL screens
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
    <div className={`relative grid h-full w-full gap-2 sm:gap-4 p-1.5 sm:p-4 ${gridColsClass} ${gridRowsClass} auto-rows-fr min-h-0 min-w-0 overflow-hidden font-[Poppins,sans-serif]`}>
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
