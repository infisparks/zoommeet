"use client";

import React, { useEffect, useRef, useState } from "react";
import { branding } from "@/config/branding";
import { Button } from "@/components/ui/Button";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  SlidersHorizontal,
  ShieldCheck,
  AlertTriangle,
  Volume2,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { PermissionModal } from "./PermissionModal";

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
  const [displayName, setDisplayName] = useState(
    initialName || (typeof window !== "undefined" ? sessionStorage.getItem("infiplus_guest_name") || "" : "")
  );
  const [nameError, setNameError] = useState<string | null>(null);
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
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionMediaType, setPermissionMediaType] = useState<"camera" | "microphone" | "both">("both");
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Request/Initialize preview stream
  const requestMedia = async (preferredType: "camera" | "microphone" | "both" = "both") => {
    try {
      setPermissionError(null);
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
        autoGainControl: { ideal: true },
        sampleRate: { ideal: 48000 },
        channelCount: { ideal: 1 },
        ...(selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : {}),
      };

      const constraints: MediaStreamConstraints = {
        video: selectedVideoInput ? { deviceId: { exact: selectedVideoInput } } : true,
        audio: audioConstraints,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setAudioEnabled(true);
      setVideoEnabled(true);
      setShowPermissionModal(false);

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
      setPermissionMediaType(preferredType);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setPermissionError("Camera / Microphone access was denied by your browser.");
        setShowPermissionModal(true);
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setPermissionError("No camera or microphone hardware detected.");
      } else {
        setPermissionError("Hardware preview unavailable on this device.");
      }
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.mediaDevices) {
      requestMedia("both");
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => {
          t.stop();
          t.enabled = false;
        });
        streamRef.current = null;
      }
    };
  }, [selectedAudioInput, selectedVideoInput]);

  // Handle Track Mute/Unmute in preview
  const toggleAudio = async () => {
    if (!streamRef.current || streamRef.current.getAudioTracks().length === 0) {
      await requestMedia("microphone");
      return;
    }
    const audioTracks = streamRef.current.getAudioTracks();
    audioTracks.forEach(t => (t.enabled = !audioEnabled));
    setAudioEnabled(!audioEnabled);
  };

  const toggleVideo = async () => {
    if (!streamRef.current || streamRef.current.getVideoTracks().length === 0) {
      await requestMedia("camera");
      return;
    }
    const videoTracks = streamRef.current.getVideoTracks();
    videoTracks.forEach(t => (t.enabled = !videoEnabled));
    setVideoEnabled(!videoEnabled);
  };

  const handleJoinClick = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    if (!cleanName) {
      setNameError("Please enter your name to join the conference.");
      return;
    }
    setNameError(null);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("infiplus_guest_name", cleanName);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => {
        t.stop();
        t.enabled = false;
      });
      streamRef.current = null;
    }

    onJoin({
      displayName: cleanName,
      audioEnabled,
      videoEnabled,
      audioDeviceId: selectedAudioInput,
      videoDeviceId: selectedVideoInput,
      enteredPassword,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden font-[Poppins,sans-serif]">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.15),transparent_65%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl space-y-5">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <VideoIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">
                {branding.appName}
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">Room ID: {meetingId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>LiveKit Connected</span>
            </span>
          </div>
        </div>

        {/* Notice alert */}
        {permissionError && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">Device Hardware Notice</p>
                <p className="mt-0.5 text-amber-200/90">{permissionError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPermissionModal(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
            >
              How to Unblock
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
          {/* Video Preview (Left 7 Cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative aspect-video w-full rounded-xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex items-center justify-center">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-white text-2xl font-bold mb-2 shadow-md border border-white/10 select-none">
                    {displayName.charAt(0).toUpperCase() || "U"}
                  </div>
                  <p className="text-xs font-semibold text-slate-200">{displayName}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Camera inactive</p>
                </div>
              )}

              {/* Audio visualizer meter line */}
              {audioEnabled && !permissionError && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-xs">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-75"
                      style={{ width: `${Math.max(10, audioLevel)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Floating Media Toggles inside preview */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                    audioEnabled
                      ? "bg-slate-800 hover:bg-slate-700 text-white"
                      : "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                  }`}
                  title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                >
                  {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                    videoEnabled
                      ? "bg-slate-800 hover:bg-slate-700 text-white"
                      : "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                  }`}
                  title={videoEnabled ? "Turn off Camera" : "Turn on Camera"}
                >
                  {videoEnabled ? <VideoIcon className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                    showDeviceSettings
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                  title="Audio & Video Settings"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Device Selector Dropdown */}
            {showDeviceSettings && (
              <div className="w-full mt-3 rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-2.5 text-xs">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Microphone</label>
                  <select
                    value={selectedAudioInput}
                    onChange={e => setSelectedAudioInput(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">System Default Microphone</option>
                    {devices.audioInputs.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Mic ${i + 1}`}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Camera</label>
                  <select
                    value={selectedVideoInput}
                    onChange={e => setSelectedVideoInput(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
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
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 shadow-xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Ready to Connect
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                  {meetingTitle || "Infiplus Conference"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter your name to enter the conference room.
                </p>
              </div>

              <form onSubmit={handleJoinClick} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name..."
                    value={displayName}
                    onChange={e => {
                      setDisplayName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                    required
                    className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 ${
                      nameError
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                        : "border-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
                    }`}
                  />
                  {nameError && (
                    <p className="text-[11px] text-rose-400 font-medium">{nameError}</p>
                  )}
                </div>

                {passwordRequired && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Meeting Passcode</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Enter room password"
                      value={enteredPassword}
                      onChange={e => setEnteredPassword(e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div className="pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full h-10 text-xs font-semibold"
                  >
                    <span>Enter Meeting Room</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </form>

              <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Secure & Encrypted</span>
                </span>
                <span>{isHost ? "Host Role" : "Attendee"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Permission Modal */}
      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onRequestPermission={() => requestMedia(permissionMediaType)}
        mediaType={permissionMediaType}
        errorMessage={permissionError || undefined}
      />
    </div>
  );
}
