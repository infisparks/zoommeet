"use client";

import React from "react";
import {
  Mic,
  Video as VideoIcon,
  AlertCircle,
  Smartphone,
  CheckCircle2,
  X,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestPermission: () => void;
  mediaType?: "camera" | "microphone" | "both";
  errorMessage?: string;
}

export function PermissionModal({
  isOpen,
  onClose,
  onRequestPermission,
  mediaType = "both",
  errorMessage,
}: PermissionModalProps) {
  if (!isOpen) return null;

  const isIos =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0D1527] p-6 sm:p-8 text-white shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
            {mediaType === "camera" ? (
              <VideoIcon className="h-7 w-7" />
            ) : mediaType === "microphone" ? (
              <Mic className="h-7 w-7" />
            ) : (
              <div className="flex items-center gap-0.5">
                <Mic className="h-5 w-5" />
                <VideoIcon className="h-5 w-5" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {mediaType === "camera"
                ? "Camera Access Needed"
                : mediaType === "microphone"
                ? "Microphone Access Needed"
                : "Camera & Microphone Access"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Your browser is blocking media access. Please enable permissions to share.
            </p>
          </div>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-rose-950/40 p-3.5 border border-rose-800/40 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Mobile-Specific Step-by-Step Instructions */}
        <div className="rounded-2xl bg-white/5 p-4 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
            <Smartphone className="w-4 h-4" />
            <span>How to unblock on your phone:</span>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-slate-300">
            {isIos ? (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                    1
                  </span>
                  <span>Tap the <strong>&quot;aA&quot;</strong> icon on the left of your Safari address bar.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                    2
                  </span>
                  <span>Tap <strong>&quot;Website Settings&quot;</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                    3
                  </span>
                  <span>Change <strong>Camera</strong> and <strong>Microphone</strong> to <strong>&quot;Allow&quot;</strong>.</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                    1
                  </span>
                  <span>Tap the <strong>Lock / Settings icon (🔒)</strong> on the left of your Chrome address bar.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                    2
                  </span>
                  <span>Tap <strong>&quot;Permissions&quot;</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                    3
                  </span>
                  <span>Turn ON <strong>Camera</strong> and <strong>Microphone</strong>.</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            type="button"
            variant="primary"
            onClick={onRequestPermission}
            className="w-full sm:flex-1 h-11 text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            <span>Allow Access & Try Again</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto h-11 text-xs sm:text-sm border-slate-700 text-slate-300 hover:bg-white/10"
          >
            <span>Continue Listen-Only</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
