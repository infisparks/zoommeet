"use client";

import React, { useState } from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  MessageSquare,
  Users,
  Hand,
  Smile,
  PhoneOff,
  LayoutGrid,
  Square,
  Copy,
  Check,
  MoreVertical,
} from "lucide-react";

interface MeetingControlsProps {
  isMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  unreadCount?: number;
  participantCount?: number;
  isFocusView?: boolean;
  isHost?: boolean;
  isRecording?: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHand: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleViewMode: () => void;
  onSendReaction: (emoji: string) => void;
  onLeaveMeeting: () => void;
  onEndMeetingForAll?: () => void;
  onCopyLink?: () => void;
  onToggleRecord?: () => void;
}

const EMOJI_LIST = ["👍", "👏", "❤️", "🎉", "🔥", "😂", "✋", "😮"];

export function MeetingControls({
  isMuted,
  isVideoMuted,
  isScreenSharing,
  isHandRaised,
  isChatOpen,
  isParticipantsOpen,
  unreadCount = 0,
  participantCount = 1,
  isFocusView = false,
  isHost = false,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHand,
  onToggleChat,
  onToggleParticipants,
  onToggleViewMode,
  onSendReaction,
  onLeaveMeeting,
  onEndMeetingForAll,
  onCopyLink,
}: MeetingControlsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLeaveMenu, setShowLeaveMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopyLink) {
      onCopyLink();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center pointer-events-auto max-w-[96vw]">
      {/* Floating Control Bar */}
      <div className="glass-control-bar flex items-center gap-1.5 sm:gap-2.5 rounded-2xl px-2.5 sm:px-5 py-2.5 text-white">
        {/* Microphone */}
        <button
          onClick={onToggleMic}
          className={`flex flex-col items-center justify-center h-12 w-12 sm:h-13 sm:w-15 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
            isMuted
              ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30"
              : "bg-slate-800/90 hover:bg-slate-700 text-slate-100"
          }`}
          title={isMuted ? "Unmute Mic" : "Mute Mic"}
        >
          {isMuted ? <MicOff className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-emerald-400" />}
          <span className="hidden sm:inline mt-0.5 text-[11px] font-medium">{isMuted ? "Unmute" : "Mute"}</span>
        </button>

        {/* Video Camera */}
        <button
          onClick={onToggleVideo}
          className={`flex flex-col items-center justify-center h-12 w-12 sm:h-13 sm:w-15 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
            isVideoMuted
              ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30"
              : "bg-slate-800/90 hover:bg-slate-700 text-slate-100"
          }`}
          title={isVideoMuted ? "Start Camera" : "Stop Camera"}
        >
          {isVideoMuted ? <VideoOff className="h-5 w-5 text-white" /> : <VideoIcon className="h-5 w-5 text-indigo-400" />}
          <span className="hidden sm:inline mt-0.5 text-[11px] font-medium">{isVideoMuted ? "Start" : "Stop"}</span>
        </button>

        <div className="h-7 w-px bg-white/15 mx-0.5 hidden sm:block" />

        {/* Screen Share */}
        <button
          onClick={onToggleScreenShare}
          className={`flex flex-col items-center justify-center h-12 w-12 sm:h-13 sm:w-15 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
            isScreenSharing
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "bg-slate-800/90 hover:bg-slate-700 text-slate-200"
          }`}
          title="Share Screen"
        >
          {isScreenSharing ? <ScreenShareOff className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}
          <span className="hidden sm:inline mt-0.5 text-[11px] font-medium">{isScreenSharing ? "Sharing" : "Share"}</span>
        </button>

        {/* Raise Hand */}
        <button
          onClick={onToggleHand}
          className={`flex flex-col items-center justify-center h-12 w-12 sm:h-13 sm:w-15 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
            isHandRaised
              ? "bg-amber-400 text-slate-950 shadow-md font-bold"
              : "bg-slate-800/90 hover:bg-slate-700 text-slate-200"
          }`}
          title="Raise Hand"
        >
          <Hand className={`h-5 w-5 ${isHandRaised ? "text-slate-950 fill-current" : ""}`} />
          <span className="hidden sm:inline mt-0.5 text-[11px] font-medium">{isHandRaised ? "Raised" : "Hand"}</span>
        </button>

        {/* Emoji Reactions Picker */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`flex flex-col items-center justify-center h-12 w-12 sm:h-13 sm:w-15 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
              showEmojiPicker
                ? "bg-indigo-600 text-white"
                : "bg-slate-800/90 hover:bg-slate-700 text-slate-200"
            }`}
            title="Reactions"
          >
            <Smile className="h-5 w-5" />
            <span className="hidden sm:inline mt-0.5 text-[11px] font-medium">React</span>
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-18 left-1/2 -translate-x-1/2 rounded-2xl border border-white/20 bg-slate-900/98 p-2.5 backdrop-blur-2xl shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
              {EMOJI_LIST.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSendReaction(emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl hover:bg-white/10 hover:scale-125 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-7 w-px bg-white/15 mx-0.5 hidden sm:block" />

        {/* Participants Panel */}
        <button
          onClick={onToggleParticipants}
          className={`relative flex flex-col items-center justify-center h-12 w-12 sm:h-13 sm:w-15 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
            isParticipantsOpen
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-slate-800/90 hover:bg-slate-700 text-slate-200"
          }`}
          title="Participants"
        >
          <Users className="h-5 w-5" />
          <span className="hidden sm:inline mt-0.5 text-[11px] font-medium">People</span>
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow-xs">
            {participantCount}
          </span>
        </button>

        {/* Chat Panel */}
        <button
          onClick={onToggleChat}
          className={`relative flex flex-col items-center justify-center h-12 w-12 sm:h-13 sm:w-15 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
            isChatOpen
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-slate-800/90 hover:bg-slate-700 text-slate-200"
          }`}
          title="Chat"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="hidden sm:inline mt-0.5 text-[11px] font-medium">Chat</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* View Mode Grid/Focus */}
        <button
          onClick={onToggleViewMode}
          className="hidden md:flex flex-col items-center justify-center h-13 w-15 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
          title={isFocusView ? "Grid View" : "Speaker Focus View"}
        >
          {isFocusView ? <LayoutGrid className="h-5 w-5" /> : <Square className="h-5 w-5" />}
          <span className="mt-0.5 text-[11px] font-medium">{isFocusView ? "Grid" : "Focus"}</span>
        </button>

        {/* Copy Invite Link */}
        {onCopyLink && (
          <button
            onClick={handleCopy}
            className="hidden lg:flex flex-col items-center justify-center h-13 w-15 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
            title="Copy Meeting Invite Link"
          >
            {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5" />}
            <span className="mt-0.5 text-[11px] font-medium">{copied ? "Copied" : "Invite"}</span>
          </button>
        )}

        <div className="h-7 w-px bg-white/15 mx-0.5" />

        {/* Leave / End Meeting Button */}
        <div className="relative">
          <button
            onClick={() => {
              if (isHost && onEndMeetingForAll) {
                setShowLeaveMenu(!showLeaveMenu);
              } else {
                onLeaveMeeting();
              }
            }}
            className="flex items-center gap-2 h-11 sm:h-13 px-4 sm:px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-rose-600/35 cursor-pointer active:scale-95"
            title="Leave Meeting"
          >
            <PhoneOff className="h-4 sm:h-5 w-4 sm:w-5" />
            <span className="hidden sm:inline">Leave</span>
            {isHost && onEndMeetingForAll && <MoreVertical className="h-4 w-4 ml-0.5" />}
          </button>

          {showLeaveMenu && isHost && (
            <div className="absolute bottom-18 right-0 w-52 rounded-2xl border border-white/20 bg-slate-900/98 p-2.5 backdrop-blur-2xl shadow-2xl space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => {
                  setShowLeaveMenu(false);
                  onLeaveMeeting();
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-white/10 rounded-xl cursor-pointer"
              >
                Leave Room
              </button>
              <button
                onClick={() => {
                  setShowLeaveMenu(false);
                  if (onEndMeetingForAll) onEndMeetingForAll();
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm font-bold text-rose-400 hover:bg-rose-950/70 rounded-xl cursor-pointer"
              >
                End Meeting for All
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
