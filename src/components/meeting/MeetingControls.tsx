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
  MoreHorizontal,
  RefreshCw,
  X,
  ChevronUp,
  Headphones,
  Maximize,
  Minimize,
} from "lucide-react";
import { AudioDeviceMenu } from "./AudioDeviceMenu";

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
  isVisible?: boolean;
  isFullscreen?: boolean;
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
  onFlipCamera?: () => void;
  onToggleFullscreen?: () => void;
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
  isVisible = true,
  isFullscreen = false,
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
  onFlipCamera,
  onToggleFullscreen,
}: MeetingControlsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLeaveMenu, setShowLeaveMenu] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [showAudioDevices, setShowAudioDevices] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopyLink) {
      onCopyLink();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Floating Bottom Control Bar with Auto-Hide Transition */}
      <div
        className={`fixed bottom-2 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center w-full px-2 sm:px-0 sm:w-auto max-w-[100vw] sm:max-w-[96vw] pb-[env(safe-area-inset-bottom,0px)] select-none transition-all duration-300 ${
          isVisible
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        <div className="glass-control-bar flex items-center justify-between sm:justify-center gap-1 sm:gap-2 rounded-2xl px-2 sm:px-4 py-2 text-white w-full sm:w-auto shadow-2xl border border-white/10 backdrop-blur-2xl bg-[#0E1628]/95">
          
          {/* 1. Microphone with Device Selector */}
          <div className="relative flex items-center shrink-0">
            <button
              type="button"
              onClick={onToggleMic}
              className={`flex flex-col items-center justify-center h-11 w-11 sm:h-13 sm:w-14 rounded-l-xl sm:rounded-xl text-xs font-semibold transition-transform duration-75 active:scale-90 cursor-pointer shrink-0 touch-manipulation select-none ${
                isMuted
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30"
                  : "bg-slate-800/90 hover:bg-slate-700 text-slate-100"
              }`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white" /> : <Mic className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-emerald-400" />}
              <span className="hidden sm:inline mt-0.5 text-[11px] font-medium">{isMuted ? "Unmute" : "Mute"}</span>
            </button>

            {/* Audio Settings Chevron (Desktop & Tablet) */}
            <button
              type="button"
              onClick={() => setShowAudioDevices(!showAudioDevices)}
              className="hidden sm:flex items-center justify-center h-13 px-1.5 rounded-r-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 transition-colors border-l border-white/10 cursor-pointer -ml-1"
              title="Select Audio Device (Bluetooth / System)"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2. Video Camera */}
          <button
            type="button"
            onClick={onToggleVideo}
            className={`flex flex-col items-center justify-center h-11 w-11 sm:h-13 sm:w-14 rounded-xl text-xs font-semibold transition-transform duration-75 active:scale-90 cursor-pointer shrink-0 touch-manipulation select-none ${
              isVideoMuted
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30"
                : "bg-slate-800/90 hover:bg-slate-700 text-slate-100"
            }`}
            title={isVideoMuted ? "Start Camera" : "Stop Camera"}
          >
            {isVideoMuted ? <VideoOff className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white" /> : <VideoIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-indigo-400" />}
            <span className="hidden sm:inline mt-0.5 text-[11px] font-medium">{isVideoMuted ? "Start" : "Stop"}</span>
          </button>

          {/* 3. Screen Share (Desktop Only) */}
          <button
            type="button"
            onClick={onToggleScreenShare}
            className={`hidden md:flex flex-col items-center justify-center h-13 w-14 rounded-xl text-xs font-semibold transition-transform duration-75 active:scale-90 cursor-pointer touch-manipulation ${
              isScreenSharing
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "bg-slate-800/90 hover:bg-slate-700 text-slate-200"
            }`}
            title="Share Screen"
          >
            {isScreenSharing ? <ScreenShareOff className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}
            <span className="mt-0.5 text-[11px] font-medium">{isScreenSharing ? "Sharing" : "Share"}</span>
          </button>

          {/* 4. Raise Hand (Desktop Only) */}
          <button
            type="button"
            onClick={onToggleHand}
            className={`hidden sm:flex flex-col items-center justify-center h-12 w-12 sm:h-13 sm:w-14 rounded-xl text-xs font-semibold transition-transform duration-75 active:scale-90 cursor-pointer touch-manipulation ${
              isHandRaised
                ? "bg-amber-400 text-slate-950 shadow-md font-bold"
                : "bg-slate-800/90 hover:bg-slate-700 text-slate-200"
            }`}
            title="Raise Hand"
          >
            <Hand className={`h-5 w-5 ${isHandRaised ? "text-slate-950 fill-current" : ""}`} />
            <span className="mt-0.5 text-[11px] font-medium">{isHandRaised ? "Raised" : "Hand"}</span>
          </button>

          {/* 5. Emoji Reactions Picker (Desktop Only) */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`flex flex-col items-center justify-center h-12 w-12 sm:h-13 sm:w-14 rounded-xl text-xs font-semibold transition-transform duration-75 active:scale-90 cursor-pointer touch-manipulation ${
                showEmojiPicker
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800/90 hover:bg-slate-700 text-slate-200"
              }`}
              title="Reactions"
            >
              <Smile className="h-5 w-5" />
              <span className="mt-0.5 text-[11px] font-medium">React</span>
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-18 left-1/2 -translate-x-1/2 rounded-2xl border border-white/20 bg-slate-900/98 p-2.5 backdrop-blur-2xl shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150 z-50">
                {EMOJI_LIST.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onSendReaction(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl hover:bg-white/10 hover:scale-125 transition-transform cursor-pointer touch-manipulation"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-7 w-px bg-white/15 mx-0.5 hidden sm:block" />

          {/* 6. Chat Panel */}
          <button
            type="button"
            onClick={onToggleChat}
            className={`relative flex flex-col items-center justify-center h-11 w-11 sm:h-13 sm:w-14 rounded-xl text-xs font-semibold transition-transform duration-75 active:scale-90 cursor-pointer shrink-0 touch-manipulation select-none ${
              isChatOpen
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-800/90 hover:bg-slate-700 text-slate-200"
            }`}
            title="Chat"
          >
            <MessageSquare className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline mt-0.5 text-[11px] font-medium">Chat</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 sm:h-5 sm:min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] sm:text-[10px] font-bold text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* 7. Participants Panel */}
          <button
            type="button"
            onClick={onToggleParticipants}
            className={`relative flex flex-col items-center justify-center h-11 w-11 sm:h-13 sm:w-14 rounded-xl text-xs font-semibold transition-transform duration-75 active:scale-90 cursor-pointer shrink-0 touch-manipulation select-none ${
              isParticipantsOpen
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-800/90 hover:bg-slate-700 text-slate-200"
            }`}
            title="Participants"
          >
            <Users className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline mt-0.5 text-[11px] font-medium">People</span>
            <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 sm:h-5 sm:min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] sm:text-[10px] font-bold text-white shadow-xs">
              {participantCount}
            </span>
          </button>

          {/* 8. Fullscreen (Desktop Only) */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="hidden lg:flex flex-col items-center justify-center h-13 w-14 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 transition-transform duration-75 active:scale-90 cursor-pointer touch-manipulation"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              <span className="mt-0.5 text-[11px] font-medium">{isFullscreen ? "Exit" : "Full"}</span>
            </button>
          )}

          {/* 9. View Mode (Desktop Only) */}
          <button
            type="button"
            onClick={onToggleViewMode}
            className="hidden xl:flex flex-col items-center justify-center h-13 w-14 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 transition-transform duration-75 active:scale-90 cursor-pointer touch-manipulation"
            title={isFocusView ? "Grid View" : "Speaker Focus View"}
          >
            {isFocusView ? <LayoutGrid className="h-5 w-5" /> : <Square className="h-5 w-5" />}
            <span className="mt-0.5 text-[11px] font-medium">{isFocusView ? "Grid" : "Focus"}</span>
          </button>

          {/* 10. Mobile More Button (⋯) */}
          <button
            type="button"
            onClick={() => setShowMobileMore(!showMobileMore)}
            className="sm:hidden flex flex-col items-center justify-center h-11 w-11 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 transition-transform duration-75 active:scale-90 cursor-pointer shrink-0 touch-manipulation"
            title="More Options"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          <div className="h-6 sm:h-7 w-px bg-white/15 mx-0.5" />

          {/* 11. Leave / End Button */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                if (isHost && onEndMeetingForAll) {
                  setShowLeaveMenu(!showLeaveMenu);
                } else {
                  onLeaveMeeting();
                }
              }}
              className="flex items-center justify-center gap-1.5 h-11 sm:h-13 px-3 sm:px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition-transform duration-75 active:scale-90 shadow-md shadow-rose-600/35 cursor-pointer touch-manipulation"
              title="Leave Meeting"
            >
              <PhoneOff className="h-4 sm:h-5 w-4 sm:w-5" />
              <span className="hidden sm:inline">Leave</span>
              {isHost && onEndMeetingForAll && <MoreVertical className="h-3.5 sm:h-4 w-3.5 sm:w-4 ml-0.5" />}
            </button>

            {showLeaveMenu && isHost && (
              <div className="absolute bottom-16 sm:bottom-18 right-0 w-48 sm:w-52 rounded-2xl border border-white/20 bg-slate-900/98 p-2 backdrop-blur-2xl shadow-2xl space-y-1.5 animate-in fade-in zoom-in-95 duration-150 z-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveMenu(false);
                    onLeaveMeeting();
                  }}
                  className="w-full text-left px-3 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-white/10 rounded-xl cursor-pointer"
                >
                  Leave Room
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveMenu(false);
                    if (onEndMeetingForAll) onEndMeetingForAll();
                  }}
                  className="w-full text-left px-3 py-2 text-xs sm:text-sm font-bold text-rose-400 hover:bg-rose-950/70 rounded-xl cursor-pointer"
                >
                  End Meeting for All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audio Device Selector Menu (Bluetooth / System) */}
      <AudioDeviceMenu
        isOpen={showAudioDevices}
        onClose={() => setShowAudioDevices(false)}
      />

      {/* Mobile "More Options" Bottom Action Sheet */}
      {showMobileMore && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm sm:hidden flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setShowMobileMore(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-[#0D1527] border-t border-white/15 p-5 text-white shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-bold text-sm text-slate-200">Meeting Options</span>
              <button
                type="button"
                onClick={() => setShowMobileMore(false)}
                className="rounded-full p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Emoji Reactions */}
            <div>
              <p className="text-xs text-slate-400 font-medium mb-2">Reactions</p>
              <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
                {EMOJI_LIST.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onSendReaction(emoji);
                      setShowMobileMore(false);
                    }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 hover:bg-white/15 text-2xl active:scale-125 transition-transform cursor-pointer touch-manipulation"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Fullscreen / Landscape Mode on Mobile */}
              {onToggleFullscreen && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleFullscreen();
                    setShowMobileMore(false);
                  }}
                  className="flex items-center gap-2.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 p-3 text-xs font-semibold text-white hover:bg-indigo-600/50 cursor-pointer touch-manipulation active:scale-95 col-span-2"
                >
                  {isFullscreen ? <Minimize className="h-4.5 w-4.5 text-indigo-300" /> : <Maximize className="h-4.5 w-4.5 text-indigo-300" />}
                  <span>{isFullscreen ? "Exit Fullscreen" : "Full Screen / Landscape Mode"}</span>
                </button>
              )}

              {/* Audio Devices (Bluetooth / System) */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileMore(false);
                  setShowAudioDevices(true);
                }}
                className="flex items-center gap-2.5 rounded-xl bg-white/5 p-3 text-xs font-semibold text-slate-200 hover:bg-white/10 cursor-pointer touch-manipulation active:scale-95 col-span-2 border border-white/10"
              >
                <Headphones className="h-4.5 w-4.5 text-indigo-400" />
                <span>Audio Devices (Bluetooth / System)</span>
              </button>

              {/* Flip Camera */}
              {onFlipCamera && !isVideoMuted && (
                <button
                  type="button"
                  onClick={() => {
                    onFlipCamera();
                    setShowMobileMore(false);
                  }}
                  className="flex items-center gap-2.5 rounded-xl bg-white/5 p-3 text-xs font-semibold text-slate-200 hover:bg-white/10 cursor-pointer touch-manipulation active:scale-95"
                >
                  <RefreshCw className="h-4.5 w-4.5 text-indigo-400" />
                  <span>Flip Camera</span>
                </button>
              )}

              {/* Raise Hand */}
              <button
                type="button"
                onClick={() => {
                  onToggleHand();
                  setShowMobileMore(false);
                }}
                className={`flex items-center gap-2.5 rounded-xl p-3 text-xs font-semibold cursor-pointer touch-manipulation active:scale-95 ${
                  isHandRaised
                    ? "bg-amber-400 text-slate-950 font-bold"
                    : "bg-white/5 text-slate-200 hover:bg-white/10"
                }`}
              >
                <Hand className={`h-4.5 w-4.5 ${isHandRaised ? "text-slate-950 fill-current" : "text-amber-400"}`} />
                <span>{isHandRaised ? "Lower Hand" : "Raise Hand"}</span>
              </button>

              {/* Copy Invite Link */}
              {onCopyLink && (
                <button
                  type="button"
                  onClick={() => {
                    handleCopy();
                    setShowMobileMore(false);
                  }}
                  className="flex items-center gap-2.5 rounded-xl bg-white/5 p-3 text-xs font-semibold text-slate-200 hover:bg-white/10 cursor-pointer touch-manipulation active:scale-95"
                >
                  <Copy className="h-4.5 w-4.5 text-emerald-400" />
                  <span>{copied ? "Link Copied!" : "Copy Invite"}</span>
                </button>
              )}

              {/* Toggle View Mode */}
              <button
                type="button"
                onClick={() => {
                  onToggleViewMode();
                  setShowMobileMore(false);
                }}
                className="flex items-center gap-2.5 rounded-xl bg-white/5 p-3 text-xs font-semibold text-slate-200 hover:bg-white/10 cursor-pointer touch-manipulation active:scale-95"
              >
                {isFocusView ? <LayoutGrid className="h-4.5 w-4.5 text-blue-400" /> : <Square className="h-4.5 w-4.5 text-blue-400" />}
                <span>{isFocusView ? "Grid View" : "Speaker Focus"}</span>
              </button>

              {/* Screen Share on Mobile */}
              <button
                type="button"
                onClick={() => {
                  onToggleScreenShare();
                  setShowMobileMore(false);
                }}
                className="flex items-center gap-2.5 rounded-xl bg-white/5 p-3 text-xs font-semibold text-slate-200 hover:bg-white/10 col-span-2 cursor-pointer touch-manipulation active:scale-95"
              >
                <ScreenShare className="h-4.5 w-4.5 text-indigo-400" />
                <span>{isScreenSharing ? "Stop Screen Share" : "Share Screen"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
