"use client";

import React, { useState } from "react";
import { Play, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export interface SharedVideoState {
  url: string;
  videoId?: string;
  title?: string;
  isPlaying: boolean;
  currentTime?: number;
  sharerName?: string;
  sharerIdentity?: string;
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.trim().match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

interface SharedVideoPlayerProps {
  videoState: SharedVideoState;
  isHost: boolean;
  onClose: () => void;
}

export function SharedVideoPlayer({
  videoState,
  isHost,
  onClose,
}: SharedVideoPlayerProps) {
  const videoId = videoState.videoId || extractYouTubeId(videoState.url);

  return (
    <div className="relative flex h-full w-full flex-col p-1 sm:p-2 overflow-hidden select-none font-[Poppins,sans-serif] min-h-0 min-w-0">
      {/* Main Video Stage */}
      <div className="relative flex-1 min-h-0 w-full rounded-2xl bg-black border border-slate-800/90 overflow-hidden shadow-2xl flex items-center justify-center">
        {videoId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}&rel=0`}
            title="Shared YouTube Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-300">
            <video
              src={videoState.url}
              autoPlay
              controls
              playsInline
              className="max-h-full max-w-full rounded-xl object-contain shadow-lg"
            />
          </div>
        )}

        {/* Top Overlay Banner */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 rounded-full bg-slate-950/85 border border-white/15 px-3 py-1.5 text-xs text-white backdrop-blur-md shadow-xl">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white">
              <YoutubeIcon className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-xs">
              {videoState.title || "YouTube Broadcast"}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              100% HD Sound
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isHost && (
              <Button
                size="sm"
                variant="danger"
                onClick={onClose}
                className="h-8 text-xs font-bold px-3 shadow-xl cursor-pointer"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                <span>Stop Video</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface YouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartShare: (url: string) => void;
}

export function YouTubeShareModal({ isOpen, onClose, onStartShare }: YouTubeModalProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    const id = extractYouTubeId(cleanUrl);
    if (!id && !cleanUrl.startsWith("http")) {
      setError("Please enter a valid YouTube video URL (e.g. https://www.youtube.com/watch?v=...)");
      return;
    }
    setError(null);
    onStartShare(cleanUrl);
    setUrl("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0E1628]/98 p-6 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <YoutubeIcon className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Share YouTube Video</h3>
              <p className="text-[11px] text-slate-400">Streams synchronized video & 100% HD sound to everyone</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              YouTube Video Link or URL:
            </label>
            <input
              type="text"
              value={url}
              onChange={e => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            {error && <p className="text-[11px] text-rose-400 font-medium">{error}</p>}
          </div>

          <div className="rounded-xl bg-indigo-950/40 border border-indigo-500/30 p-3 space-y-1 text-[11px] text-indigo-200">
            <p className="font-semibold flex items-center gap-1 text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Simultaneous Mic + Video Audio</span>
            </p>
            <p className="text-slate-300 text-[10px] leading-relaxed">
              Everyone in the meeting will hear the YouTube video audio in studio quality while you can speak on your microphone at the same time without any macOS restrictions.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play in Meeting</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
