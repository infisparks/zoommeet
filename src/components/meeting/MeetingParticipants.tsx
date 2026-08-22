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
  Pencil,
  Check,
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
  onRenameSelf?: (newName: string) => void;
  onMuteParticipant?: (identity: string) => void;
  onMuteAll?: () => void;
  onLockAllVideo?: () => void;
  onMakeCoHost?: (identity: string) => void;
  onLowerHand?: (identity: string) => void;
  onOpenBoosterConfig?: () => void;
}

const AVATAR_GRADIENTS = [
  "from-indigo-600 via-purple-600 to-pink-600",
  "from-blue-600 via-indigo-600 to-violet-600",
  "from-emerald-600 via-teal-600 to-cyan-600",
  "from-amber-500 via-orange-600 to-red-600",
  "from-purple-600 via-fuchsia-600 to-pink-600",
  "from-rose-600 via-pink-600 to-purple-600",
];

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export function MeetingParticipants({
  isOpen,
  onClose,
  participants,
  fakeParticipants = [],
  isCurrentUserHost = false,
  isVoiceLocked = false,
  isVideoLocked = false,
  onRenameSelf,
  onMuteParticipant,
  onMuteAll,
  onLockAllVideo,
  onMakeCoHost,
  onLowerHand,
  onOpenBoosterConfig,
}: MeetingParticipantsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  if (!isOpen) return null;

  const totalAttendeesCount = participants.length + fakeParticipants.length;

  const filteredReal = participants.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.identity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFake = fakeParticipants.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveRename = () => {
    if (editNameValue.trim() && onRenameSelf) {
      onRenameSelf(editNameValue.trim());
      setIsRenaming(false);
    }
  };

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

      {/* Unified Attendees Scroll List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* 1. Real Connected Participants (Host, Co-Hosts, Speakers & Real Guests) */}
        {filteredReal.map(p => {
          const initials = p.name
            .split(" ")
            .map(x => x[0])
            .join("")
            .substring(0, 2)
            .toUpperCase() || "U";
          const gradient = getAvatarGradient(p.name);

          return (
            <div
              key={p.identity}
              className="group relative flex items-center justify-between rounded-2xl p-2.5 bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-indigo-500/30 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                {/* Avatar with Speaking Glow */}
                <div className="relative shrink-0">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-white text-xs font-bold shadow-md border ${
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
                  {p.isCoHost && !p.isHost && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white shadow-xs" title="Co-Host">
                      <Shield className="w-2.5 h-2.5 fill-current" />
                    </span>
                  )}
                </div>

                {/* Name, In-place Rename & Tags */}
                <div className="min-w-0 flex-1">
                  {p.isLocal && isRenaming ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={e => setEditNameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") handleSaveRename();
                          if (e.key === "Escape") setIsRenaming(false);
                        }}
                        autoFocus
                        placeholder="Enter new name..."
                        className="w-full rounded-lg bg-slate-950 border border-indigo-500 px-2 py-1 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveRename}
                        className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                        title="Save Name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsRenaming(false)}
                        className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="truncate text-xs font-bold text-slate-100">
                          {p.name}
                        </span>
                        {p.isLocal && (
                          <>
                            <span className="text-[10px] text-indigo-300 font-semibold bg-indigo-500/20 px-1.5 py-0.2 rounded-md">
                              You
                            </span>
                            {onRenameSelf && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditNameValue(p.name);
                                  setIsRenaming(true);
                                }}
                                className="text-slate-400 hover:text-indigo-300 p-0.5 rounded cursor-pointer transition-colors"
                                title="Edit your display name"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </>
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
                          <span className="text-[10px] text-slate-400">Attendee</span>
                        )}
                      </div>
                    </>
                  )}
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

                {/* Host Moderation Menu (Only shown for Host on other real users) */}
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
                        {onMakeCoHost && (
                          <button
                            type="button"
                            onClick={() => {
                              onMakeCoHost(p.identity);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-950/50 rounded-lg cursor-pointer flex items-center gap-2 font-medium"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{p.isCoHost ? "Remove Co-Host" : "Make Co-Host"}</span>
                          </button>
                        )}
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
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 2. Simulated Attendees (Rendered in the exact same stylish, colorful format!) */}
        {filteredFake.map(f => {
          const gradient = getAvatarGradient(f.name);

          return (
            <div
              key={f.identity}
              className="flex items-center justify-between rounded-2xl p-2.5 bg-white/5 hover:bg-white/10 transition-all border border-white/5 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-white text-xs font-bold shadow-md border border-white/20`}>
                  {f.initials}
                </div>
                <div className="min-w-0">
                  <span className="truncate text-xs font-bold text-slate-100 block">
                    {f.name}
                  </span>
                  <span className="text-[10px] text-slate-400">Attendee</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/20" title="Microphone Muted">
                  <MicOff className="w-3.5 h-3.5" />
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-400" title="Camera Off">
                  <VideoOff className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
