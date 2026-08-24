"use client";

import React, { useState, useRef, useEffect } from "react";
import { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { ParticipantTile } from "./ParticipantTile";
import {
  Maximize2,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Move,
} from "lucide-react";

interface MiniMeetingWindowProps {
  meetingTitle?: string;
  roomName: string;
  elapsedSeconds: number;
  activeTrack?: TrackReferenceOrPlaceholder;
  isMuted: boolean;
  isVideoMuted: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onExpand: () => void;
  onLeave: () => void;
}

export function MiniMeetingWindow({
  meetingTitle,
  roomName,
  elapsedSeconds,
  activeTrack,
  isMuted,
  isVideoMuted,
  onToggleMic,
  onToggleVideo,
  onExpand,
  onLeave,
}: MiniMeetingWindowProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Touch & Mouse Drag Handlers
  const handleStartDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleMoveDrag = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.posX + dx,
      y: dragRef.current.posY + dy,
    });
  };

  const handleEndDrag = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMoveDrag(e.clientX, e.clientY);
    const onMouseUp = () => handleEndDrag();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMoveDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handleEndDrag();

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging]);

  return (
    <div
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        bottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
        right: "max(1rem, env(safe-area-inset-right, 1rem))",
      }}
      className="fixed z-50 w-72 sm:w-80 rounded-2xl border border-white/20 bg-slate-950/95 shadow-2xl backdrop-blur-2xl overflow-hidden font-[Poppins,sans-serif] animate-in fade-in zoom-in-95 duration-200 select-none text-white ring-1 ring-white/10"
    >
      {/* Header / Drag Bar */}
      <div
        onMouseDown={e => handleStartDrag(e.clientX, e.clientY)}
        onTouchStart={e => {
          if (e.touches.length > 0) {
            handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-white/10 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate max-w-[130px]">
              {meetingTitle || roomName}
            </p>
            <p className="text-[10px] text-slate-400 font-mono leading-none">
              {formatTimer(elapsedSeconds)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="text-slate-400 hover:text-slate-200 p-1" title="Drag Window">
            <Move className="w-3.5 h-3.5" />
          </div>
          <button
            type="button"
            onClick={onExpand}
            className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
            title="Expand to Full Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Content */}
      <div
        onClick={onExpand}
        className="relative aspect-video w-full bg-black cursor-pointer overflow-hidden flex items-center justify-center group"
      >
        {activeTrack ? (
          <ParticipantTile
            trackRef={activeTrack}
            isHost={false}
            isPinned={false}
            className="h-full w-full rounded-none border-0"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 p-4 text-center">
            <p className="text-xs font-semibold text-slate-300">Live Meeting</p>
            <p className="text-[10px] text-slate-400">Tap to expand window</p>
          </div>
        )}

        {/* Hover / Tap overlay notice */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1 text-xs font-bold text-white border border-white/20 shadow-lg">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tap to Return</span>
          </div>
        </div>
      </div>

      {/* Quick Controls Footer */}
      <div className="flex items-center justify-around px-3 py-2 bg-slate-900/90 border-t border-white/10">
        <button
          type="button"
          onClick={onToggleMic}
          className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs transition-colors cursor-pointer ${
            isMuted ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
          title={isMuted ? "Unmute Mic" : "Mute Mic"}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
        </button>

        <button
          type="button"
          onClick={onToggleVideo}
          className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs transition-colors cursor-pointer ${
            isVideoMuted ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
          title={isVideoMuted ? "Start Camera" : "Stop Camera"}
        >
          {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <VideoIcon className="w-4 h-4 text-indigo-400" />}
        </button>

        <button
          type="button"
          onClick={onLeave}
          className="flex h-8 px-3 items-center justify-center gap-1 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs transition-colors cursor-pointer"
          title="Leave Meeting"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          <span>Leave</span>
        </button>
      </div>
    </div>
  );
}
