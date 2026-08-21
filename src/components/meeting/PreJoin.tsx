"use client";

import React, { useEffect, useRef, useState } from "react";
import { branding } from "@/config/branding";
import { Button } from "@/components/ui/Button";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Settings,
  ShieldCheck,
  AlertTriangle,
  Volume2,
  Lock,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

interface PreJoinProps {
  meetingTitle?: string;
  meetingId: string;
  initialName?: string;
  isHost?: boolean;
  passwordRequired?: boolean;
  onJoin: (options: {
    displayName: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
    audioDeviceId?: string;
    videoDeviceId?: string;
    enteredPassword?: string;
  }) => void;
}

export function PreJoin({
  meetingTitle,
  meetingId,
  initialName = "",
  isHost = false,
  passwordRequired = false,
  onJoin,
}: PreJoinProps) {
  const [displayName, setDisplayName] = useState(initialName || "Guest User");
  const [enteredPassword, setEnteredPassword] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const [devices, setDevices] = useState<{
    audioInputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
  }>({
    audioInputs: [],
    videoInputs: [],
    audioOutputs: [],
  });

  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");

  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize preview stream
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        setPermissionError(null);
        const constraints: MediaStreamConstraints = {
          video: selectedVideoInput ? { deviceId: { exact: selectedVideoInput } } : true,
          audio: selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : true,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Setup audio level analyser
        try {
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVolume = () => {
              if (!active) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
              animationFrameRef.current = requestAnimationFrame(checkVolume);
            };
            checkVolume();
          }
        } catch (e) {
          console.warn("Audio meter init notice:", e);
        }

        // Enumerate devices
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        setDevices({
          audioInputs: allDevices.filter(d => d.kind === "audioinput"),
          videoInputs: allDevices.filter(d => d.kind === "videoinput"),
          audioOutputs: allDevices.filter(d => d.kind === "audiooutput"),
        });
      } catch (err: unknown) {
        const error = err as Error;
        console.warn("Media preview access warning:", error);
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          setPermissionError("Camera / Microphone access was denied. You can join in listen mode.");
          setAudioEnabled(false);
          setVideoEnabled(false);
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          setPermissionError("No camera or microphone detected. You will join in listen/view mode.");
          setAudioEnabled(false);
          setVideoEnabled(false);
        } else {
          setPermissionError("Hardware preview unavailable. Joining in listen mode.");
          setAudioEnabled(false);
          setVideoEnabled(false);
        }
      }
    }

    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.mediaDevices) {
      initMedia();
    }

    return () => {
      active = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [selectedAudioInput, selectedVideoInput]);

  // Handle Track Mute/Unmute in preview
  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(t => (t.enabled = !audioEnabled));
    }
    setAudioEnabled(!audioEnabled);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(t => (t.enabled = !videoEnabled));
    }
    setVideoEnabled(!videoEnabled);
  };

  const handleJoinClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    onJoin({
      displayName: displayName.trim(),
      audioEnabled,
      videoEnabled,
      audioDeviceId: selectedAudioInput,
      videoDeviceId: selectedVideoInput,
      enteredPassword,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080C16] p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden font-[Poppins,sans-serif]">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_65%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/25">
              <VideoIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">
                {branding.appName}
              </h1>
              <p className="text-xs text-slate-400 font-mono">Room ID: {meetingId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>LiveKit Connected</span>
            </span>
          </div>
        </div>

        {/* Notice alert */}
        {permissionError && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 flex items-start gap-3 backdrop-blur-md">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Device Hardware Notice</p>
              <p className="mt-0.5 text-amber-200/90">{permissionError}</p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
          {/* Video Preview (Left 7 Cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative aspect-video w-full rounded-2xl bg-[#0D1527] border border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center">
              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  videoEnabled && !permissionError ? "opacity-100 scale-x-[-1]" : "opacity-0 pointer-events-none"
                }`}
              />

              {/* Video Off / Avatar Placeholder */}
              {(!videoEnabled || permissionError) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0D1527] to-[#080C16] text-slate-400">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white text-3xl font-bold mb-3 shadow-xl border border-white/15 select-none">
                    {displayName.charAt(0).toUpperCase() || "U"}
                  </div>
                  <p className="text-sm font-semibold text-slate-200">{displayName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Camera feed inactive</p>
                </div>
              )}

              {/* Audio visualizer meter line */}
              {audioEnabled && !permissionError && (
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-75"
                      style={{ width: `${Math.max(10, audioLevel)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Floating Media Toggles inside preview */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-xl">
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ${
                    audioEnabled
                      ? "bg-slate-800 hover:bg-slate-700 text-white"
                      : "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30"
                  }`}
                  title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                >
                  {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>

                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ${
                    videoEnabled
                      ? "bg-slate-800 hover:bg-slate-700 text-white"
                      : "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30"
                  }`}
                  title={videoEnabled ? "Turn off Camera" : "Turn on Camera"}
                >
                  {videoEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ${
                    showDeviceSettings
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                  title="Audio & Video Settings"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick Device Selector */}
            {showDeviceSettings && (
              <div className="w-full mt-3 rounded-2xl border border-slate-800 bg-[#0D1527]/95 p-4 space-y-3 text-xs backdrop-blur-md">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Microphone Device</label>
                  <select
                    value={selectedAudioInput}
                    onChange={e => setSelectedAudioInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">System Default Microphone</option>
                    {devices.audioInputs.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Mic ${i + 1}`}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Camera Device</label>
                  <select
                    value={selectedVideoInput}
                    onChange={e => setSelectedVideoInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">System Default Camera</option>
                    {devices.videoInputs.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Join Form Details (Right 5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="rounded-2xl border border-slate-800/90 bg-[#0D1527]/90 p-6 backdrop-blur-xl space-y-5 shadow-2xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                  Ready to join
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                  {meetingTitle || "Infiplus Conference"}
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-normal leading-relaxed">
                  Enter your name to connect to the meeting stream.
                </p>
              </div>

              <form onSubmit={handleJoinClick} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-medium"
                  />
                </div>

                {passwordRequired && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-400" />
                      <span>Meeting Passcode</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Enter room password"
                      value={enteredPassword}
                      onChange={e => setEnteredPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="gradient"
                    className="w-full h-12 text-sm font-semibold shadow-lg shadow-blue-600/30"
                  >
                    <span>Enter Meeting Room</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </form>

              <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Encrypted Channel</span>
                </span>
                <span>{isHost ? "Host Access" : "Guest Participant"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
