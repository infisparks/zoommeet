"use client";

import React from "react";
import { useMediaDeviceSelect } from "@livekit/components-react";
import { Mic, Volume2, Check, Headphones, Bluetooth, Laptop, X } from "lucide-react";

interface AudioDeviceMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AudioDeviceMenu({ isOpen, onClose }: AudioDeviceMenuProps) {
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

  if (!isOpen) return null;

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
        className="w-full max-w-md rounded-3xl sm:rounded-2xl border border-white/15 bg-[#0E1628]/98 p-5 text-white shadow-2xl space-y-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Audio Device Settings</h3>
              <p className="text-[11px] text-slate-400">Select system, Bluetooth, or connected device</p>
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
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select Microphone (Input)</span>
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {micDevices.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-2 bg-white/5 rounded-xl">
                Default system microphone active
              </p>
            ) : (
              micDevices.map(device => {
                const isSelected = activeMicId === device.deviceId;
                return (
                  <button
                    key={device.deviceId}
                    type="button"
                    onClick={() => {
                      setActiveMic(device.deviceId);
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600/25 border border-indigo-500/50 text-white"
                        : "bg-white/5 hover:bg-white/10 text-slate-200 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getDeviceIcon(device.label, "mic")}
                      <span className="truncate">{device.label || `Microphone ${device.deviceId.slice(0, 5)}`}</span>
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

          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
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
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
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
