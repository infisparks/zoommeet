"use client";

import React, { useState, useEffect, useRef } from "react";
import { useMediaDeviceSelect } from "@livekit/components-react";
import {
  Mic,
  Volume2,
  Check,
  Headphones,
  Bluetooth,
  Laptop,
  X,
  AlertTriangle,
  Sparkles,
  Info,
} from "lucide-react";

interface AudioDeviceMenuProps {
  isOpen: boolean;
  onClose: () => void;
  shareSystemAudio?: boolean;
  onToggleShareSystemAudio?: (enabled: boolean) => void;
  isScreenSharing?: boolean;
  isScreenAudioActive?: boolean;
  isScreenAudioMuted?: boolean;
  onToggleScreenAudioMute?: () => void;
}

export function AudioDeviceMenu({
  isOpen,
  onClose,
  shareSystemAudio = true,
  onToggleShareSystemAudio,
  isScreenSharing = false,
  isScreenAudioActive = false,
  isScreenAudioMuted = false,
  onToggleScreenAudioMute,
}: AudioDeviceMenuProps) {
  const {
    devices: micDevices,
    activeDeviceId: activeMicId,
    setActiveMediaDevice: setActiveMic,
  } = useMediaDeviceSelect({ kind: "audioinput" });

  const {
    devices: speakerDevices,
    activeDeviceId: activeSpeakerId,
    setActiveMediaDevice: setActiveSpeaker,
  } = useMediaDeviceSelect({ kind: "audiooutput" });

  const [micVolume, setMicVolume] = useState(0);

  // Active microphone live level analyser
  useEffect(() => {
    if (!isOpen) return;
    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let animId: number | null = null;

    async function startMeter() {
      try {
        const constraints: MediaStreamConstraints = {
          audio: activeMicId ? { deviceId: { exact: activeMicId } } : true,
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
          animId = requestAnimationFrame(updateVolume);
        };
        updateVolume();
      } catch (e) {
        console.warn("Live mic meter notice:", e);
      }
    }

    startMeter();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, [isOpen, activeMicId]);

  if (!isOpen) return null;

  const activeMic = micDevices.find(d => d.deviceId === activeMicId);
  const activeMicLabel = (activeMic?.label || "").toLowerCase();
  const isVirtualDevice =
    activeMicLabel.includes("iriun") ||
    activeMicLabel.includes("virtual") ||
    activeMicLabel.includes("soundflower") ||
    activeMicLabel.includes("blackhole") ||
    activeMicLabel.includes("droidcam");

  const getDeviceIcon = (label: string, kind: "mic" | "speaker") => {
    const l = label.toLowerCase();
    if (l.includes("bluetooth") || l.includes("airpod") || l.includes("buds") || l.includes("wireless") || l.includes("bt")) {
      return <Bluetooth className="w-4 h-4 text-blue-400 shrink-0" />;
    }
    if (l.includes("headphone") || l.includes("headset") || l.includes("earphone")) {
      return <Headphones className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
    if (kind === "mic") {
      return <Mic className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    return <Laptop className="w-4 h-4 text-purple-400 shrink-0" />;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl sm:rounded-2xl border border-white/15 bg-[#0E1628]/98 p-5 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Audio & Sound Settings</h3>
              <p className="text-[11px] text-slate-400">Microphone, speaker & PC sound transmission</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* 1. Microphone Input Devices */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>Select Microphone (Input)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {micDevices.length} found
            </span>
          </div>

          {/* Live Mic Test Meter */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <Mic className="w-3 h-3 text-emerald-400" />
                <span>Live Voice Test Meter:</span>
              </span>
              <span className={micVolume > 3 ? "text-emerald-400 font-bold" : "text-slate-500 text-[10px]"}>
                {micVolume > 3 ? "Voice Detected 🟢" : "Speak to test"}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-75 rounded-full ${
                  micVolume > 50 ? "bg-amber-400" : "bg-emerald-400"
                }`}
                style={{ width: `${Math.min(100, Math.max(micVolume, 4))}%` }}
              />
            </div>
          </div>

          {/* Virtual Device Warning */}
          {isVirtualDevice && (
            <div className="rounded-xl bg-amber-500/15 border border-amber-500/30 p-2.5 text-[11px] text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>Virtual Device Active ({activeMic?.label || "Virtual Mic"})</span>
              </div>
              <p className="text-[10px] text-amber-200/90 leading-tight">
                Virtual devices (like Iriun or Droidcam) send 0 audio if not connected. If other participants cannot hear you, please select your <strong>Built-in Microphone</strong> or <strong>Headset</strong> below.
              </p>
            </div>
          )}

          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {micDevices.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-2 bg-white/5 rounded-xl">
                Default system microphone active
              </p>
            ) : (
              micDevices.map(device => {
                const isSelected = activeMicId === device.deviceId;
                const isDevVirtual = device.label.toLowerCase().includes("virtual") || device.label.toLowerCase().includes("iriun");
                return (
                  <button
                    key={device.deviceId}
                    type="button"
                    onClick={() => {
                      setActiveMic(device.deviceId);
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600/25 border border-indigo-500/50 text-white"
                        : "bg-white/5 hover:bg-white/10 text-slate-200 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getDeviceIcon(device.label, "mic")}
                      <span className="truncate">{device.label || `Microphone ${device.deviceId.slice(0, 5)}`}</span>
                      {isDevVirtual && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-300 font-normal">
                          virtual
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 2. Speaker Output Devices */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Select Speaker (Output)</span>
          </div>

          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {speakerDevices.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-2 bg-white/5 rounded-xl">
                Default system speaker active
              </p>
            ) : (
              speakerDevices.map(device => {
                const isSelected = activeSpeakerId === device.deviceId;
                return (
                  <button
                    key={device.deviceId}
                    type="button"
                    onClick={() => {
                      setActiveSpeaker(device.deviceId);
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600/25 border border-indigo-500/50 text-white"
                        : "bg-white/5 hover:bg-white/10 text-slate-200 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getDeviceIcon(device.label, "speaker")}
                      <span className="truncate">{device.label || `Speaker ${device.deviceId.slice(0, 5)}`}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 3. System Audio & Video Sound Sharing Section */}
        <div className="space-y-2 pt-1 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Laptop className="w-3.5 h-3.5 text-blue-400" />
              <span>Computer Sound & Video Audio</span>
            </div>
            {isScreenSharing && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isScreenAudioActive && !isScreenAudioMuted
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}>
                {isScreenAudioActive && !isScreenAudioMuted ? "Transmitting PC Sound" : "Audio Inactive"}
              </span>
            )}
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-white">
                  Transmit PC & Video Audio
                </p>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Transmits both your computer sound (YouTube, video player, presentations) and your microphone voice together.
                </p>
              </div>

              {onToggleShareSystemAudio && (
                <button
                  type="button"
                  onClick={() => onToggleShareSystemAudio(!shareSystemAudio)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    shareSystemAudio ? "bg-indigo-600" : "bg-slate-700"
                  }`}
                  role="switch"
                  aria-checked={shareSystemAudio}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      shareSystemAudio ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              )}
            </div>

            {/* Mac & Chrome instructions box */}
            <div className="rounded-lg bg-indigo-950/40 border border-indigo-500/30 p-2 text-[10px] text-slate-300 leading-relaxed space-y-1">
              <p className="font-semibold text-indigo-300 flex items-center gap-1">
                <Info className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>macOS / Chrome YouTube Audio Guide:</span>
              </p>
              <p>
                To share YouTube audio on Mac via Screen Share, select the <strong>Chrome Tab</strong> (where YouTube is playing) in the browser popup and check <strong>&quot;Also share tab audio&quot;</strong>.
              </p>
            </div>

            {isScreenSharing && onToggleScreenAudioMute && (
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-slate-300">Live Screen Sound:</span>
                <button
                  type="button"
                  onClick={onToggleScreenAudioMute}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    isScreenAudioMuted
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-rose-600/80 hover:bg-rose-600 text-white"
                  }`}
                >
                  {isScreenAudioMuted ? "Unmute PC Audio" : "Mute PC Audio"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Done Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-indigo-600/30"
        >
          Done
        </button>
      </div>
    </div>
  );
}
