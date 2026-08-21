"use client";

import React from "react";
import { Participant } from "livekit-client";
import {
  X,
  Users,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Hand,
  Crown,
  Shield,
  MoreVertical,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ExtendedParticipantInfo {
  identity: string;
  name: string;
  isLocal: boolean;
  isHost: boolean;
  isCoHost: boolean;
  isSpeaking?: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isHandRaised?: boolean;
  livekitParticipant?: Participant;
}

interface MeetingParticipantsProps {
  isOpen: boolean;
  onClose: () => void;
  participants: ExtendedParticipantInfo[];
  isCurrentUserHost?: boolean;
  onMuteParticipant?: (identity: string) => void;
  onMuteAll?: () => void;
  onMakeCoHost?: (identity: string) => void;
  onLowerHand?: (identity: string) => void;
}

export function MeetingParticipants({
  isOpen,
  onClose,
  participants,
  isCurrentUserHost = false,
  onMuteParticipant,
  onMuteAll,
  onMakeCoHost,
  onLowerHand,
}: MeetingParticipantsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-white/10 bg-[#0D1527]/95 backdrop-blur-2xl text-white shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white tracking-tight">Meeting Attendees</h3>
            <p className="text-[10px] text-slate-400 font-mono">{participants.length} connected</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Host Controls Action Bar */}
      {isCurrentUserHost && (
        <div className="flex items-center justify-between border-b border-white/5 bg-black/20 px-4 py-2.5">
          <span className="text-[11px] text-slate-400 font-medium">Host Moderation</span>
          {onMuteAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMuteAll}
              className="text-xs h-7 px-2.5 bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
            >
              <VolumeX className="w-3.5 h-3.5 mr-1" />
              <span>Mute All</span>
            </Button>
          )}
        </div>
      )}

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {participants.map(p => {
          const initials = p.name
            .split(" ")
            .map(x => x[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

          return (
            <div
              key={p.identity}
              className="group flex items-center justify-between rounded-xl p-2.5 hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white text-xs font-bold shadow-xs">
                  {initials}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-semibold text-slate-200">
                      {p.name}
                    </span>
                    {p.isLocal && (
                      <span className="text-[10px] text-slate-400">(You)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-0.5">
                    {p.isHost && (
                      <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-blue-600 text-white">
                        <Crown className="w-2.5 h-2.5" /> Host
                      </span>
                    )}
                    {p.isCoHost && !p.isHost && (
                      <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-indigo-600 text-white">
                        <Shield className="w-2.5 h-2.5" /> Co-host
                      </span>
                    )}
                    {p.isHandRaised && (
                      <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-amber-400 text-slate-950">
                        <Hand className="w-2.5 h-2.5" /> Raised
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Icons & Host Options */}
              <div className="flex items-center gap-2">
                <div
                  className={`p-1 rounded-md ${
                    p.isAudioEnabled ? "text-slate-400" : "text-rose-400 bg-rose-500/10"
                  }`}
                  title={p.isAudioEnabled ? "Microphone Active" : "Muted"}
                >
                  {p.isAudioEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                </div>

                <div
                  className={`p-1 rounded-md ${
                    p.isVideoEnabled ? "text-slate-400" : "text-rose-400 bg-rose-500/10"
                  }`}
                  title={p.isVideoEnabled ? "Video Active" : "Video Off"}
                >
                  {p.isVideoEnabled ? (
                    <VideoIcon className="h-3.5 w-3.5" />
                  ) : (
                    <VideoOff className="h-3.5 w-3.5" />
                  )}
                </div>

                {/* Host Action dropdown */}
                {isCurrentUserHost && !p.isLocal && (
                  <div className="relative group/menu">
                    <button
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 cursor-pointer"
                      title="Host actions"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute right-0 top-6 hidden group-hover/menu:block w-36 rounded-xl border border-white/10 bg-slate-900/95 p-1 backdrop-blur-md shadow-xl z-20 space-y-0.5">
                      {onMuteParticipant && (
                        <button
                          onClick={() => onMuteParticipant(p.identity)}
                          className="w-full text-left px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10 rounded-lg cursor-pointer"
                        >
                          Mute Audio
                        </button>
                      )}
                      {onMakeCoHost && (
                        <button
                          onClick={() => onMakeCoHost(p.identity)}
                          className="w-full text-left px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10 rounded-lg cursor-pointer"
                        >
                          {p.isCoHost ? "Remove Co-Host" : "Make Co-Host"}
                        </button>
                      )}
                      {p.isHandRaised && onLowerHand && (
                        <button
                          onClick={() => onLowerHand(p.identity)}
                          className="w-full text-left px-2 py-1 text-[11px] text-amber-300 hover:bg-white/10 rounded-lg cursor-pointer"
                        >
                          Lower Hand
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
