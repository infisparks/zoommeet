"use client";

import React, { useState } from "react";
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
  Search,
  UserCheck,
  Sparkles,
  Lock,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VirtualParticipant } from "@/lib/indianNames";

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
  fakeParticipants?: VirtualParticipant[];
  isCurrentUserHost?: boolean;
  isVoiceLocked?: boolean;
  isVideoLocked?: boolean;
  onMuteParticipant?: (identity: string) => void;
  onMuteAll?: () => void;
  onLockAllVideo?: () => void;
  onMakeCoHost?: (identity: string) => void;
  onLowerHand?: (identity: string) => void;
  onOpenBoosterConfig?: () => void;
}

export function MeetingParticipants({
  isOpen,
  onClose,
  participants,
  fakeParticipants = [],
  isCurrentUserHost = false,
  isVoiceLocked = false,
  isVideoLocked = false,
  onMuteParticipant,
  onMuteAll,
  onLockAllVideo,
  onMakeCoHost,
  onLowerHand,
  onOpenBoosterConfig,
}: MeetingParticipantsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalAttendeesCount = participants.length + fakeParticipants.length;

  const filteredReal = participants.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.identity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFake = fakeParticipants.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 sm:inset-y-0 sm:left-auto sm:right-0 z-50 flex w-full sm:max-w-md flex-col border-l border-white/10 bg-[#0D1527]/98 backdrop-blur-2xl text-white shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-tight">People in Call</h3>
            <p className="text-[11px] text-indigo-300 font-mono">
              {totalAttendeesCount} {totalAttendeesCount === 1 ? "person" : "people"} connected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isCurrentUserHost && onOpenBoosterConfig && (
            <button
              type="button"
              onClick={onOpenBoosterConfig}
              className="rounded-xl p-2 text-amber-400 hover:bg-white/10 hover:text-amber-300 transition-colors cursor-pointer"
              title="Webinar Booster Settings"
            >
              <Sparkles className="h-4.5 w-4.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="p-3 border-b border-white/5 bg-black/20 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search attendees by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Host Moderation Quick Bar */}
      {isCurrentUserHost && (
        <div className="flex items-center justify-between border-b border-white/5 bg-indigo-950/30 px-3 py-2 shrink-0 gap-2 overflow-x-auto">
          <span className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1 shrink-0">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Host Controls:</span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
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
            {onLockAllVideo && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLockAllVideo}
                className="text-xs h-7 px-2.5 bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
              >
                <Lock className="w-3.5 h-3.5 mr-1" />
                <span>Lock Video</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Participants Scroll List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 1. Real Participants */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Speakers & Hosts ({filteredReal.length})
          </p>
          {filteredReal.map(p => {
            const initials = p.name
              .split(" ")
              .map(x => x[0])
              .join("")
              .substring(0, 2)
              .toUpperCase() || "U";

            return (
              <div
                key={p.identity}
                className="group relative flex items-center justify-between rounded-2xl p-2.5 bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-indigo-500/30 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar with Speaking Glow Indicator */}
                  <div className="relative shrink-0">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-bold shadow-md border ${
                        p.isSpeaking
                          ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 animate-pulse border-emerald-400"
                          : "border-white/20"
                      }`}
                    >
                      {initials}
                    </div>
                    {p.isHost && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-xs" title="Meeting Host">
                        <Crown className="w-2.5 h-2.5 fill-current" />
                      </span>
                    )}
                  </div>

                  {/* Name and Tags */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="truncate text-xs font-bold text-slate-100">
                        {p.name}
                      </span>
                      {p.isLocal && (
                        <span className="text-[10px] text-indigo-300 font-semibold bg-indigo-500/20 px-1.5 py-0.2 rounded-md">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {p.isHost ? (
                        <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5" /> Host
                        </span>
                      ) : p.isCoHost ? (
                        <span className="text-[10px] text-blue-400 font-semibold flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" /> Co-Host
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Speaker</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badges & Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {p.isHandRaised && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30" title="Hand Raised">
                      <Hand className="w-3.5 h-3.5 fill-current" />
                    </span>
                  )}

                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      p.isAudioEnabled
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                    }`}
                    title={p.isAudioEnabled ? "Microphone Unmuted" : "Microphone Muted"}
                  >
                    {p.isAudioEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  </span>

                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      p.isVideoEnabled
                        ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                        : "bg-slate-800 text-slate-400"
                    }`}
                    title={p.isVideoEnabled ? "Camera Active" : "Camera Off"}
                  >
                    {p.isVideoEnabled ? <VideoIcon className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                  </span>

                  {isCurrentUserHost && !p.isLocal && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === p.identity ? null : p.identity)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 cursor-pointer"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {activeMenuId === p.identity && (
                        <div className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-white/15 bg-[#0A101E]/98 p-1.5 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-100">
                          {p.isAudioEnabled && onMuteParticipant && (
                            <button
                              type="button"
                              onClick={() => {
                                onMuteParticipant(p.identity);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-950/50 rounded-lg cursor-pointer flex items-center gap-2"
                            >
                              <VolumeX className="w-3.5 h-3.5" />
                              <span>Mute Participant</span>
                            </button>
                          )}
                          {p.isHandRaised && onLowerHand && (
                            <button
                              type="button"
                              onClick={() => {
                                onLowerHand(p.identity);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 rounded-lg cursor-pointer flex items-center gap-2"
                            >
                              <Hand className="w-3.5 h-3.5" />
                              <span>Lower Hand</span>
                            </button>
                          )}
                          {onMakeCoHost && (
                            <button
                              type="button"
                              onClick={() => {
                                onMakeCoHost(p.identity);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 rounded-lg cursor-pointer flex items-center gap-2"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{p.isCoHost ? "Remove Co-Host" : "Make Co-Host"}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Simulated Indian Attendees (Social Proof Booster) */}
        {filteredFake.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Audience Attendees ({filteredFake.length})
              </p>
              <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                Connected
              </span>
            </div>

            {filteredFake.slice(0, 150).map(f => (
              <div
                key={f.identity}
                className="flex items-center justify-between rounded-2xl p-2.5 bg-white/5 hover:bg-white/8 transition-colors border border-white/5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-200 text-xs font-semibold border border-white/10">
                    {f.initials}
                  </div>
                  <div className="min-w-0">
                    <span className="truncate text-xs font-medium text-slate-200 block">
                      {f.name}
                    </span>
                    <span className="text-[10px] text-slate-500">Attendee (View Only)</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-slate-500">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-slate-400" title="Muted">
                    <MicOff className="w-3 h-3" />
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-slate-400" title="Camera Off">
                    <VideoOff className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
